import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../LanguageSelector';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const db = getFirestore();

  const [branding, setBranding] = useState({
    logo: null,
    nombre: 'Mi Tienda',
    mensaje: t('login.bienvenida')
  });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const ref = doc(db, 'configuracion', 'estilo');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
                    setBranding({
            logo: data.logo || null,
            nombre: data.nombreNegocio || 'Mi Tienda',
            mensaje: data.mensaje_login || t('login.bienvenida') 
          });
        }
      } catch (error) {
        console.log('No se pudo cargar la apariencia:', error.message);
      }
    };

    fetchBranding();
  }, [t, db]);

  const handleLogin = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const ref = doc(db, 'usuarios', user.uid);
      const snap = await getDoc(ref);
      const esAdmin = snap.exists() && snap.data().admin === true;
      setLoading(false);
      if (esAdmin) {
        navigate('/dashboard-admin');
      } else {
        navigate('/inicio');
      }
    } catch (error) {
      setLoading(false);
      alert(t("login.error") + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.2rem' }}>{t("login.cargando")}</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      maxWidth: 400,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: 10 }}>
        <LanguageSelector />
      </div>

      {(branding.logo || branding.nombre !== 'Mi Tienda' || branding.mensaje !== t('login.bienvenida')) && (
        <>
          {branding.logo && (
            <img src={branding.logo} alt="Logo" style={{ width: 100, marginBottom: 12 }} />
          )}
          {branding.nombre !== 'Mi Tienda' && (
            <h1 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: 4 }}>
              {branding.nombre}
            </h1>
          )}
          {branding.mensaje && (
  <p style={{ textAlign: 'center', marginBottom: 24, color: '#666' }}>
    {branding.mensaje}
  </p>
)}
        </>
      )}

      <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: 24 }}>
        {t("login.titulo")}
      </h2>

      <form onSubmit={handleLogin} style={{ width: '100%' }}>
        <input
          type="email"
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 10, fontSize: 16, marginBottom: 16 }}
        />
        <input
          type="password"
          placeholder={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: 10, fontSize: 16, marginBottom: 16 }}
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: 10,
            fontSize: 16,
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          {t("login.ingresar")}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        {t("login.noCuenta")} <Link to="/register">{t("login.registrate")}</Link>
      </p>
    </div>
  );
}

export default Login;
  