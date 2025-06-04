
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

const ResumenCosecha = () => {
  const [resumenCosecha, setResumenCosecha] = useState({});

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const pedidosSnapshot = await getDocs(collection(db, "pedidos"));
        const pedidosData = pedidosSnapshot.docs.map(doc => doc.data());

        const resumen = {};

        pedidosData.forEach(pedido => {
          const productos = pedido.productos;

          if (productos && typeof productos === 'object') {
            Object.entries(productos).forEach(([nombre, cantidad]) => {
              if (!resumen[nombre]) resumen[nombre] = 0;
              resumen[nombre] += cantidad;
            });
          }
        });

        setResumenCosecha(resumen);
      } catch (error) {
        console.error("Error al obtener pedidos:", error);
      }
    };

    fetchPedidos();
  }, []);

  return (
    <div>
      <h2>Resumen para cosecha</h2>
      <ul>
        {Object.entries(resumenCosecha).map(([producto, cantidad]) => (
          <li key={producto}>{producto}: {cantidad}</li>
        ))}
      </ul>
    </div>
  );
};

export default ResumenCosecha;
