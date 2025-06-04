import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import FloatingWhatsApp from "../FloatingWhatsApp";

const MiPedido = () => {
  const auth = getAuth();
  const db = getFirestore();
  const [pedido, setPedido] = useState(null);
  const [ciudadConfig, setCiudadConfig] = useState({});
  const [mensajeVisible, setMensajeVisible] = useState(false);

  useEffect(() => {
    const fetchPedido = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const pedidosSnapshot = await getDocs(collection(db, "pedidos"));
      const pedidos = pedidosSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.userId === user.uid);

      if (pedidos.length > 0) {
        const ultimoPedido = pedidos.sort((a, b) => b.fecha?.seconds - a.fecha?.seconds)[0];
        setPedido(ultimoPedido);
      }
    };

    const fetchCiudadConfig = async () => {
      const snapshot = await getDocs(collection(db, "ciudades"));
      const config = {};
      snapshot.forEach(doc => {
        config[doc.id.toLowerCase()] = doc.data();
      });
      setCiudadConfig(config);
    };

    fetchPedido();
    fetchCiudadConfig();
  }, [auth, db]);

  const handleConfirmar = () => {
    setMensajeVisible(false);
    alert("¡Pedido confirmado!");
    window.location.href = "/";
  };

  const handleCancelar = async () => {
    if (!pedido) return;
    await deleteDoc(doc(db, "pedidos", pedido.id));
    alert("Pedido cancelado.");
    setPedido(null);
    setMensajeVisible(false);
  };

  if (!pedido) return <div>No tenés pedidos cargados.</div>;

  const productosList = Object.entries(pedido.productos || {})
    .map(([nombre, cantidad]) => `${nombre} (${cantidad})`)
    .join(", ");

  const ciudad = pedido.ciudad?.toLowerCase();
  const config = ciudadConfig[ciudad];
  const envioTexto =
    pedido.entrega === "envio"
      ? `Con envío a domicilio: $${config?.costoEnvio || 0} (${pedido.direccion})`
      : "Retira en punto de entrega";

  return (
    <div>
      <h2>Mi Pedido</h2>
      <p><strong>Productos:</strong> {productosList}</p>
      <p><strong>{envioTexto}</strong></p>
      <p><strong>Total:</strong> $</p>

      {!mensajeVisible ? (
        <button onClick={() => setMensajeVisible(true)}>Confirmar pedido</button>
      ) : (
        <div>
          <p>¿Confirmás el pedido con estos productos y forma de entrega?</p>
          <button onClick={handleConfirmar}>Sí, confirmar</button>
          <button onClick={handleCancelar}>Cancelar pedido</button>
        </div>
      )}

      <FloatingWhatsApp />
    </div>
  );
};

export default MiPedido;