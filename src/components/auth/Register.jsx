import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    direccion: '',
    ciudad: '',
    email: '',
    password: ''
  });

  const [ciudades, setCiudades] = useState([]);

  useEffect(() => {
    const fetchCiudades = async () => {
      const snapshot = await getDocs(collection(db, 'ciudades'));
      const lista = snapshot.docs.map(doc => doc.id);
      setCiudades(lista);
    };
    fetchCiudades();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nombre, apellido, direccion, ciudad, email, password } = formData;

    if (!nombre || !apellido || !direccion || !ciudad || !email || !password) {
      alert('Todos los campos son obligatorios');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await addDoc(collection(db, 'usuarios'), {
        uid: user.uid,
        nombre,
        apellido,
        direccion,
        ciudad,
        email
      });
      alert('Registro exitoso');
      navigate('/pedido'); // Redirección a la pantalla de pedidos
    } catch (error) {
      alert('Error al registrar: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Registro</h2>
      <form onSubmit={handleSubmit}>
        <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre" required />
        <input name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Apellido" required />
        <input name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Dirección" required />
        <select name="ciudad" value={formData.ciudad} onChange={handleChange} required>
          <option value="">Seleccioná una ciudad</option>
          {ciudades.map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Contraseña" required />
        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
}

export default Register;