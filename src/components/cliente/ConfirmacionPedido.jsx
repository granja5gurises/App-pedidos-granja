import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const ConfirmacionPedido = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const db = getFirestore();
  const [usuario, setUsuario] = useState(null);

  const { productos, bolsón, entrega, ciudad, fecha, userId } = location.state || {};

  useEffect(() => {
    const fetchUsuario = async () => {
      if (!userId) return;
      const docRef = doc(db, 'usuarios', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUsuario(docSnap.data());
      }
    };
    fetchUsuario();
  }, [userId, db]);

  if (!productos || !usuario) return <p>Cargando datos del pedido...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Pedido confirmado</h2>
      <p><strong>Gracias por tu pedido, {usuario.nombre}!</strong></p>
      <p>Ciudad: {ciudad}</p>
      <p>Tipo de entrega: {entrega}</p>
      <p>Fecha: {new Date(fecha.seconds * 1000).toLocaleString()}</p>
      <p>Dirección: {usuario.direccion}</p>
      <p>Email: {usuario.email}</p>
      <p>Bolsón seleccionado: {bolsón}</p>
      <p>Productos:</p>
      <ul>
        {Object.entries(productos).map(([producto, cantidad]) => (
          <li key={producto}>{producto}: {cantidad}</li>
        ))}
      </ul>
      <button onClick={() => navigate('/')}>Volver al inicio</button>
    </div>
  );
};

export default ConfirmacionPedido;