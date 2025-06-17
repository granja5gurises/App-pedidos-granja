import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import {
  collection, getDocs, setDoc, doc, getDoc, deleteDoc
} from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import BotonVolver from './BotonVolver';

function pluralizar(nombre) {
  if (nombre.endsWith("z")) return nombre.slice(0, -1) + "ces";
  if (/[aeiou]$/.test(nombre)) return nombre + "s";
  return nombre + "es";
}

function horaOptions() {
  const arr = [];
  for (let h = 0; h < 24; h++) {
    arr.push(`${h.toString().padStart(2, '0')}:00`);
    arr.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return arr;
}
const HORA_OPCIONES = horaOptions();

export default function PanelRestricciones() {
  const { t } = useTranslation();
  const [config, setConfig] = useState(null);
  useEffect(() => {
    async function cargarConfig() {
      const ref = doc(db, "configuracion", "general");
      const snap = await getDoc(ref);
      setConfig(snap.exists() ? snap.data() : {});
    }
    cargarConfig();
  }, []);

  const listaCampos = config?.camposRegistro?.filter(c => c.tipo === "lista") || [];
  const [concepto, setConcepto] = useState(listaCampos[0]?.nombre || "");
  const [conceptosValores, setConceptosValores] = useState([]);
  const [seleccionado, setSeleccionado] = useState('');

  const [modo, setModo] = useState('apertura');
  const [ventanas, setVentanas] = useState([]);
  const [todasRestricciones, setTodasRestricciones] = useState([]);

  const [form, setForm] = useState({
    aperturaDia: t("restricciones.dias.1"),
    aperturaHora: '15:00',
    cierreDia: t("restricciones.dias.2"),
    cierreHora: '20:00',
    repeticion: 'semanal',
    fechaInicio: '',
    fechaFin: '',
    mensaje: ''
  });
  const [editandoIdx, setEditandoIdx] = useState(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    async function cargarValores() {
      if (!concepto) return;
      const colName = pluralizar(concepto).toLowerCase();
      const snap = await getDocs(collection(db, colName));
      const valores = snap.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre || doc.id
      }));
      setConceptosValores(valores);
      setSeleccionado(valores[0]?.id || '');
    }
    cargarValores();
    // eslint-disable-next-line
  }, [concepto, config]);

  useEffect(() => {
    async function cargar() {
      if (!seleccionado || !concepto) {
        setVentanas([]);
        setModo('apertura');
        return;
      }
      const ref = doc(db, 'restricciones', `${concepto}_${seleccionado}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setModo(data.modo || 'apertura');
        setVentanas(Array.isArray(data.ventanas) ? data.ventanas : []);
      } else {
        setModo('apertura');
        setVentanas([]);
      }
    }
    cargar();
    // eslint-disable-next-line
  }, [seleccionado, concepto]);

  useEffect(() => {
    async function cargar() {
      const col = collection(db, 'restricciones');
      const snap = await getDocs(col);
      const arr = [];
      snap.forEach(d => {
        arr.push({
          id: d.id,
          concepto: d.data().concepto,
          valor: d.data().valor,
          nombre: d.data().nombre,
          modo: d.data().modo,
          ventanas: Array.isArray(d.data().ventanas) ? d.data().ventanas : [],
        });
      });
      setTodasRestricciones(arr);
    }
    cargar();
  }, [ventanas]);

  useEffect(() => {
    if (!ventanas || ventanas.length === 0) {
      setPreview(
        t("restricciones.noHayVentanas", {
          estado: modo === 'cierre'
            ? t("restricciones.habilitada")
            : t("restricciones.inhabilitada")
        })
      );
    } else if (modo === 'apertura') {
      setPreview(
        t("restricciones.tiendaCerrada") + "\n" +
        ventanas.map((v) =>
          `• ${v.aperturaDia} ${v.aperturaHora} a ${v.cierreDia} ${v.cierreHora}, ${t("restricciones.repeticion." + (v.repeticion || 'semanal'))}${v.fechaInicio ? ` ${t("restricciones.desde")} ${v.fechaInicio}` : ''}${v.fechaFin ? ` ${t("restricciones.hasta")} ${v.fechaFin}` : ''}${v.mensaje ? ` — ${v.mensaje}` : ''}`
        ).join('\n')
      );
    } else {
      setPreview(
        t("restricciones.tiendaAbierta") + "\n" +
        ventanas.map((v) =>
          `• ${v.aperturaDia} ${v.aperturaHora} a ${v.cierreDia} ${v.cierreHora}, ${t("restricciones.repeticion." + (v.repeticion || 'semanal'))}${v.fechaInicio ? ` ${t("restricciones.desde")} ${v.fechaInicio}` : ''}${v.fechaFin ? ` ${t("restricciones.hasta")} ${v.fechaFin}` : ''}${v.mensaje ? ` — ${v.mensaje}` : ''}`
        ).join('\n')
      );
    }
    // eslint-disable-next-line
  }, [modo, ventanas]);

  const handleAgregarVentana = () => {
    if (!form.aperturaDia || !form.cierreDia || !form.aperturaHora || !form.cierreHora) return;
    const nueva = {
      ...form,
      fechaInicio: form.fechaInicio || '',
      fechaFin: form.fechaFin || '',
      mensaje: form.mensaje || '',
    };
    let nuevas = Array.isArray(ventanas) ? [...ventanas] : [];
    if (editandoIdx !== null) {
      nuevas[editandoIdx] = nueva;
    } else {
      nuevas.push(nueva);
    }
    setVentanas(nuevas);
    setEditandoIdx(null);
    limpiarForm();
  };

  const handleGuardar = async () => {
    if (!seleccionado || !concepto) return;
    await setDoc(doc(db, 'restricciones', `${concepto}_${seleccionado}`), {
      concepto,
      valor: seleccionado,
      nombre: conceptosValores.find(v => v.id === seleccionado)?.nombre || seleccionado,
      modo,
      ventanas
    });
    alert(t("restricciones.guardado"));
  };

  const handleEditar = idx => {
    setForm({ ...ventanas[idx] });
    setEditandoIdx(idx);
  };

  const handleEliminar = idx => {
    setVentanas((ventanas || []).filter((_, i) => i !== idx));
    setEditandoIdx(null);
  };

  const handleEliminarTodas = async () => {
    if (!window.confirm(t("restricciones.confirmEliminarGrupo"))) return;
    await deleteDoc(doc(db, 'restricciones', `${concepto}_${seleccionado}`));
    setVentanas([]);
    setEditandoIdx(null);
    limpiarForm();
    alert(t("restricciones.eliminadas"));
  };

  const handleEliminarGeneral = async (id) => {
    if (!window.confirm(t("restricciones.confirmEliminarGrupo"))) return;
    await deleteDoc(doc(db, 'restricciones', id));
    if (id === `${concepto}_${seleccionado}`) {
      setVentanas([]);
      setEditandoIdx(null);
      limpiarForm();
    }
    setTodasRestricciones(prev => prev.filter(r => r.id !== id));
    alert(t("restricciones.eliminadas"));
  };

  const limpiarForm = () => {
    setForm({
      aperturaDia: t("restricciones.dias.1"),
      aperturaHora: '15:00',
      cierreDia: t("restricciones.dias.2"),
      cierreHora: '20:00',
      repeticion: 'semanal',
      fechaInicio: '',
      fechaFin: '',
      mensaje: ''
    });
    setEditandoIdx(null);
  };

  const onFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value || '' }));
  };

  useEffect(() => {
    if (listaCampos.length && !concepto) {
      setConcepto(listaCampos[0].nombre);
    }
    // eslint-disable-next-line
  }, [config]);

  const getVentanaKey = (v, idx) =>
    [v.aperturaDia, v.aperturaHora, v.cierreDia, v.cierreHora, v.repeticion, v.fechaInicio, v.fechaFin, v.mensaje, idx].join('-');

  return (
    <div style={{ padding: 24, maxWidth: 1150 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 5 }}>{t("restricciones.titulo")}</h2>
        <BotonVolver ruta="/dashboard-admin" />
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 17, color: "#444", marginBottom: 3 }}>
          {t("restricciones.descripcion1")}<br />
          <span style={{ color: "#656565" }}>{t("restricciones.descripcion2")}</span>
        </div>
        <div style={{
          fontWeight: 700,
          color: "#af002a",
          background: "#fff2f3",
          padding: "4px 16px",
          borderRadius: 7,
          border: "1.5px solid #ffdadf",
          fontSize: 16,
          marginTop: 6
        }}>
          {t("restricciones.aviso")}
        </div>
      </div>

      {!config ? (
        <div>{t("restricciones.cargando")}</div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <label>{t("restricciones.concepto")}:&nbsp;
              <select value={concepto} onChange={e => setConcepto(e.target.value)}>
                {listaCampos.map((c, i) => (
                  <option key={c.nombre} value={c.nombre}>{c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1)}</option>
                ))}
              </select>
            </label>
            &nbsp;&nbsp;
            <label>{t("restricciones.valor")}:&nbsp;
              <select value={seleccionado} onChange={e => setSeleccionado(e.target.value)}>
                {conceptosValores.map(val =>
                  <option key={val.id} value={val.id}>{val.nombre}</option>
                )}
              </select>
            </label>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>
              <input
                type="radio"
                checked={modo === 'apertura'}
                onChange={() => setModo('apertura')}
              /> {t("restricciones.soloApertura")}
            </label>
            <br />
            <label>
              <input
                type="radio"
                checked={modo === 'cierre'}
                onChange={() => setModo('cierre')}
              /> {t("restricciones.soloCierre")}
            </label>
          </div>
          <div style={{
            border: '1px solid #ddd', padding: 12, background: '#f7f7f7', marginBottom: 12, borderRadius: 8
          }}>
            <h4>{editandoIdx !== null ? t("restricciones.editarVentana") : t("restricciones.nuevaVentana")}</h4>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <label>{t("restricciones.aperturaDia")}:<br />
                  <select name="aperturaDia" value={form.aperturaDia || ''} onChange={onFormChange}>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <option key={i} value={t(`restricciones.dias.${i}`)}>{t(`restricciones.dias.${i}`)}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>{t("restricciones.aperturaHora")}:<br />
                  <select name="aperturaHora" value={form.aperturaHora || ''} onChange={onFormChange}>
                    {HORA_OPCIONES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </label>
              </div>
              <div>
                <label>{t("restricciones.cierreDia")}:<br />
                  <select name="cierreDia" value={form.cierreDia || ''} onChange={onFormChange}>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <option key={i} value={t(`restricciones.dias.${i}`)}>{t(`restricciones.dias.${i}`)}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>{t("restricciones.cierreHora")}:<br />
                  <select name="cierreHora" value={form.cierreHora || ''} onChange={onFormChange}>
                    {HORA_OPCIONES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </label>
              </div>
              <div>
                <label>{t("restricciones.repeticion")}:<br />
                  <select name="repeticion" value={form.repeticion || 'semanal'} onChange={onFormChange}>
                    {["unica", "semanal", "quincenal"].map(r =>
                      <option key={r} value={r}>{t("restricciones.repeticion." + r)}</option>
                    )}
                  </select>
                </label>
              </div>
              <div>
                <label>{t("restricciones.fechaInicio")}:<br />
                  <input type="date" name="fechaInicio" value={form.fechaInicio || ''} onChange={onFormChange} />
                </label>
              </div>
              <div>
                <label>{t("restricciones.fechaFin")}:<br />
                  <input type="date" name="fechaFin" value={form.fechaFin || ''} onChange={onFormChange} />
                </label>
              </div>
              <div>
                <label>{t("restricciones.mensaje")}:<br />
                  <input type="text" name="mensaje" value={form.mensaje || ''} onChange={onFormChange} placeholder={t("restricciones.placeholderMensaje")} style={{ width: 180 }} />
                </label>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <button onClick={handleAgregarVentana} style={{ marginRight: 8 }}>
                {editandoIdx !== null ? t("restricciones.guardar") : t("restricciones.agregarVentana")}
              </button>
              {editandoIdx !== null && <button onClick={limpiarForm}>{t("restricciones.cancelar")}</button>}
            </div>
          </div>
          <h4>{t("restricciones.restriccionesGrupo")}</h4>
          {(!ventanas || ventanas.length === 0) && <div style={{ color: '#888' }}>{t("restricciones.noRestriccionesGrupo")}</div>}
          {(ventanas && ventanas.length > 0) && (
            <table border={1} cellPadding={4} style={{ marginBottom: 16, background: '#fff', minWidth: 800 }}>
              <thead>
                <tr>
                  <th>{t("restricciones.aperturaDia")}/{t("restricciones.aperturaHora")}</th>
                  <th>{t("restricciones.cierreDia")}/{t("restricciones.cierreHora")}</th>
                  <th>{t("restricciones.repeticion")}</th>
                  <th>{t("restricciones.fechaInicio")}</th>
                  <th>{t("restricciones.fechaFin")}</th>
                  <th>{t("restricciones.mensaje")}</th>
                  <th>{t("restricciones.editarVentana")}</th>
                  <th>{t("restricciones.eliminar")}</th>
                </tr>
              </thead>
              <tbody>
                {ventanas.map((v, idx) => (
                  <tr key={getVentanaKey(v, idx)}>
                    <td>{v.aperturaDia} {v.aperturaHora}</td>
                    <td>{v.cierreDia} {v.cierreHora}</td>
                    <td>{t("restricciones.repeticion." + (v.repeticion || 'semanal'))}</td>
                    <td>{v.fechaInicio || '-'}</td>
                    <td>{v.fechaFin || '-'}</td>
                    <td>{v.mensaje}</td>
                    <td>
                      <button onClick={() => handleEditar(idx)}>{t("restricciones.editarVentana")}</button>
                    </td>
                    <td>
                      <button onClick={() => handleEliminar(idx)} style={{ color: 'red' }}>{t("restricciones.eliminar")}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(ventanas && ventanas.length > 0) && (
            <button onClick={handleEliminarTodas} style={{ color: 'red', marginBottom: 14 }}>
              {t("restricciones.eliminarTodas")}
            </button>
          )}
          <div style={{ background: '#eef', padding: 12, borderRadius: 8, marginTop: 12, whiteSpace: 'pre-line' }}>
            <strong>{t("restricciones.vistaPrevia")}</strong> {preview}
          </div>
          <div style={{ marginTop: 20 }}>
            <button onClick={handleGuardar} style={{ fontWeight: 600, fontSize: 16 }}>{t("restricciones.guardarCambios")}</button>
          </div>

          <h3 style={{ marginTop: 32 }}>{t("restricciones.restriccionesApp")}</h3>
          {todasRestricciones.length === 0 && <div style={{ color: '#888' }}>{t("restricciones.noRestriccionesApp")}</div>}
          {todasRestricciones.length > 0 && (
            <table border={1} cellPadding={4} style={{ background: '#f7f7f7', minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>{t("restricciones.concepto")}</th>
                  <th>{t("restricciones.valor")}</th>
                  <th>Modo</th>
                  <th>Cantidad ventanas</th>
                  <th>{t("restricciones.detalles")}</th>
                  <th>{t("restricciones.eliminarTodasBtn")}</th>
                </tr>
              </thead>
              <tbody>
                {todasRestricciones.map(r => (
                  <tr key={r.id}>
                    <td>{r.concepto}</td>
                    <td>{r.nombre || r.valor}</td>
                    <td>{r.modo === 'apertura' ? t("restricciones.soloApertura") : t("restricciones.soloCierre")}</td>
                    <td>{r.ventanas.length}</td>
                    <td>
                      <button onClick={() => {
                        setConcepto(r.concepto);
                        setSeleccionado(r.valor);
                      }}>
                        {t("restricciones.detalles")}
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleEliminarGeneral(r.id)} style={{ color: 'red' }}>
                        {t("restricciones.eliminarTodasBtn")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
