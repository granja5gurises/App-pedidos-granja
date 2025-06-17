import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  deleteField,
} from "firebase/firestore";
import BotonVolver from "./BotonVolver";
import useT from "../../locales/useT";
import usarCacheFirestore from "../../helpers/usarCacheFirestore";
import registrarLog from "../../helpers/registrarLog";

// Hook para traer la config visual del admin
function useAdminTheme() {
  return usarCacheFirestore("config_visual_admin", async () => {
    const ref = doc(db, "configuracion", "estilo_admin");
    const snap = await getDocs(ref);
    return snap.exists() ? snap.data() : {};
  }, 60 * 60); // 1 hora de cache
}

// Hook para traer la config visual de la tienda (solo para el preview)
function useStoreTheme() {
  return usarCacheFirestore("config_visual_tienda", async () => {
    const ref = doc(db, "configuracion", "estilo");
    const snap = await getDocs(ref);
    return snap.exists() ? snap.data() : {};
  }, 60 * 10); // 10 minutos de cache
}

// Componente para mostrar el preview del producto como lo ve el cliente
function PreviewProducto({ producto, config }) {
  if (!producto || !producto.nombre) return null;
  return (
    <div
      style={{
        borderRadius: config.disenoTarjeta === "material" ? 18 : 7,
        boxShadow:
          config.disenoTarjeta === "material"
            ? "0 2px 12px #0002"
            : "none",
        background: "#fff",
        border:
          config.disenoTarjeta === "material"
            ? "1.5px solid #e6e6e6"
            : "1px solid #c8c8c8",
        color: config.colorTexto || "#222",
        fontFamily: config.fuente || "Roboto",
        fontSize: config.tamanoFuente || "16px",
        margin: 10,
        padding: 16,
        width: 300,
        minHeight: 190,
      }}
    >
      <img
        src={producto.imagen}
        alt={producto.nombre}
        style={{
          width: "85%",
          height: 86,
          borderRadius: 12,
          objectFit: "cover",
          margin: "10px auto 4px auto",
          display: "block",
        }}
      />
      <div style={{ fontWeight: 700, fontSize: 16 }}>{producto.nombre}</div>
      <div style={{ fontSize: 13, color: "#666" }}>
        {producto.descripcion}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: config.colorBoton,
          marginTop: 3,
        }}
      >
        {`$${producto.precio} ${
          producto.unidad ? `/ ${producto.unidad}` : ""
        }`}
      </div>
      <button
        style={{
          background: config.colorBoton,
          color: "#fff",
          fontWeight: 600,
          border: "none",
          borderRadius: 8,
          margin: "12px 0 8px 0",
          minWidth: 80,
          fontSize: 15,
        }}
      >
        {config.textoAgregar || "Agregar"}
      </button>
    </div>
  );
}

const CAMPOS_FIJOS = [
  "nombre",
  "descripcion",
  "precio",
  "seccionId",
  "stock",
  "unidad",
  "imagen",
];

function PanelProductos() {
  const t = useT();
  const [productos, setProductos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [campos, setCampos] = useState([...CAMPOS_FIJOS]);
  const [camposExtra, setCamposExtra] = useState([]);
  const [nuevo, setNuevo] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    seccionId: "",
    stock: "",
    unidad: "",
    imagen: "",
  });
  const [editId, setEditId] = useState(null);
  const [editProd, setEditProd] = useState({});
  const [nuevoCampo, setNuevoCampo] = useState("");
  const [editandoCampo, setEditandoCampo] = useState(null);
  const [nuevoNombreCampo, setNuevoNombreCampo] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const configAdmin = useAdminTheme();
  const configTienda = useStoreTheme();

  const isMobile = window.innerWidth < 700;

  useEffect(() => {
    cargarProductos();
    cargarSecciones();
    // eslint-disable-next-line
  }, []);

  const cargarProductos = async () => {
    try {
      const q = query(collection(db, "productos"), orderBy("nombre", "asc"));
      const snap = await getDocs(q);
      const arr = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProductos(arr);
      let extras = new Set();
      arr.forEach((item) => {
        Object.keys(item).forEach((key) => {
          if (
            !CAMPOS_FIJOS.includes(key) &&
            key !== "id" &&
            key !== "oculto" &&
            key !== "seccionId"
          ) {
            extras.add(key);
          }
        });
      });
      setCampos([...CAMPOS_FIJOS, ...Array.from(extras)]);
      setCamposExtra(Array.from(extras));
    } catch (e) {
      setError(t("errorCargaProductos"));
    }
  };

  const cargarSecciones = async () => {
    try {
      const seccionesCache = await usarCacheFirestore("secciones", async () => {
        const q = query(collection(db, "secciones"), orderBy("orden", "asc"));
        const snap = await getDocs(q);
        return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      }, 60 * 20);
      setSecciones(seccionesCache);
    } catch (e) {
      setError(t("errorCargaSecciones"));
    }
  };

  const handleNuevoProducto = async () => {
    if (!nuevo.nombre.trim() || !nuevo.precio || !nuevo.seccionId) {
      setError(
        t("camposObligatorios", {
          campos: `${t("nombre")}, ${t("precio")}, ${t("categoria")}`,
        })
      );
      return;
    }
    try {
      const registro = {
        ...nuevo,
        precio: Number(
          String(nuevo.precio).replace(",", ".").replace(/[^0-9.\-]+/g, "")
        ) || 0,
        stock:
          Number(
            String(nuevo.stock).replace(",", ".").replace(/[^0-9.\-]+/g, "")
          ) || 0,
        oculto: false,
      };
      const ref = await addDoc(collection(db, "productos"), registro);
      setNuevo({
        nombre: "",
        descripcion: "",
        precio: "",
        seccionId: "",
        stock: "",
        unidad: "",
        imagen: "",
      });
      setMensaje(t("productoAgregado"));
      setTimeout(() => setMensaje(""), 2200);
      cargarProductos();
      registrarLog({
        accion: "alta_producto",
        usuario: "admin",
        objeto: "producto",
        datos: registro,
        objetoId: ref.id,
      });
    } catch (e) {
      setError(t("errorGuardarProducto"));
    }
  };

  const handleEliminarProducto = async (id) => {
    if (!window.confirm(t("seguroEliminar"))) return;
    try {
      await deleteDoc(doc(db, "productos", id));
      cargarProductos();
      setMensaje(t("productoEliminado"));
      setTimeout(() => setMensaje(""), 2000);
      registrarLog({
        accion: "baja_producto",
        usuario: "admin",
        objeto: "producto",
        objetoId: id,
      });
    } catch (e) {
      setError(t("errorEliminarProducto"));
    }
  };

  const iniciarEdicion = (prod) => {
    setEditId(prod.id);
    setEditProd({ ...prod });
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditProd({});
  };

  const guardarEdicion = async () => {
    try {
      const registro = {
        ...editProd,
        precio: Number(
          String(editProd.precio).replace(",", ".").replace(/[^0-9.\-]+/g, "")
        ) || 0,
        stock:
          Number(
            String(editProd.stock).replace(",", ".").replace(/[^0-9.\-]+/g, "")
          ) || 0,
      };
      await updateDoc(doc(db, "productos", editId), registro);
      cancelarEdicion();
      cargarProductos();
      setMensaje(t("productoEditado"));
      setTimeout(() => setMensaje(""), 2000);
      registrarLog({
        accion: "edicion_producto",
        usuario: "admin",
        objeto: "producto",
        datos: registro,
        objetoId: editId,
      });
    } catch (e) {
      setError(t("errorGuardarProducto"));
    }
  };

  const alternarOculto = async (id, oculto) => {
    try {
      await updateDoc(doc(db, "productos", id), { oculto: !oculto });
      cargarProductos();
    } catch (e) {
      setError(t("errorOcultarProducto"));
    }
  };

  // ---- Campos personalizados ----
  const agregarCampo = () => {
    const campo = nuevoCampo.trim();
    if (
      !campo ||
      CAMPOS_FIJOS.includes(campo) ||
      camposExtra.includes(campo)
    )
      return;
    setCamposExtra([...camposExtra, campo]);
    setCampos([...CAMPOS_FIJOS, ...camposExtra, campo]);
    setNuevoCampo("");
  };

  const editarCampo = (campo) => {
    setEditandoCampo(campo);
    setNuevoNombreCampo(campo);
  };

  const guardarNuevoNombreCampo = async () => {
    const viejo = editandoCampo;
    const nuevoNombre = nuevoNombreCampo.trim();
    if (
      !nuevoNombre ||
      CAMPOS_FIJOS.includes(nuevoNombre) ||
      camposExtra.includes(nuevoNombre)
    ) {
      setError(t("nombreInvalido"));
      return;
    }
    for (const item of productos) {
      if (item[viejo] !== undefined) {
        const ref = doc(db, "productos", item.id);
        let update = { ...item, [nuevoNombre]: item[viejo] };
        delete update[viejo];
        delete update.id;
        await updateDoc(ref, update);
      }
    }
    setEditandoCampo(null);
    setNuevoNombreCampo("");
    await cargarProductos();
  };

  const eliminarCampo = async (campo) => {
    if (!window.confirm(t("avisoEliminarCampo", { campo }))) return;
    for (const item of productos) {
      if (Object.prototype.hasOwnProperty.call(item, campo)) {
        const ref = doc(db, "productos", item.id);
        await updateDoc(ref, { [campo]: deleteField() });
      }
    }
    setEditandoCampo(null);
    setNuevoNombreCampo("");
    await cargarProductos();
    setMensaje(t("campoEliminado"));
    setTimeout(() => setMensaje(""), 1600);
  };

  const handleInputNuevo = (campo, val) => {
    setNuevo((n) => ({ ...n, [campo]: val }));
  };

  const exportarExcel = async () => {
    const XLSX = await import("xlsx");
    if (productos.length === 0) {
      setError(t("noProductos"));
      return;
    }
    const header = [
      "nombre",
      "descripcion",
      "precio",
      "seccionId",
      "stock",
      "unidad",
      "imagen",
      ...camposExtra,
    ];
    const data = productos.map((prod) => {
      let obj = {};
      header.forEach((key) => {
        if (key === "seccionId") {
          obj[t("categoria")] =
            secciones.find((s) => s.id === prod.seccionId)?.nombre || "";
        } else {
          obj[key] = prod[key] || "";
        }
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(data, { header });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("listaProductos"));
    XLSX.writeFile(wb, t("excelNombre"));
  };

  function MensajeError({ error }) {
    if (!error) return null;
    return (
      <div
        style={{
          background: "#fee",
          color: "#a12020",
          border: "1px solid #c44",
          padding: "9px 18px",
          borderRadius: 8,
          marginBottom: 12,
          maxWidth: 580,
        }}
      >
        {error}
        <button
          style={{
            float: "right",
            marginLeft: 16,
            color: "#a12020",
            background: "none",
            border: "none",
            fontSize: 18,
            cursor: "pointer",
          }}
          onClick={() => setError("")}
        >
          ×
        </button>
      </div>
    );
  }

  function MensajeOk({ mensaje }) {
    if (!mensaje) return null;
    return (
      <div
        style={{
          background: "#e8f9e1",
          color: "#117a25",
          border: "1px solid #38c96c",
          padding: "9px 18px",
          borderRadius: 8,
          marginBottom: 12,
          maxWidth: 580,
        }}
      >
        {mensaje}
      </div>
    );
  }

  const layoutMain = isMobile
    ? { flexDirection: "column", alignItems: "stretch" }
    : { flexDirection: "row", alignItems: "flex-start" };

  return (
    <div
      style={{
        padding: isMobile ? 7 : 20,
        minHeight: "100vh",
        background: configAdmin.fondo || "#f5f6fa",
        fontFamily: configAdmin.fuente || "Roboto",
      }}
    >
      <BotonVolver
        to="/dashboard-admin"
        texto={t("volverPanel")}
      />

      <h2>{t("nuevoProducto")}</h2>

      <MensajeError error={error} />
      <MensajeOk mensaje={mensaje} />

      <div style={{ display: "flex", gap: 24, ...layoutMain }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <input
              placeholder={t("nombre")}
              value={nuevo.nombre}
              onChange={(e) => handleInputNuevo("nombre", e.target.value)}
              style={{ minWidth: 160, fontWeight: "bold" }}
            />
            <input
              placeholder={t("urlImagen")}
              value={nuevo.imagen}
              onChange={(e) => handleInputNuevo("imagen", e.target.value)}
              style={{ minWidth: 220 }}
            />
            {nuevo.imagen && (
              <img
                src={nuevo.imagen}
                alt=""
                width={48}
                style={{ borderRadius: 8, border: "1px solid #ccc" }}
              />
            )}
          </div>
          <div style={{ marginBottom: 10 }}>
            <textarea
              placeholder={t("descripcion")}
              value={nuevo.descripcion}
              onChange={(e) =>
                handleInputNuevo("descripcion", e.target.value)
              }
              style={{ width: "100%", minHeight: 48, fontSize: 15 }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 10,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <input
              placeholder={t("precio")}
              type="number"
              value={nuevo.precio}
              onChange={(e) => handleInputNuevo("precio", e.target.value)}
              style={{ minWidth: 90 }}
            />
            <div>
              <select
                value={nuevo.seccionId}
                onChange={(e) =>
                  handleInputNuevo("seccionId", e.target.value)
                }
                style={{ minWidth: 160 }}
              >
                <option value="">{t("seleccionaCategoria")}</option>
                {secciones.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.nombre}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 13, color: "#2d5b9f", marginTop: 2 }}>
                {t("noVesCategoria")}{" "}
                <a
                  href="/secciones"
                  style={{
                    color: "#2976d1",
                    textDecoration: "underline",
                  }}
                >
                  {t("configuraCategorias")}
                </a>
              </div>
            </div>
            <input
              placeholder={t("stock")}
              type="number"
              value={nuevo.stock}
              onChange={(e) => handleInputNuevo("stock", e.target.value)}
              style={{ minWidth: 70 }}
            />
            <input
              placeholder={t("unidad")}
              value={nuevo.unidad}
              onChange={(e) => handleInputNuevo("unidad", e.target.value)}
              style={{ minWidth: 160 }}
            />
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                maxWidth: "100vw",
                gap: 10,
                alignItems: "center",
              }}
            >
              {camposExtra.map((campo) => (
                <span
                  key={campo}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <input
                    placeholder={campo}
                    value={nuevo[campo] || ""}
                    onChange={(e) =>
                      handleInputNuevo(campo, e.target.value)
                    }
                    style={{ minWidth: 100 }}
                  />
                  {editandoCampo === campo ? (
                    <>
                      <input
                        value={nuevoNombreCampo}
                        onChange={(e) =>
                          setNuevoNombreCampo(e.target.value)
                        }
                        style={{ width: 70, marginLeft: 3 }}
                      />
                      <button onClick={guardarNuevoNombreCampo}>
                        {t("ok")}
                      </button>
                      <button onClick={() => setEditandoCampo(null)}>
                        {t("x")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        style={{ marginLeft: 3 }}
                        title={t("editarCampo")}
                        onClick={() => editarCampo(campo)}
                      >
                        ✎
                      </button>
                      <button
                        style={{ marginLeft: 2 }}
                        title={t("eliminarCampo")}
                        onClick={() => eliminarCampo(campo)}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleNuevoProducto}
            style={{
              margin: "10px 0 20px 0",
              padding: "6px 24px",
              background: configAdmin.colorPrincipal || "#4caf50",
              color: "#fff",
              fontWeight: "bold",
              border: "none",
              borderRadius: 6,
              fontSize: 17,
              cursor: "pointer",
              boxShadow: "0 2px 8px #b4e2c5",
            }}
          >
            {t("agregarProducto")}
          </button>
          <div
            style={{
              marginBottom: 18,
              background: "#eaf7ea",
              border: "1px dashed #8bd58b",
              padding: 8,
              borderRadius: 6,
              maxWidth: 500,
            }}
          >
            {t("agregarCampoExtra")}
            <br />
            <input
              value={nuevoCampo}
              onChange={(e) => setNuevoCampo(e.target.value)}
              placeholder={t("placeholderCampo")}
              style={{ marginRight: 6 }}
            />
            <button onClick={agregarCampo}>{t("agregarCampo")}</button>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3 style={{ marginBottom: 10 }}>
            {t("previewProductoTienda")}
          </h3>
          <PreviewProducto producto={nuevo} config={configTienda} />
        </div>
      </div>

      <hr style={{ margin: "32px 0" }} />

      <h2
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {t("listaProductos")}
        <button
          onClick={exportarExcel}
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            padding: "7px 18px",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 1px 5px #a4c2e7",
          }}
        >
          {t("exportarExcel")}
        </button>
      </h2>
      <div style={{ overflowX: "auto", maxWidth: "100vw" }}>
        <table border="1" cellPadding={6} style={{ minWidth: 950 }}>
          <thead>
            <tr>
              <th>{t("nombre")}</th>
              <th>{t("descripcion")}</th>
              <th>{t("precio")}</th>
              <th>{t("categoria")}</th>
              <th>{t("stock")}</th>
              <th>{t("unidad")}</th>
              <th>{t("urlImagen")}</th>
              {camposExtra.map((campo) => (
                <th key={campo} style={{ background: "#f4f7fa" }}>
                  {editandoCampo === campo ? (
                    <>
                      <input
                        value={nuevoNombreCampo}
                        onChange={(e) =>
                          setNuevoNombreCampo(e.target.value)
                        }
                        style={{ width: 80 }}
                      />
                      <button onClick={guardarNuevoNombreCampo}>
                        {t("ok")}
                      </button>
                      <button onClick={() => setEditandoCampo(null)}>
                        {t("x")}
                      </button>
                    </>
                  ) : (
                    <>
                      {campo}
                      <button
                        style={{ marginLeft: 3 }}
                        title={t("editarCampo")}
                        onClick={() => editarCampo(campo)}
                      >
                        ✎
                      </button>
                      <button
                        style={{ marginLeft: 2 }}
                        title={t("eliminarCampo")}
                        onClick={() => eliminarCampo(campo)}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </th>
              ))}
              <th>
                {t("visible")}
                <span
                  style={{
                    marginLeft: 4,
                    color: "#337ab7",
                    cursor: "pointer",
                  }}
                  title={t("ayudaVisible")}
                >
                  ❓
                </span>
              </th>
              <th>{t("acciones")}</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((prod) =>
              editId === prod.id ? (
                <tr key={prod.id} style={{ background: "#f7f7e0" }}>
                  <td>
                    <input
                      value={editProd.nombre}
                      onChange={(e) =>
                        setEditProd({ ...editProd, nombre: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <textarea
                      value={editProd.descripcion}
                      onChange={(e) =>
                        setEditProd({
                          ...editProd,
                          descripcion: e.target.value,
                        })
                      }
                      style={{ width: 120, minHeight: 30 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editProd.precio}
                      onChange={(e) =>
                        setEditProd({ ...editProd, precio: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={editProd.seccionId}
                      onChange={(e) =>
                        setEditProd({
                          ...editProd,
                          seccionId: e.target.value,
                        })
                      }
                    >
                      <option value="">{t("seleccionaCategoria")}</option>
                      {secciones.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editProd.stock}
                      onChange={(e) =>
                        setEditProd({ ...editProd, stock: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={editProd.unidad}
                      onChange={(e) =>
                        setEditProd({ ...editProd, unidad: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      placeholder={t("urlImagen")}
                      value={editProd.imagen}
                      onChange={(e) =>
                        setEditProd({ ...editProd, imagen: e.target.value })
                      }
                    />
                    {editProd.imagen && (
                      <img src={editProd.imagen} alt="" width={48} />
                    )}
                  </td>
                  {camposExtra.map((campo) => (
                    <td key={campo}>
                      <input
                        value={editProd[campo] || ""}
                        onChange={(e) =>
                          setEditProd({
                            ...editProd,
                            [campo]: e.target.value,
                          })
                        }
                      />
                    </td>
                  ))}
                  <td>
                    <span
                      style={{
                        color: productos.find((p) => p.id === editId)?.oculto
                          ? "crimson"
                          : "green",
                      }}
                    >
                      {productos.find((p) => p.id === editId)?.oculto
                        ? t("oculto")
                        : t("visible")}
                    </span>
                  </td>
                  <td>
                    <button onClick={guardarEdicion}>{t("guardar")}</button>
                    <button onClick={cancelarEdicion}>{t("cancelar")}</button>
                  </td>
                </tr>
              ) : (
                <tr key={prod.id}>
                  <td>{prod.nombre}</td>
                  <td
                    style={{
                      maxWidth: 140,
                      fontSize: 13,
                      color: "#444",
                    }}
                  >
                    {prod.descripcion}
                  </td>
                  <td>${prod.precio}</td>
                  <td>
                    {secciones.find((s) => s.id === prod.seccionId)?.nombre ||
                      ""}
                  </td>
                  <td>{prod.stock}</td>
                  <td>{prod.unidad}</td>
                  <td>
                    {prod.imagen && (
                      <img src={prod.imagen} alt="" width={48} />
                    )}
                  </td>
                  {camposExtra.map((campo) => (
                    <td key={campo}>{prod[campo] || ""}</td>
                  ))}
                  <td>
                    {prod.oculto ? (
                      <span style={{ color: "crimson" }}>{t("oculto")}</span>
                    ) : (
                      <span style={{ color: "green" }}>{t("visible")}</span>
                    )}
                    <button
                      style={{ marginLeft: 8, fontSize: 12 }}
                      onClick={() => alternarOculto(prod.id, prod.oculto)}
                    >
                      {prod.oculto ? t("mostrar") : t("ocultar")}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => iniciarEdicion(prod)}>
                      {t("editar")}
                    </button>
                    <button
                      style={{ color: "red" }}
                      onClick={() => handleEliminarProducto(prod.id)}
                    >
                      {t("eliminar")}
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelProductos;
