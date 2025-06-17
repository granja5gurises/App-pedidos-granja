import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Textos centralizados para internacionalización
const texts = {
  titulo: "Pedido confirmado",
  gracias: (nombre) => `Gracias por tu pedido, ${nombre}!`,
  ciudad: "Ciudad",
  entrega: "Tipo de entrega",
  fecha: "Fecha",
  direccion: "Dirección",
  email: "Email",
  bolson: "Bolsón seleccionado",
  productos: "Productos",
  comprobante: "Número de pedido",
  volver: "Volver al inicio",
  cargando: "Cargando datos del pedido..."
};

const ConfirmacionPedido = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const db = getFirestore();
  const [usuario, setUsuario] = useState(null);
  const [comprobante, setComprobante] = useState("");

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
    // Tomar comprobante del state (si lo mandás), o de sessionStorage
    const comp = (location.state && location.state.comprobante)
      || window.sessionStorage.getItem("ultimoComprobante")
      || "";
    setComprobante(comp);
  }, [userId, db, location.state]);

  if (!productos || !usuario) return <p>{texts.cargando}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>{texts.titulo}</h2>
      {/* Mostramos el número de pedido */}
      {comprobante && (
        <p>
          <strong>{texts.comprobante}:</strong> {comprobante}
        </p>
      )}
      <p><strong>{texts.gracias(usuario.nombre)}</strong></p>
      <p>{texts.ciudad}: {ciudad}</p>
      <p>{texts.entrega}: {entrega}</p>
      <p>{texts.fecha}: {new Date(fecha.seconds * 1000).toLocaleString()}</p>
      <p>{texts.direccion}: {usuario.direccion}</p>
      <p>{texts.email}: {usuario.email}</p>
      <p>{texts.bolson}: {bolsón}</p>
      <p>{texts.productos}:</p>
      <ul>
        {Object.entries(productos).map(([producto, cantidad]) => (
          <li key={producto}>{producto}: {cantidad}</li>
        ))}
      </ul>
      <button onClick={() => navigate('/')}>{texts.volver}</button>
    </div>
  );
};

export default ConfirmacionPedido;
