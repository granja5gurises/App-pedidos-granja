import { useTranslation } from "react-i18next";

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const cambiarIdioma = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const idiomaActual = i18n.language;

  const Bandera = ({ code, lang }) => (
    <img
      src={`https://flagcdn.com/h20/${code}.png`}
      alt={lang}
      title={lang.toUpperCase()}
      style={{
        height: 20,
        cursor: "pointer",
        opacity: idiomaActual === lang ? 1 : 0.4,
        transition: "opacity 0.3s",
        borderRadius: 4
      }}
      onClick={() => cambiarIdioma(lang)}
    />
  );

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 12 }}>
      <Bandera code="ar" lang="es" />
      <Bandera code="us" lang="en" />
      <Bandera code="br" lang="pt" />
    </div>
  );
}
