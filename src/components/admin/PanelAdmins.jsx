import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import { useTranslation } from "react-i18next";
import useAdminTheme from "../../helpers/useAdminTheme";
import BotonVolver from "./BotonVolver";
import registrarLog from "../../helpers/registrarLog";

// Lista de roles disponibles
const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "encargado", label: "Encargado" },
  { value: "operador", label: "Operador" }
];

function PanelAdmins() {
  const { t } = useTranslation();
  const theme = useAdminTheme();

  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line
  }, []);

  const cargarUsuarios = async () => {
    try {
      const snap = await getDocs(collection(db, "usuarios"));
      const arr = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsuarios(arr);
    } catch (e) {
      setError(t("errorCargaUsuarios"));
      setTimeout(() => setError(""), 2200);
    }
  };

  // Cambiar el rol de un usuario
  const cambiarRol = async (id, nuevoRol) => {
    try {
      await updateDoc(doc(db, "usuarios", id), {
        rol: nuevoRol,
        admin: nuevoRol === "admin" // Para transición suave
      });
      setMensaje(t("rolActualizado"));
      setTimeout(() => setMensaje(""), 1800);
      registrarLog({
        accion: "cambio_rol",
        usuario: id,
        objeto: "usuario",
        datos: { rol: nuevoRol }
      });
      cargarUsuarios();
    } catch (e) {
      setError(t("errorActualizarRol"));
      setTimeout(() => setError(""), 2200);
    }
  };

  // Responsive
  const isMobile = window.innerWidth < 700;

  return (
    <div
      style={{
        padding: isMobile ? 10 : 28,
        background: theme.fondo,
        fontFamily: theme.fuente || "Roboto",
        minHeight: "90vh"
      }}
    >
      <BotonVolver />

      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 18 }}>
        {t("panelAdminsTitulo")}
      </h2>
      <p style={{ color: "#666", marginBottom: 14 }}>
        {t("panelAdminsDesc")}
      </p>

      {/* Mensajes */}
      {mensaje && (
        <div style={{
          background: "#e8f9e1",
          color: "#117a25",
          border: "1px solid #38c96c",
          padding: "9px 18px",
          borderRadius: 8,
          marginBottom: 12,
          maxWidth: 500,
        }}>
          {mensaje}
        </div>
      )}
      {error && (
        <div style={{
          background: "#fee",
          color: "#a12020",
          border: "1px solid #c44",
          padding: "9px 18px",
          borderRadius: 8,
          marginBottom: 12,
          maxWidth: 500,
        }}>
          {error}
        </div>
      )}

      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: 12,
        background: "#fff",
        borderRadius: 9,
        boxShadow: "0 2px 8px #0001"
      }}>
        <thead>
          <tr style={{ background: "#e8eefb" }}>
            <th style={{ padding: "10px 5px", textAlign: "left" }}>{t("nombre")}</th>
            <th style={{ padding: "10px 5px", textAlign: "left" }}>{t("email")}</th>
            <th style={{ padding: "10px 5px", textAlign: "left" }}>{t("rol")}</th>
            <th style={{ padding: "10px 5px" }}>{t("acciones")}</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td style={{ padding: "8px 5px" }}>
                {u.nombre || "-"} {u.apellido || ""}
              </td>
              <td style={{ padding: "8px 5px" }}>{u.email}</td>
              <td style={{ padding: "8px 5px" }}>
                <select
                  value={u.rol || (u.admin ? "admin" : "operador")}
                  onChange={e => cambiarRol(u.id, e.target.value)}
                  style={{ padding: 5, borderRadius: 6 }}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>
                      {t(`rol_${r.value}`) || r.label}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "8px 5px" }}>
                {/* Futuro: acciones como eliminar usuario, resetear contraseña, etc. */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PanelAdmins;
