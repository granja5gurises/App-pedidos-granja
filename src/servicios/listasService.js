import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, deleteField } from "firebase/firestore";
import { db } from "../firebase";

export const cargarItems = async (coleccion) => {
  const snap = await getDocs(collection(db, coleccion));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const agregarItem = async (coleccion, nuevo) => {
  await addDoc(collection(db, coleccion), nuevo);
};

export const actualizarItem = async (coleccion, id, datos) => {
  await updateDoc(doc(db, coleccion, id), datos);
};

export const eliminarItem = async (coleccion, id) => {
  await deleteDoc(doc(db, coleccion, id));
};

export const eliminarCampo = async (coleccion, campo, items) => {
  for (const item of items) {
    try {
      const ref = doc(db, coleccion, item.id);
      await updateDoc(ref, {
        [campo]: deleteField()
      });
      console.log(`✅ Campo eliminado: "${campo}" en ${item.id}`);
    } catch (err) {
      console.error(`❌ Error eliminando campo "${campo}" en ${item.id}`, err);
    }
  }
};

export const renombrarCampo = async (coleccion, viejo, nuevo, items) => {
  for (const item of items) {
    if (item[viejo] !== undefined) {
      const ref = doc(db, coleccion, item.id);
      const update = {
        [nuevo]: item[viejo],
        [viejo]: deleteField()
      };
      await updateDoc(ref, update);
    }
  }
};
