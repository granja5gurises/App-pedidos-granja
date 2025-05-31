
import React, { useState } from 'react';

const productosIniciales = [
  { id: 1, nombre: 'Bolson', precio: 16000, stock: 10 },
  { id: 2, nombre: 'Tomate', precio: 1200, stock: 15 },
  { id: 3, nombre: 'Acelga', precio: 800, stock: 20 },
];

export default function App() {
  const [productos, setProductos] = useState(productosIniciales);
  const [pedido, setPedido] = useState({});
  const [mensaje, setMensaje] = useState('');

  const agregarAlPedido = (id) => {
    setPedido((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const enviarPedido = () => {
    if (Object.keys(pedido).length === 0) {
      setMensaje('No seleccionaste ningún producto.');
      return;
    }
    setMensaje('¡Pedido enviado con éxito! Pronto te lo confirmamos.');
    setPedido({});
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Granja 5 Gurises - Pedidos</h1>
      <ul className="space-y-2">
        {productos.map((prod) => (
          <li key={prod.id} className="border p-2 rounded">
            <div className="flex justify-between items-center">
              <span>{prod.nombre} - ${prod.precio}</span>
              <button
                onClick={() => agregarAlPedido(prod.id)}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                Agregar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        onClick={enviarPedido}
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded"
      >
        Enviar pedido
      </button>
      {mensaje && <p className="mt-4 text-center text-green-700">{mensaje}</p>}
    </div>
  );
}
