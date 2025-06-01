// App con login persistente, panel productor, exportación, stock en tiempo real y alertas + manejo de secciones y productos
import React, { useState, useEffect } from 'react';

const productosIniciales = [
  { id: 1, nombre: 'Bolson', precio: 16000, stock: 10, ciudad: 'Ubajay', seccion: 'Verduras', visible: true },
  { id: 2, nombre: 'Tomate', precio: 1200, stock: 15, ciudad: 'Ubajay', seccion: 'Verduras', visible: true },
  { id: 3, nombre: 'Acelga', precio: 800, stock: 5, ciudad: 'Ubajay', seccion: 'Verduras', visible: true },
];

const ciudadesDisponibles = ['Ubajay', 'Villa Elisa', 'Colón', 'Concepción del Uruguay'];
const seccionesDisponibles = ['Verduras', 'Almacén'];

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [registro, setRegistro] = useState({ nombre: '', apellido: '', direccion: '', tipo: 'cliente', clave: '', ciudad: '' });
  const [productos, setProductos] = useState(productosIniciales);
  const [pedido, setPedido] = useState({});
  const [confirmando, setConfirmando] = useState(false);
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState('retiro');
  const [historialPedidos, setHistorialPedidos] = useState([]);
  const [modoProductor, setModoProductor] = useState(false);
  const [ciudadesHabilitadas, setCiudadesHabilitadas] = useState(['Ubajay']);
  const [horaCierre, setHoraCierre] = useState(() => {
    const h = new Date();
    h.setHours(20, 0, 0, 0);
    return h;
  });

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      const user = JSON.parse(usuarioGuardado);
      setUsuario(user);
      setDireccionEntrega(user.direccion);
      if (user.tipo === 'productor') setModoProductor(true);
    }
    const pedidosGuardados = localStorage.getItem('pedidos');
    if (pedidosGuardados) {
      setHistorialPedidos(JSON.parse(pedidosGuardados));
    }
  }, []);

  const guardarPedido = (nuevoPedido) => {
    const actualizados = [...historialPedidos, nuevoPedido];
    setHistorialPedidos(actualizados);
    localStorage.setItem('pedidos', JSON.stringify(actualizados));
  };

  const handleLogin = () => {
    if (registro.nombre.trim() && registro.apellido.trim() && registro.direccion.trim() && registro.ciudad.trim()) {
      if (registro.tipo === 'productor' && registro.clave !== 'granja2024') {
        alert('Clave incorrecta');
        return;
      }
      const user = { ...registro, nombre: `${registro.nombre} ${registro.apellido}` };
      setUsuario(user);
      setDireccionEntrega(registro.direccion);
      localStorage.setItem('usuario', JSON.stringify(user));
    } else {
      alert('Completá todos los campos obligatorios');
    }
  };

  const toggleProducto = (id) => {
    const producto = productos.find(p => p.id === id);
    if (producto.stock <= 0) {
      alert(`No queda stock de ${producto.nombre}`);
      return;
    }
    setPedido(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const productosSeleccionados = Object.entries(pedido)
    .filter(([_, seleccionado]) => seleccionado)
    .map(([id]) => productos.find(p => p.id === parseInt(id)));

  const total = productosSeleccionados.reduce((acc, prod) => acc + prod.precio, 0);

  const confirmarPedido = () => {
    const ahora = new Date();
    if (ahora > horaCierre) {
      alert('Ya se cerró la toma de pedidos');
      return;
    }
    if (!ciudadesHabilitadas.includes(usuario.ciudad)) {
      alert('Esta semana no se están tomando pedidos en tu ciudad');
      return;
    }
    if (productosSeleccionados.length === 0) return alert('No seleccionaste productos');
    setConfirmando(true);
  };

  const enviarPedido = () => {
    const nuevoPedido = {
      cliente: usuario.nombre,
      direccion: direccionEntrega,
      tipoEntrega,
      productos: productosSeleccionados,
      total,
      fecha: new Date().toLocaleString()
    };
    guardarPedido(nuevoPedido);
    const actualizados = productos.map(p => {
      const cantidad = productosSeleccionados.filter(sel => sel.id === p.id).length;
      return { ...p, stock: p.stock - cantidad };
    });
    setProductos(actualizados);
    alert(`¡Gracias ${usuario.nombre}! Tu pedido fue confirmado.`);
    setPedido({});
    setConfirmando(false);
  };

  const exportarPedidos = () => {
    const encabezado = 'Cliente,Fecha,Entrega,Producto,Precio\n';
    const filas = historialPedidos.flatMap(p =>
      p.productos.map(prod => `${p.cliente},${p.fecha},${p.tipoEntrega},${prod.nombre},${prod.precio}`)
    );
    const csv = encabezado + filas.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pedidos.csv';
    a.click();
  };

  if (!usuario) {
    return <div>App iniciando...</div>;
  }

  return <div>App cargada correctamente</div>;
}
