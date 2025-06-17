import { useTranslation } from "react-i18next";

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const cambiarIdioma = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select onChange={cambiarIdioma} value={i18n.language}>
      <option value="es">🇦🇷 Español</option>
      <option value="en">🇺🇸 English</option>
      <option value="pt">🇧🇷 Português</option>
    </select>
  );
}
