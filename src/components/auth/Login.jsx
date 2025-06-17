import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Textos centralizados para i18n
const texts = {
  titulo: "Iniciar Sesión",
  email: "Email",
  password: "Contraseña",
  ingresar: "Ingresar",
  noCuenta: "¿No tenés cuenta?",
  registrate: "Registrate",
  error: "Error al iniciar sesión: "
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const db = getFirestore();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const ref = doc(db, 'usuarios', user.uid);
      const snap = await getDoc(ref);
      const esAdmin = snap.exists() && snap.data().admin === true;
      if (esAdmin) {
        navigate('/dashboard-admin');
      } else {
        navigate('/inicio'); // cliente común
      }
    } catch (error) {
      alert(texts.error + error.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>{texts.titulo}</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder={texts.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br /><br />
        <input
          type="password"
          placeholder={texts.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br /><br />
        <button type="submit">{texts.ingresar}</button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        {texts.noCuenta} <Link to="/register">{texts.registrate}</Link>
      </p>
    </div>
  );
}

export default Login;
