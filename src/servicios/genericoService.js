
import { db } from "../firebase";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

export const obtenerDocumentos = async (coleccion) => {
  const snapshot = await getDocs(collection(db, coleccion));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const agregarDocumento = async (coleccion, datos) => {
  const ref = collection(db, coleccion);
  const docRef = await addDoc(ref, datos);
  return docRef.id;
};

export const actualizarDocumento = async (coleccion, id, datos) => {
  const ref = doc(db, coleccion, id);
  await updateDoc(ref, datos);
};

export const borrarDocumento = async (coleccion, id) => {
  const ref = doc(db, coleccion, id);
  await deleteDoc(ref);
};
