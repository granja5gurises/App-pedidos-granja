import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import BotonVolver from './BotonVolver';

// Opciones ejemplo para tema visual
const fuentes = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Arial', label: 'Arial' }
];
const colores = [
  { value: '#01569f', label: 'Azul profundo' },
  { value: '#242424', label: 'Gris oscuro' },
  { value: '#218C55', label: 'Verde' },
  { value: '#be2038', label: 'Rojo' },
  { value: '#ebbb27', label: 'Amarillo' },
];

export default function PanelAparienciaAdmin() {
  const { t } = useTranslation();
  const [tema, setTema] = useState({
    colorPrincipal: '#01569f',
    colorSecundario: '#242424',
    fuente: 'Inter',
    estiloBoton: 'rounded',
    vistaProductos: 'grid',
    tamFuente: 16
  });
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  // Cargar config de apariencia desde Firestore
  useEffect(() => {
    async function cargarApariencia() {
      try {
        const ref = doc(db, 'configuracion', 'aparienciaAdmin');
        const snap = await getDoc(ref);
        if (snap.exists()) setTema(prev => ({ ...prev, ...snap.data() }));
      } catch (e) {
        setMensaje(t('apariencia.errorCargar'));
      } finally {
        setCargando(false);
      }
    }
    cargarApariencia();
    // eslint-disable-next-line
  }, []);

  // Guardar cambios en Firestore
  const guardarTema = async () => {
    try {
      await setDoc(doc(db, 'configuracion', 'aparienciaAdmin'), tema, { merge: true });
      setMensaje(t('apariencia.guardadoOk'));
      setTimeout(() => setMensaje(''), 1500);
    } catch {
      setMensaje(t('apariencia.errorGuardar'));
    }
  };

  // Cambios de inputs
  const cambiar = (campo, valor) => setTema(prev => ({ ...prev, [campo]: valor }));

  if (cargando) return <div>{t('apariencia.cargando')}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {/* Botón volver arriba a la derecha */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <BotonVolver ruta="/config" />
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 800 }}>
        {t('apariencia.tituloAdmin')}
      </h2>
      <p>{t('apariencia.descripcionAdmin')}</p>

      {/* Opciones de personalización */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 28,
        margin: "22px 0"
      }}>
        <div>
          <label style={{ fontWeight: 600 }}>{t('apariencia.colorPrincipal')}</label><br />
          <select value={tema.colorPrincipal} onChange={e => cambiar('colorPrincipal', e.target.value)}>
            {colores.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>{t('apariencia.colorSecundario')}</label><br />
          <select value={tema.colorSecundario} onChange={e => cambiar('colorSecundario', e.target.value)}>
            {colores.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>{t('apariencia.fuente')}</label><br />
          <select value={tema.fuente} onChange={e => cambiar('fuente', e.target.value)}>
            {fuentes.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>{t('apariencia.tamFuente')}</label><br />
          <input
            type="number"
            min={12}
            max={22}
            value={tema.tamFuente}
            onChange={e => cambiar('tamFuente', Number(e.target.value))}
            style={{ width: 60 }}
          /> px
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>{t('apariencia.estiloBoton')}</label><br />
          <select value={tema.estiloBoton} onChange={e => cambiar('estiloBoton', e.target.value)}>
            <option value="rounded">{t('apariencia.estiloRedondeado')}</option>
            <option value="square">{t('apariencia.estiloCuadrado')}</option>
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>{t('apariencia.vistaProductos')}</label><br />
          <select value={tema.vistaProductos} onChange={e => cambiar('vistaProductos', e.target.value)}>
            <option value="grid">{t('apariencia.grid')}</option>
            <option value="lista">{t('apariencia.lista')}</option>
            <option value="fotoGrande">{t('apariencia.fotoGrande')}</option>
          </select>
        </div>
      </div>

      <button onClick={guardarTema} style={{
        marginTop: 10,
        background: tema.colorPrincipal,
        color: "#fff",
        border: "none",
        borderRadius: tema.estiloBoton === 'rounded' ? 12 : 3,
        padding: "8px 22px",
        fontWeight: 600,
        fontSize: tema.tamFuente
      }}>
        {t('apariencia.guardar')}
      </button>
      {mensaje && <span style={{ color: "green", marginLeft: 14 }}>{mensaje}</span>}

      {/* PREVIEW en tiempo real */}
      <div style={{
        border: "2px solid #ddd",
        borderRadius: 16,
        marginTop: 32,
        padding: 28,
        background: tema.colorSecundario,
        color: "#fff",
        fontFamily: tema.fuente,
        fontSize: tema.tamFuente
      }}>
        <h3>{t('apariencia.previewTitulo')}</h3>
        <p>{t('apariencia.previewTexto')}</p>
        <button style={{
          background: tema.colorPrincipal,
          color: "#fff",
          borderRadius: tema.estiloBoton === 'rounded' ? 12 : 3,
          padding: "8px 18px",
          border: "none",
          fontWeight: 600,
          fontSize: tema.tamFuente
        }}>
          {t('apariencia.botonDemo')}
        </button>
      </div>
    </div>
  );
}
