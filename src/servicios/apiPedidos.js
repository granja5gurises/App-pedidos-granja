import { obtenerPedidosFirebase } from './firebase/apiPedidosFirebase'

export async function obtenerPedidos() {
  // En el futuro acá podés decidir si usar Firebase o SQL
  return await obtenerPedidosFirebase()
}
