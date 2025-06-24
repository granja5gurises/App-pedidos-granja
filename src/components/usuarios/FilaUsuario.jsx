
import React from "react";
import { useTranslation } from "react-i18next";
import styles from "../../estilos/panelStyles";

function FilaUsuario({
  user,
  campos,
  editId,
  editUser,
  setEditUser,
  iniciarEdicion,
  cancelarEdicion,
  guardarEdicion,
  errorEdit,
  handleEliminar,
  alternarBloqueado
}) {
  const { t } = useTranslation();

  const enEdicion = editId === user.id;

  return (
    <>
      <tr key={user.id} style={enEdicion ? styles.filaEdicion : undefined}>
        {campos.map(col => (
          <td key={col.nombre}>
            {enEdicion ? (
              <input
                value={editUser[col.nombre] || ""}
                onChange={e => setEditUser({ ...editUser, [col.nombre]: e.target.value })}
                style={{ minWidth: 85 }}
              />
            ) : (
              user[col.nombre]
            )}
          </td>
        ))}
        <td>
          {enEdicion ? (
            <>
              <button onClick={guardarEdicion} style={{ marginRight: 5 }}>{t("usuarios.guardar")}</button>
              <button onClick={cancelarEdicion}>{t("usuarios.cancelar")}</button>
            </>
          ) : (
            <>
              <button onClick={() => iniciarEdicion(user)} style={{ marginRight: 5 }}>{t("usuarios.editar")}</button>
              <button onClick={() => handleEliminar(user.id)} style={{ color: "red", marginRight: 5 }}>
                {t("usuarios.eliminar")}
              </button>
              <button
                onClick={() => alternarBloqueado(user.id, user.bloqueado)}
                style={{ color: "#b12a12", marginRight: 5 }}
              >
                {user.bloqueado ? t("usuarios.desbloquear") : t("usuarios.bloquear")}
              </button>
            </>
          )}
        </td>
      </tr>
      {enEdicion && errorEdit && (
        <tr>
          <td colSpan={campos.length + 1}>
            <span style={{ color: "#d00021", fontWeight: 500 }}>{errorEdit}</span>
          </td>
        </tr>
      )}
    </>
  );
}

export default FilaUsuario;
