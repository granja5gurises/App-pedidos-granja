
import React, { useEffect, useState } from 'react'
import { db } from '../../firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function PanelProductor() {
  const [pedidos, setPedidos] = useState([])

  useEffect(() => {
    const fetchPedidos = async () => {
      const querySnapshot = await getDocs(collection(db, 'pedidos'))
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPedidos(data)
    }
    fetchPedidos()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h2>Panel del Productor</h2>
      {pedidos.length === 0 ? (
        <p>No hay pedidos aún.</p>
      ) : (
        <ul>
          {pedidos.map(p => (
            <li key={p.id}>
              <strong>{p.nombre} {p.apellido}</strong> ({p.ciudad})<br/>
              Productos: {Object.entries(p.productos || {}).map(([prod, cant]) => `${prod} (${cant})`).join(', ')}<br/>
              Tipo de entrega: {p.entrega}<br/>
              Total: ${p.total}
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
