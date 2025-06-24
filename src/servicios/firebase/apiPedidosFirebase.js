import { db } from '../../../firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function obtenerPedidosFirebase() {
  const snapshot = await getDocs(collection(db, 'pedidos'))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
