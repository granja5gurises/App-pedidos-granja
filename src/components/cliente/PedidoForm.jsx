// Igual a la versión debug, pero restaurando el mensaje completo según tipo de entrega

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import {
  collection, addDoc, getDocs, getDoc, doc, query, where
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const productosMock = [
  {
    id: 'bolson_clasico',
    nombre: 'Bolson Clásico',
    precio: 16000,
    imagen: 'https://via.placeholder.com/100?text=Bolson+Clasico'
  },
  {
    id: 'bolson_familiar',
    nombre: 'Bolson Familiar',
    precio: 24000,
    imagen: 'https://via.placeholder.com/100?text=Bolson+Familiar'
  },
  {
    id: 'acelga',
    nombre: 'Acelga',
    precio: 1200,
    imagen: 'https://via.placeholder.com/100?text=Acelga'
  },
  {
    id: 'zapallo',
    nombre: 'Zapallo',
    precio: 1500,
    imagen: 'https://via.placeholder.com/100?text=Zapallo'
  },
  {
    id: 'tomate',
    nombre: 'Tomate',
    precio: 2000,
    imagen: 'https://via.placeholder.com/100?text=Tomate'
  }
];

function PedidoForm() {
  const [pedido, setPedido] = useState({});
  const [mostrarResumen, setMostrarResumen] = useState(false);
  
// CAMBIO: agregamos campo comentario
const [comentario, setComentario] = useState('');

const [tipoEntrega, setTipoEntrega] = useState('retiro');
  const [usuario, setUsuario] = useState(null);
  const [datosCiudad, setDatosCiudad] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const q = query(collection(db, 'usuarios'), where('uid', '==', user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const datos = snapshot.docs[0].data();
          setUsuario({ ...datos, docId: snapshot.docs[0].id });
          const ciudadRef = doc(db, 'ciudades', datos.ciudad);
          const ciudadSnap = await getDoc(ciudadRef);
          if (ciudadSnap.exists()) {
            setDatosCiudad(ciudadSnap.data());
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleProducto = (id) => {
    setPedido(prev => {
      const nuevo = { ...prev };
      if (nuevo[id]) {
        delete nuevo[id];
      } else {
        nuevo[id] = 1;
      }
      return nuevo;
    });
  };

  const cambiarCantidad = (id, cantidad) => {
    setPedido(prev => ({ ...prev, [id]: parseInt(cantidad) }));
  };

  const hacerPedido = () => {
    if (Object.keys(pedido).length === 0) {
      alert('Seleccioná al menos un producto');
      return;
    }
    setMostrarResumen(true);
  };

  const cancelarPedido = () => {
    setPedido({});
    setMostrarResumen(false);
  };

  const editarPedido = () => {
    setMostrarResumen(false);
  };

  const confirmarPedido = async () => {
    try {
      const productos = Object.entries(pedido).map(([id, cantidad]) => {
        const prod = productosMock.find(p => p.id === id);
        return {
          id,
          nombre: prod.nombre,
          cantidad,
          precio: prod.precio
        };
      });

      const subtotal = productos.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
      const costoEnvio = tipoEntrega === 'envio' ? parseInt(datosCiudad?.costoEnvio || 0) : 0;
      const total = subtotal + costoEnvio;

      const nuevoPedido = {
        productos,
        tipoEntrega,
        ciudad: usuario?.ciudad,
        direccion: usuario?.direccion,
        nombre: usuario?.nombre,
        apellido: usuario?.apellido,
        email: usuario?.email,
        total,
        
comentario,
timestamp: new Date()
      };

      await addDoc(collection(db, 'pedidos'), nuevoPedido);

      const mensaje = tipoEntrega === 'envio'
        ? `Recibirás tu pedido en tu domicilio el ${datosCiudad?.horario}`
        : `Podés retirarlo en ${datosCiudad?.puntoRetiro} el ${datosCiudad?.horario}`;

      alert('Pedido confirmado.\n' + mensaje);
      setPedido({});
      setMostrarResumen(false);
    } catch (e) {
      alert('Error al guardar el pedido: ' + e.message);
    }
  };

  const subtotal = Object.entries(pedido).reduce((acc, [id, cantidad]) => {
    const prod = productosMock.find(p => p.id === id);
    return acc + (prod?.precio || 0) * cantidad;
  }, 0);

  const costoEnvio = tipoEntrega === 'envio' ? parseInt(datosCiudad?.costoEnvio || 0) : 0;
  const total = subtotal + costoEnvio;

  return (
    <div>
      
      {usuario && (
        <button onClick={async () => {
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
          window.location.href = '/login';
        }} style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 1000,
          background: '#eee',
          border: '1px solid #ccc',
          padding: '4px 8px',
          borderRadius: '5px'
        }}>
          Salir
        </button>
      )}

      <h2>Formulario de Pedido</h2>
      {!mostrarResumen && (
        <>
          {productosMock.map(prod => (
            <div key={prod.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={pedido.hasOwnProperty(prod.id)}
                onChange={() => toggleProducto(prod.id)}
              />
              <img src={prod.imagen} alt={prod.nombre} width="60" />
              <label>{prod.nombre} (${prod.precio})</label>
              {pedido.hasOwnProperty(prod.id) && (
                <select value={pedido[prod.id]} onChange={(e) => cambiarCantidad(prod.id, e.target.value)}>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
          <button onClick={hacerPedido}>Hacer Pedido</button>
        </>
      )}

      {mostrarResumen && (
        <div style={{ backgroundColor: '#eef', padding: '1rem', marginTop: '20px' }}>
          <h3>Confirmar Pedido</h3>
          <ul>
            {Object.entries(pedido).map(([id, cantidad]) => {
              const prod = productosMock.find(p => p.id === id);
              return (
                <li key={id}>
                  {prod?.nombre} ({cantidad}) x ${prod?.precio} = ${prod?.precio * cantidad}
                </li>
              );
            })}
          </ul>

          <div>
            <label><input type="radio" name="entrega" checked={tipoEntrega === 'retiro'} onChange={() => setTipoEntrega('retiro')} /> Retira en punto de entrega</label>
            <label><input type="radio" name="entrega" checked={tipoEntrega === 'envio'} onChange={() => setTipoEntrega('envio')} /> Envío a domicilio</label>
          </div>

          <p>Subtotal: ${subtotal}</p>
          {tipoEntrega === 'envio' && <p>Envío: ${costoEnvio}</p>}
          
          <div style={{ marginTop: '1rem' }}>
            <label>¿Querés dejar algún comentario sobre tu pedido?</label><br />
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows="3"
              placeholder="Ej: batatas chicas por favor"
              style={{ width: '100%', marginTop: '5px' }}
            />
            <small style={{ display: 'block', marginTop: '5px', color: '#555' }}>
              *Este comentario no modifica el total automáticamente.
            </small>

          </div>

          <p><strong>Total: ${total}</strong></p>

          <button onClick={confirmarPedido}>Confirmar</button>
          <button onClick={editarPedido}>Editar</button>
          <button onClick={cancelarPedido}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

export default PedidoForm;