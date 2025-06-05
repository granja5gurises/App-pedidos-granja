
import React, { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocs,
  collection,
  deleteDoc,
} from "firebase/firestore";
import FloatingWhatsApp from "../FloatingWhatsApp";
import { useNavigate } from "react-router-dom";

const MiPedido = () => {
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [ciudadConfig, setCiudadConfig] = useState({});
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);

  useEffect(() => {
    const fetchPedidos = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const pedidosSnapshot = await getDocs(collection(db, "pedidos"));
      const pedidos = pedidosSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.userId === user.uid)
        .sort((a, b) => b.fecha?.seconds - a.fecha?.seconds);

      setPedido(pedidos[0] || null);
      setHistorial(pedidos.slice(1));
    };

    const fetchCiudadConfig = async () => {
      const snapshot = await getDocs(collection(db, "ciudades"));
      const config = {};
      snapshot.forEach((doc) => {
        config[doc.id.toLowerCase()] = doc.data();
      });
      setCiudadConfig(config);
    };

    fetchPedidos();
    fetchCiudadConfig();
  }, [auth, db]);

  const handleCancelar = async () => {
    if (!pedido) return;
    await deleteDoc(doc(db, "pedidos", pedido.id));
    alert("Pedido cancelado.");
    setPedido(null);
    setConfirmacionVisible(false);
  };

  const handleModificar = () => {
    localStorage.setItem("pedidoModificacion", JSON.stringify(pedido));
    navigate("/pedido");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/inicio");
  };

  const volverInicio = () => {
    navigate("/inicio");
  };

  const renderPedido = (pedidoData, esPendiente = false) => {
    const productosList = (pedidoData.productos || [])
      .map((p) => `${p.nombre} (${p.cantidad})`)
      .join(", ");

    const ciudad = pedidoData.ciudad?.toLowerCase();
    const config = ciudadConfig[ciudad];
    const envioTexto =
      pedidoData.entrega === "envio"
        ? `Con envío a domicilio: $${config?.costoEnvio || 0} (${pedidoData.direccion})`
        : "Retira en punto de entrega";

    return (
      <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
        <p><strong>Fecha:</strong> {pedidoData.fecha?.seconds ? new Date(pedidoData.fecha.seconds * 1000).toLocaleDateString() : 'Sin fecha'}</p>
        <p><strong>Productos:</strong> {productosList}</p>
        <p><strong>Entrega:</strong> {envioTexto}</p>
        <p><strong>Total:</strong> ${pedidoData.total || "Consultar"}</p>
        <p><strong>Estado:</strong> {pedidoData.estado || (esPendiente ? "Pendiente" : "Entregado")}</p>

        {esPendiente && (
          <>
            <button onClick={handleModificar}>Modificar pedido</button>
            <button onClick={handleCancelar} style={{ marginLeft: 8, color: "red" }}>
              Cancelar pedido
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2>Mis Pedidos</h2>

      {pedido ? (
        <>
          <h3>Pedido Pendiente</h3>
          {renderPedido(pedido, true)}
        </>
      ) : (
        <p>No tenés pedidos pendientes.</p>
      )}

      {historial.length > 0 && (
        <>
          <h3>Pedidos Anteriores</h3>
          {historial.map((p) => renderPedido(p, false))}
        </>
      )}

      <div style={{ marginTop: 32 }}>
        <button onClick={volverInicio}>Volver al inicio</button>
        <button onClick={handleLogout} style={{ marginLeft: 8 }}>Cerrar sesión</button>
      </div>

      <FloatingWhatsApp />
    </div>
  );
};

export default MiPedido;
