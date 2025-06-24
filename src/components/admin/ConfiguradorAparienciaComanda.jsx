import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "../../estilos/panelStyles";
import { guardarConfigComanda } from "../../servicios/comandaService";

// Recibe camposRegistro: array [{nombre}], configComanda, setConfigComanda, onGuardar
export default function ConfiguradorAparienciaComanda({ camposRegistro, configComanda, setConfigComanda, onGuardar }) {
  const { t } = useTranslation();

  // Estados locales para edición
  const [localConfig, setLocalConfig] = useState(configComanda || getDefaultConfig(camposRegistro));
  const [previewData, setPreviewData] = useState({});

  useEffect(() => {
  // Si no hay config previa, usar la por defecto
  if (!configComanda) {
    setLocalConfig(getDefaultConfig(camposRegistro));
    return;
  }

  // Si hay config previa, agregarle los campos nuevos que no tenga
  const camposExistentes = configComanda.campos.map(c => c.campo);
  const nuevosCampos = (camposRegistro || [])
    .map(c => c.nombre)
    .filter(nombre => !camposExistentes.includes(nombre))
    .map(nombre => ({
      campo: nombre,
      mostrar: true,
      alineacion: "izq"
    }));

  const nuevaConfig = {
    ...configComanda,
    campos: [...configComanda.campos, ...nuevosCampos]
  };

  setLocalConfig(nuevaConfig);
}, [configComanda, camposRegistro]);

  // Prepara datos de ejemplo para preview
  useEffect(() => {
    if (!camposRegistro) return;
    let data = {};
    camposRegistro.forEach(c => {
      data[c.nombre] = t(`aparienciaComanda.ejemplo.${c.nombre}`, { defaultValue: c.nombre.toUpperCase() }) || c.nombre.toUpperCase();
    });
    data["productos"] = [
      { nombre: t("aparienciaComanda.ejemplo.producto1"), cantidad: 2, precio: 150 },
      { nombre: t("aparienciaComanda.ejemplo.producto2"), cantidad: 1, precio: 100 }
    ];
    data["total"] = 400;
    setPreviewData(data);
  }, [camposRegistro, t]);

  function getDefaultConfig(campos) {
    return {
      tamano: "15x15",
      campos: (campos || []).map(c => ({
        campo: c.nombre,
        mostrar: true,
        alineacion: "izq"
      })),
      mostrarProductos: true,
      mostrarTotales: true,
      logoURL: "",
      colorFondo: "#fff",
      leyenda: ""
    };
  }

  // Handler para mostrar campo
  const handleCampoMostrar = (i, mostrar) => {
    const nuevos = [...localConfig.campos];
    nuevos[i].mostrar = mostrar;
    setLocalConfig({ ...localConfig, campos: nuevos });
  };

  // Handler para alineación
  const handleCampoAlineacion = (i, alineacion) => {
    const nuevos = [...localConfig.campos];
    nuevos[i].alineacion = alineacion;
    setLocalConfig({ ...localConfig, campos: nuevos });
  };

  // Handler subir/bajar
  const handleSubir = i => {
    if (i === 0) return;
    const nuevos = [...localConfig.campos];
    [nuevos[i - 1], nuevos[i]] = [nuevos[i], nuevos[i - 1]];
    setLocalConfig({ ...localConfig, campos: nuevos });
  };
  const handleBajar = i => {
    if (i === localConfig.campos.length - 1) return;
    const nuevos = [...localConfig.campos];
    [nuevos[i + 1], nuevos[i]] = [nuevos[i], nuevos[i + 1]];
    setLocalConfig({ ...localConfig, campos: nuevos });
  };

  // Handler de otras opciones
  const handleOpcion = (key, value) => {
    setLocalConfig({ ...localConfig, [key]: value });
  };

  // Restaurar a valores por defecto
  const handleRestaurar = () => {
    setLocalConfig(getDefaultConfig(camposRegistro));
  };

  // Guardar (manda la config editada arriba)
  // Guardar (manda la config editada arriba)
  const handleGuardar = async () => {
    try {
      await guardarConfigComanda(localConfig); // simulación de guardado
      setConfigComanda(localConfig); // actualiza estado local
      if (onGuardar) onGuardar(localConfig); // callback opcional
    } catch (error) {
      console.error("Error al guardar configuración:", error);
    }
  };

  // ----------- Preview dinámico ----------
  const styleComanda = () => {
    switch (localConfig.tamano) {
      case "10x10": return { width: "10cm", height: "10cm" };
      case "12x12": return { width: "12cm", height: "12cm" };
      case "15x15": return { width: "15cm", height: "15cm" };
      case "20x10": return { width: "20cm", height: "10cm" };
      default: return { width: "15cm", height: "15cm" };
    }
  };

  return (
    <div className={styles.panelContainer}>
      <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>
        {t("panel_comanda.leyendaIntro")}
      </p>

      <h3 style={{ marginTop: 0 }}>{t("aparienciaComanda.titulo")}</h3>
      {/* Tamaño y color */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <label>{t("aparienciaComanda.tamano")}</label>
        <select value={localConfig.tamano} onChange={e => handleOpcion("tamano", e.target.value)}>
          <option value="10x10">{t("aparienciaComanda.tamano10x10")}</option>
          <option value="12x12">{t("aparienciaComanda.tamano12x12")}</option>
          <option value="15x15">{t("aparienciaComanda.tamano15x15")}</option>
          <option value="20x10">{t("aparienciaComanda.tamano20x10")}</option>
        </select>
        <label>{t("aparienciaComanda.colorFondo")}</label>
        <input type="color" value={localConfig.colorFondo} onChange={e => handleOpcion("colorFondo", e.target.value)} />
      </div>
      {/* Logo */}
      <div style={{ marginBottom: 8 }}>
        <label>{t("aparienciaComanda.logoURL")}</label>
        <input
          type="text"
          value={localConfig.logoURL}
          onChange={e => handleOpcion("logoURL", e.target.value)}
          placeholder={t("aparienciaComanda.logoURLPlaceholder")}
          style={{ width: 280 }}
        />
      </div>
      {/* Campos configurables */}
      <table style={{ width: "100%", marginBottom: 10, fontSize: 15 }}>
        <thead>
          <tr>
            <th>{t("aparienciaComanda.mostrar")}</th>
            <th>{t("aparienciaComanda.campo")}</th>
            <th>{t("aparienciaComanda.alineacion")}</th>
            <th>{t("aparienciaComanda.orden")}</th>
          </tr>
        </thead>
        <tbody>
          {localConfig.campos.map((c, i) => (
            <tr key={c.campo}>
              <td>
                <input
                  type="checkbox"
                  checked={!!c.mostrar}
                  onChange={e => handleCampoMostrar(i, e.target.checked)}
                />
              </td>
              <td>{t(`aparienciaComanda.${c.campo}`) || c.campo}</td>
              <td>
                <select
                  value={c.alineacion}
                  onChange={e => handleCampoAlineacion(i, e.target.value)}
                >
                  <option value="izq">{t("aparienciaComanda.izq")}</option>
                  <option value="centro">{t("aparienciaComanda.centro")}</option>
                  <option value="der">{t("aparienciaComanda.der")}</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleSubir(i)} disabled={i === 0}>↑</button>
                <button onClick={() => handleBajar(i)} disabled={i === localConfig.campos.length - 1}>↓</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Opciones premium */}
      <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 12 }}>
        <label>
          <input type="checkbox"
            checked={!!localConfig.mostrarProductos}
            onChange={e => handleOpcion("mostrarProductos", e.target.checked)}
          /> {t("aparienciaComanda.mostrarProductos")}
        </label>
        <label>
          <input type="checkbox"
            checked={!!localConfig.mostrarTotales}
            onChange={e => handleOpcion("mostrarTotales", e.target.checked)}
          /> {t("aparienciaComanda.mostrarTotales")}
        </label>
      </div>
      {/* Leyenda */}
      <div style={{ marginBottom: 12 }}>
        <label>{t("aparienciaComanda.leyenda")}</label>
        <input
          type="text"
          value={localConfig.leyenda}
          onChange={e => handleOpcion("leyenda", e.target.value)}
          placeholder={t("aparienciaComanda.leyendaPlaceholder")}
          style={{ width: 320 }}
        />
      </div>
      {/* Botones */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={handleGuardar} style={{ fontWeight: "bold", marginRight: 10 }}>{t("aparienciaComanda.guardar")}</button>
        <button onClick={handleRestaurar}>{t("aparienciaComanda.restaurar")}</button>
      </div>
      {/* Preview */}
      <div>
        <div style={{
          ...styleComanda(),
          background: localConfig.colorFondo,
          border: "1px dashed #009",
          borderRadius: 9,
          padding: 15,
          margin: "auto",
          minHeight: 160
        }}>
          {localConfig.logoURL && (
            <img src={localConfig.logoURL} alt="logo" style={{ width: 48, marginBottom: 8, display: "block", marginLeft: "auto", marginRight: "auto" }} />
          )}
          {localConfig.campos.filter(f => f.mostrar).map(f => (
            <div
              key={f.campo}
              style={{
                textAlign: f.alineacion === "izq" ? "left" : f.alineacion === "centro" ? "center" : "right",
                margin: 3,
                fontWeight: f.campo === "nombre" || f.campo === "apellido" ? 700 : 400
              }}
            >
              <span>{t(`aparienciaComanda.${f.campo}`, { defaultValue: f.campo }) || f.campo}:</span>{" "}
              <span>{previewData[f.campo] || "--"}</span>
            </div>
          ))}
          {localConfig.mostrarProductos && (
            <div style={{ margin: 6 }}>
              <b>{t("aparienciaComanda.productos")}:</b>
              <ul style={{ margin: 0, fontSize: 15 }}>
                {(previewData.productos || []).map((prod, i) => (
                  <li key={i}>{prod.nombre} x {prod.cantidad} - ${prod.precio * prod.cantidad}</li>
                ))}
              </ul>
            </div>
          )}
          {localConfig.mostrarTotales && (
            <div style={{ margin: 5, fontWeight: "bold", fontSize: 19, textAlign: "right" }}>
              {t("aparienciaComanda.total")}: ${previewData.total}
            </div>
          )}
          {localConfig.leyenda && (
            <div style={{ marginTop: 8, textAlign: "center", color: "#008" }}>
              {localConfig.leyenda}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
