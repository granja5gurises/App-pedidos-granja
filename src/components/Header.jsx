import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { getAuth, signOut } from "firebase/auth";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";

// (En caso de menú visible, los textos irían acá)
const texts = {
  panel: "Panel Productor",
  productos: "Productos",
  combos: "Combos",
  secciones: "Secciones",
  preparar: "Preparar pedidos",
  restricciones: "Restricciones",
  config: "Configurar App",
  cerrar: "Cerrar sesión",
  inicio: "Inicio",
  pedido: "Hacer Pedido",
  misPedidos: "Mis Pedidos"
};

function pluralizar(nombre) {
  if (nombre.endsWith("z")) {
    return nombre.slice(0, -1) + "ces";
  }
  if (nombre.endsWith("ón")) {
    return nombre.slice(0, -2) + "ones";
  }
  if (nombre.endsWith("s")) {
    return nombre;
  }
  return nombre + "s";
}

function Header() {
  const [admin, setAdmin] = useState(false);
  const [camposLista, setCamposLista] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setAdmin(false);
          return;
        }
        const email = user.email;
        const snap = await getDocs(collection(db, "usuarios"));
        let esAdmin = false;
        snap.forEach(doc => {
          const data = doc.data();
          if (data.email === email && data.admin) {
            esAdmin = true;
          }
        });
        setAdmin(esAdmin);
      } catch (error) {
        setAdmin(false);
      }
    };
    fetchAdmin();
  }, []);

  useEffect(() => {
    const fetchCamposLista = async () => {
      const ref = doc(db, "configuracion", "general");
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setCamposLista([]);
        return;
      }
      const data = snap.data();
      const arr = (data.camposRegistro || []).filter(
        campo => campo.tipo === "lista" && campo.visible !== false
      );
      setCamposLista(arr);
    };
    fetchCamposLista();
  }, []);

  const handleLogout = () => {
    signOut(getAuth());
    navigate("/login");
  };

  return null; // La barra de navegación está oculta por ahora
}

export default Header;
