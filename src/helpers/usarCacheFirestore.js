// src/helpers/usarCacheFirestore.js

// Hook dummy que solo ejecuta el fetch y NO cachea (para no romper nada)
// Después se reemplaza por la versión optimizada.
import { useState, useEffect } from "react";

export default function usarCacheFirestore(clave, fetchFn, expiracionSegundos = 60) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let activo = true;
    fetchFn().then((res) => {
      if (activo) setData(res);
    });
    return () => { activo = false; };
  }, [clave]);
  return data || {};
}
