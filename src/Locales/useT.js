// src/locales/useT.js

// Hook de traducción dummy: devuelve la clave tal cual.
// Al final lo cambiamos por uno que lea los archivos de idioma.
export default function useT() {
  return (clave, vars) => typeof clave === "string" ? clave : "";
}
