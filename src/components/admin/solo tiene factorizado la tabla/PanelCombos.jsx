import { useEffect, useState, useRef } from 'react';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import BotonVolver from './BotonVolver';
import CombosTabla from "./panelproductor/CombosTabla";

const IMG_PLACEHOLDER = "https://cdn-icons-png.flaticon.com/512/1356/1356661.png";

function PanelCombos() {
  const { t } = useTranslation();
  const [combos, setCombos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [nuevo, setNuevo] = useState({
    nombre: "",
    descripcion: "",
    imagen: "",
    productos: [],
    descuento: 0,
    stock: "",
    oculto: false,
    seccionId: ""
  });

  // Edición de combos
  const [editId, setEditId] = useState(null);
  const [editCombo, setEditCombo] = useState({
    nombre: "",
    descripcion: "",
    imagen: "",
    productos: [],
    descuento: 0,
    stock: "",
    oculto: false,
    seccionId: ""
  });

  const [error, setError] = useState("");
  const inputEdit = useRef(null);

  // Buscador
  const [busquedaProducto, setBusquedaProducto] = useState("");

  // Redondeo
  const [redondeoTipo, setRedondeoTipo] = useState("arriba");
  const [redondeoMultiplo, setRedondeoMultiplo] = useState(10);

  useEffect(() => {
    cargarCombos();
    cargarProductos();
    cargarSecciones();
  }, []);

  const cargarCombos = async () => {
    const q = query(collection(db, "combos"), orderBy("nombre", "asc"));
    const snap = await getDocs(q);
    const arr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCombos(arr);
  };

  const cargarProductos = async () => {
    const q = query(collection(db, "productos"), orderBy("nombre", "asc"));
    const snap = await getDocs(q);
    const arr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProductos(arr);
  };

  const cargarSecciones = async () => {
    const q = query(collection(db, "secciones"), orderBy("orden", "asc"));
    const snap = await getDocs(q);
    const arr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
    setSecciones(arr);
  };

  // Helpers
  const getProducto = (id) => productos.find(p => p.id === id);
  const getNombreUnidad = (id) => {
    const p = getProducto(id);
    return p ? `${p.nombre} (${p.unidad || ''})` : "";
  };

  // Redondeo
  function redondear(valor, tipo, multiplo) {
    if (multiplo <= 1) return Math[tipo === "arriba" ? "ceil" : "floor"](valor);
    const factor = multiplo;
    return tipo === "arriba"
      ? Math.ceil(valor / factor) * factor
      : Math.floor(valor / factor) * factor;
  }

  // Calcular precios
  function calcularPrecios(productosCombo, descuento = 0) {
    let suma = 0;
    productosCombo.forEach(item => {
      const p = getProducto(item.productoId);
      if (p && p.precio && item.cantidad > 0) {
        suma += Number(p.precio) * Number(item.cantidad);
      }
    });
    const precioBase = suma;
    const precioDesc = descuento > 0 && descuento < 100
      ? precioBase * (1 - descuento / 100)
      : precioBase;
    const precioRed = redondear(precioDesc, redondeoTipo, Number(redondeoMultiplo));
    return {
      base: precioBase,
      descuento: precioDesc,
      redondeado: precioRed
    };
  }

  // Manejo de productos en combo (alta)
  const handleCantidad = (productoId, cant) => {
    setNuevo(n => {
      const productos = n.productos.filter(p => p.productoId !== productoId);
      if (cant > 0) productos.push({ productoId, cantidad: Number(cant) });
      return { ...n, productos };
    });
  };

  // Manejo de productos en combo (edición)
  const handleCantidadEdit = (productoId, cant) => {
    setEditCombo(e => {
      const productos = e.productos.filter(p => p.productoId !== productoId);
      if (cant > 0) productos.push({ productoId, cantidad: Number(cant) });
      return { ...e, productos };
    });
  };

  // Buscador
  const agregarProductoBuscado = (productoId) => {
    setNuevo(n => {
      if (n.productos.some(x => x.productoId === productoId)) return n;
      return {
        ...n,
        productos: [...n.productos, { productoId, cantidad: 1 }]
      };
    });
    setBusquedaProducto("");
  };

  const quitarProductoBuscado = (productoId) => {
    setNuevo(n => ({
      ...n,
      productos: n.productos.filter(x => x.productoId !== productoId)
    }));
  };

  // Crear nuevo combo
  const handleNuevoCombo = async () => {
    setError("");
    if (!nuevo.nombre.trim() || !nuevo.productos.length || !nuevo.stock || !nuevo.seccionId) {
      setError(t("combos.errorCompleta"));
      return;
    }
    if (combos.some(c => c.nombre.trim().toLowerCase() === nuevo.nombre.trim().toLowerCase())) {
      setError(t("combos.errorExiste"));
      return;
    }
    if (nuevo.descuento < 0 || nuevo.descuento > 99) {
      setError(t("combos.errorDescuento"));
      return;
    }
    // Calcula el precio redondeado final para guardar
    const precios = calcularPrecios(nuevo.productos, nuevo.descuento);
    await addDoc(collection(db, "combos"), {
      ...nuevo,
      descuento: Number(nuevo.descuento),
      stock: Number(nuevo.stock),
      oculto: false,
      seccionId: nuevo.seccionId,
      precioFinal: precios.redondeado
    });
    setNuevo({
      nombre: "",
      descripcion: "",
      imagen: "",
      productos: [],
      descuento: 0,
      stock: "",
      oculto: false,
      seccionId: ""
    });
    cargarCombos();
  };

  // Eliminar combo
  const handleEliminarCombo = async (id) => {
    if (window.confirm(t("combos.confirmEliminar"))) {
      await deleteDoc(doc(db, "combos", id));
      cargarCombos();
    }
  };

  // Ocultar/mostrar combo
  const alternarOcultoCombo = async (id, oculto) => {
    await updateDoc(doc(db, "combos", id), { oculto: !oculto });
    cargarCombos();
  };

  // Iniciar edición
  const iniciarEdicion = (combo) => {
    setEditId(combo.id);
    setEditId(combo.id);
    setEditCombo({
      nombre: combo.nombre,
      descripcion: combo.descripcion || "",
      imagen: combo.imagen || "",
      productos: combo.productos || [],
      descuento: combo.descuento || 0,
      stock: combo.stock || "",
      oculto: combo.oculto || false,
      seccionId: combo.seccionId || ""
    });
    setTimeout(() => inputEdit.current?.focus(), 200);
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditCombo({
      nombre: "",
      descripcion: "",
      imagen: "",
      productos: [],
      descuento: 0,
      stock: "",
      oculto: false,
      seccionId: ""
    });
    setError("");
  };

  // Guardar edición
  const guardarEdicion = async () => {
    setError("");
    if (!editCombo.nombre.trim() || !editCombo.productos.length || !editCombo.stock || !editCombo.seccionId) {
      setError(t("combos.errorCompleta"));
      return;
    }
    if (
      combos.some(
        c =>
          c.nombre.trim().toLowerCase() === editCombo.nombre.trim().toLowerCase() &&
          c.id !== editId
      )
    ) {
      setError(t("combos.errorExiste"));
      return;
    }
    if (editCombo.descuento < 0 || editCombo.descuento > 99) {
      setError(t("combos.errorDescuento"));
      return;
    }
    const precios = calcularPrecios(editCombo.productos, editCombo.descuento);
    await updateDoc(doc(db, "combos", editId), {
      ...editCombo,
      descuento: Number(editCombo.descuento),
      stock: Number(editCombo.stock),
      seccionId: editCombo.seccionId,
      precioFinal: precios.redondeado
    });
    cancelarEdicion();
    cargarCombos();
  };

  // Exportar a Excel
  const exportarExcel = () => {
    if (combos.length === 0) {
      alert(t("combos.errorExportar"));
      return;
    }
    const data = combos.map(combo => ({
      [t("combos.categoria")]: secciones.find(sec => sec.id === combo.seccionId)?.nombre || "-",
      [t("combos.nombre")]: combo.nombre,
      [t("combos.descripcion")]: combo.descripcion || "",
      [t("combos.productos")]: combo.productos.map(i => {
        const p = getProducto(i.productoId);
        return p ? `${p.nombre} x${i.cantidad}` : "";
      }).join(", "),
      [t("combos.stock")]: combo.stock,
      [t("combos.descuento")]: combo.descuento + "%",
      [t("combos.precioFinal")]: combo.precioFinal || calcularPrecios(combo.productos, combo.descuento).redondeado,
      [t("combos.visible")]: combo.oculto ? t("combos.no") : t("combos.si")
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("combos.hojaExcel"));
    XLSX.writeFile(wb, "combos.xlsx");
  };

  // Opciones de múltiplos para redondeo
  const opcionesMultiplo = [
    { label: t("combos.unidad"), value: 1 },
    { label: t("combos.decena"), value: 10 },
    { label: t("combos.centena"), value: 100 },
    { label: t("combos.mil"), value: 1000 },
  ];

  // Precios a mostrar en tiempo real
  const preciosMostrados = calcularPrecios(nuevo.productos, nuevo.descuento);

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ marginBottom: 0 }}>{t("combos.titulo")}</h2>
        <BotonVolver ruta="/dashboard-admin" />
      </div>
      <button
        onClick={exportarExcel}
        style={{
          background: "#1976d2",
          color: "#fff",
          border: "none",
          padding: "7px 18px",
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 15,
          cursor: "pointer",
          boxShadow: "0 1px 5px #a4c2e7",
          marginBottom: 16
        }}
      >
        {t("combos.exportarExcel")}
      </button>
      {productos.length === 0 && (
        <div style={{
          background: "#fff3cd",
          border: "1px solid #ffeeba",
          color: "#856404",
          padding: 10,
          borderRadius: 7,
          fontSize: 15,
          marginBottom: 18
        }}>
          <b>{t("combos.ayudaCarga")}</b>
        </div>
      )}
      <div style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-end",
        background: "#eaf7ea",
        padding: 12,
        borderRadius: 8,
        maxWidth: 880,
        marginBottom: 10,
        flexWrap: "wrap"
      }}>
        {/* CATEGORIA LABEL + SELECT + TOOLTIP */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label>
            {t("combos.categoria")}
            <span
              style={{ marginLeft: 4, color: "#2976d1", cursor: "pointer" }}
              title={t("combos.ayudaCategoria")}
            >
              ❓
            </span>
          </label>
          <select
            value={nuevo.seccionId || ""}
            onChange={e => setNuevo({ ...nuevo, seccionId: e.target.value })}
            style={{ minWidth: 140, marginTop: 2 }}
          >
            <option value="">{t("combos.elegiCategoria")}</option>
            {secciones.map(sec => (
              <option key={sec.id} value={sec.id}>{sec.nombre}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label>{t("combos.nombre")}</label>
          <input
            placeholder={t("combos.placeholderNombre")}
            value={nuevo.nombre}
            onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })}
            style={{ minWidth: 140 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label>{t("combos.imagen")}</label>
          <input
            placeholder={t("combos.placeholderImagen")}
            value={nuevo.imagen}
            onChange={e => setNuevo({ ...nuevo, imagen: e.target.value })}
            style={{ minWidth: 160 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label>{t("combos.stock")}</label>
          <input
            placeholder={t("combos.placeholderStock")}
            type="number"
            value={nuevo.stock}
            onChange={e => setNuevo({ ...nuevo, stock: e.target.value })}
            style={{ width: 75 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label>{t("combos.descuento")}</label>
          <input
            type="number"
            value={nuevo.descuento}
            onChange={e => setNuevo({ ...nuevo, descuento: e.target.value })}
            style={{ width: 65 }}
            min={0}
            max={99}
          />
        </div>
        {/* Redondeo */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label>
            {t("combos.redondeo")}
            <span
              style={{ marginLeft: 4, color: "#2976d1", cursor: "pointer" }}
              title={t("combos.ayudaRedondeo")}
            >❓</span>
          </label>
          <div style={{ display: "flex", gap: 4 }}>
            <select
              value={redondeoTipo}
              onChange={e => setRedondeoTipo(e.target.value)}
              style={{ width: 70 }}
            >
              <option value="arriba">{t("combos.arriba")}</option>
              <option value="abajo">{t("combos.abajo")}</option>
            </select>
            <select
              value={redondeoMultiplo}
              onChange={e => setRedondeoMultiplo(Number(e.target.value))}
              style={{ width: 115 }}
            >
              {opcionesMultiplo.map(o =>
                <option key={o.value} value={o.value}>{o.label}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* --- CARGA RÁPIDA: lista completa --- */}
      <div style={{
        background: "#f5f7f7",
        border: "1px solid #c6e2d7",
        padding: 12,
        borderRadius: 8,
        maxWidth: 880,
        marginBottom: 8
      }}>
        <div style={{ fontWeight: 600, marginBottom: 5 }}>{t("combos.cargaRapida")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {productos.map(p => (
            <div key={p.id} style={{ minWidth: 150, marginBottom: 2 }}>
              <span style={{ fontWeight: 500 }}>{p.nombre}</span>{" "}
              <span style={{ fontSize: 13, color: "#666" }}>({p.unidad || ""})</span>
              <input
                type="number"
                min={0}
                style={{ width: 50, marginLeft: 8 }}
                value={nuevo.productos.find(x => x.productoId === p.id)?.cantidad || ""}
                onChange={e => handleCantidad(p.id, e.target.value)}
                placeholder={t("combos.cant")}
              />
            </div>
          ))}
        </div>
      </div>

      {/* --- BÚSQUEDA AVANZADA --- */}
      <div style={{
        background: "#eaf1f7",
        border: "1px solid #a7c8e7",
        padding: 12,
        borderRadius: 8,
        maxWidth: 880,
        marginBottom: 8
      }}>
        <div style={{ fontWeight: 600, marginBottom: 5 }}>{t("combos.busquedaAvanzada")}</div>
        <input
          type="text"
          value={busquedaProducto}
          onChange={e => setBusquedaProducto(e.target.value)}
          placeholder={t("combos.buscaProducto")}
          style={{ width: 320, padding: 6, borderRadius: 4, border: "1px solid #b8b8b8", marginBottom: 6 }}
        />
        {/* Resultados de búsqueda */}
        {busquedaProducto && (
          <div style={{
            background: "#fff",
            border: "1px solid #d6d6d6",
            borderRadius: 5,
            maxHeight: 120,
            overflowY: "auto",
            marginBottom: 6
          }}>
            {productos
              .filter(p =>
                p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
                !nuevo.productos.some(x => x.productoId === p.id)
              )
              .slice(0, 15)
              .map(p => (
                <div
                  key={p.id}
                  style={{
                    padding: 5,
                    cursor: "pointer",
                    borderBottom: "1px solid #eaeaea"
                  }}
                  onClick={() => agregarProductoBuscado(p.id)}
                >
                  {p.nombre} <span style={{ fontSize: 12, color: "#888" }}>({p.unidad || ""})</span>
                </div>
              ))}
            {productos.filter(p =>
              p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
              !nuevo.productos.some(x => x.productoId === p.id)
            ).length === 0 && (
              <div style={{ padding: 6, color: "#999" }}>{t("combos.sinResultados")}</div>
            )}
          </div>
        )}

        {/* Productos agregados por búsqueda */}
        {nuevo.productos.filter(x =>
          productos.some(p =>
            p.id === x.productoId &&
            p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
          )
        ).length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>{t("combos.seleccionados")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              {nuevo.productos
                .filter(x =>
                  productos.some(p =>
                    p.id === x.productoId &&
                    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
                  )
                )
                .map(item => {
                  const p = productos.find(pp => pp.id === item.productoId);
                  return (
                    <div key={item.productoId} style={{
                      border: "1px solid #c6c6c6",
                      borderRadius: 6,
                      padding: "5px 12px",
                      display: "flex",
                      alignItems: "center",
                      background: "#fff"
                    }}>
                      <span style={{ fontWeight: 500 }}>{p?.nombre}</span>
                      <input
                        type="number"
                        min={0}
                        value={item.cantidad}
                        onChange={e => handleCantidad(p.id, e.target.value)}
                        style={{ width: 50, margin: "0 7px" }}
                        placeholder={t("combos.cant")}
                      />
                      <span style={{ fontSize: 13, color: "#666" }}>{p?.unidad || ""}</span>
                      <button
                        onClick={() => quitarProductoBuscado(item.productoId)}
                        style={{
                          marginLeft: 10, color: "#c71111", border: "none", background: "none", cursor: "pointer", fontSize: 18
                        }}
                        title={t("combos.quitar")}
                      >✖️</button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* --- PRECIOS EN TIEMPO REAL --- */}
      <div style={{
        background: "#fff",
        border: "1px solid #e1e1e1",
        borderRadius: 8,
        padding: 10,
        margin: "14px 0 8px 0",
        maxWidth: 340,
        fontSize: 16,
        lineHeight: 1.7
      }}>
        <div>
          <span style={{ fontWeight: 600 }}>{t("combos.precioBase")}</span>{" "}
          ${preciosMostrados.base.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </div>
        <div>
          <span style={{ fontWeight: 600 }}>{t("combos.precioDescuento")}</span>{" "}
          ${preciosMostrados.descuento.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </div>
        <div>
          <span style={{ fontWeight: 600 }}>{t("combos.precioRedondeado")}</span>{" "}
          <span style={{ color: "#127312", fontWeight: 700 }}>
            ${preciosMostrados.redondeado.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <button
        style={{
          margin: "10px 0 20px 0",
          padding: "7px 28px",
          background: "#4caf50",
          color: "#fff",
          fontWeight: "bold",
          border: "none",
          borderRadius: 6,
          fontSize: 17,
          cursor: "pointer",
          boxShadow: "0 2px 8px #b4e2c5"
        }}
        onClick={handleNuevoCombo}
      >
        {t("combos.agregarCombo")}
      </button>
      {error && <div style={{ color: "#d00021", marginBottom: 8 }}>{error}</div>}
      <hr />
      <h2>{t("combos.lista")}</h2>
      {combos.length === 0 && (
        <div style={{
          background: "#eef0f4",
          border: "1px solid #c1c1c1",
          color: "#555",
          padding: 8,
          borderRadius: 6,
          fontSize: 15,
          marginBottom: 12
        }}>
          {t("combos.noCombos")}
        </div>
      )}
      
      <div style={{ overflowX: "auto" }}>
        <CombosTabla
          combos={combos}
          productos={productos}
          secciones={secciones}
          editId={editId}
          editCombo={editCombo}
          inputEdit={inputEdit}
          t={t}
          onEditar={iniciarEdicion}
          onGuardar={guardarEdicion}
          onCancelar={cancelarEdicion}
          onEliminar={handleEliminarCombo}
          onOcultar={alternarOcultoCombo}
          calcularPrecios={calcularPrecios}
          handleCantidadEdit={handleCantidadEdit}
        />
      </div>
    
    </div>
  );
}

export default PanelCombos;