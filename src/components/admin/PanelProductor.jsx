import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import React, { useEffect, useState } from "react";
  const descargarPDF = () => {
    const element = document.getElementById("contenido-a-exportar");
    if (!element) {
      console.error("No se encontró el contenedor para exportar.");
      return;
    }

    const opciones = {
      margin: 0.5,
      filename: "reporte.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    };

    html2pdf().set(opciones).from(element).save();
  };
import { db } from '../../firebase'
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'
import BotonVolver from './BotonVolver'
import PanelProductorTabla from "./panelProductor/PanelProductorTabla"
import PanelProductorConfigCampos from "./panelProductor/PanelProductorConfigCampos"

function useAdminTheme() {
  const [config, setConfig] = useState({});


  function descargarPDF() {
    const contenido = document.getElementById("tabla-imprimir");
    if (!contenido) {
      console.error("No se encontró el elemento para imprimir.");
      return;
    }
    import("html2pdf.js").then(html2pdf => {
      html2pdf.default().set({
        margin: 10,
        filename: 'reporte.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(contenido).save();
    }).catch(error => {
      console.error("Error al generar PDF:", error);
    });
  }

  useEffect(() => {
    const cargar = async () => {
      const ref = doc(db, "configuracion", "estilo_admin");
      const snap = await getDoc(ref);
      if (snap.exists()) setConfig(snap.data());
    };
    cargar();
  }, []);
  return config;
}

function desglosarBolsones(productos) {
  let resultado = {}
  productos.forEach(item => {
    if (item.esBolson && item.contenido) {
      item.contenido.forEach(compo => {
        if (!resultado[compo.nombre]) resultado[compo.nombre] = 0
        resultado[compo.nombre] += (compo.cantidad || 1) * (item.cantidad || 1)
      })
    } else {
      if (!resultado[item.nombre]) resultado[item.nombre] = 0
      resultado[item.nombre] += (item.cantidad || 1)
    }
  })
  return resultado
}

export default function PanelProductor() {
  const { t } = useTranslation();
  const configAdmin = useAdminTheme();

  // ESTADO PRINCIPAL
  const [pedidos, setPedidos] = useState([])
  const [columnas, setColumnas] = useState([]);
  const [camposRegistro, setCamposRegistro] = useState([])

  // --- FILTROS ---
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Filtros elegidos/configurados (ej: ["ciudad", "estado"])
  const [filtrosElegidos, setFiltrosElegidos] = useState([]);
  // Valores activos de cada filtro {ciudad: "Colón", estado: "pendiente"}
  const [valoresFiltros, setValoresFiltros] = useState({});

  // Todos los campos posibles detectados en los pedidos
  const [camposDisponibles, setCamposDisponibles] = useState([]);

  // --- CARGA INICIAL DE DATOS ---
  useEffect(() => {
    const fetchPedidos = async () => {
      const querySnapshot = await getDocs(collection(db, 'pedidos'))
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPedidos(data)
    }
    fetchPedidos()
  }, [])

  useEffect(() => {
    const fetchCamposRegistro = async () => {
      const ref = doc(db, "configuracion", "general");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        let arr = snap.data().camposRegistro;
        if (!Array.isArray(arr)) {
          arr = Object.entries(arr).map(([nombre, props]) => ({
            nombre,
            ...props
          }));
        }
        setCamposRegistro(arr.filter(c => c.visible !== false));
      }
    };
    fetchCamposRegistro();
  }, []);

  // --- CAMPOS DISPONIBLES EN LOS PEDIDOS ---
  useEffect(() => {
    // Detectar todos los campos existentes en todos los pedidos
    const camposSet = new Set();
    pedidos.forEach(p => Object.keys(p).forEach(c => camposSet.add(c)));
    setCamposDisponibles([...camposSet].filter(c => c !== "id" && c !== "comentarios" && c !== "fechaCreacion"));
  }, [pedidos]);

  // --- CARGAR CONFIGURACIÓN PREDETERMINADA DE FILTROS Y COLUMNAS ---
  useEffect(() => {
    const fetchConfigDefault = async () => {
      const ref = doc(db, "configuracion", "panelProductorDefault");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        if (snap.data().filtros) setFiltrosElegidos(snap.data().filtros);
        if (snap.data().columnas) setColumnas(snap.data().columnas);
      }
    };
    fetchConfigDefault();
  }, []);

  // --- CARGAR/SINCRONIZAR FILTROS ELEGIDOS ---
  useEffect(() => {
    const fetchFiltros = async () => {
      const ref = doc(db, "configuracion", "panelProductorFiltros");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setFiltrosElegidos(snap.data().filtros || []);
      }
    }
    fetchFiltros();
  }, []);

  const guardarFiltrosElegidos = async (filtrosActualizados) => {
    setFiltrosElegidos(filtrosActualizados);
    await setDoc(doc(db, "configuracion", "panelProductorFiltros"), { filtros: filtrosActualizados });
  }

  // --- GUARDAR CONFIGURACIÓN DEFAULT (FILTROS Y COLUMNAS) ---
  const guardarConfiguracionDefault = async () => {
    await setDoc(doc(db, "configuracion", "panelProductorDefault"), {
      filtros: filtrosElegidos,
      columnas
    });
    alert(t("panelProductor.configGuardada"));
  };

  // --- LÓGICA PARA AGREGAR/QUITAR/REORDENAR FILTROS ---
  const agregarFiltro = campo => {
    if (!filtrosElegidos.includes(campo)) {
      const nuevos = [...filtrosElegidos, campo];
      guardarFiltrosElegidos(nuevos);
    }
  };

  const quitarFiltro = idx => {
    const nuevos = filtrosElegidos.filter((_, i) => i !== idx);
    guardarFiltrosElegidos(nuevos);
    setValoresFiltros(prev => {
      const nv = { ...prev };
      delete nv[filtrosElegidos[idx]];
      return nv;
    });
  };

  const moverFiltro = (idx, direccion) => {
    const nuevos = [...filtrosElegidos];
    const nuevoIdx = idx + direccion;
    if (nuevoIdx < 0 || nuevoIdx >= nuevos.length) return;
    const [moved] = nuevos.splice(idx, 1);
    nuevos.splice(nuevoIdx, 0, moved);
    guardarFiltrosElegidos(nuevos);
  };

  // --- OPCIONES ÚNICAS POR CADA FILTRO ---
  const opcionesPorCampo = campo => {
    const set = new Set();
    pedidos.forEach(p => {
      let valor = p[campo];
      if (valor === undefined || valor === null || valor === "") return;
      if (typeof valor === "object" && valor.seconds !== undefined) {
        valor = new Date(valor.seconds * 1000).toLocaleDateString();
      } else if (typeof valor === "object") {
        valor = JSON.stringify(valor);
      }
      set.add(valor);
    });
    return Array.from(set);
  };

  // --- FILTRAR PEDIDOS SEGÚN FILTROS Y RANGO DE FECHAS ---
  function filtrarPedidos() {
    const tieneValorDeFiltro = filtrosElegidos.some(f => valoresFiltros[f] && valoresFiltros[f] !== "");
    const fechasElegidas = fechaDesde || fechaHasta;
    if (
      (filtrosElegidos.length === 0 || !tieneValorDeFiltro) &&
      !fechasElegidas
    ) {
      return [];
    }

    return pedidos.filter(p => {
      let ok = true;

      // Rango de fechas (usa p.fecha tipo Firebase)
      if (fechaDesde) {
        const f = p.fecha && p.fecha.seconds ? new Date(p.fecha.seconds * 1000) : null;
        if (!f || f < new Date(fechaDesde)) ok = false;
      }
      if (fechaHasta) {
        const f = p.fecha && p.fecha.seconds ? new Date(p.fecha.seconds * 1000) : null;
        if (!f || f > new Date(fechaHasta)) ok = false;
      }

      // Filtros dinámicos elegidos
      filtrosElegidos.forEach(campo => {
        if (!valoresFiltros[campo]) return;
        let pedidoValor = p[campo];
        let valorFiltro = valoresFiltros[campo];
        if (pedidoValor && typeof pedidoValor === "object" && pedidoValor.seconds !== undefined) {
          pedidoValor = new Date(pedidoValor.seconds * 1000).toLocaleDateString();
        }
        if (typeof pedidoValor === "object") pedidoValor = JSON.stringify(pedidoValor);
        if (typeof valorFiltro === "object") valorFiltro = JSON.stringify(valorFiltro);
        if (pedidoValor != valorFiltro) ok = false;
      });

      return ok;
    });
  }

  // --- RESUMEN DE PRODUCTOS ---
  function resumenProductos() {
    const resumen = {}
    filtrarPedidos().forEach(p => {
      (p.productos || []).forEach(item => {
        if (item.esBolson && item.contenido) {
          item.contenido.forEach(compo => {
            if (!resumen[compo.nombre]) resumen[compo.nombre] = 0
            resumen[compo.nombre] += (compo.cantidad || 1) * (item.cantidad || 1)
          })
        } else {
          if (!resumen[item.nombre]) resumen[item.nombre] = 0
          resumen[item.nombre] += (item.cantidad || 1)
        }
      })
    })
    return resumen
  }

  // --- EXPORTACIÓN/IMPRIMIR ---
  const imprimir = () => window.print()
  const exportarPDF = () => {
  const resumen = resumenProductos();
  let html = "<html><head><title>Pedidos filtrados</title>";
  html += `<style>
    body { font-family: sans-serif; padding: 20px; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    th, td { border: 1px solid #333; padding: 6px; text-align: left; font-size: 12px; white-space: nowrap; }
    .resumen-table { table-layout: auto; width: auto; min-width: 300px; }
  </style>`;
  html += "</head><body>";

  // Filtros aplicados
  html += "<h2>Filtros aplicados</h2><ul>";
  if (fechaDesde) html += `<li>Desde: ${fechaDesde}</li>`;
  if (fechaHasta) html += `<li>Hasta: ${fechaHasta}</li>`;
  filtrosElegidos.forEach(campo => {
    const valor = valoresFiltros[campo];
    if (valor) html += `<li>${campo}: ${valor}</li>`;
  });
  html += "</ul>";

  // Resumen de productos
  html += "<h2>Resumen de productos</h2><table class='resumen-table'><thead><tr><th>Producto</th><th>Total unidades</th></tr></thead><tbody>";
  Object.entries(resumen).forEach(([producto, cantidad]) => {
    html += `<tr><td>${producto}</td><td>${cantidad}</td></tr>`;
  });
  html += "</tbody></table>";

  // Pedidos filtrados
  html += "<h2>Pedidos</h2><table><thead><tr>";
  columnas.forEach(col => {
    html += `<th>${col}</th>`;
  });
  html += "</tr></thead><tbody>";

  pedidosFiltrados.forEach(p => {
    html += "<tr>";
    columnas.forEach(col => {
      let val = p[col];
      if (Array.isArray(val)) {
        val = val.map(item => {
          if (typeof item === "object") {
            if (item.nombre && item.cantidad) {
              return `${item.nombre} (${item.cantidad})`;
            } else if (item.nombre) {
              return item.nombre;
            } else {
              return JSON.stringify(item);
            }
          } else {
            return item;
          }
        }).join(", ");
      } else if (val && typeof val === "object" && val.seconds !== undefined) {
        val = new Date(val.seconds * 1000).toLocaleDateString();
      }
      html += `<td>${val ?? ""}</td>`;
    });
    html += "</tr>";
  });

  html += "</tbody></table></body></html>";
  const win = window.open("", "", "height=800,width=1000");
  win.document.write(html);
  win.document.close();
  win.print();
}
  
  const descargarPDF = () => {
    const element = document.getElementById('contenido-a-exportar');
    const opt = {
      margin:       0.5,
      filename:     'resumen-pedidos.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

const exportarExcel = () => {
  // HOJA 1: Tabla con columnas visibles
  const dataPedidos = pedidosFiltrados.map(p => {
    const fila = {};
    columnas.forEach(col => {
      if (Array.isArray(p[col])) {
        fila[col] = p[col].map(item => {
          if (typeof item === "object") {
            if (item.nombre && item.cantidad) {
              return `${item.nombre} (${item.cantidad})`;
            } else if (item.nombre) {
              return item.nombre;
            } else {
              return JSON.stringify(item);
            }
          } else {
            return item;
          }
        }).join(", ");
      } else {
        fila[col] = p[col];
      }
    });
    return fila;
  });
  const wsPedidos = XLSX.utils.json_to_sheet(dataPedidos);

  // HOJA 2: Resumen de productos
  const resumen = resumenProductos();
  const dataResumen = Object.entries(resumen).map(([producto, cantidad]) => ({
    producto,
    cantidad
  }));
  const wsResumen = XLSX.utils.json_to_sheet(dataResumen);

  // Generar libro y escribir
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsPedidos, "Pedidos");
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
  XLSX.writeFile(wb, "pedidos_filtrados.xlsx");
}

  const resumen = resumenProductos()
  const pedidosFiltrados = filtrarPedidos()

  // --- UI ---
  return (
    <div
      style={{
        padding: 20,
        maxWidth: 1200,
        margin: "auto",
        background: configAdmin.fondo || "#f5f6fa",
        fontFamily: configAdmin.fuente || "Roboto",
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <h2>{t("panelProductor.titulo")}</h2>
        <BotonVolver ruta="/dashboard-admin" />
  <div style={{ display: "flex", gap: 10 }}>
    <button onClick={exportarPDF} style={{
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: 6,
      padding: "6px 12px",
      cursor: "pointer",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    }}>{t("panelProductor.imprimir")}</button>
      <button onClick={descargarPDF} style={{
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "6px 12px",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        marginLeft: "8px"
      }}>{t("panelProductor.descargarPDF")}</button>

    <button onClick={exportarExcel} style={{
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: 6,
      padding: "6px 12px",
      cursor: "pointer",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    }}>{t("panelProductor.exportarExcel")}</button>
<button onClick={descargarPDF} style={{
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "6px 12px",
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  marginLeft: "8px"
}}>
  Descargar PDF
</button>

  </div>
      </div>

      {/* ---- FILTRO FIJO: RANGO DE FECHAS ---- */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "12px 0" }}>
        <label>{t("panelProductor.desde")}</label>
        <input
          type="date"
          value={fechaDesde}
          onChange={e => setFechaDesde(e.target.value)}
        />
        <label>{t("panelProductor.hasta")}</label>
        <input
          type="date"
          value={fechaHasta}
          onChange={e => setFechaHasta(e.target.value)}
        />
      </div>

      {/* ---- CONFIGURACIÓN DE FILTROS DINÁMICOS ---- */}
      <div style={{
        background: "#eef",
        padding: 10,
        borderRadius: 8,
        marginBottom: 16
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>
          {t("panelProductor.configuracionFiltros")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {filtrosElegidos.map((campo, idx) => (
            <div key={campo} style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <span style={{ minWidth: 100, fontWeight: 500 }}>
                {t("panelProductor." + campo, campo.charAt(0).toUpperCase() + campo.slice(1))}
              </span>
              <button
                onClick={() => moverFiltro(idx, -1)}
                disabled={idx === 0}
                style={{ padding: "0 4px" }}
                title={t("panelProductor.moverArriba")}
              >↑</button>
              <button
                onClick={() => moverFiltro(idx, 1)}
                disabled={idx === filtrosElegidos.length - 1}
                style={{ padding: "0 4px" }}
                title={t("panelProductor.moverAbajo")}
              >↓</button>
              <button
                onClick={() => quitarFiltro(idx)}
                style={{ color: "red", padding: "0 6px", marginLeft: 2 }}
                title={t("panelProductor.quitarFiltro")}
              >✕</button>
            </div>
          ))}
          <select
            style={{ minWidth: 120 }}
            onChange={e => {
              if (e.target.value) {
                agregarFiltro(e.target.value);
                e.target.value = "";
              }
            }}
            defaultValue=""
          >
            <option value="">
              {t("panelProductor.agregarFiltro")}
            </option>
            {camposDisponibles
              .filter(c => !filtrosElegidos.includes(c) && c !== "fecha" && c !== "id")
              .map(campo => (
                <option key={campo} value={campo}>
                  {t("panelProductor." + campo, campo.charAt(0).toUpperCase() + campo.slice(1))}
                </option>
              ))}
          </select>
        </div>
        {/* BOTÓN PARA GUARDAR CONFIGURACIÓN DEFAULT */}
        
      </div>

      {/* ---- FILTROS ACTIVOS: SELECTS DINÁMICOS ---- */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "center",
        background: "#eee",
        padding: 10,
        borderRadius: 8,
        marginBottom: 20
      }}>
        {filtrosElegidos.map(campo => {
          const opciones = opcionesPorCampo(campo);
          return (
            <select
              key={campo}
              value={valoresFiltros[campo] || ""}
              onChange={e => setValoresFiltros(v => ({ ...v, [campo]: e.target.value }))}
              style={{ minWidth: 120, marginBottom: 5 }}
            >
              <option value="">
                {t("panelProductor." + campo, campo.charAt(0).toUpperCase() + campo.slice(1))}
              </option>
              {opciones.map((op, idx) => (
                <option key={op + idx} value={op}>
                  {typeof op === "string" ? t("panelProductor.opcion."+op, op) : op}
                </option>
              ))}
            </select>
          );
        })}
        
      </div>

      {/* ---- COLUMNAS ---- */}
      <div style={{ marginBottom: 16 }}>
        <PanelProductorConfigCampos
          camposPosibles={camposDisponibles}
          columnasSeleccionadas={columnas}
          onChange={setColumnas}
        />
        <div
          style={{
            fontSize: 18,
            color: "#164099",
            fontWeight: "bold",
            marginBottom: 10
          }}
        >
          {t("panelProductor.ordenColumnas")}
        </div>
<button onClick={guardarConfiguracionDefault} style={{
  marginBottom: 10,
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)"
}}>
  {t("panelProductor.guardarConfig")}
</button>
      </div>

      <h3>{t("panelProductor.resumen")}</h3>
      <table border={1} cellPadding={4}>
        <thead>
          <tr>
            <th>{t("panelProductor.producto")}</th>
            <th>{t("panelProductor.totalUnidades")}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(resumen).map(([prod, cant]) =>
            <tr key={prod}>
              <td>{prod}</td>
              <td>{cant}</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3>{t("panelProductor.pedidos")}</h3>
      {columnas.length > 0 && (
        <PanelProductorTabla pedidos={pedidosFiltrados} columnas={columnas} />
      )}

    </div>
  )
}
