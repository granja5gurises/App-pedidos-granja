import { db } from '../firebase';
import { collection, getDocs, setDoc, getDoc, deleteDoc, doc } from 'firebase/firestore';

// Traer datos generales de configuración
export const obtenerConfigGeneral = async () => {
  const ref = doc(db, 'configuracion', 'general');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

// Obtener lista de restricciones por colección
export const obtenerRestricciones = async (colName) => {
  const colRef = collection(db, colName);
  const snap = await getDocs(colRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Obtener documento puntual
export const obtenerRestriccion = async (concepto, id) => {
  const ref = doc(db, 'restricciones', `${concepto}_${id}`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

// Guardar restricción
export const guardarRestriccion = async (concepto, id, data) => {
  const ref = doc(db, 'restricciones', `${concepto}_${id}`);
  await setDoc(ref, data);
};

// Borrar restricción
export const eliminarRestriccion = async (concepto, id) => {
  const ref = doc(db, 'restricciones', `${concepto}_${id}`);
  await deleteDoc(ref);
};
