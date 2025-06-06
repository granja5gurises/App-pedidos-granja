
import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import {
  collection, addDoc, getDocs, getDoc, doc, query, where, deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

function PedidoForm() {
  const [pedido, setPedido] = useState({});
  const [productos, setProductos] = useState([]);
  const [productosQuitados, setProductosQuitados] = useState([]);
  const [comentario, setComentario] = useState('');
  const [mostrarResumen, setMostrarResumen] = useState(false);
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
          setUsuario(datos);
          const ciudadRef = doc(db, 'ciudades', datos.ciudad);
          const ciudadSnap = await getDoc(ciudadRef);
          if (ciudadSnap.exists()) setDatosCiudad(ciudadSnap.data());
        }
      }
    });

    const cargarProductos = async () => {
      const snap = await getDocs(collection(db, 'productos'));
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(lista.filter(p => !p.oculto));
    };

    cargarProductos();
    return () => unsubscribe();
  }, []);

  const toggleProducto = (id) => {
    if (pedido[id]) {
      const nuevo = { ...pedido };
      delete nuevo[id];
      setPedido(nuevo);
      setProductosQuitados([]);
    } else {
      setPedido({ ...pedido, [id]: 1 });
    }
  };

  const quitarDelBolson = (id) => {
    if (productosQuitados.includes(id)) {
      setProductosQuitados(prev => prev.filter(p => p !== id));
    } else if (productosQuitados.length < 2) {
      setProductosQuitados(prev => [...prev, id]);
    } else {
      alert("Solo podés quitar 2 productos del bolsón");
    }
  };

  const redondear = (n) => Math.round(n / 100) * 100;
  const precioConDescuento = (precio, descuento) => redondear(precio * (1 - descuento / 100));

  const calcularPrecioBolson = (bolson) => {
    return redondear(
      bolson.contenido
        .filter(id => !productosQuitados.includes(id))
        .reduce((acc, id) => {
          const prod = productos.find(p => p.id === id);
          return acc + (prod ? precioConDescuento(prod.precio, bolson.descuento || 0) : 0);
        }, 0)
    );
  };

  const subtotal = Object.entries(pedido).reduce((acc, [id, cantidad]) => {
    const prod = productos.find(p => p.id === id);
    if (!prod) return acc;
    if (prod.esBolson) return acc + calcularPrecioBolson(prod) * cantidad;
    return acc + (prod.precio || 0) * cantidad;
  }, 0);

  const costoEnvio = tipoEntrega === 'envio' ? parseInt(datosCiudad?.costoEnvio || 0) : 0;
  const total = subtotal + costoEnvio;

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
    window.location.href = '/inicio';
  };

  const confirmarPedido = async () => {
    try {
      const productosConfirmados = Object.entries(pedido).map(([id, cantidad]) => {
        const prod = productos.find(p => p.id === id);
        const precio = prod.esBolson ? calcularPrecioBolson(prod) : prod.precio;
        return {
          id,
          nombre: prod.nombre,
          cantidad,
          precio
        };
      });

      const nuevoPedido = {
        userId: auth.currentUser.uid,
        productos: productosConfirmados,
        tipoEntrega,
        ciudad: usuario?.ciudad,
        direccion: usuario?.direccion,
        nombre: usuario?.nombre,
        apellido: usuario?.apellido,
        email: usuario?.email,
        total,
        comentario,
        fecha: new Date()
      };

      await addDoc(collection(db, 'pedidos'), nuevoPedido);
      alert('Pedido confirmado');
      setPedido({});
      setMostrarResumen(false);
      window.location.href = '/inicio';
    } catch (e) {
      alert('Error al guardar el pedido: ' + e.message);
    }
  };

  const bolsones = productos.filter(p => p.esBolson);
  const productosSimples = productos.filter(p => !p.esBolson);

  return (
    <div>
      {usuario && (
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
          <button onClick={() => window.location.href = '/inicio'}>Inicio</button>
          <button onClick={() => window.location.href = '/mipedido'}>Mis pedidos</button>
        </div>
      )}

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
          {bolsones.map(bolson => (
            <div key={bolson.id} style={{ marginBottom: 10 }}>
              <input type="checkbox" checked={pedido[bolson.id]} onChange={() => toggleProducto(bolson.id)} />
              <img src={bolson.imagen} alt={bolson.nombre} width="60" />
              <strong>{bolson.nombre}</strong>
              {pedido[bolson.id] && (
                <ul>
                  {bolson.contenido.map(itemId => {
                    const item = productos.find(p => p.id === itemId);
                    const quitado = productosQuitados.includes(itemId);
                    return (
                      <li key={itemId} style={{ textDecoration: quitado ? 'line-through' : 'none' }}>
                        {item?.nombre} (${precioConDescuento(item?.precio || 0, bolson.descuento || 0)})
                        <button onClick={() => quitarDelBolson(itemId)} style={{ marginLeft: 10 }}>
                          Quitar
                        </button>
                      </li>
                    );
                  })}
                  <p><strong>Precio con descuento:</strong> ${calcularPrecioBolson(bolson)}</p>
                </ul>
              )}
            </div>
          ))}
          {productosSimples.map(prod => (
            <div key={prod.id} style={{ marginBottom: 10 }}>
              <input type="checkbox" checked={pedido[prod.id]} onChange={() => toggleProducto(prod.id)} />
              <img src={prod.imagen} alt={prod.nombre} width="60" />
              <label>{prod.nombre} (${prod.precio})</label>
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
              const prod = productos.find(p => p.id === id);
              const precio = prod.esBolson ? calcularPrecioBolson(prod) : prod.precio;
              return (
                <li key={id}>
                  {prod?.nombre} ({cantidad}) x ${precio} = ${precio * cantidad}
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
          </div>

          <p><strong>Total: ${total}</strong></p>

          <button onClick={confirmarPedido}>Confirmar</button>
          <button onClick={cancelarPedido}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

export default PedidoForm;
