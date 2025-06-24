import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import {
  doc, setDoc, getDoc
} from "firebase/firestore";
import { useTranslation } from "react-i18next";
import useAdminTheme from "../../helpers/useAdminTheme";
import BotonVolver from "./BotonVolver";
import registrarLog from "../../helpers/registrarLog";
import panelStyles from "../../estilos/panelStyles";

function PanelParametrosGenerales() {
  const { t } = useTranslation();
  const configVisual = useAdminTheme();

  const [config, setConfig] = useState({ camposRegistro: [] });
  const [nuevoCampo, setNuevoCampo] = useState("");
  const [tipoNuevoCampo, setTipoNuevoCampo] = useState("texto");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const CAMPOS_FIJOS = ["nombre", "apellido", "email"];
  const esCampoFijo = (idx) => idx < CAMPOS_FIJOS.length;
  const campos = useMemo(() => config.camposRegistro || [], [config]);


  const guardarCampos = async (campos) => {
    try {
      await setDoc(doc(db, "Registro", "camposRegistro"), { campos }, { merge: true });
      setMensaje(t("paramGen.guardado"));
      setTimeout(() => setMensaje(""), 2000);
      registrarLog({
        accion: "guardar_campos_registro",
        usuario: "admin",
        objeto: "Registro/camposRegistro",
        datos: campos,
      });
    } catch (err) {
      setError(t("paramGen.errorGuardar"));
      setTimeout(() => setError(""), 2200);
    }
  };

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    try {
      const ref = doc(db, "Registro", "camposRegistro");
      const snap = await getDoc(ref);
      let campos = snap.exists() ? snap.data().campos || [] : [];

      // Filtrar campos inválidos y asegurar que los fijos estén presentes
      const fijos = CAMPOS_FIJOS.map(nombre => ({ nombre, visible: true, obligatorio: true, tipo: nombre === "email" ? "email" : "texto" }));
      const personalizados = campos.filter(c => !CAMPOS_FIJOS.includes(c.nombre));
      setConfig({ camposRegistro: [...fijos, ...personalizados] });
    } catch (err) {
      setError(t("paramGen.errorCargaConfig"));
    }
  };

  const agregarCampo = async () => {
    const campo = nuevoCampo.trim().toLowerCase().replace(/\s+/g, "_");
    if (!campo || CAMPOS_FIJOS.includes(campo) || campos.find(c => c.nombre === campo)) return;
    const nuevo = { nombre: campo, visible: true, obligatorio: false, tipo: tipoNuevoCampo };
    if (tipoNuevoCampo === "lista") nuevo.coleccionOpciones = campo;
    const nuevosCampos = [...campos, nuevo];
    setConfig({ camposRegistro: nuevosCampos });
    setNuevoCampo("");
    setTipoNuevoCampo("texto");
  };

  const moverCampo = (idx, dir) => {
    const currentCampos = [...config.camposRegistro];
    if (esCampoFijo(idx)) return;
    const nuevos = [...currentCampos];
    const destino = dir === "arriba" ? idx - 1 : idx + 1;
    if (esCampoFijo(destino) || destino >= nuevos.length) return;
    [nuevos[idx], nuevos[destino]] = [nuevos[destino], nuevos[idx]];
    setConfig({ camposRegistro: nuevos });
  };

  const eliminarCampo = (idx) => {
    if (esCampoFijo(idx)) return;
    const nuevos = campos.filter((_, i) => i !== idx);
    setConfig({ camposRegistro: nuevos });
  };

  const cambiarTipoCampo = (idx, tipo) => {
    if (esCampoFijo(idx)) return;
    const nuevos = [...campos];
    nuevos[idx].tipo = tipo;
    if (tipo === "lista") {
      nuevos[idx].coleccionOpciones = nuevos[idx].nombre;
    } else {
      delete nuevos[idx].coleccionOpciones;
    }
    setConfig({ camposRegistro: nuevos });
  };

  const editarNombreCampo = (idx) => {
    if (esCampoFijo(idx)) return;
    const nuevo = prompt(t("paramGen.editarNombreCampoPrompt"), campos[idx].nombre);
    if (!nuevo) return;
    const nuevos = [...campos];
    nuevos[idx].nombre = nuevo.trim().toLowerCase().replace(/\s+/g, "_");
    setConfig({ camposRegistro: nuevos });
  };


  const CampoFijo = ({ campo }) => (
    <div className={panelStyles.tarjeta} style={panelStyles.margenInferior}>
      <strong>{campo.nombre}</strong><br />
      <span className={panelStyles.subtituloFijo}>Campo obligatorio no editable</span>
    </div>
  );

  const CampoEditable = ({ campo, idx }) => (
    <div key={campo.nombre} className={panelStyles.tarjeta} style={panelStyles.margenInferior}>
      <strong>{campo.nombre}</strong>
      <button className={panelStyles.botonEditarColumna} onClick={() => editarNombreCampo(idx)}>{t("paramGen.editar")}</button>
      <button className={panelStyles.botonEliminarColumna} onClick={() => eliminarCampo(idx)}>{t("paramGen.eliminar")}</button>
      <button onClick={() => moverCampo(idx, "arriba")}>{t("paramGen.moverArriba")}</button>
      <button onClick={() => moverCampo(idx, "abajo")}>{t("paramGen.moverAbajo")}</button>
      <br />
      <label>
        <input type="checkbox" checked={!!campo.visible} onChange={e => {
          const nuevos = campos.map((c, i) => i === idx ? { ...c, visible: !c.visible } : c);
          setConfig({ camposRegistro: nuevos });        }} /> {t("paramGen.visible")}
      </label>
      <label>
        <input type="checkbox" checked={!!campo.obligatorio} onChange={e => {
          const nuevos = campos.map((c, i) => i === idx ? { ...c, obligatorio: !c.obligatorio } : c);
          setConfig({ camposRegistro: nuevos });        }} /> {t("paramGen.obligatorio")}
      </label>
      <select value={campo.tipo} onChange={e => cambiarTipoCampo(idx, e.target.value)} className={panelStyles.inputChico}>
        <option value="texto">{t("paramGen.tipoTexto")}</option>
        <option value="email">{t("paramGen.tipoEmail")}</option>
        <option value="numero">{t("paramGen.tipoNumero")}</option>
        <option value="lista">{t("paramGen.tipoLista")}</option>
      </select>
      {campo.tipo === "lista" && (
        <span className={panelStyles.botonListaContenedor}>
          <Link to={`/${campo.nombre}`}>
            <button className={panelStyles.botonIrAPanelLista}>
              {t("paramGen.irAlPanelCampoLista", { nombre: campo.nombre })}
            </button>
          </Link>
        </span>
      )}
    </div>
  );

  return (
    <div style={panelStyles.contenedor}> {/* Se usó "style" para mantener la consistencia con PanelUsuarios, aunque se podría usar className si se prefiere una clase específica para el div principal */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}> {/* Estilo del encabezado superior, igual que en PanelUsuarios */}
        <BotonVolver ruta="/dashboard-admin" />
        <h2 style={{ margin: 0 }}>{t("paramGen.titulo")}</h2> {/* Estilo del título, igual que en PanelUsuarios */}
      </div>

      <div style={panelStyles.tarjeta}> {/* Nueva tarjeta para la descripción y mensajes */}
        <h3>{t("paramGen.camposRegistro")}</h3>
        <p className={panelStyles.descripcionCampos}>{t("paramGen.descripcionCampos")}</p>

        {error && <div className={panelStyles.alertaError}>{error}</div>}
        {mensaje && <div className={panelStyles.alertaExito}>{mensaje}</div>}

        <div className={panelStyles.subtituloFijo} style={{marginTop: 10}}>
          Campos obligatorios no editables
        </div>
      </div>

      {campos.map((campo, idx) =>
        esCampoFijo(idx) ? (
          <CampoFijo key={campo.nombre} campo={campo} />
        ) : (
          <CampoEditable key={campo.nombre} campo={campo} idx={idx} />
        )
      )}

      <div className={panelStyles.tarjeta} style={panelStyles.margenInferior}> {/* Nueva tarjeta para agregar campo */}
        <div className={panelStyles.agregarCampoBloque}>
          <input placeholder={t("paramGen.nuevoCampoPlaceholder")} value={nuevoCampo} onChange={e => setNuevoCampo(e.target.value)} className={panelStyles.inputAncho} />
          <select value={tipoNuevoCampo} onChange={e => setTipoNuevoCampo(e.target.value)} className={panelStyles.inputChico}>
            <option value="texto">{t("paramGen.tipoTexto")}</option>
            <option value="email">{t("paramGen.tipoEmail")}</option>
            <option value="numero">{t("paramGen.tipoNumero")}</option>
            <option value="lista">{t("paramGen.tipoLista")}</option>
          </select>
          {tipoNuevoCampo === "lista" && !!nuevoCampo.trim() && (
            <span className={panelStyles.botonListaContenedor}>
              <Link to={`/${nuevoCampo.trim().toLowerCase().replace(/\s+/g, "_")}`}>
                <button className={panelStyles.botonEditarOpciones}>
                  {t("paramGen.editarOpciones")}
                </button>
              </Link>
            </span>
          )}
          <button onClick={agregarCampo} className={panelStyles.botonAgregar}>{t("paramGen.agregarCampo")}</button>
        </div>
      </div>

      <div className={panelStyles.tarjeta} style={panelStyles.botonGuardarContenedor}> {/* Nueva tarjeta para el botón de guardar */}
        <button onClick={() => guardarCampos(campos)} className={panelStyles.botonGuardar}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

export default PanelParametrosGenerales;