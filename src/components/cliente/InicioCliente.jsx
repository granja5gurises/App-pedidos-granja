import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

// Textos centralizados para internacionalización
const texts = {
  saludo: "¡Hola! ¿Qué querés hacer hoy?",
  hacerPedido: "🛒 Hacer Pedido",
  misPedidos: "📦 Mis Pedidos",
  cerrarSesion: "🔓 Cerrar sesión"
};

const InicioCliente = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{texts.saludo}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        <button onClick={() => navigate('/pedido')} style={{ padding: '1rem', fontSize: '1.2rem' }}>
          {texts.hacerPedido}
        </button>
        <button onClick={() => navigate('/mipedido')} style={{ padding: '1rem', fontSize: '1.2rem' }}>
          {texts.misPedidos}
        </button>
        <button onClick={handleLogout} style={{ padding: '0.8rem', fontSize: '1rem', color: 'red' }}>
          {texts.cerrarSesion}
        </button>
      </div>
    </div>
  );
};

export default InicioCliente;
