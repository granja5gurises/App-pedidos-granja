import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BotonVolver from "./BotonVolver";

function PanelListaGenerico({ coleccion: propColeccion, label: propLabel }) {
  const { t } = useTranslation();
  const params = useParams();
  // Soporta prop o ruta dinámica
  const coleccion = propColeccion || params.nombreLista;
  const label = propLabel || (coleccion ? (coleccion.charAt(0).toUpperCase() + coleccion.slice(1)) : t("dashboard.listas"));

  const [items, setItems] = useState([]);
  const [campos, setCampos] = useState(["nombre"]);
  const [nuevo, setNuevo] = useState({});
  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [nuevoCampo, setNuevoCampo] = useState("");
  const [editandoCol, setEditandoCol] = useState(null);
  const [nuevoNombreCol, setNuevoNombreCol] = useState("");

  useEffect(() => {
    if (!coleccion) return;
    cargar();
    // eslint-disable-next-line
  }, [coleccion]);

  const cargar = async () => {
    if (!coleccion) return;
    const snap = await getDocs(collection(db, coleccion));
    const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setItems(docs);
    let setAll = new Set(["nombre"]);
    docs.forEach(item => {
      Object.keys(item).forEach(key => setAll.add(key));
    });
    setCampos(Array.from(setAll).filter(c => c !== "id"));
  };

  const handleAgregarCampo = () => {
    const campo = nuevoCampo.trim();
    if (!campo || campos.includes(campo)) return;
    setCampos([...campos, campo]);
    setNuevoCampo("");
  };

  // Eliminar columna/campo
  const eliminarColumna = (col) => {
    if (col === "nombre") return alert(t("panelListaGenerico.noEliminarNombre"));
    if (!window.confirm(t("panelListaGenerico.seguroEliminarCol", { col }))) return;
    items.forEach(async (item) => {
      if (item[col] !== undefined) {
        const ref = doc(db, coleccion, item.id);
        let update = { ...item };
        delete update[col];
        delete update.id;
        await updateDoc(ref, update);
      }
    });
    setCampos(prev => prev.filter(c => c !== col));
    setTimeout(cargar, 800);
  };

  // EDITAR NOMBRE DE COLUMNA
  const editarColumna = (col) => {
    setEditandoCol(col);
    setNuevoNombreCol(col);
  };

  const guardarNombreCol = async () => {
    const viejo = editandoCol;
    const nuevo = nuevoNombreCol.trim();
    if (!nuevo || nuevo === "nombre" || campos.includes(nuevo)) {
      alert(t("panelListaGenerico.nombreInvalido"));
      return;
    }
    for (const item of items) {
      if (item[viejo] !== undefined) {
        const ref = doc(db, coleccion, item.id);
        let update = { ...item, [nuevo]: item[viejo] };
        delete update[viejo];
        delete update.id;
        await updateDoc(ref, update);
      }
    }
    setCampos(prev => prev.map(c => c === viejo ? nuevo : c));
    setEditandoCol(null);
    setNuevoNombreCol("");
    setTimeout(cargar, 800);
  };

  // Nuevo registro
  const handleInputNuevo = (campo, val) => {
    setNuevo(n => ({ ...n, [campo]: val }));
  };

  const handleAgregar = async () => {
    if (!nuevo.nombre || !nuevo.nombre.trim()) return alert(t("panelListaGenerico.completaNombre"));
    let registro = { ...nuevo };
    campos.forEach(campo => {
      if (
        campo.toLowerCase().includes("costo") ||
        campo.toLowerCase().includes("precio") ||
        campo.toLowerCase().includes("stock") ||
        campo.toLowerCase().includes("descuento")
      ) {
        registro[campo] = Number(
          String(registro[campo]).replace(",", ".").replace(/[^0-9.\-]+/g, "")
        ) || 0;
      }
    });
    await addDoc(collection(db, coleccion), registro);
    setNuevo({});
    cargar();
  };

  // Edición inline
  const startEditar = (item) => {
    setEditId(item.id);
    setEditRow(item);
  };

  const handleEditInput = (campo, val) => {
    setEditRow(row => ({ ...row, [campo]: val }));
  };

  const guardarEdicion = async () => {
    let row = { ...editRow };
    delete row.id;
    campos.forEach(campo => {
      if (
        campo.toLowerCase().includes("costo") ||
        campo.toLowerCase().includes("precio") ||
        campo.toLowerCase().includes("stock") ||
        campo.toLowerCase().includes("descuento")
      ) {
        row[campo] = Number(
          String(row[campo]).replace(",", ".").replace(/[^0-9.\-]+/g, "")
        ) || 0;
      }
    });
    await updateDoc(doc(db, coleccion, editId), row);
    setEditId(null);
    setEditRow({});
    cargar();
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditRow({});
  };

  const eliminar = async (id) => {
    if (!window.confirm(t("panelListaGenerico.eliminarRegistro"))) return;
    await deleteDoc(doc(db, coleccion, id));
    cargar();
  };

  if (!coleccion) return <div style={{ color: "crimson", padding: 24 }}>{t("panelListaGenerico.noColeccion")}</div>;

  return (
    <div style={{
      padding: 20,
      maxWidth: "100vw",
      overflowX: "auto"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{t("panelListaGenerico.gestion", { label })}</h2>
        <BotonVolver ruta="/dashboard-admin" />
      </div>
      <div style={{ marginBottom: 10 }}>
        <b>{t("panelListaGenerico.agregarCampo")}</b>{" "}
        <input
          value={nuevoCampo}
          onChange={e => setNuevoCampo(e.target.value)}
          placeholder={t("panelListaGenerico.placeholderCampo")}
          style={{ marginRight: 8 }}
        />
        <button onClick={handleAgregarCampo}>{t("panelListaGenerico.agregarColumna")}</button>
      </div>
      <div style={{
        overflowX: "auto",
        border: "1px solid #eee",
        borderRadius: 8,
        background: "#fafbfc",
        boxShadow: "0 0 8px #eee"
      }}>
        <table style={{
          borderCollapse: "collapse",
          minWidth: 1100,
          width: "100%",
          fontSize: 14
        }}>
          <thead style={{
            position: "sticky",
            top: 0,
            background: "#eef",
            zIndex: 2
          }}>
            <tr>
              {campos.map((campo, idx) => (
                <th key={campo}
                  style={{
                    padding: "10px 8px",
                    border: "1px solid #e0e0e0",
                    background: "#f4f7fa",
                    minWidth: idx === 0 ? 120 : 100,
                    maxWidth: 250,
                    whiteSpace: "nowrap",
                    position: idx === 0 ? "sticky" : undefined,
                    left: idx === 0 ? 0 : undefined,
                    zIndex: idx === 0 ? 1 : undefined,
                  }}>
                  {editandoCol === campo ? (
                    <>
                      <input
                        value={nuevoNombreCol}
                        onChange={e => setNuevoNombreCol(e.target.value)}
                        style={{ width: 90, marginRight: 4 }}
                      />
                      <button onClick={guardarNombreCol}>{t("panelListaGenerico.ok")}</button>
                      <button onClick={() => setEditandoCol(null)}>X</button>
                    </>
                  ) : (
                    <>
                      {campo === "nombre"
                        ? t("panelListaGenerico.nombre")
                        : campo}
                      {campo !== "nombre" && (
                        <>
                          <button
                            style={{
                              marginLeft: 6, color: "blue", fontWeight: "bold",
                              background: "#eef", border: "1px solid #99c", borderRadius: 4, cursor: "pointer"
                            }}
                            title={t("panelListaGenerico.editarCol")}
                            onClick={() => editarColumna(campo)}
                          >
                            ✎
                          </button>
                          <button
                            style={{
                              marginLeft: 2, color: "red", fontWeight: "bold",
                              background: "#fee", border: "1px solid #faa", borderRadius: 4, cursor: "pointer"
                            }}
                            title={t("panelListaGenerico.eliminarCol")}
                            onClick={() => eliminarColumna(campo)}
                          >
                            x
                          </button>
                        </>
                      )}
                    </>
                  )}
                </th>
              ))}
              <th style={{
                background: "#f4f7fa",
                position: "sticky",
                right: 0,
                zIndex: 1,
                padding: "10px 8px"
              }}>{t("panelListaGenerico.acciones")}</th>
            </tr>
          </thead>
          <tbody>
            {/* Nueva fila */}
            <tr>
              {campos.map((campo, idx) => (
                <td key={campo}
                  style={{
                    padding: "5px",
                    background: "#f7f9fb",
                    border: "1px solid #e0e0e0",
                    minWidth: idx === 0 ? 120 : 100,
                    maxWidth: 250,
                    position: idx === 0 ? "sticky" : undefined,
                    left: idx === 0 ? 0 : undefined,
                    zIndex: idx === 0 ? 1 : undefined,
                  }}>
                  <input
                    value={nuevo[campo] || ""}
                    onChange={e => handleInputNuevo(campo, e.target.value)}
                    placeholder={campo === "nombre"
                      ? t("panelListaGenerico.nombre")
                      : campo}
                    style={{ width: "95%", fontSize: 14, padding: 3 }}
                  />
                </td>
              ))}
              <td style={{
                background: "#f4f7fa",
                position: "sticky",
                right: 0,
                zIndex: 1,
                padding: 5
              }}>
                <button onClick={handleAgregar}>{t("panelListaGenerico.agregar")}</button>
              </td>
            </tr>
            {/* Filas */}
            {items.map(item => editId === item.id ? (
              <tr key={item.id}>
                {campos.map((campo, idx) => (
                  <td key={campo}
                    style={{
                      padding: "5px",
                      background: "#fff",
                      border: "1px solid #e0e0e0",
                      minWidth: idx === 0 ? 120 : 100,
                      maxWidth: 250,
                      position: idx === 0 ? "sticky" : undefined,
                      left: idx === 0 ? 0 : undefined,
                      zIndex: idx === 0 ? 1 : undefined,
                    }}>
                    <input
                      value={editRow[campo] || ""}
                      onChange={e => handleEditInput(campo, e.target.value)}
                      style={{ width: "95%", fontSize: 14, padding: 3 }}
                    />
                  </td>
                ))}
                <td style={{
                  background: "#f4f7fa",
                  position: "sticky",
                  right: 0,
                  zIndex: 1,
                  padding: 5
                }}>
                  <button onClick={guardarEdicion}>{t("panelListaGenerico.guardar")}</button>
                  <button onClick={cancelarEdicion} style={{ marginLeft: 5 }}>{t("panelListaGenerico.cancelar")}</button>
                </td>
              </tr>
            ) : (
              <tr key={item.id}>
                {campos.map((campo, idx) => (
                  <td key={campo}
                    style={{
                      padding: "5px",
                      border: "1px solid #e0e0e0",
                      minWidth: idx === 0 ? 120 : 100,
                      maxWidth: 250,
                      background: idx === 0 ? "#f7f9fb" : "#fff",
                      position: idx === 0 ? "sticky" : undefined,
                      left: idx === 0 ? 0 : undefined,
                      zIndex: idx === 0 ? 1 : undefined,
                      overflow: "hidden",
                    }}>
                    {
                      typeof item[campo] === "object" && item[campo] !== null
                        ? <pre style={{
                            fontSize: "12px",
                            background: "#f7f7f7",
                            margin: 0,
                            padding: 2,
                            border: "none",
                            maxWidth: 220,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all"
                          }}>{JSON.stringify(item[campo], null, 0)}</pre>
                        : (item[campo] || "")
                    }
                  </td>
                ))}
                <td style={{
                  background: "#f4f7fa",
                  position: "sticky",
                  right: 0,
                  zIndex: 1,
                  padding: 5
                }}>
                  <button onClick={() => startEditar(item)}>{t("panelListaGenerico.editar")}</button>
                  <button onClick={() => eliminar(item.id)} style={{ color: "red", marginLeft: 5 }}>{t("panelListaGenerico.eliminar")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p style={{ color: "#888" }}>{t("panelListaGenerico.noRegistros", { label })}</p>}
    </div>
  );
}

export default PanelListaGenerico;
