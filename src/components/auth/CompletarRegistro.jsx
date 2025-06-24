import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";

const CompletarRegistro = () => {
  const [campos, setCampos] = useState([]);
  const [valores, setValores] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const cargarCampos = async () => {
      const configRef = doc(db, "Registro", "camposRegistro");
      const configSnap = await getDoc(configRef);
      const campos = configSnap.data()?.campos || [];

      // Verificamos si hay campos tipo lista para cargar opciones
      const camposConOpciones = await Promise.all(
        campos.map(async (campo) => {
          if (campo.tipo === "lista" && campo.coleccionOpciones) {
            const colRef = collection(db, campo.coleccionOpciones);
            const colSnap = await getDocs(colRef);
            const opciones = colSnap.docs.map((doc) => doc.data().nombre);
            return { ...campo, opciones };
          }
          return campo;
        })
      );

      setCampos(camposConOpciones);
      setLoading(false);
    };

    cargarCampos();
  }, [db]);

  const handleChange = (e, nombreCampo) => {
    setValores({ ...valores, [nombreCampo]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db, "usuarios", user.uid), {
      ...valores,
      uid: user.uid,
      email: user.email,
      creado: new Date(),
    });

    navigate("/inicio");
  };

  if (loading) return <p>Cargando campos...</p>;
  if (campos.length === 0) {
    navigate("/inicio");
    return null;
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Completá tu perfil</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {campos.map((campo) => (
          <div key={campo.nombreCampo}>
            <label className="block font-medium">
              {campo.label || campo.nombreCampo}
            </label>
            {campo.tipo === "lista" ? (
              <select
                className="w-full border p-2 rounded"
                value={valores[campo.nombreCampo] || ""}
                onChange={(e) => handleChange(e, campo.nombreCampo)}
                required={campo.obligatorio}
              >
                <option value="" disabled>
                  Seleccioná una opción
                </option>
                {campo.opciones.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={campo.tipo === "numero" ? "number" : "text"}
                className="w-full border p-2 rounded"
                value={valores[campo.nombreCampo] || ""}
                onChange={(e) => handleChange(e, campo.nombreCampo)}
                required={campo.obligatorio}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Guardar y continuar
        </button>
      </form>
    </div>
  );
};

export default CompletarRegistro;
