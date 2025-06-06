
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function Header() {
  const [admin, setAdmin] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user);
        const q = query(collection(db, 'usuarios'), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setAdmin(data.admin === true);
        }
      } else {
        setUsuario(null);
        setAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUsuario(null);
    setAdmin(false);
    navigate('/login');
  };

  if (!usuario) return null;

  return (
    <nav style={{ padding: 10, background: '#f0f0f0', marginBottom: 20 }}>
      {admin && (
        <>
          <Link to="/panel" style={{ marginRight: 10 }}>Panel Productor</Link>
          <Link to="/ciudades" style={{ marginRight: 10 }}>Ciudades</Link>
          <Link to="/resumen" style={{ marginRight: 10 }}>Resumen cosecha</Link>
        </>
      )}
      {usuario.email === 'productor@granja.com' && (
        <Link to="/productos" style={{ marginRight: 10 }}>Productos</Link>
      )}
      <button onClick={handleLogout} style={{ marginLeft: 20 }}>Cerrar sesión</button>
    </nav>
  );
}
