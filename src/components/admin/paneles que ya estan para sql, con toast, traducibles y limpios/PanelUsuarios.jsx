
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {
  obtenerCamposRegistro,
  obtenerCamposObligatorios,
  obtenerUsuarios,
  agregarUsuario,
  actualizarUsuario,
  eliminarUsuario,
  cambiarBloqueoUsuario
} from "../../servicios/usuariosService";
import BotonVolver from "./BotonVolver";
import styles from "../../estilos/panelStyles";
import FormularioAltaUsuario from "../usuarios/FormularioAltaUsuario";
import TablaUsuarios from "../usuarios/TablaUsuarios";
import { useTranslation } from "react-i18next";

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
    try {
      const arr = await obtenerCamposRegistro();
      setCampos(arr);
    } catch (error) {
      console.error("Error al cargar campos", error);
    }
  };

  const cargarCamposObligatorios = async () => {
    try {
      const lista = await obtenerCamposObligatorios();
      setCamposObligatorios(lista);
    } catch (error) {
      console.error("Error al cargar campos obligatorios", error);
    }
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const arr = await obtenerUsuarios();
      setUsuarios(arr);
    } catch (error) {
      console.error("Error al cargar usuarios", error);
      toast.error(t("usuarios.errorGeneral"));
    } finally {
      setLoading(false);
    }
  };

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
    try {
      await agregarUsuario(nuevo);
      setNuevo({});
      cargarUsuarios();
      toast.success(t("usuarios.usuarioAgregado"));
    } catch (error) {
      console.error("Error al agregar usuario", error);
      toast.error(t("usuarios.errorGeneral"));
    }
  };

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
      usuarios.some(u => u.email.trim().toLowerCase() === editUser.email.trim().toLowerCase() && u.id !== editId)
    ) {
      setErrorEdit(t("usuarios.emailExistente"));
      return;
    }
    try {
      await actualizarUsuario(editId, editUser);
      cancelarEdicion();
      cargarUsuarios();
      toast.success(t("usuarios.usuarioEditado"));
    } catch (error) {
      console.error("Error al guardar edición", error);
      toast.error(t("usuarios.errorGeneral"));
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm(t("usuarios.confirmEliminar"))) {
      try {
        await eliminarUsuario(id);
        cargarUsuarios();
        toast.success(t("usuarios.usuarioEliminado"));
      } catch (error) {
        console.error("Error al eliminar usuario", error);
        toast.error(t("usuarios.errorGeneral"));
      }
    }
  };

  const alternarBloqueado = async (id, bloqueado) => {
    try {
      await cambiarBloqueoUsuario(id, bloqueado);
      cargarUsuarios();
    } catch (error) {
      console.error("Error al cambiar bloqueo", error);
      toast.error(t("usuarios.errorGeneral"));
    }
  };

  const handleFiltroCol = (col, val) => {
    setFiltroCol({ ...filtroCol, [col]: val });
  };

  const exportarExcel = () => {
    if (!usuarios.length) {
      toast.info(t("usuarios.noUsuariosExportar"));
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
    <div style={styles.contenedor}>
      <ToastContainer position="top-right" autoClose={3500} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <BotonVolver ruta="/dashboard-admin" />
        <h2 style={{ margin: 0 }}>{t("usuarios.titulo")}</h2>
      </div>

      <FormularioAltaUsuario
        campos={campos}
        nuevo={nuevo}
        setNuevo={setNuevo}
        handleNuevoUsuario={handleNuevoUsuario}
        errorAlta={errorAlta}
      />

      <div style={{ marginBottom: 9 }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder={t("usuarios.buscar")}
          style={styles.inputBusqueda}
        />
      </div>

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

      <div style={{ display: "flex", justifyContent: "flex-end", margin: "4px 0" }}>
        <button onClick={exportarExcel} style={styles.botonExportar}>
          {t("usuarios.exportarExcel")}
        </button>
      </div>

      <div style={{ overflowX: "auto", marginBottom: 22 }}>
        <TablaUsuarios
          usuarios={usuariosFiltrados}
          campos={campos}
          editId={editId}
          editUser={editUser}
          setEditUser={setEditUser}
          iniciarEdicion={iniciarEdicion}
          cancelarEdicion={cancelarEdicion}
          guardarEdicion={guardarEdicion}
          errorEdit={errorEdit}
          handleEliminar={handleEliminar}
          alternarBloqueado={alternarBloqueado}
          loading={loading}
          filtroActivo={busqueda || Object.values(filtroCol).some(v => v)}
        />
      </div>
    </div>
  );
}

export default PanelUsuarios;
