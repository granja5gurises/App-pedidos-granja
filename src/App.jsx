import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { useTranslation } from "react-i18next";

import InicioCliente from "./components/cliente/InicioCliente";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import RegisterAdmin from "./components/auth/RegisterAdmin";
import PanelProductor from "./components/admin/PanelProductor";
import PedidoForm from "./components/cliente/PedidoForm";
import ConfirmacionPedido from "./components/cliente/ConfirmacionPedido";
import PanelProductos from "./components/admin/PanelProductos";
import CiudadConfig from "./components/admin/CiudadConfig";
import PrepararPedidos from "./components/admin/PrepararPedidos";
import PanelSecciones from "./components/admin/PanelSecciones";
import PanelRestricciones from "./components/admin/PanelRestricciones";
import PanelCombos from "./components/admin/PanelCombos";
import PanelListaGenerico from "./components/admin/PanelListaGenerico";
import PanelUsuarios from "./components/admin/PanelUsuarios";
import PanelApariencia from "./components/admin/PanelApariencia";
import ConfigGeneral from "./components/admin/ConfigGeneral";
import PanelFacturacion from "./components/admin/PanelFacturacion";
import Header from "./components/Header";

import "react-toastify/dist/ReactToastify.css";
import "./styles.css";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userFirebase) => {
      if (userFirebase) {
        setUser(userFirebase);
        if (location.pathname === "/login" || location.pathname === "/register") {
          navigate("/");
        }
      } else {
        setUser(null);
        if (location.pathname !== "/login" && location.pathname !== "/register" && location.pathname !== "/register-admin") {
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [location, navigate]);

  return (
    <>
      <Header user={user} />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<InicioCliente user={user} t={t} />} />
        <Route path="/login" element={<Login t={t} />} />
        <Route path="/register" element={<Register t={t} />} />
        <Route path="/register-admin" element={<RegisterAdmin t={t} />} />
        <Route path="/panel-productor" element={<PanelProductor user={user} t={t} />} />
        <Route path="/pedido-form" element={<PedidoForm user={user} t={t} />} />
        <Route path="/confirmacion-pedido" element={<ConfirmacionPedido user={user} t={t} />} />
        <Route path="/panel-productos" element={<PanelProductos user={user} t={t} />} />
        <Route path="/ciudad-config" element={<CiudadConfig user={user} t={t} />} />
        <Route path="/preparar-pedidos" element={<PrepararPedidos user={user} t={t} />} />
        <Route path="/panel-secciones" element={<PanelSecciones user={user} t={t} />} />
        <Route path="/panel-restricciones" element={<PanelRestricciones user={user} t={t} />} />
        <Route path="/panel-combos" element={<PanelCombos user={user} t={t} />} />
        <Route path="/panel-lista-generico" element={<PanelListaGenerico user={user} t={t} />} />
        <Route path="/panel-usuarios" element={<PanelUsuarios user={user} t={t} />} />
        <Route path="/panel-apariencia" element={<PanelApariencia user={user} t={t} />} />
        <Route path="/config-general" element={<ConfigGeneral user={user} t={t} />} />
        <Route path="/panel-facturacion" element={<PanelFacturacion user={user} t={t} />} />
      </Routes>
    </>
  );
}

export default App;
