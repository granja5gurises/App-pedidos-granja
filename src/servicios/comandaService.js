
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // Asegurate que esta ruta esté bien según tu estructura

/**
 * Guarda la configuración de la comanda en Firestore
 * en el documento 'configuracion/comanda', accesible por todos los admins.
 */
export async function guardarConfigComanda(config) {
  try {
    await setDoc(doc(db, "configuracion", "comanda"), config, { merge: true });
    console.log("Configuración de comanda guardada en Firestore");
    return true;
  } catch (error) {
    console.error("Error al guardar configuración de comanda:", error);
    throw error;
  }
}
