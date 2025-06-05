
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

const InicioCliente = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>¡Hola! ¿Qué querés hacer hoy?</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        <button onClick={() => navigate('/pedido')} style={{ padding: '1rem', fontSize: '1.2rem' }}>
          🛒 Hacer Pedido
        </button>
        <button onClick={() => navigate('/mipedido')} style={{ padding: '1rem', fontSize: '1.2rem' }}>
          📦 Mis Pedidos
        </button>
        <button onClick={handleLogout} style={{ padding: '0.8rem', fontSize: '1rem', color: 'red' }}>
          🔓 Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default InicioCliente;
