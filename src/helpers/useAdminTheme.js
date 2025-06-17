import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function useAdminTheme() {
  const [config, setConfig] = useState({
    fondo: "#f8faff",
    colorTitulo: "#31426a",
    colorNav: "#23705d",
    fuente: "Roboto"
  });

  useEffect(() => {
    const cacheKey = "config_visual_admin";
    const expiraEn = 60 * 60 * 1000; // 1h en ms
    const cache = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    if (cache?.data && cache?.fecha && Date.now() - cache.fecha < expiraEn) {
      setConfig(cache.data);
    } else {
      (async () => {
        const ref = doc(db, "configuracion", "estilo_admin");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setConfig(data);
          localStorage.setItem(cacheKey, JSON.stringify({ data, fecha: Date.now() }));
        }
      })();
    }
  }, []);

  return config;
}
