
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function useProductosYBolsones() {
  const [productos, setProductos] = useState([]);
  const [bolsones, setBolsones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const productosSnap = await getDocs(collection(db, 'productos'));
        const bolsonesSnap = await getDocs(collection(db, 'bolsones'));

        const productosData = productosSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(p => !p.esBolson);

        const bolsonesData = bolsonesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProductos(productosData);
        setBolsones(bolsonesData);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar productos y bolsones:", err);
      }
    };

    cargarDatos();
  }, []);

  return { productos, bolsones, loading };
}
