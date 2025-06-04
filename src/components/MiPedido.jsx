
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

export default function MiPedido() {
  const { user } = useAuth();
  const [pedido, setPedido] = useState(null);
  const [puedeEditar, setPuedeEditar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchPedido = async () => {
      const pedidosRef = collection(db, "pedidos");
      const q = query(pedidosRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const pedidoData = querySnapshot.docs[0];
        setPedido({ id: pedidoData.id, ...pedidoData.data() });

        const ahora = new Date();
        const limite = new Date();
        limite.setDate(limite.getDate() + (3 - ahora.getDay() + 7) % 7); // próximo miércoles
        limite.setHours(12, 0, 0, 0);
        setPuedeEditar(ahora < limite);
      }
    };

    fetchPedido();
  }, [user]);

  const handleCancelar = async () => {
    if (pedido) {
      await deleteDoc(doc(db, "pedidos", pedido.id));
      alert("Pedido cancelado.");
      navigate("/");
    }
  };

  if (!pedido) return <p>No hay pedido confirmado.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Mi Pedido</h2>
      <ul className="mb-2">
        {pedido.productos.map((item, index) => (
          <li key={index}>
            {item.nombre} x {item.cantidad}
          </li>
        ))}
      </ul>
      <p><strong>Entrega:</strong> {pedido.entrega === "envio" ? pedido.direccion : "Retira en punto de entrega"}</p>
      <p><strong>Total:</strong> ${pedido.total}</p>
      {puedeEditar ? (
        <div className="mt-4">
          <button onClick={() => navigate("/editarpedido")} className="mr-2 bg-yellow-500 text-white px-4 py-2 rounded">Editar</button>
          <button onClick={handleCancelar} className="bg-red-500 text-white px-4 py-2 rounded">Cancelar</button>
        </div>
      ) : (
        <p className="mt-2 text-gray-600">Ya no es posible modificar el pedido.</p>
      )}
    </div>
  );
}
