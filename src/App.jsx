
import CompletarRegistro from "./components/auth/CompletarRegistro";
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

import PrivateRouteAdmin from "./components/routing/PrivateRouteAdmin";
import InicioCliente from "./components/cliente/InicioCliente";
import PanelParametrosGenerales from "./components/admin/PanelParametrosGenerales";
import PanelAdmins from "./components/admin/PanelAdmins";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import RegisterAdmin from "./components/auth/RegisterAdmin";
import PanelProductor from "./components/admin/PanelProductor";
import PedidoForm from "./components/cliente/PedidoForm";
import ConfirmacionPedido from "./components/cliente/ConfirmacionPedido";
import PanelProductos from "./components/admin/PanelProductos";
import PrepararPedidos from "./components/admin/PrepararPedidos";
import PanelSecciones from "./components/admin/PanelSecciones";
import PanelRestricciones from "./components/admin/PanelRestricciones";
import PanelCombos from "./components/admin/PanelCombos";
import PanelListaGenerico from "./components/admin/PanelListaGenerico";
import PanelUsuarios from "./components/admin/PanelUsuarios";
import PanelApariencia from "./components/admin/PanelApariencia";
import PanelFacturacion from "./components/admin/PanelFacturacion";
import ConfiguradorAparienciaComanda from "./components/admin/ConfiguradorAparienciaComanda";
import DashboardAdmin from "./components/admin/DashboardAdmin";

import "react-toastify/dist/ReactToastify.css";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userTypeLoading, setUserTypeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  const { t, i18n } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userFirebase) => {
      if (userFirebase) {
        setUser(userFirebase);
        const db = getFirestore();
        const ref = doc(db, "usuarios", userFirebase.uid);
        const snap = await getDoc(ref);
        const esAdmin = snap.exists() && snap.data().admin;
        setIsAdmin(esAdmin);

        const datosCompletos = snap.exists() && snap.data() && Object.keys(snap.data()).length > 2;

        // Evitar redirección antes de que la autenticación esté completamente lista
        if (location.pathname === "/login" || location.pathname === "/register") {
          if (!datosCompletos && !esAdmin) {
            navigate("/completar-registro");
          } else {
            navigate(esAdmin ? "/dashboard-admin" : "/");
          }
        }

      } else {
        setUser(null);
        setIsAdmin(false);
        if (
          location.pathname !== "/login" &&
          location.pathname !== "/register" &&
          location.pathname !== "/register-admin"
        ) {
          navigate("/login");
        }
      }

      setIsAuthReady(true);
      setUserTypeLoading(false);  // Aseguramos que solo se rendericen rutas cuando todo esté listo
    });

    return () => unsubscribe();
  }, [location, navigate]);

  if (!isAuthReady || !i18n.isInitialized || userTypeLoading) return null;  // Mantenemos esta validación

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/completar-registro" element={<CompletarRegistro />} />
        <Route path="/" element={<InicioCliente user={user} t={t} />} />
        <Route path="/login" element={<Login t={t} />} />
        <Route path="/register" element={<Register t={t} />} />
        <Route path="/register-admin" element={<RegisterAdmin t={t} />} />
        <Route path="/panel-productor" element={<PanelProductor user={user} t={t} />} />
        <Route path="/pedido-form" element={<PedidoForm user={user} t={t} />} />
        <Route path="/confirmacion-pedido" element={<ConfirmacionPedido user={user} t={t} />} />
        <Route path="/panel-productos" element={<PanelProductos user={user} t={t} />} />
        <Route path="/preparar-pedidos" element={<PrepararPedidos user={user} t={t} />} />
        <Route path="/panel-secciones" element={<PanelSecciones user={user} t={t} />} />
        <Route path="/panel-restricciones" element={<PanelRestricciones user={user} t={t} />} />
        <Route path="/panel-combos" element={<PanelCombos user={user} t={t} />} />
        <Route path="/panel-lista-generico" element={<PanelListaGenerico user={user} t={t} />} />
        <Route path="/panel-usuarios" element={<PanelUsuarios user={user} t={t} />} />
        <Route path="/panel-apariencia" element={<PanelParametrosGenerales user={user} t={t} />} />
        <Route path="/panel-facturacion" element={<PanelFacturacion user={user} t={t} />} />
        <Route path="/dashboard-admin" element={<PrivateRouteAdmin><DashboardAdmin /></PrivateRouteAdmin>} />

        {/* ======= RUTAS "CORTAS" QUE USA EL DASHBOARD ======= */}
        <Route path="/panel" element={<PanelProductor user={user} t={t} />} />
        <Route path="/preparar" element={<PrepararPedidos user={user} t={t} />} />
        <Route path="/facturacion" element={<PanelFacturacion user={user} t={t} />} />
        <Route path="/productos" element={<PanelProductos user={user} t={t} />} />
        <Route path="/combos" element={<PanelCombos user={user} t={t} />} />
        <Route path="/secciones" element={<PanelSecciones user={user} t={t} />} />
        <Route path="/usuarios" element={<PanelUsuarios user={user} t={t} />} />
        <Route path="/config" element={<PanelParametrosGenerales user={user} t={t} />} />
        <Route path="/restricciones" element={<PanelRestricciones user={user} t={t} />} />
        <Route path="/apariencia" element={<PanelApariencia user={user} t={t} />} />
        <Route path="/apariencia/comanda" element={<ConfiguradorAparienciaComanda user={user} t={t} />} />
        <Route path="/admins" element={<PanelAdmins user={user} t={t} />} />
        <Route path="/listas/:nombreLista" element={<PanelListaGenerico user={user} t={t} />} />
        {/* ================================================ */}
      </Routes>
    </>
  );
}

export default App;
