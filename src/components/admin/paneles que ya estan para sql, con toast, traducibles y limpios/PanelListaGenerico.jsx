import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import panelStyles from "../../estilos/panelStyles";
import Swal from "sweetalert2";
import {
  cargarItems, agregarItem, actualizarItem, eliminarItem, eliminarCampo, renombrarCampo
} from "../../servicios/listasService";
import BotonVolver from "./BotonVolver";

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function PanelListaGenerico({ coleccion: propColeccion, label: propLabel }) {
  const { t } = useTranslation();
  const location = useLocation();
  const pathCampo = location.pathname.split("/").pop();
  const fallbackColeccion = pathCampo;
  const fallbackLabel = capitalizar(pathCampo);
  const coleccion = propColeccion || fallbackColeccion;
  const label = propLabel || fallbackLabel;

  const [items, setItems] = useState([]);
  const [campos, setCampos] = useState(["nombre"]);
  const [nuevo, setNuevo] = useState({});
  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [nuevoCampo, setNuevoCampo] = useState("");
  const [editandoCol, setEditandoCol] = useState(null);
  const [nuevoNombreCol, setNuevoNombreCol] = useState("");
  const camposRef = useRef(null);

  useEffect(() => {
    cargar();
  }, [coleccion]);

  const cargar = async () => {
    if (!coleccion) return;
    const docs = await cargarItems(coleccion);
    setItems(docs);
    if (!camposRef.current && docs.length > 0) {
      const keys = Object.keys(docs[0]).filter(c => c !== "id" && c !== "nombre");
      camposRef.current = ["nombre", ...keys];
      setCampos(camposRef.current);
    }
  };

  const handleAgregarCampo = () => {
    const campo = nuevoCampo.trim();
    if (!campo || campos.includes(campo)) return;
    const nuevos = [...campos, campo];
    camposRef.current = nuevos;
    setCampos(nuevos);
    setNuevoCampo("");
  };

  const eliminarColumna = async (col) => {
    if (col === "nombre") return alert(t("panel_lista.error_no_eliminar_nombre"));
    const { isConfirmed } = await Swal.fire({
      title: t("panel_lista.confirmar_eliminar_columna") + " " + col + " " + t("panel_lista.de_todos_los_registros"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("panel_lista.boton_eliminar"),
      cancelButtonText: t("panel_lista.boton_cancelar")
    });
    if (!isConfirmed) return;
    await eliminarCampo(coleccion, col, items);
    const nuevos = campos.filter(c => c !== col);
    camposRef.current = nuevos;
    setCampos(nuevos);
    toast.success(t("panel_lista.eliminado_ok"));
    setTimeout(cargar, 800);
  };

  const editarColumna = (col) => {
    setEditandoCol(col);
    setNuevoNombreCol(col);
  };

  const guardarNombreCol = async () => {
    const viejo = editandoCol;
    const nuevo = nuevoNombreCol.trim();
    if (!nuevo || nuevo === "nombre" || campos.includes(nuevo)) {
      alert(t("panel_lista.error_nombre_invalido"));
      return;
    }
    await renombrarCampo(coleccion, viejo, nuevo, items);
    const nuevos = campos.map(c => c === viejo ? nuevo : c);
    camposRef.current = nuevos;
    setCampos(nuevos);
    setEditandoCol(null);
    setNuevoNombreCol("");
    toast.success(t("panel_lista.editado_ok"));
    setTimeout(cargar, 800);
  };

  const handleInputNuevo = (campo, val) => {
    setNuevo(n => ({ ...n, [campo]: val }));
  };

  const handleAgregar = async () => {
    if (!nuevo.nombre || !nuevo.nombre.trim()) return alert(t("panel_lista.error_completar_nombre"));
    await agregarItem(coleccion, nuevo);
    setNuevo({});
    cargar();
  };

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
    await actualizarItem(coleccion, editId, row);
    setEditId(null);
    setEditRow({});
    toast.success(t("panel_lista.editado_ok"));
    cargar();
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditRow({});
  };

  const eliminar = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: t("panel_lista.confirmar_eliminar"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("panel_lista.boton_eliminar"),
      cancelButtonText: t("panel_lista.boton_cancelar")
    });
    if (!isConfirmed) return;
    await eliminarItem(coleccion, id);
    toast.success(t("panel_lista.eliminado_ok"));
    cargar();
  };

  return (
    <div style={panelStyles.contenedor}>
      <h2>{t("panel_lista.titulo") + " "}{label}</h2>
      <div style={panelStyles.margenInferior}>
        <b>{t("panel_lista.agregar_columna")}</b>{" "}
        <input
          value={nuevoCampo}
          onChange={e => setNuevoCampo(e.target.value)}
          placeholder={t("panel_lista.placeholder_columna")}
          style={panelStyles.inputNuevoCampo}
        />
        <button onClick={handleAgregarCampo}>{t("panel_lista.boton_agregar_columna")}</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table border={1} cellPadding={5} style={panelStyles.tabla}>
          <thead>
            <tr>
              {Array.isArray(campos) && campos.map(campo => (
                <th key={campo}>
                  {editandoCol === campo ? (
                    <>
                      <input
                        value={nuevoNombreCol}
                        onChange={e => setNuevoNombreCol(e.target.value)}
                        style={panelStyles.inputColCabecera}
                      />
                      <button onClick={guardarNombreCol}>{t("panel_lista.boton_guardar")}</button>
                      <button onClick={() => setEditandoCol(null)}>{t("panel_lista.boton_cancelar")}</button>
                    </>
                  ) : (
                    <>
                      {campo}
                      {campo !== "nombre" && (
                        <>
                          <button
                            style={panelStyles.botonEditarColumna}
                            title="Editar nombre columna"
                            onClick={() => editarColumna(campo)}
                          >
                            ✎
                          </button>
                          <button
                            style={panelStyles.botonEliminarColumna}
                            title="Eliminar columna"
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
              <th>{t("panel_lista.columna_acciones")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {Array.isArray(campos) && campos.map(campo => (
                <td key={campo}>
                  <input
                    value={nuevo[campo] || ""}
                    onChange={e => handleInputNuevo(campo, e.target.value)}
                    placeholder={campo}
                    style={panelStyles.inputChico}
                  />
                </td>
              ))}
              <td>
                <button onClick={handleAgregar}>{t("panel_lista.boton_agregar")}</button>
              </td>
            </tr>
            {items.map(item => editId === item.id ? (
              <tr key={item.id}>
                {Array.isArray(campos) && campos.map(campo => (
                  <td key={campo}>
                    <input
                      value={editRow[campo] || ""}
                      onChange={e => handleEditInput(campo, e.target.value)}
                      style={panelStyles.inputChico}
                    />
                  </td>
                ))}
                <td>
                  <button onClick={guardarEdicion}>{t("panel_lista.boton_guardar")}</button>
                  <button onClick={cancelarEdicion} style={panelStyles.botonCancelar}>{t("panel_lista.boton_cancelar")}</button>
                </td>
              </tr>
            ) : (
              <tr key={item.id}>
                {Array.isArray(campos) && campos.map(campo => (
                  <td key={campo}>{item[campo] || ""}</td>
                ))}
                <td>
                  <button onClick={() => startEditar(item)}>{t("panel_lista.boton_editar")}</button>
                  <button onClick={() => eliminar(item.id)} style={panelStyles.botonEliminarFila}>{t("panel_lista.boton_eliminar")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p style={panelStyles.sinRegistros}>{t("panel_lista.sin_registros") + " " + label.toLowerCase() + " " + t("panel_lista.registrados")}</p>}
      <BotonVolver />
    </div>
  );
}

export default PanelListaGenerico;
