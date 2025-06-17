import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import PanelCombos from './components/admin/PanelCombos';
import PanelRestricciones from './components/admin/PanelRestricciones';
import PanelParametrosGenerales from './components/admin/PanelParametrosGenerales'; // <- corregido
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import RegisterAdmin from './components/auth/RegisterAdmin';
import PedidoForm from './components/cliente/PedidoForm';
import PanelProductor from './components/admin/PanelProductor';
import PrepararPedidos from './components/admin/PrepararPedidos';
import MiPedido from './components/cliente/MiPedido';
import InicioCliente from './components/cliente/InicioCliente';
import Header from './components/Header';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import PanelProductos from './components/admin/PanelProductos';
import PanelSecciones from './components/admin/PanelSecciones';
import PanelUsuarios from './components/admin/PanelUsuarios';
import DashboardAdmin from './components/admin/DashboardAdmin';
import ConfirmacionPedido from './components/cliente/ConfirmacionPedido';
import PanelApariencia from './components/admin/PanelApariencia';
import PanelAdmins from './components/admin/PanelAdmins';
import PanelAparienciaAdmin from './components/admin/PanelAparienciaAdmin';
import PanelFacturacion from './components/admin/PanelFacturacion';
import PanelListaGenerico from './components/admin/PanelListaGenerico';

import useT from './locales/useT';

// Centralizamos aquí las rutas consideradas “admin” para simplificar cambios a futuro
const adminPrefixes = [
  "/dashboard-admin",
  "/panel",
  "/combos",
  "/config",
  "/productos",
  "/secciones",
  "/preparar",
  "/facturacion",
  "/restricciones",
  "/apariencia",
  "/admins",
  "/config/apariencia-admin",
  "/listas"
];

function esRutaAdmin(pathname) {
  return adminPrefixes.some(pref => pathname.startsWith(pref));
}

function App() {
  const location = useLocation();
  const t = useT();

  useEffect(() => {
    const cargarTitulo = async () => {
      const db = getFirestore();
      const ref = doc(db, "configuracion", "estilo");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        document.title = data.nombreNegocio || t("tituloDefault");
      } else {
        document.title = t("tituloDefault");
      }
    };
    cargarTitulo();
    // eslint-disable-next-line
  }, []);

  const enAdmin = esRutaAdmin(location.pathname);

  return (
    <>
      <Header />
      {!enAdmin && <FloatingWhatsApp />}
      <Routes>
        {/* --- RUTAS PÚBLICAS Y CLIENTE --- */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />
        <Route path="/pedido" element={<PedidoForm />} />
        <Route path="/confirmacion-pedido" element={<ConfirmacionPedido />} />
        <Route path="/mipedido" element={<MiPedido />} />
        <Route path="/inicio" element={<InicioCliente />} />

        {/* --- DASHBOARD ADMIN Y PANEL ADMIN --- */}
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
        <Route path="/panel" element={<PanelProductor />} />

        {/* --- PANEL ADMINISTRATIVO --- */}
        <Route path="/productos" element={<PanelProductos />} />
        <Route path="/combos" element={<PanelCombos />} />
        <Route path="/secciones" element={<PanelSecciones />} />
        <Route path="/config" element={<PanelParametrosGenerales />} /> {/* <- corregido */}
        <Route path="/preparar" element={<PrepararPedidos />} />
        <Route path="/facturacion" element={<PanelFacturacion />} />
        <Route path="/restricciones" element={<PanelRestricciones />} />
        <Route path="/apariencia" element={<PanelApariencia />} />
        <Route path="/admins" element={<PanelAdmins />} />
        <Route path="/config/apariencia-admin" element={<PanelAparienciaAdmin />} />

        {/* --- PANEL DINÁMICO DE LISTAS --- */}
        <Route path="/listas/:nombreLista" element={<PanelListaGenerico />} />

        {/* --- RUTA DINÁMICA (DEJAR SIEMPRE AL FINAL) --- */}
        <Route path="/usuarios" element={<PanelUsuarios />} />
      </Routes>
    </>
  );
}

export default App;
