import BotonVolver from "../BotonVolver";
import { Outlet, Link, useLocation } from "react-router-dom";
import useT from "../../locales/useT";
import useAdminTheme from "../../helpers/useAdminTheme"; // <-- Hook real

export default function AdminLayout() {
  const t = useT();
  const location = useLocation();
  const configAdmin = useAdminTheme();

  // Panel principal del admin
  const isDashboard = location.pathname === "/dashboard-admin";

  // Rutas de la app admin (pueden venir de un array si lo hacés más dinámico)
  const NAV_LINKS = [
    { path: "/dashboard-admin", label: t("inicio") },
    { path: "/dashboard-admin/usuarios", label: t("usuarios") },
    { path: "/dashboard-admin/productos", label: t("productos") },
    { path: "/dashboard-admin/apariencia-admin", label: t("aparienciaAdmin") },
    // sumá más rutas si querés
  ];

  // Títulos por sección
  const TITULOS = {
    "/dashboard-admin": t("panelAdmin"),
    "/dashboard-admin/usuarios": t("usuarios"),
    "/dashboard-admin/productos": t("productos"),
    "/dashboard-admin/apariencia-admin": t("aparienciaAdmin"),
    // agregá aquí si tenés más rutas
  };
  // Título según ruta, default al panel admin
  const titulo = TITULOS[location.pathname] || t("panelAdmin");

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        maxWidth: 1150,
        margin: "0 auto",
        padding: "38px 42px 48px 42px",
        background: configAdmin.fondo,
        borderRadius: 22,
        boxShadow: "0 2px 24px #0001",
        fontFamily: configAdmin.fuente || "Roboto"
      }}
    >
      {/* Botón volver solo si NO estamos en el dashboard principal */}
      {!isDashboard && <BotonVolver />}

      <h1 style={{
        fontSize: 32,
        fontWeight: 800,
        marginBottom: 16,
        color: configAdmin.colorTitulo,
        letterSpacing: 0.5,
        textShadow: "0 1px 0 #fff"
      }}>
        {titulo}
      </h1>

      <nav style={{
        marginBottom: 20,
        background: "#fff",
        padding: "10px 12px",
        borderRadius: 10,
        boxShadow: "0 1px 5px #c2dde7",
        display: "flex",
        flexWrap: "wrap",
        gap: 10
      }}>
        {NAV_LINKS.map(link => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              marginRight: 10,
              color: configAdmin.colorNav,
              fontWeight: 600,
              fontSize: 17,
              textDecoration: "none",
              padding: "7px 14px",
              borderRadius: 7,
              background:
                location.pathname === link.path
                  ? "#e5f6ef"
                  : "transparent",
              transition: "background 0.2s"
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
