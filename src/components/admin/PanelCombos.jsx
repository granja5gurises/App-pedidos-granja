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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { useTranslation } from 'react-i18next';
import BotonVolver from './BotonVolver';
import panelStyles from '../../estilos/panelStyles';

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
  const combosListRef = useRef(null); 

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
    const cantidadNumerica = Number(cant);
    setNuevo(n => {
      const productosActualizados = n.productos.filter(p => p.productoId !== productoId);
      if (!isNaN(cantidadNumerica) && cantidadNumerica > 0) {
        productosActualizados.push({ productoId, cantidad: cantidadNumerica });
      } else if (cant === '' || cant === null || cant === undefined || (isNaN(cantidadNumerica) && cant !== '0')) {
        const existingProduct = n.productos.find(p => p.productoId === productoId);
        if (existingProduct) {
          productosActualizados.push({ productoId, cantidad: cant });
        }
      }
      return { ...n, productos: productosActualizados };
    });
  };

  // Manejo de productos en combo (edición)
  const handleCantidadEdit = (productoId, cant) => {
    const cantidadNumerica = Number(cant);
    setEditCombo(e => {
      const productosActualizados = e.productos.filter(p => p.productoId !== productoId);
      if (!isNaN(cantidadNumerica) && cantidadNumerica > 0) {
        productosActualizados.push({ productoId, cantidad: cantidadNumerica });
      } else if (cant === '' || cant === null || cant === undefined || (isNaN(cantidadNumerica) && cant !== '0')) {
        const existingProduct = e.productos.find(p => p.productoId === productoId);
        if (existingProduct) {
          productosActualizados.push({ productoId, cantidad: cant });
        }
      }
      return { ...e, productos: productosActualizados };
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
    const productosValidos = nuevo.productos.filter(p => !isNaN(Number(p.cantidad)) && Number(p.cantidad) > 0);
    
    if (!nuevo.nombre.trim() || productosValidos.length === 0 || !nuevo.stock || !nuevo.seccionId) {
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
    
    const precios = calcularPrecios(productosValidos, nuevo.descuento);
    try {
      await addDoc(collection(db, "combos"), {
        ...nuevo,
        productos: productosValidos,
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
    } catch (e) {
      console.error("Error adding document: ", e);
      setError(t("combos.errorGeneral") + " " + e.message);
    }
  };

  // Eliminar combo
  const handleEliminarCombo = async (id) => {
    if (!id) {
      console.error("Attempted to delete with invalid ID:", id);
      setError(t("combos.errorEliminarInvalidId"));
      return;
    }
    if (window.confirm(t("combos.confirmEliminar"))) {
      try {
        await deleteDoc(doc(db, "combos", id));
        cargarCombos();
      } catch (e) {
        console.error("Error deleting document: ", e);
        setError(t("combos.errorGeneral") + " " + e.message);
      }
    }
  };

  // Ocultar/mostrar combo
  const alternarOcultoCombo = async (id, oculto) => {
    if (!id) {
      console.error("Attempted to toggle visibility with invalid ID:", id);
      setError(t("combos.errorAlternarVisibilidadInvalidId"));
      return;
    }
    try {
      await updateDoc(doc(db, "combos", id), { oculto: !oculto });
      cargarCombos();
    } catch (e) {
      console.error("Error updating document visibility: ", e);
      setError(t("combos.errorGeneral") + " " + e.message);
    }
  };

  // Iniciar edición
  const iniciarEdicion = (combo) => {
    setEditId(combo.id);
    const productosParaEdicion = combo.productos.map(p => ({
        ...p,
        cantidad: p.cantidad !== '' && p.cantidad !== null ? Number(p.cantidad) : ''
    }));

    setEditCombo({
      nombre: combo.nombre,
      descripcion: combo.descripcion || "",
      imagen: combo.imagen || "",
      productos: productosParaEdicion || [],
      descuento: combo.descuento || 0,
      stock: combo.stock || "",
      oculto: combo.oculto || false,
      seccionId: combo.seccionId || ""
    });
    setTimeout(() => {
        if(inputEdit.current) {
            inputEdit.current.focus();
        }
    }, 200);
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
    if (!editId) {
        console.error("Attempted to save edit with no selected combo (editId is null).");
        setError(t("combos.errorGuardarEdicionNoId"));
        return;
    }
    const productosValidos = editCombo.productos.filter(p => !isNaN(Number(p.cantidad)) && Number(p.cantidad) > 0);

    if (!editCombo.nombre.trim() || productosValidos.length === 0 || !editCombo.stock || !editCombo.seccionId) {
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
    const precios = calcularPrecios(productosValidos, editCombo.descuento);
    try {
      await updateDoc(doc(db, "combos", editId), {
        ...editCombo,
        productos: productosValidos,
        descuento: Number(editCombo.descuento),
        stock: Number(editCombo.stock),
        seccionId: editCombo.seccionId,
        precioFinal: precios.redondeado
      });
      cancelarEdicion();
      cargarCombos();
    } catch (e) {
      console.error("Error saving document: ", e);
      setError(t("combos.errorGeneral") + " " + e.message);
    }
  };

  // Exportar a Excel
  const exportarExcel = () => {
    if (combos.length === 0) {
      alert(t("combos.noCombosExportar"));
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

  // Función para Exportar a PDF
  const exportarPDF = async () => {
    if (!combosListRef.current) {
        console.error("Referencia al contenedor de combos no encontrada.");
        alert(t("combos.errorPDFNoElement"));
        return;
    }
    if (combos.length === 0) {
        alert(t("combos.noCombosExportar"));
        return;
    }

    try {
        const canvas = await html2canvas(combosListRef.current, { 
            scale: 2,
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps= pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let position = 0;
        let heightLeft = pdfHeight;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft >= 0) {
            position = heightLeft - pdf.internal.pageSize.getHeight(); // Ajuste aquí para la posición en la nueva página
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }

        pdf.save(t("combos.archivoPDF") + ".pdf");
    } catch (e) {
        console.error("Error al exportar a PDF:", e);
        alert(t("combos.errorGeneralPDF"));
    }
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
    <div style={panelStyles.contenedor}>
      <div style={panelStyles.headerSuperior}>
        <h2 style={{ margin: 0 }}>{t("combos.titulo")}</h2>
        <BotonVolver ruta="/dashboard-admin" />
      </div>
      <div style={{display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap'}}> {/* Contenedor para los botones de exportar */}
        <button
          onClick={exportarExcel}
          style={panelStyles.botonExportar}
        >
          {t("combos.exportarExcel")}
        </button>
        <button
          onClick={exportarPDF}
          style={panelStyles.botonExportarPDF}
        >
          {t("combos.exportarPDF")}
        </button>
      </div>
      {productos.length === 0 && (
        <div style={panelStyles.alertaInfo}>
          <b>{t("combos.ayudaCarga")}</b>
        </div>
      )}
      {/* SECCIÓN DE AGREGAR NUEVO COMBO */}
      {/* Se eliminó el comentario problemático y se aseguró el layout con panelStyles.tarjetaVerdeClaro */}
      <div style={panelStyles.tarjetaVerdeClaro}>
        {/* CATEGORIA LABEL + SELECT + TOOLTIP */}
        <div style={panelStyles.flexColumn}>
          <label style={panelStyles.label}>
            {t("combos.categoria")}
            <span
              style={panelStyles.tooltipIcon}
              title={t("combos.ayudaCategoria")}
            >
              ❓
            </span>
          </label>
          <select
            value={nuevo.seccionId || ""}
            onChange={e => setNuevo({ ...nuevo, seccionId: e.target.value })}
            style={panelStyles.input}
          >
            <option value="">{t("combos.elegiCategoria")}</option>
            {secciones.map(sec => (
              <option key={sec.id} value={sec.id}>{sec.nombre}</option>
            ))}
          </select>
        </div>
        <div style={panelStyles.flexColumn}>
          <label style={panelStyles.label}>{t("combos.nombre")}</label>
          <input
            placeholder={t("combos.placeholderNombre")}
            value={nuevo.nombre}
            onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })}
            style={panelStyles.input}
          />
        </div>
        <div style={panelStyles.flexColumn}>
          <label style={panelStyles.label}>{t("combos.imagen")}</label>
          <input
            placeholder={t("combos.placeholderImagen")}
            value={nuevo.imagen}
            onChange={e => setNuevo({ ...nuevo, imagen: e.target.value })}
            style={panelStyles.input} // Usando input general para que use width: 100%
          />
        </div>
        <div style={panelStyles.flexColumn}>
          <label style={panelStyles.label}>{t("combos.stock")}</label>
          <input
            placeholder={t("combos.placeholderStock")}
            type="number"
            value={nuevo.stock}
            onChange={e => setNuevo({ ...nuevo, stock: e.target.value })}
            style={panelStyles.inputChico}
          />
        </div>
        <div style={panelStyles.flexColumn}>
          <label style={panelStyles.label}>{t("combos.descuento")}</label>
          <input
            type="number"
            value={nuevo.descuento}
            onChange={e => setNuevo({ ...nuevo, descuento: e.target.value })}
            style={panelStyles.inputChico}
            min={0}
            max={99}
          />
        </div>
        {/* Redondeo */}
        <div style={panelStyles.flexColumn}>
          <label style={panelStyles.label}>
            {t("combos.redondeo")}
            <span
              style={panelStyles.tooltipIcon}
              title={t("combos.ayudaRedondeo")}
            >❓</span>
          </label>
          <div style={{ display: "flex", gap: 4 }}>
            <select
              value={redondeoTipo}
              onChange={e => setRedondeoTipo(e.target.value)}
              style={panelStyles.inputChico}
            >
              <option value="arriba">{t("combos.arriba")}</option>
              <option value="abajo">{t("combos.abajo")}</option>
            </select>
            <select
              value={redondeoMultiplo}
              onChange={e => setRedondeoMultiplo(Number(e.target.value))}
              style={panelStyles.inputChico}
            >
              {opcionesMultiplo.map(o =>
                <option key={o.value} value={o.value}>{o.label}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* --- CARGA RÁPIDA: lista completa --- */}
      <div style={panelStyles.tarjetaGrisClaro}>
        <div style={{ fontWeight: 600, marginBottom: 5 }}>{t("combos.cargaRapida")}</div>
        <div style={panelStyles.flexGap12Wrap}>
          {productos.map(p => (
            <div key={p.id} style={panelStyles.productoItemCantidad}>
              <span style={panelStyles.productoNombreUnidad}>{p.nombre}</span>{" "}
              <span style={panelStyles.productoUnidad}>({p.unidad || ""})</span>
              <input
                type="number"
                min={0}
                style={panelStyles.inputChico}
                value={nuevo.productos.find(x => x.productoId === p.id)?.cantidad || ""}
                onChange={e => handleCantidad(p.id, e.target.value)}
                placeholder={t("combos.cant")}
              />
            </div>
          ))}
        </div>
      </div>

      {/* --- BÚSQUEDA AVANZADA --- */}
      <div style={panelStyles.tarjetaAzulClaro}>
        <div style={{ fontWeight: 600, marginBottom: 5 }}>{t("combos.busquedaAvanzada")}</div>
        <input
          type="text"
          value={busquedaProducto}
          onChange={e => setBusquedaProducto(e.target.value)}
          placeholder={t("combos.buscaProducto")}
          style={panelStyles.inputBusqueda}
        />
        {/* Resultados de búsqueda */}
        {busquedaProducto && (
          <div style={panelStyles.busquedaResultsContenedor}>
            {productos
              .filter(p =>
                p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
                !nuevo.productos.some(x => x.productoId === p.id)
              )
              .slice(0, 15)
              .map(p => (
                <div
                  key={p.id}
                  style={panelStyles.busquedaResultadoItem}
                  onClick={() => agregarProductoBuscado(p.id)}
                >
                  {p.nombre} <span style={{ fontSize: 12, color: "#888" }}>({p.unidad || ""})</span>
                </div>
              ))}
            {productos.filter(p =>
              p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
              !nuevo.productos.some(x => x.productoId === p.id)
            ).length === 0 && (
              <div style={panelStyles.busquedaSinResults}>
                {t("combos.sinResultados")}
              </div>
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
            <div style={panelStyles.flexGap12Wrap}>
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
                    <div key={item.productoId} style={panelStyles.productoSeleccionadoItem}>
                      <span style={panelStyles.productoNombreUnidad}>{p?.nombre}</span>
                      <input
                        type="number"
                        min={0}
                        style={{ ...panelStyles.inputChico, width: 50, margin: "0 7px" }}
                        value={item.cantidad}
                        onChange={e => handleCantidad(p.id, e.target.value)}
                        placeholder={t("combos.cant")}
                      />
                      <span style={panelStyles.productoUnidad}>{p?.unidad || ""}</span>
                      <button
                        onClick={() => quitarProductoBuscado(item.productoId)}
                        style={panelStyles.botonQuitarProducto}
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
      <div style={panelStyles.tarjetaPrecios}>
        <div>
          <span style={panelStyles.precioResumen}>{t("combos.precioBase")}</span>{" "}
          ${preciosMostrados.base.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </div>
        <div>
          <span style={panelStyles.precioResumen}>{t("combos.precioDescuento")}</span>{" "}
          ${preciosMostrados.descuento.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </div>
        <div>
          <span style={panelStyles.precioResumen}>{t("combos.precioRedondeado")}</span>{" "}
          <span style={panelStyles.precioFinalDestacado}>
            ${preciosMostrados.redondeado.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <button
        style={panelStyles.botonGuardar}
        onClick={handleNuevoCombo}
      >
        {t("combos.agregarCombo")}
      </button>
      {error && <div style={panelStyles.alertaError}>{error}</div>}
      <hr />
      <h2>{t("combos.lista")}</h2>
      {combos.length === 0 && (
        <div style={panelStyles.sinRegistros}>
          {t("combos.noCombos")}
        </div>
      )}
      
      {/* Nuevo contenedor para las tarjetas de combos */}
      <div ref={combosListRef} style={panelStyles.listaTarjetasCombos}>
        {combos.map((combo, index) =>
          editId === combo.id ? (
            // Tarjeta de edición
            <div key={combo.id} style={panelStyles.comboCardEdit}>
                <div style={panelStyles.cardField}>
                  <label style={panelStyles.label}>{t("combos.categoria")}</label>
                  <select
                    value={editCombo.seccionId || ""}
                    onChange={e => setEditCombo({ ...editCombo, seccionId: e.target.value })}
                    style={panelStyles.inputChico}
                  >
                    <option value="">{t("combos.elegiCategoria")}</option>
                    {secciones.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={panelStyles.cardField}>
                  <label style={panelStyles.label}>{t("combos.nombre")}</label>
                  <input
                    ref={inputEdit}
                    value={editCombo.nombre}
                    onChange={e => setEditCombo({ ...editCombo, nombre: e.target.value })}
                    style={panelStyles.input}
                  />
                </div>
                <div style={panelStyles.cardField}>
                  <label style={panelStyles.label}>{t("combos.imagen")}</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: 5}}>
                      <input
                        placeholder={t("combos.placeholderImagen")}
                        value={editCombo.imagen}
                        onChange={e => setEditCombo({ ...editCombo, imagen: e.target.value })}
                        style={panelStyles.input} // Usando input general
                      />
                      <img
                        src={editCombo.imagen || IMG_PLACEHOLDER}
                        alt=""
                        width={38}
                        style={panelStyles.tablaImagenCombo}
                      />
                  </div>
                </div>
                <div style={panelStyles.cardField}>
                  <label style={panelStyles.label}>{t("combos.descripcion")}</label>
                  <textarea
                    value={editCombo.descripcion}
                    onChange={e => setEditCombo({ ...editCombo, descripcion: e.target.value })}
                    style={{ ...panelStyles.inputTabla, width: '100%', minHeight: 30 }}
                  />
                </div>
                <div style={panelStyles.cardField}>
                  <label style={panelStyles.label}>{t("combos.stock")}</label>
                  <input
                    type="number"
                    value={editCombo.stock}
                    onChange={e => setEditCombo({ ...editCombo, stock: e.target.value })}
                    style={panelStyles.inputChico}
                  />
                </div>
                <div style={panelStyles.cardField}>
                  <label style={panelStyles.label}>{t("combos.descuento")}</label>
                  <input
                    type="number"
                    value={editCombo.descuento}
                    onChange={e => setEditCombo({ ...editCombo, descuento: e.target.value })}
                    style={panelStyles.inputChico}
                    min={0}
                    max={99}
                  /> %
                </div>
                <div style={panelStyles.cardField}>
                  <label style={panelStyles.label}>{t("combos.productos")}</label>
                  <ul style={panelStyles.listaProductosCombo}>
                    {productos.map(p => (
                      <li key={p.id}>
                        <span>{p.nombre} <span style={panelStyles.productoUnidad}>({p.unidad || ""})</span></span>
                        <input
                          type="number"
                          min={0}
                          style={{ ...panelStyles.inputChico, width: 40, marginLeft: 8 }}
                          value={editCombo.productos.find(x => x.productoId === p.id)?.cantidad || ""}
                          onChange={e => handleCantidadEdit(p.id, e.target.value)}
                          placeholder={t("combos.cant")}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={panelStyles.cardField}>
                  <label style={panelStyles.label}>{t("combos.precioFinal")}</label>
                  <span style={{fontWeight: 'bold'}}>
                    ${calcularPrecios(editCombo.productos, editCombo.descuento).redondeado}
                  </span>
                </div>
                <div style={panelStyles.cardField}>
                  <label style={panelStyles.label}>{t("combos.visible")}</label>
                  <span style={combo.oculto ? panelStyles.estadoOculto : panelStyles.estadoVisible}>
                    {combo.oculto ? t("combos.oculto") : t("combos.visibleEstado")}
                  </span>
                </div>
                <div style={panelStyles.cardActions}>
                  <button onClick={guardarEdicion} style={panelStyles.botonGuardar}>{t("combos.guardar")}</button>
                  <button onClick={cancelarEdicion} style={panelStyles.botonCancelar}>{t("combos.cancelar")}</button>
                </div>
            </div>
          ) : (
            // Tarjeta de visualización
            <div key={combo.id} style={panelStyles.comboCard}>
                <div style={panelStyles.cardImageContainer}>
                    <img
                        src={combo.imagen || IMG_PLACEHOLDER}
                        alt={combo.nombre}
                        style={panelStyles.cardImage}
                    />
                </div>
                <div style={panelStyles.cardContent}>
                    <h3 style={panelStyles.cardTitle}>{combo.nombre}</h3>
                    <p style={panelStyles.cardText}>
                        <strong>{t("combos.categoria")}:</strong> {secciones.find(sec => sec.id === combo.seccionId)?.nombre || "-"}
                    </p>
                    {combo.descripcion && (
                        <p style={panelStyles.cardText}>
                            <strong>{t("combos.descripcion")}:</strong> {combo.descripcion}
                        </p>
                    )}
                    <p style={panelStyles.cardText}>
                        <strong>{t("combos.stock")}:</strong> {combo.stock}
                    </p>
                    <p style={panelStyles.cardText}>
                        <strong>{t("combos.descuento")}:</strong> {combo.descuento}%
                    </p>
                    <div style={panelStyles.cardText}>
                        <strong>{t("combos.productos")}:</strong>
                        <ul style={panelStyles.listaProductosCombo}>
                            {combo.productos.map(item =>
                                <li key={item.productoId}>
                                    {getNombreUnidad(item.productoId)} x{item.cantidad}
                                </li>
                            )}
                        </ul>
                    </div>
                    <p style={panelStyles.cardText}>
                        <strong>{t("combos.precioFinal")}:</strong>{" "}
                        <span style={panelStyles.precioFinalDestacado}>
                            ${combo.precioFinal || calcularPrecios(combo.productos, combo.descuento).redondeado}
                        </span>
                    </p>
                    <p style={panelStyles.cardText}>
                        <strong>{t("combos.visible")}:</strong>{" "}
                        {combo.oculto ? (
                            <span style={panelStyles.estadoOculto}>{t("combos.oculto")}</span>
                        ) : (
                            <span style={panelStyles.estadoVisible}>{t("combos.visibleEstado")}</span>
                        )}
                    </p>
                </div>
                <div style={panelStyles.cardActions}>
                    <button onClick={() => iniciarEdicion(combo)} style={panelStyles.botonEditarColumna}>{t("combos.editar")}</button>
                    <button style={panelStyles.botonEliminarFila} onClick={() => handleEliminarCombo(combo.id)}>{t("combos.eliminar")}</button>
                    <button
                        style={panelStyles.botonAlternarVisibilidad}
                        onClick={() => alternarOcultoCombo(combo.id, combo.oculto)}
                    >
                        {combo.oculto ? t("combos.mostrar") : t("combos.ocultar")}
                    </button>
                </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default PanelCombos;