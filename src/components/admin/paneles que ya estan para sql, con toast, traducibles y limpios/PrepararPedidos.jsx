import React, { useEffect, useState } from 'react'
import { db } from '../../firebase'
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import * as XLSX from "xlsx";
import BotonVolver from "./BotonVolver";
import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { toast } from "react-toastify";
import FiltrosPedidos from "../../components/pedidos/FiltrosPedidos";
import VistaComandas from "../../components/pedidos/VistaComandas";

export default function PrepararPedidos() {
  const [camposRegistro, setCamposRegistro] = useState([]);
  const { t } = useTranslation();

  const [pedidos, setPedidos] = useState([]);
  const [camposDinamicos, setCamposDinamicos] = useState([]);
  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    search: ""
  });

  // Para filtros tipo lista:
  const [camposLista, setCamposLista] = useState([]);
  const [conceptoFiltro, setConceptoFiltro] = useState(""); // campo lista para filtrar
  const [opcionesFiltro, setOpcionesFiltro] = useState([]);
  const [valorFiltro, setValorFiltro] = useState("");

  // Config visual de la comanda
  const [configComanda, setConfigComanda] = useState(null);
  const [buscado, setBuscado] = useState(false);

  // Extrae todos los campos únicos de los pedidos (salvo los que ignores)
  function obtenerCamposUnicos(pedidos) {
    const IGNORAR = ["id", "productos"];
    const campos = new Set();
    pedidos.forEach(p => {
      Object.keys(p).forEach(k => {
        if (!IGNORAR.includes(k)) campos.add(k);
      });
    });
    return Array.from(campos);
  }

  // Traer todos los pedidos y obtener lista dinámica de campos

useEffect(() => {
  const fetchPedidos = async () => {
    try {
      const pedidosSnapshot = await getDocs(collection(db, "pedidos"));
      const camposUnicos = new Set();

      pedidosSnapshot.forEach(doc => {
        const data = doc.data();
        Object.keys(data).forEach(key => {
          if (key !== "id" && key !== "productos" && key !== "__typename") {
            camposUnicos.add(key);
          }
        });
      });

      const campos = Array.from(camposUnicos).map(nombre => ({ nombre }));
      setCamposRegistro(campos);
    } catch (error) {
      console.error("Error obteniendo pedidos:", error);
    }
  };

  fetchPedidos();
}, []);

  useEffect(() => {
    const fetchPedidos = async () => {
      const querySnapshot = await getDocs(collection(db, 'pedidos'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPedidos(data);
    };
    fetchPedidos();
  }, []);

  // Actualizar campos dinámicos cada vez que cambian los pedidos
  useEffect(() => {
    if (pedidos.length === 0) return;
    const campos = obtenerCamposUnicos(pedidos);
    setCamposDinamicos(campos);
    console.log("Campos dinámicos detectados:", campos); // DEBUG
  }, [pedidos]);

  // Traer campos tipo lista (para los filtros arriba)
  useEffect(() => {
    const fetchCampos = async () => {
      const ref = doc(db, "configuracion", "general");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        let arr = snap.data().camposRegistro;
        if (!Array.isArray(arr)) {
          arr = Object.entries(arr).map(([nombre, props]) => ({
            nombre,
            ...props
          }))
        }
        // Solo los de tipo lista (ciudad, barrio, sucursal, etc.)
        const camposL = arr.filter(c => c.tipo === "lista");
        setCamposLista(camposL);
        setConceptoFiltro(camposL[0]?.nombre || "");
        // Config de la comanda
        if (snap.data().comanda) {
          setConfigComanda(snap.data().comanda);
        }
      }
    }
    fetchCampos();
  }, []);

  // Opciones para el filtro flexible
  useEffect(() => {
    if (!conceptoFiltro) {
      setOpcionesFiltro([]);
      setValorFiltro("");
      return;
    }
    const fetchOpciones = async () => {
      const snap = await getDocs(collection(db, conceptoFiltro.toLowerCase()));
      setOpcionesFiltro(
        snap.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre || doc.id
        }))
      );
      setValorFiltro("");
    };
    fetchOpciones();
  }, [conceptoFiltro]);

  // Guardar configuración de la comanda en Firestore
  const handleGuardarConfigComanda = async (configNueva) => {
    setConfigComanda(configNueva);
    const ref = doc(db, "configuracion", "general");
    await setDoc(ref, { comanda: configNueva }, { merge: true });
  };

  // Filtro principal
  function filtrarPedidosBase(pedidosLista) {
    return pedidosLista.filter(p => {
      let ok = true;
      // Filtro dinámico por campo tipo lista (ej: ciudad, sucursal)
      if (conceptoFiltro && valorFiltro) {
        ok = ok && (
          (p[conceptoFiltro] || '').toString().trim().toLowerCase() === valorFiltro.toString().trim().toLowerCase()
        );
      }
      // Filtro por fecha
      if (filtros.fechaDesde) {
        const fechaPedido = p.fecha?.seconds
          ? new Date(p.fecha.seconds * 1000)
          : new Date(p.fecha);
        const fechaFiltro = new Date(filtros.fechaDesde);
        if (fechaPedido < fechaFiltro) ok = false;
      }
      if (filtros.fechaHasta) {
        const fechaPedido = p.fecha?.seconds
          ? new Date(p.fecha.seconds * 1000)
          : new Date(p.fecha);
        const fechaFiltro = new Date(filtros.fechaHasta);
        if (fechaPedido > fechaFiltro) ok = false;
      }
      // Buscador por cliente, apellido, o comprobante
      if (filtros.search) {
        const str = filtros.search.toLowerCase();
        const campos = [
          (p.nombre || "").toLowerCase(),
          (p.apellido || "").toLowerCase(),
          (p.comprobante || "").toLowerCase()
        ];
        if (!campos.some(v => v.includes(str))) ok = false;
      }
      return ok;
    });
  }

  // Exportar a Excel
  const exportarExcel = () => {
    const pedidosFiltrados = filtrarPedidosBase(pedidos);
    if (!pedidosFiltrados.length) {
      toast.error(t("prepararPedidos.noExportar"));
      return;
    }
    // Exporta solo los campos configurados en la comanda
    const data = pedidosFiltrados.map(p => {
      const fila = {};
      if (configComanda && configComanda.campos) {
        configComanda.campos.filter(c => c.mostrar).forEach(campoObj => {
          const key = campoObj.campo;
          fila[t(`aparienciaComanda.${key}`) || key] = p[key] || "";
        });
      }
      return fila;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("prepararPedidos.comandasExcel"));
    XLSX.writeFile(wb, "comandas.xlsx");
  };

  // Exportar a PDF (simple: print)
  const exportarPDF = () => window.print();

  // Para imprimir solo las comandas
  const imprimir = () => window.print();

  // Aplica los filtros sólo al buscar
  const pedidosFiltrados = buscado ? filtrarPedidosBase(pedidos) : [];

  // DEBUG: para ver los pedidos filtrados en consola
  useEffect(() => {
    if (buscado) {
      console.log("Pedidos filtrados:", pedidosFiltrados);
    }
  }, [buscado, pedidosFiltrados]);

  return (
    <div style={{ padding: 20 }}>
      {/* Header y Botón Volver */}
      <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 15 }}>
        <BotonVolver ruta="/dashboard-admin" />
        <h2 style={{ margin: 0 }}>{t("prepararPedidos.titulo")}</h2>
</div>
      <FiltrosPedidos
        t={t}
        filtros={filtros}
        setFiltros={setFiltros}
        camposLista={camposLista}
        conceptoFiltro={conceptoFiltro}
        setConceptoFiltro={setConceptoFiltro}
        valorFiltro={valorFiltro}
        setValorFiltro={setValorFiltro}
        opcionesFiltro={opcionesFiltro}
        buscado={buscado}
        setBuscado={setBuscado}
        exportarExcel={exportarExcel}
        exportarPDF={exportarPDF}
        imprimir={imprimir}
      />


      {/* Apariencia y preview de comanda */}
      {/* Las comandas (vista final, para impresión/export) */}
            <VistaComandas
        pedidosFiltrados={pedidosFiltrados}
        configComanda={configComanda}
        t={t}
        buscado={buscado}
      />

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          .comandas-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0;
            justify-content: flex-start;
          }
          .comanda {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>
    </div>
  );
}