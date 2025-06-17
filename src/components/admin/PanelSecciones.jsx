import { useEffect, useState, useRef } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import BotonVolver from "./BotonVolver";

const IMG_PLACEHOLDER = "https://cdn-icons-png.flaticon.com/512/508/508784.png";

export default function PanelSecciones() {
  const { t } = useTranslation();
  const [secciones, setSecciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: "", imagen: "" });
  const [editId, setEditId] = useState(null);
  const [editSec, setEditSec] = useState({ nombre: "", imagen: "" });
  const [error, setError] = useState("");
  const [busca, setBusca] = useState("");
  const inputEdit = useRef(null);

  useEffect(() => {
    cargarSecciones();
    cargarProductos();
  }, []);

  const cargarSecciones = async () => {
    const q = query(collection(db, "secciones"), orderBy("orden", "asc"));
    const snap = await getDocs(q);
    setSecciones(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const cargarProductos = async () => {
    const q = query(collection(db, "productos"));
    const snap = await getDocs(q);
    setProductos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Alta categoría
  const handleAgregar = async () => {
    setError("");
    const nombre = nuevo.nombre.trim();
    if (!nombre) {
      setError(t("secciones.nombreObligatorio"));
      return;
    }
    if (secciones.some(sec => sec.nombre.toLowerCase() === nombre.toLowerCase())) {
      setError(t("secciones.existeCategoria"));
      return;
    }
    const orden = secciones.length ? Math.max(...secciones.map(s => s.orden || 0)) + 1 : 1;
    await addDoc(collection(db, "secciones"), {
      nombre,
      imagen: nuevo.imagen || "",
      orden,
      oculta: false
    });
    setNuevo({ nombre: "", imagen: "" });
    cargarSecciones();
  };

  // Edición
  const iniciarEdicion = (sec) => {
    setEditId(sec.id);
    setEditSec({ nombre: sec.nombre, imagen: sec.imagen || "" });
    setTimeout(() => inputEdit.current?.focus(), 300);
  };
  const cancelarEdicion = () => {
    setEditId(null);
    setEditSec({ nombre: "", imagen: "" });
    setError("");
  };
  const guardarEdicion = async () => {
    const nombre = editSec.nombre.trim();
    if (!nombre) {
      setError(t("secciones.nombreObligatorio"));
      return;
    }
    if (
      secciones.some(
        sec =>
          sec.nombre.toLowerCase() === nombre.toLowerCase() &&
          sec.id !== editId
      )
    ) {
      setError(t("secciones.existeCategoria"));
      return;
    }
    await updateDoc(doc(db, "secciones", editId), {
      nombre,
      imagen: editSec.imagen || ""
    });
    cancelarEdicion();
    cargarSecciones();
  };

  // Ocultar/desocultar
  const alternarOculta = async (id, oculta) => {
    await updateDoc(doc(db, "secciones", id), { oculta: !oculta });
    cargarSecciones();
  };

  // No permite borrar si hay productos vinculados
  const puedeBorrar = (seccionId) =>
    !productos.some((p) => p.seccionId === seccionId);

  const handleEliminar = async (id) => {
    if (!window.confirm(t("secciones.seguroBorrar"))) return;
    await deleteDoc(doc(db, "secciones", id));
    cargarSecciones();
  };

  // Cambiar orden
  const moverOrden = async (sec, dir) => {
    const idx = secciones.findIndex((s) => s.id === sec.id);
    if (idx === -1) return;
    const nuevoIdx = dir === "arriba" ? idx - 1 : idx + 1;
    if (nuevoIdx < 0 || nuevoIdx >= secciones.length) return;
    // Intercambiar orden
    const otras = [...secciones];
    [otras[idx].orden, otras[nuevoIdx].orden] = [otras[nuevoIdx].orden, otras[idx].orden];
    await updateDoc(doc(db, "secciones", sec.id), { orden: otras[idx].orden });
    await updateDoc(doc(db, "secciones", secciones[nuevoIdx].id), { orden: otras[nuevoIdx].orden });
    cargarSecciones();
  };

  // Exportar a Excel
  const exportarExcel = () => {
    if (secciones.length === 0) {
      alert(t("secciones.avisoSinCategorias"));
      return;
    }
    const data = secciones.map((sec, i) => ({
      Nro: i + 1,
      [t("secciones.nombre")]: sec.nombre,
      [t("secciones.imagen")]: sec.imagen || t("secciones.sinImagen"),
      [t("secciones.orden")]: sec.orden,
      [t("secciones.visible")]: sec.oculta ? t("secciones.no") : t("secciones.si")
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("secciones.titulo"));
    XLSX.writeFile(wb, t("secciones.excel"));
  };

  // Filtrar por nombre
  const seccionesFiltradas = secciones.filter((sec) =>
    sec.nombre.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ padding: 20, maxWidth: 950 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2>{t("secciones.titulo")}</h2>
        <BotonVolver ruta="/dashboard-admin" />
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
            boxShadow: "0 1px 5px #a4c2e7"
          }}
        >
          {t("secciones.exportar")}
        </button>
      </div>
      {secciones.length === 0 && (
        <div style={{
          background: "#fff3cd",
          border: "1px solid #ffeeba",
          color: "#856404",
          padding: 10,
          borderRadius: 7,
          fontSize: 15,
          marginBottom: 18
        }}>
          <b>{t("secciones.avisoSinCategorias")}</b>
          <br />{t("secciones.ayudaAgregar")}
        </div>
      )}

      {secciones.length > 4 && (
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder={t("secciones.buscar")}
          style={{ marginBottom: 14, width: 260, padding: 5, borderRadius: 4, border: "1px solid #cfcfcf" }}
        />
      )}

      <div style={{
        display: "flex",
        gap: 10,
        marginBottom: 14,
        alignItems: "center",
        background: "#eaf7ea",
        padding: 12,
        borderRadius: 8,
        maxWidth: 650
      }}>
        <input
          value={nuevo.nombre}
          onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })}
          placeholder={t("secciones.nuevaCategoria")}
          style={{ width: 210, marginRight: 7, padding: 5, borderRadius: 4, border: "1px solid #b8b8b8" }}
        />
        <input
          value={nuevo.imagen}
          onChange={e => setNuevo({ ...nuevo, imagen: e.target.value })}
          placeholder={t("secciones.urlImagen")}
          style={{ width: 240, padding: 5, borderRadius: 4, border: "1px solid #b8b8b8" }}
        />
        <button
          onClick={handleAgregar}
          style={{
            marginLeft: 5,
            background: "#4caf50",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "7px 18px",
            fontWeight: "bold",
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 2px 8px #b4e2c5"
          }}
        >
          {t("secciones.agregar")}
        </button>
      </div>
      {error && <div style={{ color: "#ba2519", marginBottom: 12 }}>{error}</div>}

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table border="1" cellPadding={7} style={{ minWidth: 730, fontSize: 16, background: "#fff" }}>
          <thead style={{ background: "#e3e8f0" }}>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th style={{ width: 80 }}>{t("secciones.imagen")}</th>
              <th style={{ width: 220 }}>{t("secciones.nombre")}</th>
              <th style={{ width: 80 }}>
                {t("secciones.orden")}
                <span
                  style={{ marginLeft: 4, color: "#2976d1", cursor: "pointer" }}
                  title={t("secciones.ayudaOrden")}
                >
                  ❓
                </span>
              </th>
              <th style={{ width: 90 }}>{t("secciones.visible")}</th>
              <th style={{ width: 220 }}>{t("secciones.acciones")}</th>
            </tr>
          </thead>
          <tbody>
            {seccionesFiltradas.map((sec, i) =>
              editId === sec.id ? (
                <tr key={sec.id} style={{ background: "#e9f7ef" }}>
                  <td>{i + 1}</td>
                  <td>
                    <input
                      ref={inputEdit}
                      value={editSec.imagen}
                      onChange={e => setEditSec({ ...editSec, imagen: e.target.value })}
                      placeholder={t("secciones.urlImagen")}
                      style={{ width: 70 }}
                    />
                    <img
                      src={editSec.imagen || IMG_PLACEHOLDER}
                      alt="imagen"
                      width={38}
                      style={{ borderRadius: 8, border: "1px solid #ccc", marginLeft: 5 }}
                    />
                  </td>
                  <td>
                    <input
                      value={editSec.nombre}
                      onChange={e => setEditSec({ ...editSec, nombre: e.target.value })}
                      placeholder={t("secciones.nombre")}
                      style={{ width: 165, fontWeight: "bold" }}
                    />
                  </td>
                  <td>{sec.orden}</td>
                  <td>
                    {sec.oculta ? (
                      <span style={{ color: "#b82121" }}>{t("secciones.oculta")}</span>
                    ) : (
                      <span style={{ color: "#127312" }}>{t("secciones.visible")}</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={guardarEdicion}
                      style={{ marginRight: 5, color: "#fff", background: "#009966", border: "none", borderRadius: 4, padding: "6px 12px", fontWeight: 600, cursor: "pointer" }}
                    >
                      {t("secciones.guardar")}
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      style={{ marginRight: 12, background: "#fff", color: "#555", border: "1px solid #ccc", borderRadius: 4, padding: "6px 12px", fontWeight: 500, cursor: "pointer" }}
                    >
                      {t("secciones.cancelar")}
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={sec.id}>
                  <td>{i + 1}</td>
                  <td>
                    <img
                      src={sec.imagen || IMG_PLACEHOLDER}
                      alt="imagen"
                      width={38}
                      style={{ borderRadius: 8, border: "1px solid #ccc" }}
                    />
                  </td>
                  <td>
                    {sec.nombre}
                    {sec.oculta && <span style={{ color: "#b82121", fontWeight: 500, marginLeft: 4 }}>({t("secciones.oculta")})</span>}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      disabled={i === 0}
                      title={t("secciones.subir")}
                      onClick={() => moverOrden(sec, "arriba")}
                      style={{ marginRight: 3, background: "none", border: "none", fontSize: 17, cursor: i === 0 ? "not-allowed" : "pointer" }}
                    >⬆️</button>
                    <button
                      disabled={i === secciones.length - 1}
                      title={t("secciones.bajar")}
                      onClick={() => moverOrden(sec, "abajo")}
                      style={{ background: "none", border: "none", fontSize: 17, cursor: i === secciones.length - 1 ? "not-allowed" : "pointer" }}
                    >⬇️</button>
                  </td>
                  <td>
                    <button
                      onClick={() => alternarOculta(sec.id, sec.oculta)}
                      style={{
                        padding: "2px 11px",
                        border: "none",
                        borderRadius: 4,
                        fontWeight: 600,
                        background: sec.oculta ? "#d7d8d6" : "#c6f1c4",
                        color: sec.oculta ? "#b82121" : "#127312",
                        cursor: "pointer"
                      }}
                    >
                      {sec.oculta ? t("secciones.mostrar") : t("secciones.ocultar")}
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => iniciarEdicion(sec)}
                      style={{ marginRight: 5, color: "#1c52b8", background: "#eaf1fb", border: "1px solid #8bb9f7", borderRadius: 4, padding: "5px 10px", fontWeight: 600, cursor: "pointer" }}
                    >
                      {t("secciones.editar")}
                    </button>
                    <button
                      onClick={() => {
                        if (!puedeBorrar(sec.id)) {
                          alert(t("secciones.noBorrarProductos"));
                          window.open("/productos", "_blank");
                          return;
                        }
                        handleEliminar(sec.id);
                      }}
                      style={{
                        marginRight: 5,
                        color: "#fff",
                        background: puedeBorrar(sec.id) ? "#d90b36" : "#eabebc",
                        border: "none",
                        borderRadius: 4,
                        padding: "5px 10px",
                        fontWeight: 600,
                        cursor: puedeBorrar(sec.id) ? "pointer" : "not-allowed"
                      }}
                      disabled={!puedeBorrar(sec.id)}
                    >
                      {t("secciones.borrar")}
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
