import React, { useEffect, useState } from 'react'
import { db } from '../../firebase'
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import * as XLSX from "xlsx";
import BotonVolver from "./BotonVolver";
import AparienciaComanda from "./AparienciaComanda";
import { useTranslation } from "react-i18next";

export default function PrepararPedidos() {
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
      alert(t("prepararPedidos.noExportar"));
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

      {/* Filtros funcionales */}
      <div className="no-print" style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        background: "#eee",
        padding: 10,
        borderRadius: 8,
        marginBottom: 16
      }}>
        {camposLista.length > 0 && (
          <>
            <label style={{ fontWeight: 600 }}>{t("prepararPedidos.filtrarPor")}</label>
            <select
              value={conceptoFiltro}
              onChange={e => setConceptoFiltro(e.target.value)}
              style={{ minWidth: 120 }}
            >
              {camposLista.map(campo => (
                <option key={campo.nombre} value={campo.nombre}>
                  {t(`prepararPedidos.${campo.nombre}`) || (campo.nombre.charAt(0).toUpperCase() + campo.nombre.slice(1))}
                </option>
              ))}
            </select>
            <label style={{ fontWeight: 600 }}>{t("prepararPedidos.valor")}</label>
            <select
              value={valorFiltro}
              onChange={e => setValorFiltro(e.target.value)}
              style={{ minWidth: 120 }}
            >
              <option value="">{t("prepararPedidos.seleccioneValor", { concepto: conceptoFiltro })}</option>
              {opcionesFiltro.map(opcion => (
                <option key={opcion.id} value={opcion.nombre}>
                  {opcion.nombre}
                </option>
              ))}
            </select>
          </>
        )}
        <input type="date" value={filtros.fechaDesde} onChange={e => setFiltros({ ...filtros, fechaDesde: e.target.value })} placeholder={t("prepararPedidos.fechaDesde")} />
        <input type="date" value={filtros.fechaHasta} onChange={e => setFiltros({ ...filtros, fechaHasta: e.target.value })} placeholder={t("prepararPedidos.fechaHasta")} />
        <input
          type="text"
          placeholder={t("prepararPedidos.buscarCliente")}
          value={filtros.search}
          onChange={e => setFiltros({ ...filtros, search: e.target.value })}
          style={{ minWidth: 180 }}
        />
        <button onClick={() => setBuscado(true)}>{t("prepararPedidos.buscar")}</button>
        {buscado && (
          <>
            <button onClick={imprimir}>{t("prepararPedidos.imprimir")}</button>
            <button onClick={exportarExcel}>{t("prepararPedidos.exportarExcel")}</button>
            <button onClick={exportarPDF}>{t("prepararPedidos.exportarPDF")}</button>
          </>
        )}
      </div>

      {/* Apariencia y preview de comanda */}
      <AparienciaComanda
        camposRegistro={camposDinamicos.map(nombre => ({ nombre }))}
        configComanda={configComanda}
        setConfigComanda={setConfigComanda}
        onGuardar={handleGuardarConfigComanda}
      />

      {/* Las comandas (vista final, para impresión/export) */}
      <div
        className="comandas-container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0,
          justifyContent: "flex-start"
        }}
      >
        {buscado && pedidosFiltrados.length === 0 && (
          <div style={{ fontSize: 20, color: "#999", margin: "2cm auto" }}>{t("prepararPedidos.noPedidos")}</div>
        )}
        {buscado && pedidosFiltrados.length > 0 && configComanda && pedidosFiltrados.map(p => {
          // Uso la estructura elegida en configComanda
          const isEnvio = p.tipoEntrega === "envio";
          const costoEnvio = isEnvio ? Number(p.costoEnvio || 0) : 0;
          const totalProductos = (p.productos || []).reduce((sum, prod) => sum + (prod.precio || 0) * (prod.cantidad || 1), 0);
          const totalFinal = totalProductos + (isEnvio ? costoEnvio : 0);

          return (
            <div
              key={p.id}
              className="comanda"
              style={{
                width: configComanda.tamano?.includes("x") ? configComanda.tamano.split("x")[0] + "cm" : "15cm",
                height: configComanda.tamano?.includes("x") ? configComanda.tamano.split("x")[1] + "cm" : "15cm",
                border: "1px solid #222",
                margin: "0.5cm",
                boxSizing: "border-box",
                pageBreakInside: "avoid",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                fontSize: 18,
                padding: "10px",
                background: configComanda.colorFondo || "#fff",
                breakInside: "avoid"
              }}
            >
              {configComanda.logoURL && (
                <img src={configComanda.logoURL} alt="logo" style={{ width: 48, marginBottom: 8, display: "block", marginLeft: "auto", marginRight: "auto" }} />
              )}
              {configComanda.campos.filter(f => f.mostrar).map(f => (
                <div
                  key={f.campo}
                  style={{
                    textAlign: f.alineacion === "izq" ? "left" : f.alineacion === "centro" ? "center" : "right",
                    margin: 3,
                    fontWeight: f.campo === "nombre" || f.campo === "apellido" ? 700 : 400
                  }}
                >
                  <span>{t(`aparienciaComanda.${f.campo}`) || f.campo}:</span>{" "}
                  <span>
                    {f.campo === "fecha" && p.fecha?.seconds
                      ? new Date(p.fecha.seconds * 1000).toLocaleDateString()
                      : p[f.campo] || "--"}
                  </span>
                </div>
              ))}
              {configComanda.mostrarProductos && (
                <div style={{ margin: 6 }}>
                  <b>{t("aparienciaComanda.productos")}:</b>
                  <ul style={{ margin: 0, fontSize: 15 }}>
                    {(p.productos || []).map((prod, i) => (
                      <li key={i}>{prod.nombre} x {prod.cantidad} - ${prod.precio ? (prod.precio * prod.cantidad) : 0}</li>
                    ))}
                  </ul>
                </div>
              )}
              {configComanda.mostrarTotales && (
                <div style={{ margin: 5, fontWeight: "bold", fontSize: 19, textAlign: "right" }}>
                  {t("aparienciaComanda.total")}: ${totalFinal}
                </div>
              )}
              {configComanda.leyenda && (
                <div style={{ marginTop: 8, textAlign: "center", color: "#008" }}>
                  {configComanda.leyenda}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body {
            background: #fff !important;
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
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
