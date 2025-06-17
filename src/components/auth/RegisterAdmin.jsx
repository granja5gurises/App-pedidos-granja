import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../LanguageSelector';

function RegisterAdmin() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ nombre: '', apellido: '', email: '', password: '' });
  const [adminExiste, setAdminExiste] = useState(null); // null: cargando, true/false: listo

  useEffect(() => {
    const verificarAdmin = async () => {
      const q = query(collection(db, 'usuarios'), where('admin', '==', true));
      const snap = await getDocs(q);
      setAdminExiste(!snap.empty); // true si hay admin
    };
    verificarAdmin();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nombre, apellido, email, password } = formData;

    if (!nombre || !apellido || !email || !password) {
      alert(t("registerAdmin.obligatorio"));
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        nombre,
        apellido,
        email,
        admin: true
      });

      alert(t("registerAdmin.exito"));
      navigate('/config');
    } catch (error) {
      alert(t("registerAdmin.error") + error.message);
    }
  };

  if (adminExiste === null) return <p>{t("registerAdmin.cargando")}</p>;

  if (adminExiste) {
    return (
      <div style={{ padding: '2rem', color: 'crimson' }}>
        <h3>{t("registerAdmin.adminExiste")}</h3>
        <p>{t("registerAdmin.accesoDeshabilitado")}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <LanguageSelector />
      </div>

      <h2>{t("registerAdmin.titulo")}</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="nombre"
          type="text"
          placeholder={t("registerAdmin.nombre")}
          value={formData.nombre}
          onChange={handleChange}
          required
        /><br /><br />
        <input
          name="apellido"
          type="text"
          placeholder={t("registerAdmin.apellido")}
          value={formData.apellido}
          onChange={handleChange}
          required
        /><br /><br />
        <input
          name="email"
          type="email"
          placeholder={t("registerAdmin.email")}
          value={formData.email}
          onChange={handleChange}
          required
        /><br /><br />
        <input
          name="password"
          type="password"
          placeholder={t("registerAdmin.password")}
          value={formData.password}
          onChange={handleChange}
          required
        /><br /><br />
        <button type="submit">{t("registerAdmin.crear")}</button>
      </form>
    </div>
  );
}

export default RegisterAdmin;
