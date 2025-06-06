import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

const PanelProductos = () => {
  const [productos, setProductos] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    precio: "",
    stock: "",
    unidad: "unidad",
    imagen: "",
    oculto: false,
    esBolson: false,
  });
  const [productoEditandoId, setProductoEditandoId] = useState(null);

  const [nuevoBolson, setNuevoBolson] = useState({
    nombre: "",
    imagen: "",
    contenido: [],
    descuento: 10,
    stock: 0,
    oculto: false,
    esBolson: true,
  });
  const [bolsonEditandoId, setBolsonEditandoId] = useState(null);
  const [contenidoTemp, setContenidoTemp] = useState({});

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const snapshot = await getDocs(collection(db, "productos"));
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setProductos(lista);
  };

  const guardarProducto = async () => {
    const nuevo = {
      ...nuevoProducto,
      precio: parseInt(nuevoProducto.precio),
      stock: parseInt(nuevoProducto.stock),
      oculto: false,
      esBolson: false,
    };

    try {
      if (productoEditandoId) {
        await updateDoc(doc(db, "productos", productoEditandoId), nuevo);
        setProductoEditandoId(null);
      } else {
        await addDoc(collection(db, "productos"), nuevo);
      }

      setNuevoProducto({
        nombre: "",
        precio: "",
        stock: "",
        unidad: "unidad",
        imagen: "",
        oculto: false,
        esBolson: false,
      });

      cargarProductos();
    } catch (error) {
      console.error("Error al guardar el producto:", error);
    }
  };

  const editarProducto = (producto) => {
    setNuevoProducto(producto);
    setProductoEditandoId(producto.id);
  };

  const eliminarProducto = async (id) => {
    await deleteDoc(doc(db, "productos", id));
    cargarProductos();
  };

  const ocultarProducto = async (id, oculto) => {
    await updateDoc(doc(db, "productos", id), { oculto: !oculto });
    cargarProductos();
  };

  const calcularPrecioBolson = () => {
    return nuevoBolson.contenido.reduce((total, item) => {
      return total + (item.precioUnitario || 0) * (item.cantidad || 0);
    }, 0);
  };

  const guardarBolson = async () => {
    const contenidoValido = Object.entries(contenidoTemp)
      .filter(([id, cantidad]) => cantidad > 0)
      .map(([id, cantidad]) => {
        const prod = productos.find((p) => p.id === id);
        return {
          id,
          nombre: prod.nombre,
          cantidad: parseFloat(cantidad),
          precioUnitario: prod.precio,
        };
      });

    const nuevo = {
      ...nuevoBolson,
      contenido: contenidoValido,
      precio: calcularPrecioBolson(),
      descuento: parseInt(nuevoBolson.descuento),
      stock: parseInt(nuevoBolson.stock),
      oculto: false,
      esBolson: true,
    };

    try {
      await addDoc(collection(db, "productos"), nuevo);
      setNuevoBolson({
        nombre: "",
        imagen: "",
        contenido: [],
        descuento: 10,
        stock: 0,
        oculto: false,
        esBolson: true,
      });
      setContenidoTemp({});
      cargarProductos();
    } catch (error) {
      console.error("Error al guardar el bolson:", error);
    }
  };

  return (
    <div>
      <h1>Gestión de Productos</h1>

      <input
        placeholder="Nombre"
        value={nuevoProducto.nombre}
        onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
      />
      <input
        placeholder="Precio"
        value={nuevoProducto.precio}
        onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })}
      />
      <input
        placeholder="Stock"
        value={nuevoProducto.stock}
        onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })}
      />
      <input
        placeholder="URL de imagen"
        value={nuevoProducto.imagen}
        onChange={(e) => setNuevoProducto({ ...nuevoProducto, imagen: e.target.value })}
      />
      <select
        value={nuevoProducto.unidad}
        onChange={(e) => setNuevoProducto({ ...nuevoProducto, unidad: e.target.value })}
      >
        <option value="unidad">Unidad</option>
        <option value="kg">Kg</option>
        <option value="atado">Atado</option>
      </select>
      <button onClick={guardarProducto}>Guardar</button>

      <h2>Armar Bolsón</h2>
      <input
        placeholder="Nombre del bolsón"
        value={nuevoBolson.nombre}
        onChange={(e) => setNuevoBolson({ ...nuevoBolson, nombre: e.target.value })}
      />
      <input
        placeholder="URL imagen"
        value={nuevoBolson.imagen}
        onChange={(e) => setNuevoBolson({ ...nuevoBolson, imagen: e.target.value })}
      />
      <input
        placeholder="Stock"
        value={nuevoBolson.stock}
        onChange={(e) => setNuevoBolson({ ...nuevoBolson, stock: e.target.value })}
      />
      <input
        placeholder="Descuento (%)"
        value={nuevoBolson.descuento}
        onChange={(e) => setNuevoBolson({ ...nuevoBolson, descuento: e.target.value })}
      />
      <p>Contenido del bolsón:</p>
      {productos.filter((p) => !p.esBolson).map((prod) => (
        <div key={prod.id}>
          <label>
            <input
              type="checkbox"
              checked={!!contenidoTemp[prod.id]}
              onChange={(e) => {
                const updated = { ...contenidoTemp };
                if (e.target.checked) updated[prod.id] = 1;
                else delete updated[prod.id];
                setContenidoTemp(updated);
              }}
            />
            {prod.nombre}
          </label>
          {!!contenidoTemp[prod.id] && (
            <input
              type="number"
              value={contenidoTemp[prod.id]}
              onChange={(e) => {
                setContenidoTemp({
                  ...contenidoTemp,
                  [prod.id]: parseFloat(e.target.value),
                });
              }}
              style={{ width: "50px", marginLeft: "10px" }}
            />
          )}
        </div>
      ))}
      <p><strong>💲 Precio estimado del bolsón: ${calcularPrecioBolson()}</strong></p>
      <button onClick={guardarBolson}>Guardar Bolsón</button>

      <h2>Lista de productos</h2>
      <table border="1">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Unidad</th>
            <th>Stock</th>
            <th>Bolson</th>
            <th>Oculto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((prod) => (
            <tr key={prod.id}>
              <td>
                {prod.imagen && (
                  <img src={prod.imagen} alt={prod.nombre} width="50" />
                )}
              </td>
              <td>{prod.nombre}</td>
              <td>${prod.precio}</td>
              <td>{prod.unidad || "-"}</td>
              <td>{prod.stock}</td>
              <td>{prod.esBolson ? "Sí" : "No"}</td>
              <td>{prod.oculto ? "Sí" : "No"}</td>
              <td>
                {!prod.esBolson && (
                  <>
                    <button onClick={() => editarProducto(prod)}>Editar</button>
                    <button onClick={() => eliminarProducto(prod.id)}>Eliminar</button>
                    <button onClick={() => ocultarProducto(prod.id, prod.oculto)}>
                      {prod.oculto ? "Mostrar" : "Ocultar"}
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PanelProductos;
