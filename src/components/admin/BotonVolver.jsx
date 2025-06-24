import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAdminTheme from "../../helpers/useAdminTheme";

export default function BotonVolver({
  to = "/dashboard-admin",
  texto // si no se pasa, toma del idioma
}) {
  const navigate = useNavigate();
  const { t } = useTranslation(); // Traducción correcta
  const config = useAdminTheme();

  // Responsive para mobile (posición fija abajo a la derecha si pantalla chica)
  const isMobile = window.innerWidth < 600;

  return (
    <button
      style={{
        position: isMobile ? "fixed" : "absolute",
        right: isMobile ? 12 : 32,
        top: isMobile ? "unset" : 32,
        bottom: isMobile ? 18 : "unset",
        zIndex: 99,
        background: config.colorTitulo || "#31426a",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        fontSize: 15,
        padding: "8px 18px",
        boxShadow: "0 2px 8px #0002",
        cursor: "pointer",
        fontWeight: 600,
      }}
      onClick={() => navigate(to)}
    >
      {texto || t("volverPanel")}
    </button>
  );
}
