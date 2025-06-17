
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const db = getFirestore();
      const q = query(collection(db, 'usuarios'), where('admin', '==', true));
      const snap = await getDocs(q);

      if (snap.empty) {
        navigate('/register-admin');
      } else {
        navigate('/login');
      }
    };

    checkAdmin();
  }, [navigate]);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Cargando...</h2>
    </div>
  );
}

export default Splash;
