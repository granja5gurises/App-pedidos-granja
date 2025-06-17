import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import LanguageSelector from "../LanguageSelector";
import { useTranslation } from "react-i18next";
import useAdminTheme from "../../helpers/useAdminTheme"; // Toma el tema visual del admin

const iconos = {
  "dashboard.inicio": "🏠",
  "dashboard.ventas": "📊",
  "dashboard.catalogo": "🛍️",
  "dashboard.clientes": "👥",
  "dashboard.listas": "📋",
  "dashboard.horarios": "🕒",
  "dashboard.apariencia": "🎨",
  "dashboard.configuracion": "⚙️",
  "dashboard.ayuda": "❓"
};

export default function DashboardAdmin() {
  const [admin, setAdmin] = useState({});
  const [grupoActivo, setGrupoActivo] = useState("inicio");
  const [listasDinamicas, setListasDinamicas] = useState([]);
  const { t, i18n } = useTranslation();
  const configAdmin = useAdminTheme();

  // --- CONTROL DE ROLES (cambiar por hook/prop real en futuro) ---
  // Ejemplo: "admin", "encargado", "operador"
  const rolUsuario = admin.rol || "admin"; // Simulado

  // Define el menú con los roles permitidos en cada grupo
  const gruposMenu = (t, listasDinamicas) => [
    {
      nombre: t("dashboard.inicio"),
      key: "inicio",
      roles: ["admin", "encargado", "operador"],
      secciones: ["stats", "manual"]
    },
    {
      nombre: t("dashboard.ventas"),
      key: "ventas",
      roles: ["admin", "encargado"],
      secciones: [
        { label: t("dashboard.pedidos"), to: "/panel" },
        { label: t("dashboard.prepararPedidos"), to: "/preparar" },
        { label: t("dashboard.facturacion"), to: "/facturacion" }
      ]
    },
    {
      nombre: t("dashboard.catalogo"),
      key: "catalogo",
      roles: ["admin", "encargado"],
      secciones: [
        { label: t("dashboard.productos"), to: "/productos" },
        { label: t("dashboard.combos"), to: "/combos" },
        { label: t("dashboard.categorias"), to: "/secciones" }
      ]
    },
    {
      nombre: t("dashboard.clientes"),
      key: "clientes",
      roles: ["admin"],
      secciones: [
        { label: t("dashboard.usuarios"), to: "/usuarios" },
        { label: t("dashboard.camposRegistro"), to: "/config" }
      ]
    },
    {
      nombre: t("dashboard.listas"),
      key: "listas",
      roles: ["admin"],
      secciones: listasDinamicas
    },
    {
      nombre: t("dashboard.horarios"),
      key: "horarios",
      roles: ["admin", "encargado"],
      secciones: [
        { label: t("dashboard.restricciones"), to: "/restricciones" }
      ]
    },
    {
      nombre: t("dashboard.apariencia"),
      key: "apariencia",
      roles: ["admin"],
      secciones: [
        { label: t("dashboard.aparienciaTienda"), to: "/apariencia" },
        { label: t("dashboard.aparienciaAdmin"), to: "/config/apariencia-admin" }
      ]
    },
    {
      nombre: t("dashboard.configuracion"),
      key: "configuracion",
      roles: ["admin"],
      secciones: [
        { label: t("dashboard.admins"), to: "/admins" }
      ]
    },
    {
      nombre: t("dashboard.ayuda"),
      key: "ayuda",
      roles: ["admin", "encargado", "operador"],
      secciones: [
        { label: t("dashboard.manual"), to: "/manual" }
      ]
    }
  ];

  const descripcionesSecciones = (t) => ({
    [t("dashboard.pedidos")]: t("dashboard.desc.pedidos"),
    [t("dashboard.prepararPedidos")]: t("dashboard.desc.prepararPedidos"),
    [t("dashboard.facturacion")]: t("dashboard.desc.facturacion"),
    [t("dashboard.productos")]: t("dashboard.desc.productos"),
    [t("dashboard.combos")]: t("dashboard.desc.combos"),
    [t("dashboard.categorias")]: t("dashboard.desc.categorias"),
    [t("dashboard.usuarios")]: t("dashboard.desc.usuarios"),
    [t("dashboard.camposRegistro")]: t("dashboard.desc.camposRegistro"),
    [t("dashboard.restricciones")]: t("dashboard.desc.restricciones"),
    [t("dashboard.aparienciaTienda")]: t("dashboard.desc.aparienciaTienda"),
    [t("dashboard.aparienciaAdmin")]: t("dashboard.desc.aparienciaAdmin"),
    [t("dashboard.admins")]: t("dashboard.desc.admins"),
    [t("dashboard.manual")]: t("dashboard.desc.manual")
  });

  // Obtiene las listas dinámicas (creadas por el admin)
  useEffect(() => {
    getDoc(doc(db, "configuracion", "general")).then(snap => {
      if (snap.exists()) {
        const campos = snap.data().camposRegistro || [];
        const lista = Array.isArray(campos)
          ? campos.filter(c => c.tipo === "lista")
          : Object.entries(campos)
              .filter(([_, c]) => c.tipo === "lista")
              .map(([k]) => ({ nombre: k }));
        setListasDinamicas(
          lista.map(c => ({
            label: c.nombre, // SIEMPRE nombre del admin, SIN traducción
            to: `/listas/${c.nombre}`
          }))
        );
      }
    });
    // Admin info
    const uid = localStorage.getItem("uid");
    if (uid) {
      getDoc(doc(db, "usuarios", uid)).then(snap => {
        setAdmin(snap.data() || {});
      });
    }
  }, [i18n.language, t]);

  // Filtra el menú según rol
  const menu = gruposMenu(t, listasDinamicas).filter(g =>
    g.roles.includes(rolUsuario)
  );

  const descripciones = descripcionesSecciones(t);

  const descripcionListasDinamicas = (
    <div style={{
      marginBottom: 24,
      background: "#e6eefc",
      borderLeft: "5px solid #2778c4",
      padding: "16px 20px",
      borderRadius: "10px",
      color: "#222",
      fontSize: "1rem",
      maxWidth: 680
    }}>
      <strong>{t("dashboard.listasExplicacion")}</strong>
    </div>
  );

  const renderGrupo = (grupo) => {
    if (!grupo || !grupo.secciones) return null;

    if (grupo.key === "inicio") {
      return (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 0 8px rgba(0,0,0,0.1)',
            flex: '1 1 200px'
          }}>
            <div style={{ fontSize: '1.1rem', color: '#555' }}>{t("dashboard.ventasSemana")}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: configAdmin.colorTitulo || '#1c2d4a' }}>$123.400</div>
          </div>
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 0 8px rgba(0,0,0,0.1)',
            flex: '1 1 200px'
          }}>
            <div style={{ fontSize: '1.1rem', color: '#555' }}>{t("dashboard.pedidosPendientes")}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#d97706' }}>7</div>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        marginTop: '20px',
        maxWidth: 900
      }}>
        {grupo.key === "listas" && descripcionListasDinamicas}
        {grupo.secciones.map(sec => (
          <div key={typeof sec === "string" ? sec : sec.label} style={{ display: 'flex', alignItems: 'center' }}>
            {typeof sec === "string" ? null : (
              <Link
                to={sec.to}
                style={{
                  textDecoration: 'none',
                  backgroundColor: '#ffffff',
                  border: `1px solid ${configAdmin.colorNav || '#ddd'}`,
                  borderRadius: '10px',
                  padding: '20px 36px',
                  minWidth: '200px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  color: configAdmin.colorNav || '#333',
                  boxShadow: '2px 2px 10px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease'
                }}
              >
                {sec.label}
              </Link>
            )}
            <div style={{ marginLeft: 32, color: "#444", fontSize: "1rem", flex: 1 }}>
              {grupo.key === "listas"
                ? ""
                : descripciones[sec.label] || ""}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Responsive layout: columna en mobile, sidebar arriba
  const isMobile = window.innerWidth < 700;

  return (
    <div style={{
      display: isMobile ? 'block' : 'flex',
      minHeight: '100vh',
      fontFamily: configAdmin.fuente || 'Arial, sans-serif',
      backgroundColor: configAdmin.fondo || '#f9f9f9',
      position: 'relative'
    }}>
      <aside style={{
        width: isMobile ? '100%' : '240px',
        backgroundColor: configAdmin.colorTitulo || '#1c2d4a',
        color: 'white',
        padding: isMobile ? '10px 10px 0 10px' : '20px',
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        justifyContent: 'space-between',
        borderRadius: isMobile ? '0 0 22px 22px' : '0',
        gap: isMobile ? '6px' : '0'
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{
            fontSize: '1.6rem',
            marginBottom: '20px',
            marginTop: isMobile ? '10px' : '0'
          }}>{t("dashboard.panelAdmin")}</h2>
          {menu.filter(m => m.key !== "ayuda").map(grupo => (
            <button
              key={grupo.key}
              onClick={() => setGrupoActivo(grupo.key)}
              style={{
                backgroundColor: grupoActivo === grupo.key ? '#ffffff' : (configAdmin.colorTitulo || '#1c2d4a'),
                color: grupoActivo === grupo.key ? (configAdmin.colorTitulo || '#1c2d4a') : 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                fontWeight: 'bold', fontSize: '1rem', textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: isMobile ? 'auto' : '100%',
                marginBottom: isMobile ? '0' : '6px'
              }}
            >
              <span>{iconos["dashboard." + grupo.key]}</span> {grupo.nombre}
            </button>
          ))}
        </div>
        <div>
          {menu.filter(m => m.key === "ayuda").map(grupo => (
            <button
              key={grupo.key}
              onClick={() => setGrupoActivo(grupo.key)}
              style={{
                backgroundColor: grupoActivo === grupo.key ? '#ffffff' : (configAdmin.colorTitulo || '#294166'),
                color: grupoActivo === grupo.key ? (configAdmin.colorTitulo || '#294166') : 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                fontWeight: 'bold', fontSize: '1rem', textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: isMobile ? 'auto' : '100%',
                marginBottom: isMobile ? '0' : '6px'
              }}
            >
              <span>{iconos["dashboard." + grupo.key]}</span> {grupo.nombre}
            </button>
          ))}
        </div>
      </aside>

      {/* Selector de idioma arriba a la derecha */}
      <div style={{ position: "absolute", top: 22, right: 32, zIndex: 999 }}>
        <LanguageSelector />
      </div>

      <main style={{
        flex: 1,
        padding: isMobile ? '18px 8px' : '40px',
        backgroundColor: '#ffffff'
      }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>
          {grupoActivo === "inicio"
            ? `${t("dashboard.hola")}, ${admin.nombre ? admin.nombre.charAt(0).toUpperCase() + admin.nombre.slice(1) : (admin.email || "admin")}!`
            : menu.find(g => g.key === grupoActivo)?.nombre}
        </h2>
        {renderGrupo(menu.find(g => g.key === grupoActivo))}
      </main>
    </div>
  );
}
