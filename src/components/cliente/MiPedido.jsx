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

// Textos centralizados para internacionalización
const texts = {
  titulo: "Mis Pedidos",
  pendiente: "Pedido Pendiente",
  noPendiente: "No tenés pedidos pendientes.",
  anteriores: "Pedidos Anteriores",
  fecha: "Fecha",
  productos: "Productos",
  entrega: "Entrega",
  envio: "Con envío a domicilio",
  retiro: "Retira en punto de entrega",
  total: "Total",
  estado: "Estado",
  pendienteEstado: "Pendiente",
  entregadoEstado: "Entregado",
  modificar: "Modificar pedido",
  cancelar: "Cancelar pedido",
  cancelarConfirm: "Pedido cancelado.",
  volverInicio: "Volver al inicio",
  cerrarSesion: "Cerrar sesión",
  sinFecha: "Sin fecha",
  consultar: "Consultar",
  comprobante: "Número de pedido"
};

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
    alert(texts.cancelarConfirm);
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
        ? `${texts.envio}: $${config?.costoEnvio || 0} (${pedidoData.direccion})`
        : texts.retiro;

    return (
      <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
        {/* Mostrar comprobante si existe */}
        {pedidoData.comprobante && (
          <p>
            <strong>{texts.comprobante}:</strong> {pedidoData.comprobante}
          </p>
        )}
        <p><strong>{texts.fecha}:</strong> {pedidoData.fecha?.seconds ? new Date(pedidoData.fecha.seconds * 1000).toLocaleDateString() : texts.sinFecha}</p>
        <p><strong>{texts.productos}:</strong> {productosList}</p>
        <p><strong>{texts.entrega}:</strong> {envioTexto}</p>
        <p><strong>{texts.total}:</strong> ${pedidoData.total || texts.consultar}</p>
        <p><strong>{texts.estado}:</strong> {pedidoData.estado || (esPendiente ? texts.pendienteEstado : texts.entregadoEstado)}</p>

        {esPendiente && (
          <>
            <button onClick={handleModificar}>{texts.modificar}</button>
            <button onClick={handleCancelar} style={{ marginLeft: 8, color: "red" }}>
              {texts.cancelar}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2>{texts.titulo}</h2>

      {pedido ? (
        <>
          <h3>{texts.pendiente}</h3>
          {renderPedido(pedido, true)}
        </>
      ) : (
        <p>{texts.noPendiente}</p>
      )}

      {historial.length > 0 && (
        <>
          <h3>{texts.anteriores}</h3>
          {historial.map((p) => renderPedido(p, false))}
        </>
      )}

      <div style={{ marginTop: 32 }}>
        <button onClick={volverInicio}>{texts.volverInicio}</button>
        <button onClick={handleLogout} style={{ marginLeft: 8 }}>{texts.cerrarSesion}</button>
      </div>

      <FloatingWhatsApp />
    </div>
  );
};

export default MiPedido;
