
import React from "react";
import { useTranslation } from "react-i18next";
import FilaUsuario from "./FilaUsuario";
import styles from "../../estilos/panelStyles";

function TablaUsuarios({
  usuarios,
  campos,
  editId,
  editUser,
  setEditUser,
  iniciarEdicion,
  cancelarEdicion,
  guardarEdicion,
  errorEdit,
  handleEliminar,
  alternarBloqueado,
  loading,
  filtroActivo
}) {
  const { t } = useTranslation();

  if (loading) return <div>{t("usuarios.cargando")}</div>;

  return (
    <>
      {filtroActivo && (
        <div style={styles.mensajeFiltro}>
          {t("usuarios.filtroActivo", { visibles: usuarios.length, total: usuarios.length })}
        </div>
      )}

      <table border="1" cellPadding={7} style={styles.tabla}>
        <thead style={styles.tablaEncabezado}>
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
          {usuarios.map(user => (
            <FilaUsuario
              key={user.id}
              user={user}
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
            />
          ))}
        </tbody>
      </table>
    </>
  );
}

export default TablaUsuarios;
