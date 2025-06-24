
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const texts = {
    titulo: t("register.titulo"),
    registrarse: t("register.registrarse"),
    cargando: t("register.cargando"),
    obligatorio: (label) => t("register.obligatorio", { label }),
    exito: t("register.exito"),
    error: t("register.error"),
    volver: t("register.volver")
  };

  const [campos, setCampos] = useState([]);
  const [formData, setFormData] = useState({});
  const [cargando, setCargando] = useState(true);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    // Seteo fijo de campos permitidos por reglas
    const camposConfig = [
  { nombre: "nombre", tipo: "texto", obligatorio: true, label: t("register.nombre") },
  { nombre: "apellido", tipo: "texto", obligatorio: true, label: t("register.apellido") },
  { nombre: "email", tipo: "email", obligatorio: true, label: t("register.email") },
  { nombre: "password", tipo: "password", obligatorio: true, label: t("register.password") }
    ];
    setCampos(camposConfig);
    setCargando(false);
  }, []);

  useEffect(() => {
    const fetchLogo = async () => {
      const snap = await getDoc(doc(db, "configuracion", "estilo"));
      if (snap.exists() && snap.data().logo) {
        setLogo(snap.data().logo);
      }
    };
    fetchLogo();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verifica que todos los campos obligatorios estén completos
    for (const campo of campos) {
      if (campo.obligatorio && !formData[campo.nombre]) {
        alert(texts.obligatorio(campo.label || campo.nombre));
        return;
      }
    }

    try {
      // Crear usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const userId = userCredential.user.uid;
      const { password, ...userData } = formData;

      // Guardar el nuevo usuario en Firestore
      await setDoc(doc(db, 'usuarios', userId), {
        ...userData,
        uid: userId,
        admin: false
      });

      // Confirmar el registro exitoso
      alert(texts.exito);

      // Verifica si el usuario debe completar su registro y redirige
      const camposPendientes = campos.filter(campo => !userData[campo.nombre]);
      if (camposPendientes.length > 0) {
        navigate('/completar-registro');  // Redirige a completar el registro
      } else {
        navigate('/inicio');  // Redirige a la tienda si todo está completo
      }

    } catch (error) {
      alert(texts.error + error.message);
    }
  };

  if (cargando) return <div>{texts.cargando}</div>;

  return (
    <div style={{
      padding: '2rem',
      maxWidth: 400,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {logo && <img src={logo} alt="logo" style={{ maxWidth: "100px", marginBottom: "1rem" }} />}
      <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: 24 }}>
        {texts.titulo}
      </h2>

      <button
        type="button"
        onClick={() => navigate('/login')}
        style={{
          marginBottom: '1rem',
          padding: '8px 16px',
          fontSize: '14px',
          backgroundColor: '#f0f0f0',
          color: '#333',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          alignSelf: 'flex-start'
        }}
      >
        {texts.volver}
      </button>

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        {campos.map((campo, idx) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
              {campo.label || campo.nombre}{campo.obligatorio && " *"}
            </label>
            <input
              type={campo.tipo}
              name={campo.nombre}
              value={formData[campo.nombre] || ""}
              onChange={handleChange}
              required={campo.obligatorio}
              autoComplete={campo.tipo === "password" ? "new-password" : "off"}
              style={{ width: '100%', padding: 10, fontSize: 16 }}
            />
          </div>
        ))}
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
          {texts.registrarse}
        </button>
      </form>
    </div>
  );
}

export default Register;
