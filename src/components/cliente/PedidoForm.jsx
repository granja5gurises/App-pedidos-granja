import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import {
  collection, addDoc, getDocs, getDoc, doc, query, where, runTransaction
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Textos centralizados para internacionalización
const texts = {
  inicio: "Inicio",
  misPedidos: "Mis pedidos",
  salir: "Salir",
  formPedido: "Formulario de Pedido",
  hacerPedido: "Hacer Pedido",
  quitar: "Quitar",
  precioConDesc: "Precio con descuento",
  confirmar: "Confirmar",
  cancelar: "Cancelar",
  confirmarPedido: "Confirmar Pedido",
  retira: "Retira en punto de entrega",
  envio: "Envío a domicilio",
  subtotal: "Subtotal",
  envioCosto: "Envío",
  total: "Total",
  comentario: "¿Querés dejar algún comentario sobre tu pedido?",
  comentarioPlaceholder: "Ej: batatas chicas por favor",
  seleccionadoAlMenosUno: "Seleccioná al menos un producto",
  pedidoConfirmado: "Pedido confirmado",
  errorGuardar: "Error al guardar el pedido",
  soloQuitar2: "Solo podés quitar 2 productos del bolsón"
};

// --- Helper para comprobante secuencial ---
const getNuevoComprobante = async () => {
  // Correlativos en: configuracion/correlativos (doc), campos: prefijoComprobante y nroComprobante
  const ref = doc(db, "configuracion", "correlativos");

  return await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    let prefijo = 'A', nro = 1;
    if (snap.exists()) {
      prefijo = snap.data().prefijoComprobante || 'A';
      nro = snap.data().nroComprobante || 1;
    }
    let nuevoPrefijo = prefijo;
    let nuevoNro = nro + 1;
    if (nro >= 999999) {
      // Salta a la siguiente letra
      const nextChar = String.fromCharCode(prefijo.charCodeAt(0) + 1);
      nuevoPrefijo = nextChar > 'Z' ? 'A' : nextChar;
      nuevoNro = 1;
    }
    transaction.set(ref, {
      prefijoComprobante: nuevoPrefijo,
      nroComprobante: nuevoNro
    }, { merge: true });
    // Devuelve string tipo "A000001"
    return prefijo + String(nro).padStart(6, '0');
  });
};

function PedidoForm() {
  const [pedido, setPedido] = useState({});
  const [productos, setProductos] = useState([]);
  const [productosQuitados, setProductosQuitados] = useState([]);
  const [comentario, setComentario] = useState('');
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [tipoEntrega, setTipoEntrega] = useState('retiro');
  const [usuario, setUsuario] = useState(null);
  const [datosCiudad, setDatosCiudad] = useState(null);
  const [camposRegistro, setCamposRegistro] = useState([]);

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

    // Cargar configuración dinámica de campos de usuario
    const cargarCampos = async () => {
      const ref = doc(db, "configuracion", "general")
      const snap = await getDoc(ref)
      if (snap.exists()) {
        let arr = snap.data().camposRegistro
        if (!Array.isArray(arr)) {
          arr = Object.entries(arr).map(([nombre, props]) => ({
            nombre,
            ...props
          }))
        }
        setCamposRegistro(arr.filter(c => c.visible !== false))
      }
    }

    cargarProductos();
    cargarCampos();
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
      alert(texts.soloQuitar2);
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

  // Nuevo: el costo de envío de la ciudad (si corresponde)
  const costoEnvio = tipoEntrega === 'envio'
    ? parseInt(datosCiudad?.costoEnvio || "0")
    : 0;
  const total = subtotal + costoEnvio;

  const hacerPedido = () => {
    if (Object.keys(pedido).length === 0) {
      alert(texts.seleccionadoAlMenosUno);
      return;
    }
    setMostrarResumen(true);
  };

  const cancelarPedido = () => {
    setPedido({});
    setMostrarResumen(false);
    window.location.href = '/inicio';
  };

  // --- FUNCIÓN MODIFICADA PARA COMPROBANTE ---
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

      const costoEnvioPedido = tipoEntrega === "envio"
        ? parseInt(datosCiudad?.costoEnvio || "0")
        : 0;

      // Campos de usuario configurables
      let userInfo = {};
      camposRegistro.forEach(campo => {
        userInfo[campo.nombre] = usuario?.[campo.nombre] || "";
      });

      // --- Nuevo: generar número de comprobante ---
      const comprobante = await getNuevoComprobante();

      const nuevoPedido = {
        userId: auth.currentUser.uid,
        productos: productosConfirmados,
        tipoEntrega,
        ...userInfo,
        total,
        comentario,
        costoEnvio: costoEnvioPedido,
        fecha: new Date(),
        comprobante // <-- GUARDAMOS EL NRO DE PEDIDO!
      };

      await addDoc(collection(db, 'pedidos'), nuevoPedido);

      // Guardar comprobante en sessionStorage para confirmación
      window.sessionStorage.setItem("ultimoComprobante", comprobante);

      alert(texts.pedidoConfirmado);
      setPedido({});
      setMostrarResumen(false);
      window.location.href = '/confirmacion-pedido';
    } catch (e) {
      alert(texts.errorGuardar + ': ' + e.message);
    }
  };

  const bolsones = productos.filter(p => p.esBolson);
  const productosSimples = productos.filter(p => !p.esBolson);

  return (
    <div>
      {usuario && (
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
          <button onClick={() => window.location.href = '/inicio'}>{texts.inicio}</button>
          <button onClick={() => window.location.href = '/mipedido'}>{texts.misPedidos}</button>
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
          {texts.salir}
        </button>
      )}

      <h2>{texts.formPedido}</h2>

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
                          {texts.quitar}
                        </button>
                      </li>
                    );
                  })}
                  <p><strong>{texts.precioConDesc}:</strong> ${calcularPrecioBolson(bolson)}</p>
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
          <button onClick={hacerPedido}>{texts.hacerPedido}</button>
        </>
      )}

      {mostrarResumen && (
        <div style={{ backgroundColor: '#eef', padding: '1rem', marginTop: '20px' }}>
          <h3>{texts.confirmarPedido}</h3>
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
            <label>
              <input type="radio" name="entrega" checked={tipoEntrega === 'retiro'} onChange={() => setTipoEntrega('retiro')} /> {texts.retira}
            </label>
            <label>
              <input type="radio" name="entrega" checked={tipoEntrega === 'envio'} onChange={() => setTipoEntrega('envio')} /> {texts.envio}
            </label>
          </div>

          <p>{texts.subtotal}: ${subtotal}</p>
          {tipoEntrega === 'envio' && <p>{texts.envioCosto}: ${costoEnvio}</p>}

          <div style={{ marginTop: '1rem' }}>
            <label>{texts.comentario}</label><br />
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows="3"
              placeholder={texts.comentarioPlaceholder}
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>

          <p><strong>{texts.total}: ${total}</strong></p>

          <button onClick={confirmarPedido}>{texts.confirmar}</button>
          <button onClick={cancelarPedido}>{texts.cancelar}</button>
        </div>
      )}
    </div>
  );
}

export default PedidoForm;
