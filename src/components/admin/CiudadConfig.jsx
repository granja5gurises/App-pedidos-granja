import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';

export default function CiudadConfig() {
  const [nuevoCiudad, setNuevoCiudad] = useState('');
  const [nuevoCosto, setNuevoCosto] = useState('');
  const [nuevoHorario, setNuevoHorario] = useState('');
  const [nuevoRetiro, setNuevoRetiro] = useState('');
  const [ciudades, setCiudades] = useState({});
  const [editando, setEditando] = useState(null);
  const [editCosto, setEditCosto] = useState('');
  const [editHorario, setEditHorario] = useState('');
  const [editRetiro, setEditRetiro] = useState('');

  useEffect(() => {
    obtenerCiudades();
  }, []);

  const obtenerCiudades = async () => {
    const snap = await getDocs(collection(db, 'ciudades'));
    const datos = {};
    snap.forEach(doc => {
      datos[doc.id] = doc.data();
    });
    setCiudades(datos);
  };

  const handleGuardar = async () => {
    if (!nuevoCiudad || !nuevoCosto || !nuevoHorario || !nuevoRetiro) return;
    await setDoc(doc(db, 'ciudades', nuevoCiudad), {
      costoEnvio: nuevoCosto,
      horario: nuevoHorario,
      puntoRetiro: nuevoRetiro
    });
    setNuevoCiudad('');
    setNuevoCosto('');
    setNuevoHorario('');
    setNuevoRetiro('');
    obtenerCiudades();
  };

  const empezarEdicion = (nombre, data) => {
    setEditando(nombre);
    setEditCosto(data.costoEnvio);
    setEditHorario(data.horario);
    setEditRetiro(data.puntoRetiro);
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setEditCosto('');
    setEditHorario('');
    setEditRetiro('');
  };

  const guardarCambios = async () => {
    await setDoc(doc(db, 'ciudades', editando), {
      costoEnvio: editCosto,
      horario: editHorario,
      puntoRetiro: editRetiro
    }, { merge: true });
    cancelarEdicion();
    obtenerCiudades();
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Configuración por Ciudad</h2>
      <input
        placeholder="Ciudad"
        value={nuevoCiudad}
        onChange={(e) => setNuevoCiudad(e.target.value)}
      />
      <input
        placeholder="Costo envío"
        value={nuevoCosto}
        onChange={(e) => setNuevoCosto(e.target.value)}
      />
      <input
        placeholder="Horario de entrega"
        value={nuevoHorario}
        onChange={(e) => setNuevoHorario(e.target.value)}
      />
      <input
        placeholder="Punto de retiro"
        value={nuevoRetiro}
        onChange={(e) => setNuevoRetiro(e.target.value)}
      />
      <button onClick={handleGuardar}>Guardar</button>

      <hr />

      <h3>Ciudades configuradas</h3>
      <ul>
        {Object.entries(ciudades).map(([nombre, data]) => (
          <li key={nombre}>
            {editando === nombre ? (
              <>
                <strong>{nombre}</strong>: $
                <input
                  value={editCosto}
                  onChange={(e) => setEditCosto(e.target.value)}
                  style={{ width: '80px' }}
                /> – 
                <input
                  value={editHorario}
                  onChange={(e) => setEditHorario(e.target.value)}
                  placeholder="Horario"
                /> / 
                <input
                  value={editRetiro}
                  onChange={(e) => setEditRetiro(e.target.value)}
                  placeholder="Punto retiro"
                />
                <button onClick={guardarCambios}>Guardar</button>
                <button onClick={cancelarEdicion}>Cancelar</button>
              </>
            ) : (
              <>
                {nombre}: ${data.costoEnvio} – {data.horario} / {data.puntoRetiro}
                <button onClick={() => empezarEdicion(nombre, data)} style={{ marginLeft: 10 }}>Editar</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}