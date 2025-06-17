import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

// Textos centralizados para internacionalización
const texts = {
  titulo: "Registro",
  registrarse: "Registrarse",
  cargando: "Cargando formulario...",
  obligatorio: (label) => `El campo "${label}" es obligatorio`,
  seleccionar: "Seleccionar...",
  exito: "Registro exitoso",
  error: "Error al registrar: "
};

function Register() {
  const navigate = useNavigate();

  const [campos, setCampos] = useState([]);
  const [formData, setFormData] = useState({});
  const [opciones, setOpciones] = useState({});
  const [cargando, setCargando] = useState(true);

  // Cargar la config de campos dinámicos al iniciar
  useEffect(() => {
    const cargarCampos = async () => {
      // Leer la configuración ACTUAL de campos desde "configuracion/general"
      const snap = await getDoc(doc(db, "configuracion", "general"));
      let camposConfig = [];
      if (snap.exists() && Array.isArray(snap.data().camposRegistro)) {
        camposConfig = snap.data().camposRegistro;
      } else {
        // fallback por si no existe: mínimo para no romper
        camposConfig = [
          { nombre: "nombre", tipo: "texto", obligatorio: true, label: "Nombre" },
          { nombre: "apellido", tipo: "texto", obligatorio: true, label: "Apellido" },
          { nombre: "direccion", tipo: "texto", obligatorio: true, label: "Dirección" },
          { nombre: "ciudad", tipo: "lista", obligatorio: true, coleccionOpciones: "ciudades", label: "Ciudad" },
          { nombre: "email", tipo: "email", obligatorio: true, label: "Email" },
          { nombre: "password", tipo: "password", obligatorio: true, label: "Contraseña" }
        ];
      }
      setCampos(camposConfig);

      // Traer opciones de cada campo tipo lista
      for (const campo of camposConfig) {
        // Si la colección de opciones no está definida, asume plural (ej: ciudad -> ciudades)
        let coleccion = campo.coleccionOpciones || (campo.tipo === "lista"
          ? (campo.nombre.endsWith("z")
              ? campo.nombre.slice(0, -1) + "ces"
              : campo.nombre + "s")
          : null);

        if (campo.tipo === "lista" && coleccion) {
          const snapOpc = await getDocs(collection(db, coleccion));
          setOpciones(prev => ({
            ...prev,
            [campo.nombre]: snapOpc.docs.map(doc => doc.id)
          }));
        }
      }
      setCargando(false);
    };
    cargarCampos();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Registrar usuario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación simple según config
    for (const campo of campos) {
      if (campo.obligatorio && !formData[campo.nombre]) {
        alert(texts.obligatorio(campo.label || campo.nombre));
        return;
      }
    }

    try {
      // Registrar en auth si hay email y password
      let user;
      if (formData.email && formData.password) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;
      }

      // Antes de guardar, eliminar el password
      const userId = user ? user.uid : (formData.email || Date.now().toString());
      const { password, ...userData } = formData; // Excluir el password

      await setDoc(doc(db, 'usuarios', userId), {
        ...userData,
        uid: userId,
        admin: false // Si querés que admin sea configurable, adaptá esto
      });

      alert(texts.exito);
      navigate('/pedido');
    } catch (error) {
      alert(texts.error + error.message);
    }
  };

  if (cargando) return <div>{texts.cargando}</div>;

  return (
    <div>
      <h2>{texts.titulo}</h2>
      <form onSubmit={handleSubmit}>
        {campos.map((campo, idx) => (
          <div key={idx} style={{ marginBottom: 14 }}>
            <label>
              {campo.label || campo.nombre}
              {campo.obligatorio && " *"}
            </label>
            {campo.tipo === "lista" ? (
              <select
                name={campo.nombre}
                value={formData[campo.nombre] || ""}
                onChange={handleChange}
                required={campo.obligatorio}
              >
                <option value="">{texts.seleccionar}</option>
                {(opciones[campo.nombre] || []).map((op, i) => (
                  <option key={i} value={op}>{op}</option>
                ))}
              </select>
            ) : campo.tipo === "password" ? (
              <input
                type="password"
                name={campo.nombre}
                value={formData[campo.nombre] || ""}
                onChange={handleChange}
                required={campo.obligatorio}
                autoComplete="new-password"
              />
            ) : (
              <input
                type={campo.tipo === "email" ? "email" : campo.tipo === "numero" ? "number" : "text"}
                name={campo.nombre}
                value={formData[campo.nombre] || ""}
                onChange={handleChange}
                required={campo.obligatorio}
              />
            )}
          </div>
        ))}
        <button type="submit">{texts.registrarse}</button>
      </form>
    </div>
  );
}

export default Register;
