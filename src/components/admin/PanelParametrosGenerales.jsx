import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import {
  doc, setDoc, getDoc
} from "firebase/firestore";
import { useTranslation } from "react-i18next";
import useAdminTheme from "../../helpers/useAdminTheme";
import BotonVolver from "./BotonVolver";
import registrarLog from "../../helpers/registrarLog";

// Hook para rol (preparado para control granular futuro)
function useRol() {
  // Cambiá esto por el contexto real del usuario cuando lo tengas
  return "admin";
}

const CONFIG_ID = "general";

function PanelParametrosGenerales() {
  const { t } = useTranslation();
  const configVisual = useAdminTheme();
  const rol = useRol();

  const [config, setConfig] = useState({
    camposRegistro: [
      { nombre: "nombre", visible: true, obligatorio: true, tipo: "texto" },
      { nombre: "apellido", visible: true, obligatorio: true, tipo: "texto" },
      { nombre: "direccion", visible: true, obligatorio: false, tipo: "texto" },
      { nombre: "ciudad", visible: true, obligatorio: true, tipo: "lista" },
      { nombre: "email", visible: true, obligatorio: true, tipo: "email" }
    ]
  });
  const [nuevoCampo, setNuevoCampo] = useState("");
  const [tipoNuevoCampo, setTipoNuevoCampo] = useState("texto");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  function camposAsArray() {
    if (Array.isArray(config.camposRegistro)) return config.camposRegistro;
    return Object.entries(config.camposRegistro).map(([nombre, props]) => ({
      nombre,
      ...props
    }));
  }

  const guardarCampos = async (campos) => {
    try {
      const aGuardar = {
        ...config,
        camposRegistro: campos
      };
      let objCampos = {};
      campos.forEach(c => {
        const { nombre, ...rest } = c;
        objCampos[nombre] = rest;
      });
      aGuardar.camposRegistroObj = objCampos;
      const ref = doc(db, "configuracion", CONFIG_ID);
      await setDoc(ref, aGuardar, { merge: true });
      const obligatorios = campos.filter(c => c.obligatorio).map(c => c.nombre);
      await setDoc(doc(db, "config", "camposObligatorios"), { lista: obligatorios });
      setMensaje(t("paramGen.guardado"));
      setTimeout(() => setMensaje(""), 2000);

      // Auditoría/log
      registrarLog({
        accion: "guardar_campos_registro",
        usuario: rol,
        objeto: "configuracion_general",
        datos: campos,
      });

    } catch (err) {
      setError(t("paramGen.errorGuardar"));
      setTimeout(() => setError(""), 2200);
    }
  };

  useEffect(() => {
    cargarConfig();
    // eslint-disable-next-line
  }, []);

  const cargarConfig = async () => {
    try {
      const ref = doc(db, "configuracion", CONFIG_ID);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        let cfg = snap.data();
        if (!Array.isArray(cfg.camposRegistro)) {
          cfg.camposRegistro = Object.entries(cfg.camposRegistro).map(([nombre, props]) => ({
            nombre,
            ...props
          }));
        }
        setConfig(prev => ({ ...prev, ...cfg }));
      }
    } catch (err) {
      setError(t("paramGen.errorCargaConfig"));
    }
  };

  const agregarCampo = async () => {
    const campo = nuevoCampo.trim().toLowerCase().replace(/\s+/g, "_");
    if (!campo || camposAsArray().find(c => c.nombre === campo)) return;
    const nuevo = {
      nombre: campo,
      visible: true,
      obligatorio: false,
      tipo: tipoNuevoCampo
    };
    if (tipoNuevoCampo === "lista") {
      nuevo.coleccionOpciones = campo;
    }
    const nuevosCampos = [...camposAsArray(), nuevo];
    setConfig(prev => ({
      ...prev,
      camposRegistro: nuevosCampos
    }));
    setNuevoCampo("");
    setTipoNuevoCampo("texto");
    guardarCampos(nuevosCampos);
  };

  const cambiarTipoCampo = (idx, tipo) => {
    setConfig(prev => {
      const nuevos = [...camposAsArray()];
      nuevos[idx].tipo = tipo;
      if (tipo === "lista") {
        nuevos[idx].coleccionOpciones = nuevos[idx].nombre;
      } else {
        delete nuevos[idx].coleccionOpciones;
      }
      guardarCampos(nuevos);
      return { ...prev, camposRegistro: nuevos };
    });
  };

  const editarNombreCampo = (idx) => {
    const nuevo = prompt(t("paramGen.editarNombreCampoPrompt"), camposAsArray()[idx].nombre);
    if (!nuevo) return;
    setConfig(prev => {
      const nuevos = [...camposAsArray()];
      const oldTipo = nuevos[idx].tipo;
      nuevos[idx].nombre = nuevo.trim().toLowerCase().replace(/\s+/g, "_");
      if (oldTipo === "lista") {
        nuevos[idx].coleccionOpciones = nuevos[idx].nombre;
      }
      guardarCampos(nuevos);
      return { ...prev, camposRegistro: nuevos };
    });
  };

  const eliminarCampo = (idx) => {
    setConfig(prev => {
      const nuevos = [...camposAsArray()];
      nuevos.splice(idx, 1);
      guardarCampos(nuevos);
      return { ...prev, camposRegistro: nuevos };
    });
  };

  const moverCampo = (idx, dir) => {
    setConfig(prev => {
      const nuevos = [...camposAsArray()];
      if (dir === "arriba" && idx > 0) {
        [nuevos[idx - 1], nuevos[idx]] = [nuevos[idx], nuevos[idx - 1]];
      }
      if (dir === "abajo" && idx < nuevos.length - 1) {
        [nuevos[idx + 1], nuevos[idx]] = [nuevos[idx], nuevos[idx + 1]];
      }
      guardarCampos(nuevos);
      return { ...prev, camposRegistro: nuevos };
    });
  };

  // Responsive
  const isMobile = window.innerWidth < 700;

  return (
    <div
      style={{
        padding: isMobile ? 7 : 24,
        maxWidth: 950,
        background: configVisual.fondo,
        fontFamily: configVisual.fuente || "Roboto",
        minHeight: "90vh"
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10
      }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 0 }}>{t("paramGen.titulo")}</h2>
        <BotonVolver ruta="/dashboard-admin" />
      </div>

      {/* --- CAMPOS DE REGISTRO --- */}
      <h3 style={{ marginTop: 16, marginBottom: 3, borderBottom: "2px solid #d7e6d7", paddingBottom: 2 }}>
        {t("paramGen.camposRegistro")}
      </h3>
      <p style={{ color: "#555", fontSize: 15, marginTop: 0, marginBottom: 10 }}>
        {t("paramGen.descripcionCampos")}
      </p>

      {/* AVISO IMPORTANTE */}
      <div style={{ background: "#fff8c4", color: "#7a6200", border: "1px solid #ffe16a", padding: 10, borderRadius: 7, marginBottom: 14 }}>
        {t("paramGen.avisoImportanteCampos")}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div style={{
          background: "#fee",
          color: "#a12020",
          border: "1px solid #c44",
          padding: "9px 18px",
          borderRadius: 8,
          marginBottom: 12,
          maxWidth: 580,
        }}>
          {error}
          <button
            style={{
              float: "right",
              marginLeft: 16,
              color: "#a12020",
              background: "none",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
            }}
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* Mensaje ok */}
      {mensaje && (
        <div style={{
          background: "#e8f9e1",
          color: "#117a25",
          border: "1px solid #38c96c",
          padding: "9px 18px",
          borderRadius: 8,
          marginBottom: 12,
          maxWidth: 580,
        }}>
          {mensaje}
        </div>
      )}

      {/* Lista de campos uno debajo de otro */}
      {camposAsArray().map((props, idx) => (
        <div key={props.nombre} style={{ marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
          <strong>{props.nombre}</strong>{" "}
          <button onClick={() => editarNombreCampo(idx)}>{t("paramGen.editar")}</button>{" "}
          <button onClick={() => eliminarCampo(idx)}>{t("paramGen.eliminar")}</button>{" "}
          <button disabled={idx === 0} onClick={() => moverCampo(idx, "arriba")}>{t("paramGen.moverArriba")}</button>
          <button disabled={idx === camposAsArray().length - 1} onClick={() => moverCampo(idx, "abajo")}>{t("paramGen.moverAbajo")}</button>
          <br />
          <label>
            <input
              type="checkbox"
              checked={!!props.visible}
              onChange={e => {
                const nuevos = camposAsArray().map((c, i) =>
                  i === idx ? { ...c, visible: !c.visible } : c
                );
                setConfig(prev => ({ ...prev, camposRegistro: nuevos }));
                guardarCampos(nuevos);
              }}
            /> {t("paramGen.visible")}
          </label>{" "}
          <label>
            <input
              type="checkbox"
              checked={!!props.obligatorio}
              onChange={e => {
                const nuevos = camposAsArray().map((c, i) =>
                  i === idx ? { ...c, obligatorio: !c.obligatorio } : c
                );
                setConfig(prev => ({ ...prev, camposRegistro: nuevos }));
                guardarCampos(nuevos);
              }}
            /> {t("paramGen.obligatorio")}
          </label>{" "}
          <select value={props.tipo} onChange={e => cambiarTipoCampo(idx, e.target.value)}>
            <option value="texto">{t("paramGen.tipoTexto")}</option>
            <option value="email">{t("paramGen.tipoEmail")}</option>
            <option value="numero">{t("paramGen.tipoNumero")}</option>
            <option value="lista">{t("paramGen.tipoLista")}</option>
          </select>
          {/* BOTÓN DIRECTO AL PANEL DEL CAMPO LISTA */}
          {props.tipo === "lista" && props.nombre && (
            <span style={{ marginLeft: 16 }}>
              <Link to={`/${props.nombre}`}>
                <button style={{
                  fontSize: 14,
                  padding: "4px 14px",
                  border: "1.5px solid #69b",
                  borderRadius: 7,
                  background: "#eef4fa",
                  marginLeft: 8
                }}>
                  {t("paramGen.irAlPanelCampoLista", { nombre: props.nombre })}
                </button>
              </Link>
            </span>
          )}
        </div>
      ))}

      <div style={{ margin: "12px 0 18px 0" }}>
        <input placeholder={t("paramGen.nuevoCampoPlaceholder")} value={nuevoCampo}
          onChange={e => setNuevoCampo(e.target.value)} style={{ width: 250 }} />
        <select value={tipoNuevoCampo} onChange={e => setTipoNuevoCampo(e.target.value)}>
          <option value="texto">{t("paramGen.tipoTexto")}</option>
          <option value="email">{t("paramGen.tipoEmail")}</option>
          <option value="numero">{t("paramGen.tipoNumero")}</option>
          <option value="lista">{t("paramGen.tipoLista")}</option>
        </select>
        {tipoNuevoCampo === "lista" && !!nuevoCampo.trim() && (
          <span style={{ marginLeft: 16 }}>
            <Link to={`/${nuevoCampo.trim().toLowerCase().replace(/\s+/g, "_")}`}>
              <button style={{
                fontSize: 13,
                padding: "2px 10px",
                border: "1.5px solid #69b",
                borderRadius: 7,
                background: "#eef4fa",
                marginLeft: 8
              }}>
                {t("paramGen.editarOpciones")}
              </button>
            </Link>
          </span>
        )}
        <button onClick={agregarCampo} style={{ marginLeft: 8 }}>{t("paramGen.agregarCampo")}</button>
      </div>
    </div>
  );
}

export default PanelParametrosGenerales;
