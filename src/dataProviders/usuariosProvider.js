// src/dataProviders/usuariosProvider.js
import { db } from "../../firebase"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy
} from "firebase/firestore"

export const getUsuarios = async () => {
  const q = query(collection(db, "usuarios"), orderBy("email", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addUsuario = async (nuevo) => {
  return await addDoc(collection(db, "usuarios"), {
    ...nuevo,
    admin: false,
    bloqueado: false
  });
};

export const updateUsuario = async (id, data) => {
  return await updateDoc(doc(db, "usuarios", id), data);
};

export const deleteUsuario = async (id) => {
  return await deleteDoc(doc(db, "usuarios", id));
};

export const toggleBloqueado = async (id, bloqueado) => {
  return await updateDoc(doc(db, "usuarios", id), { bloqueado: !bloqueado });
};

export const getCamposConfig = async () => {
  const snap = await getDoc(doc(db, "configuracion", "general"));
  if (!snap.exists()) return [];
  const data = snap.data().camposRegistro;
  return Array.isArray(data)
    ? data
    : Object.entries(data || {}).map(([nombre, props]) => ({ nombre, ...props }));
};

export const getCamposObligatorios = async () => {
  const snap = await getDoc(doc(db, "config", "camposObligatorios"));
  return snap.exists() ? (snap.data().lista || []) : ["nombre", "email"];
};
