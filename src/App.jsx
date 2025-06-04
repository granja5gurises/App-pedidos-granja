import { Routes, Route } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PedidoForm from './components/cliente/PedidoForm';
import PanelProductor from './components/admin/PanelProductor';
import CiudadConfig from './components/admin/CiudadConfig';
import ResumenCosecha from './components/admin/ResumenCosecha';
import Splash from './pages/Splash';
import Header from './components/Header';
import FloatingWhatsApp from './components/FloatingWhatsApp';

function App() {
  return (
    <>
      <Header />
      <FloatingWhatsApp />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pedido" element={<PedidoForm />} />
        <Route path="/panel" element={<PanelProductor />} />
        <Route path="/ciudades" element={<CiudadConfig />} />
        <Route path="/resumen" element={<ResumenCosecha />} />
      </Routes>
    </>
  );
}

export default App;