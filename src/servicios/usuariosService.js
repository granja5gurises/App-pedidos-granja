import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";

// Trae todos los campos configurables del registro
export const obtenerCamposRegistro = async () => {
  const snap = await getDoc(doc(db, "configuracion", "general"));
  if (!snap.exists()) return [];
  const data = snap.data().camposRegistro;
  return Array.isArray(data)
    ? data
    : Object.entries(data || {}).map(([nombre, props]) => ({ nombre, ...props }));
};

// Trae campos obligatorios del sistema
export const obtenerCamposObligatorios = async () => {
  const snap = await getDoc(doc(db, "config", "camposObligatorios"));
  if (!snap.exists()) return ["nombre", "email"];
  return snap.data().lista || ["nombre", "email"];
};

// Trae todos los usuarios ordenados por email
export const obtenerUsuarios = async () => {
  const q = query(collection(db, "usuarios"), orderBy("email", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Alternativa simple sin orden (por si otro panel lo requiere)
export const obtenerTodosLosUsuarios = async () => {
  const ref = collection(db, "usuarios");
  const snap = await getDocs(ref);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Crear nuevo usuario
export const agregarUsuario = async (datos) => {
  return await addDoc(collection(db, "usuarios"), {
    ...datos,
    admin: false,
    bloqueado: false
  });
};

// Actualizar usuario existente
export const actualizarUsuario = async (id, nuevosDatos) => {
  return await updateDoc(doc(db, "usuarios", id), nuevosDatos);
};

// Eliminar usuario
export const eliminarUsuario = async (id) => {
  return await deleteDoc(doc(db, "usuarios", id));
};

// Cambiar estado de bloqueo
export const cambiarBloqueoUsuario = async (id, bloqueado) => {
  return await updateDoc(doc(db, "usuarios", id), { bloqueado: !bloqueado });
};

// Buscar usuarios por campo (ciudad, nombre, etc.)
export const buscarUsuariosPorCampo = async (campo, valor) => {
  const ref = collection(db, "usuarios");
  const q = query(ref, where(campo, "==", valor));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
