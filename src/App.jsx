import React, { useState } from 'react';

const productosIniciales = [
  { id: 1, nombre: 'Bolson', precio: 16000, stock: 10 },
  { id: 2, nombre: 'Tomate', precio: 1200, stock: 15 },
  { id: 3, nombre: 'Acelga', precio: 800, stock: 0 }, // producto sin stock
];

export default function App() {
  const [productos, setProductos] = useState(productosIniciales);
  const [pedido, setPedido] = useState({});
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');

  const agregarAlPedido = (id) => {
    const prod = productos.find((p) => p.id === id);
    if (!prod || prod.stock === 0) return;

    setPedido((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const quitarDelPedido = (id) => {
    setPedido((prev) => {
      const nuevo = { ...prev };
      if (nuevo[id] > 1) nuevo[id]--;
      else delete nuevo[id];
      return nuevo;
    });
  };

  const reiniciarPedido = () => {
    setPedido({});
    setNombre('');
    setMensaje('');
  };

  const enviarPedido = () => {
    if (!nombre.trim()) {
      setMensaje('Ingresá tu nombre para continuar.');
      return;
    }
    if (Object.keys(pedido).length === 0) {
      setMensaje('No seleccionaste ningún producto.');
      return;
    }
    setMensaje(`¡Gracias ${nombre}! Tu pedido fue enviado correctamente.`);
    setPedido({});
    setNombre('');
  };

  const totalPedido = Object.entries(pedido).reduce((total, [id, cantidad]) => {
    const prod = productos.find(p => p.id === parseInt(id));
    return total + (prod ? prod.precio * cantidad : 0);
  }, 0);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Granja 5 Gurises - Pedidos</h1>

      <input
        type="text"
        placeholder="Tu nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <ul className="space-y-2">
        {productos.filter(p => p.stock > 0).map((prod) => (
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

      {Object.keys(pedido).length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Resumen del pedido:</h2>
          <ul className="mb-4">
            {Object.entries(pedido).map(([id, cantidad]) => {
              const prod = productos.find(p => p.id === parseInt(id));
              return (
                <li key={id} className="flex justify-between">
                  <span>{prod?.nombre} x{cantidad}</span>
                  <div>
                    <button
                      onClick={() => quitarDelPedido(parseInt(id))}
                      className="text-sm bg-red-500 text-white px-2 rounded mr-2"
                    >
                      -
                    </button>
                    <button
                      onClick={() => agregarAlPedido(parseInt(id))}
                      className="text-sm bg-green-500 text-white px-2 rounded"
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="font-bold">Total: ${totalPedido}</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <button
          onClick={enviarPedido}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Enviar pedido
        </button>
        <button
          onClick={reiniciarPedido}
          className="w-full bg-gray-500 text-white py-2 rounded"
        >
          Reiniciar
        </button>
      </div>

      {mensaje && <p className="mt-4 text-center text-green-700">{mensaje}</p>}
    </div>
  );
}
