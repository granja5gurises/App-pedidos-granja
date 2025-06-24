import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "../../estilos/panelStyles";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

function FormularioAltaUsuario({ campos, nuevo, setNuevo, handleNuevoUsuario, errorAlta }) {
  const { t } = useTranslation();
  const [opcionesListas, setOpcionesListas] = useState({});

  useEffect(() => {
    async function cargarListas() {
      const listas = {};

      const camposLista = campos.filter(c => c.tipo === "lista");
      for (const campo of camposLista) {
        try {
          const snap = await getDocs(collection(db, campo.nombre));
          listas[campo.nombre] = snap.docs.map(doc => doc.data().nombre || doc.id);
        } catch (err) {
          console.error(`Error al cargar la colección '${campo.nombre}'`, err);
        }
      }

      setOpcionesListas(listas);
    }

    cargarListas();
  }, [campos]);

  return (
    <div style={styles.tarjeta}>
      <div style={{ fontWeight: 600, marginBottom: 5 }}>{t("usuarios.altaManual")}</div>

      {campos.map(campo => {
        const label = t(`usuarios.${campo.nombre}`) || campo.nombre.charAt(0).toUpperCase() + campo.nombre.slice(1);

        if (campo.tipo === "lista" && opcionesListas[campo.nombre]) {
          return (
            <select
              key={campo.nombre}
              value={nuevo[campo.nombre] || ""}
              onChange={e => setNuevo(n => ({ ...n, [campo.nombre]: e.target.value }))}
              style={styles.input}
            >
              <option value="">{t("usuarios.seleccionar")} {label}</option>
              {opcionesListas[campo.nombre].map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          );
        }

        return (
          <input
            key={campo.nombre}
            placeholder={label}
            value={nuevo[campo.nombre] || ""}
            onChange={e => setNuevo(n => ({ ...n, [campo.nombre]: e.target.value }))}
            style={styles.input}
          />
        );
      })}

      <button onClick={handleNuevoUsuario} style={styles.botonAgregar}>
        {t("usuarios.agregarUsuario")}
      </button>

      {errorAlta && <div style={styles.error}>{errorAlta}</div>}

      <div style={{ color: "#606060", fontSize: 12, marginTop: 5 }}>
        <Link to="/config-general" style={styles.linkEdicion}>
          {t("usuarios.editCamposRegistro")}
        </Link>
      </div>
    </div>
  );
}

export default FormularioAltaUsuario;
