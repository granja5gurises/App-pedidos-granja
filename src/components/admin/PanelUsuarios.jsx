import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import BotonVolver from "./BotonVolver";

function PanelUsuarios() {
  const { t } = useTranslation();
  const [usuarios, setUsuarios] = useState([]);
  const [campos, setCampos] = useState([]);
  const [camposObligatorios, setCamposObligatorios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editId, setEditId] = useState(null);
  const [editUser, setEditUser] = useState({});
  const [nuevo, setNuevo] = useState({});
  const [errorAlta, setErrorAlta] = useState("");
  const [errorEdit, setErrorEdit] = useState("");
  const [filtroCol, setFiltroCol] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCamposConfig();
    cargarCamposObligatorios();
    cargarUsuarios();
    // eslint-disable-next-line
  }, []);

  const cargarCamposConfig = async () => {
    const snap = await getDoc(doc(db, "configuracion", "general"));
    if (snap.exists()) {
      const arr = Array.isArray(snap.data().camposRegistro)
        ? snap.data().camposRegistro
        : Object.entries(snap.data().camposRegistro || {}).map(([nombre, props]) => ({
            nombre,
            ...props
          }));
      setCampos(arr);
    }
  };

  const cargarCamposObligatorios = async () => {
    const snap = await getDoc(doc(db, "config", "camposObligatorios"));
    if (snap.exists()) setCamposObligatorios(snap.data().lista || []);
    else setCamposObligatorios(["nombre", "email"]);
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    const q = query(collection(db, "usuarios"), orderBy("email", "asc"));
    const snap = await getDocs(q);
    const arr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsuarios(arr);
    setLoading(false);
  };

  // Alta manual
  const handleNuevoUsuario = async () => {
    setErrorAlta("");
    for (let campo of camposObligatorios) {
      if (!nuevo[campo]) {
        setErrorAlta(t("usuarios.campoObligatorio", { campo: t(`usuarios.${campo}`) || campo }));
        return;
      }
    }
    if (usuarios.some(u => u.email.trim().toLowerCase() === (nuevo.email || "").trim().toLowerCase())) {
      setErrorAlta(t("usuarios.emailExistente"));
      return;
    }
    await addDoc(collection(db, "usuarios"), {
      ...nuevo,
      admin: false,
      bloqueado: false
    });
    setNuevo({});
    cargarUsuarios();
  };

  // Editar usuario
  const iniciarEdicion = (user) => {
    setEditId(user.id);
    setEditUser({ ...user });
    setErrorEdit("");
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditUser({});
    setErrorEdit("");
  };

  const guardarEdicion = async () => {
    setErrorEdit("");
    for (let campo of camposObligatorios) {
      if (!editUser[campo]) {
        setErrorEdit(t("usuarios.campoObligatorio", { campo: t(`usuarios.${campo}`) || campo }));
        return;
      }
    }
    if (
      editUser.email &&
      usuarios.some(
        u => u.email.trim().toLowerCase() === editUser.email.trim().toLowerCase() && u.id !== editId
      )
    ) {
      setErrorEdit(t("usuarios.emailExistente"));
      return;
    }
    await updateDoc(doc(db, "usuarios", editId), editUser);
    cancelarEdicion();
    cargarUsuarios();
  };

  // Eliminar usuario
  const handleEliminar = async (id) => {
    if (window.confirm(t("usuarios.confirmEliminar"))) {
      await deleteDoc(doc(db, "usuarios", id));
      cargarUsuarios();
    }
  };

  // Bloquear/desbloquear
  const alternarBloqueado = async (id, bloqueado) => {
    await updateDoc(doc(db, "usuarios", id), { bloqueado: !bloqueado });
    cargarUsuarios();
  };

  const handleFiltroCol = (col, val) => {
    setFiltroCol({ ...filtroCol, [col]: val });
  };

  const exportarExcel = () => {
    if (!usuarios.length) {
      alert(t("usuarios.noUsuariosExportar"));
      return;
    }
    const columnas = campos.map(c => c.nombre);
    const data = usuarios.map(u => {
      let obj = {};
      columnas.forEach(k => obj[k] = u[k] || "");
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(data, { header: columnas });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("usuarios.hojaExcel"));
    XLSX.writeFile(wb, t("usuarios.archivoExcel"));
  };

  let usuariosFiltrados = usuarios.filter(u => {
    let ok = true;
    if (busqueda.trim()) {
      const b = busqueda.trim().toLowerCase();
      ok = campos.some(campo => (u[campo.nombre] || "").toLowerCase().includes(b));
    }
    Object.entries(filtroCol).forEach(([col, val]) => {
      if (val && String(u[col] || "").toLowerCase() !== String(val).toLowerCase()) ok = false;
    });
    return ok;
  });

  return (
    <div style={{ padding: 20 }}>
      {/* Botón Volver y Título bien arriba */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <BotonVolver ruta="/dashboard-admin" />
        <h2 style={{ margin: 0 }}>{t("usuarios.titulo")}</h2>
      </div>

      {/* ALTA USUARIO */}
      <div style={{
        background: "#f5f7f7",
        border: "1px solid #c6e2d7",
        padding: 12,
        borderRadius: 8,
        maxWidth: 850,
        marginBottom: 12
      }}>
        <div style={{ fontWeight: 600, marginBottom: 5 }}>{t("usuarios.altaManual")}</div>
        {campos.map(campo => (
          <input
            key={campo.nombre}
            placeholder={t(`usuarios.${campo.nombre}`) || campo.nombre.charAt(0).toUpperCase() + campo.nombre.slice(1)}
            value={nuevo[campo.nombre] || ""}
            onChange={e => setNuevo(n => ({ ...n, [campo.nombre]: e.target.value }))}
            style={{ marginRight: 10, marginBottom: 4, minWidth: 120 }}
          />
        ))}
        <button
          onClick={handleNuevoUsuario}
          style={{
            background: "#4caf50",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            borderRadius: 6,
            fontSize: 15,
            padding: "6px 22px",
            cursor: "pointer",
            boxShadow: "0 2px 8px #b4e2c5"
          }}
        >{t("usuarios.agregarUsuario")}</button>
        {errorAlta && <div style={{ color: "#d00021", marginTop: 7 }}>{errorAlta}</div>}
        <div style={{ color: "#606060", fontSize: 12, marginTop: 5 }}>
          <Link to="/config-general" style={{ color: "#2976d1", textDecoration: "underline" }}>
            {t("usuarios.editCamposRegistro")}
          </Link>
        </div>
      </div>

      {/* BUSQUEDA Y FILTROS */}
      <div style={{ marginBottom: 9 }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder={t("usuarios.buscar")}
          style={{
            padding: "7px 10px",
            width: 320,
            borderRadius: 4,
            border: "1px solid #b8b8b8",
            fontSize: 15
          }}
        />
      </div>

      {/* FILTROS POR COLUMNA */}
      <div style={{ marginBottom: 7 }}>
        {campos.map(col =>
          col.nombre === "admin" ? (
            <select
              key={col.nombre}
              value={filtroCol[col.nombre] || ""}
              onChange={e => handleFiltroCol(col.nombre, e.target.value)}
              style={{ marginRight: 7, minWidth: 95 }}
            >
              <option value="">{t("usuarios.admin")}</option>
              <option value="true">{t("usuarios.admins")}</option>
              <option value="false">{t("usuarios.clientes")}</option>
            </select>
          ) : null
        )}
      </div>

      {/* MENSAJE FILTRO */}
      {(busqueda || Object.values(filtroCol).some(v => v)) && (
        <div style={{ color: "#2957a4", fontSize: 13, marginBottom: 8 }}>
          {t("usuarios.filtroActivo", { visibles: usuariosFiltrados.length, total: usuarios.length })}
        </div>
      )}

      {/* Botón de Exportar Excel alineado a la derecha */}
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "4px 0" }}>
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
            marginLeft: "auto"
          }}
        >
          {t("usuarios.exportarExcel")}
        </button>
      </div>

      {/* TABLA DE USUARIOS */}
      <div style={{ overflowX: "auto", marginBottom: 22 }}>
        {loading ? <div>{t("usuarios.cargando")}</div> :
          <table border="1" cellPadding={7} style={{ minWidth: 890, background: "#fff" }}>
            <thead style={{ background: "#e3e8f0" }}>
              <tr>
                {campos.map(col => (
                  <th key={col.nombre}>
                    {t(`usuarios.${col.nombre}`) || col.nombre.charAt(0).toUpperCase() + col.nombre.slice(1)}
                  </th>
                ))}
                <th>{t("usuarios.acciones")}</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(user =>
                editId === user.id ? (
                  <>
                    <tr key={user.id} style={{ background: "#f7f7e0" }}>
                      {campos.map(col => (
                        <td key={col.nombre}>
                          <input
                            value={editUser[col.nombre] || ""}
                            onChange={e => setEditUser({ ...editUser, [col.nombre]: e.target.value })}
                            style={{ minWidth: 85 }}
                          />
                        </td>
                      ))}
                      <td>
                        <button onClick={guardarEdicion} style={{ marginRight: 5 }}>{t("usuarios.guardar")}</button>
                        <button onClick={cancelarEdicion}>{t("usuarios.cancelar")}</button>
                      </td>
                    </tr>
                    {errorEdit && (
                      <tr>
                        <td colSpan={campos.length + 1}>
                          <span style={{ color: "#d00021", fontWeight: 500 }}>{errorEdit}</span>
                        </td>
                      </tr>
                    )}
                  </>
                ) : (
                  <tr key={user.id}>
                    {campos.map(col => (
                      <td key={col.nombre}>{user[col.nombre]}</td>
                    ))}
                    <td>
                      <button onClick={() => iniciarEdicion(user)} style={{ marginRight: 5 }}>{t("usuarios.editar")}</button>
                      <button
                        onClick={() => handleEliminar(user.id)}
                        style={{ color: "red", marginRight: 5 }}>{t("usuarios.eliminar")}</button>
                      <button
                        onClick={() => alternarBloqueado(user.id, user.bloqueado)}
                        style={{ color: "#b12a12", marginRight: 5 }}
                      >
                        {user.bloqueado ? t("usuarios.desbloquear") : t("usuarios.bloquear")}
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}

export default PanelUsuarios;
