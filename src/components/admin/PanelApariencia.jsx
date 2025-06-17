import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

// Tipografías ampliadas
const FUENTES = [
  { value: "Roboto", label: "Roboto" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Nunito", label: "Nunito" },
  { value: "Quicksand", label: "Quicksand" },
  { value: "Poppins", label: "Poppins" },
  { value: "Mulish", label: "Mulish" },
  { value: "Inter", label: "Inter" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
  { value: "PT Sans", label: "PT Sans" },
  { value: "Muli", label: "Muli" }
];
const TAMANOS = [
  { value: "14px", label: "Chica" },
  { value: "16px", label: "Mediana" },
  { value: "18px", label: "Grande" }
];

const VISTAS = [
  { value: "cuadricula", label: "Cuadrícula" },
  { value: "lista", label: "Lista" },
  { value: "foto", label: "Foto grande + push up" }
];

const POSICIONES_CARRITO = [
  { value: "bottom-right", label: "Flotante abajo derecha" },
  { value: "bottom-left", label: "Flotante abajo izquierda" },
  { value: "top-right", label: "Flotante arriba derecha" },
  { value: "top-left", label: "Flotante arriba izquierda" },
  { value: "fixed-bottom", label: "Fijo abajo" },
  { value: "fixed-top", label: "Fijo arriba" }
];

const TARJETAS = [
  { value: "material", label: "Sombra redonda" },
  { value: "plano", label: "Borde fino, fondo plano" },
  { value: "gruesa", label: "Borde grueso rectangular" }
];

const ESTILOS_BOTON = [
  { value: "recto", label: "Recto" },
  { value: "pill", label: "Súper redondo (pill)" },
  { value: "borde", label: "Con borde color secundario" }
];

export default function PanelApariencia() {
  // Configuración editable
  const [config, setConfig] = useState({
    logo: "",
    nombreNegocio: "",
    descripcion: "",
    vistaCatalogo: "cuadricula",
    columnas: 2,
    banner: "",
    colorPrincipal: "#23705d",
    colorSecundario: "#f5f8f6",
    colorBoton: "#2298eb",
    colorTexto: "#242e2e",
    fuente: "Roboto",
    tamanoFuente: "16px",
    estiloBoton: "recto",
    disenoTarjeta: "material",
    posicionCarrito: "bottom-right",
    mostrarWhatsapp: true,
    whatsappPos: "bottom-right",
    whatsappSecciones: [],
  });
  const [logoPreview, setLogoPreview] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [pushUp, setPushUp] = useState(null);
  const [previewSection, setPreviewSection] = useState(null);

  // Firestore data
  const [productos, setProductos] = useState([]);
  const [combos, setCombos] = useState([]);
  const [secciones, setSecciones] = useState([]);

  // Cargar config y datos de Firestore
  useEffect(() => {
    const cargar = async () => {
      const ref = doc(db, "configuracion", "estilo");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setConfig(prev => ({ ...prev, ...snap.data() }));
        setLogoPreview(snap.data().logo || "");
      }
      // Secciones y productos reales
      const secSnap = await getDocs(collection(db, "secciones"));
      const activas = secSnap.docs.filter(d => !d.data().oculta).map(doc => ({ id: doc.id, ...doc.data() }));
      setSecciones(activas);
      setPreviewSection(activas[0]?.id || null);

      const prodSnap = await getDocs(collection(db, "productos"));
      const activos = prodSnap.docs.filter(d => !d.data().oculto).map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(activos);

      const combosSnap = await getDocs(collection(db, "combos"));
      const combosActivos = combosSnap.docs.filter(d => !d.data().oculto).map(doc => ({ id: doc.id, ...doc.data() }));
      setCombos(combosActivos);
    };
    cargar();
  }, []);

  // Forzar import de tipografía
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css?family=${config.fuente.replace(/ /g, "+")}:400,600&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); }
  }, [config.fuente]);

  // Subir logo
  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setConfig(c => ({ ...c, logo: reader.result }));
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Guardar cambios
  const guardarCambios = async () => {
    setGuardando(true);
    try {
      await setDoc(doc(db, "configuracion", "estilo"), config, { merge: true });
      setMensaje("¡Cambios guardados!");
      setTimeout(() => setMensaje(""), 1800);
    } catch (e) {
      setMensaje("Error al guardar: " + e.message);
    }
    setGuardando(false);
  };

  // Estilos de tarjeta y botón
  function getTarjetaEstilo() {
    if (config.disenoTarjeta === "material") {
      return {
        borderRadius: 18,
        boxShadow: "0 2px 12px #0002",
        background: "#fff",
        border: "1.5px solid #e6e6e6"
      };
    }
    if (config.disenoTarjeta === "plano") {
      return {
        borderRadius: 7,
        boxShadow: "none",
        background: "#fff",
        border: "1px solid #c8c8c8"
      };
    }
    if (config.disenoTarjeta === "gruesa") {
      return {
        borderRadius: 4,
        boxShadow: "none",
        background: "#fff",
        border: "3px solid " + config.colorPrincipal
      };
    }
    return {};
  }

  function getBotonEstilo() {
    if (config.estiloBoton === "recto") {
      return {
        borderRadius: 8,
        background: config.colorBoton,
        color: "#fff",
        border: "none"
      };
    }
    if (config.estiloBoton === "pill") {
      return {
        borderRadius: 32,
        background: config.colorBoton,
        color: "#fff",
        border: "none"
      };
    }
    if (config.estiloBoton === "borde") {
      return {
        borderRadius: 8,
        background: "#fff",
        color: config.colorBoton,
        border: "2px solid " + config.colorBoton
      };
    }
    return {};
  }

  // --- Preview: qué mostrar según la sección ---
  const seccionesActivas = secciones.filter(sec => !sec.oculta);
  const seccionActual = seccionesActivas.find(s => s.id === previewSection) || seccionesActivas[0];

  // Detecta si es una sección de combos (nombre incluye combos, bolson, promo, pack)
  const esSeccionCombos = seccionActual?.nombre?.toLowerCase().match(/combo|bols[oó]n|promo|pack/);

  let itemsVista = [];
  if (esSeccionCombos) {
    itemsVista = combos.filter(
      c => (!c.oculto) && (c.seccionId === seccionActual?.id)
    );
  } else {
    itemsVista = productos.filter(
      p => (!p.oculto) && (p.seccionId === seccionActual?.id)
    );
  }

  // --- Botones flotantes dentro del marco del celu ---
  function getPos(style) {
    // Reusable para carrito y WhatsApp (ajusta top/bottom/left/right)
    switch (style) {
      case "bottom-right": return { right: 20, bottom: 18 };
      case "bottom-left": return { left: 20, bottom: 18 };
      case "top-right": return { right: 20, top: 18 };
      case "top-left": return { left: 20, top: 18 };
      case "fixed-bottom": return { left: "50%", bottom: 10, transform: "translateX(-50%)" };
      case "fixed-top": return { left: "50%", top: 10, transform: "translateX(-50%)" };
      default: return { right: 20, bottom: 18 };
    }
  }

  // --- Render producto o combo ---
  function renderProducto(item, i) {
    if (!item) {
      return (
        <div key={"placeholder-" + i} style={{ margin: 8, padding: 12, color: "#bbb" }}>
          Producto no cargado
        </div>
      );
    }

    const isCombo = item.productos && Array.isArray(item.productos);

    if (config.vistaCatalogo === "lista") {
      return (
        <div key={item.id} style={{
          display: "flex",
          alignItems: "center",
          background: "#fff",
          ...getTarjetaEstilo(),
          margin: "8px 0",
          minHeight: 66,
          maxWidth: "100%"
        }}>
          <img src={item.imagen} alt={item.nombre} style={{ width: 60, height: 60, borderRadius: 12, marginRight: 13, objectFit: "cover" }} />
          <div style={{ flex: 1, color: config.colorTexto }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{item.nombre}</div>
            <div style={{ fontSize: 13, color: "#666" }}>{item.descripcion}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: config.colorBoton, marginTop: 3 }}>
              {isCombo
                ? (item.precio ? `$${item.precio}` : "Precio combo")
                : `$${item.precio} ${item.unidad ? `/ ${item.unidad}` : ""}`
              }
            </div>
          </div>
          <button style={{ ...getBotonEstilo(), marginLeft: 15, minWidth: 80 }}>Agregar</button>
        </div>
      );
    }
    if (config.vistaCatalogo === "cuadricula") {
      return (
        <div key={item.id} style={{
          ...getTarjetaEstilo(),
          margin: 7,
          width: `calc(${100 / config.columnas}% - 20px)`,
          display: "inline-block",
          verticalAlign: "top",
          color: config.colorTexto
        }}>
          <img src={item.imagen} alt={item.nombre} style={{ width: "85%", height: 86, borderRadius: 12, objectFit: "cover", margin: "10px auto 4px auto", display: "block" }} />
          <div style={{ fontWeight: 700, fontSize: 16 }}>{item.nombre}</div>
          <div style={{ fontSize: 13, color: "#666" }}>{item.descripcion}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: config.colorBoton, marginTop: 3 }}>
            {isCombo
              ? (item.precio ? `$${item.precio}` : "Precio combo")
              : `$${item.precio} ${item.unidad ? `/ ${item.unidad}` : ""}`
            }
          </div>
          <button style={{ ...getBotonEstilo(), margin: "12px 0 8px 0", minWidth: 80 }}>Agregar</button>
        </div>
      );
    }
    if (config.vistaCatalogo === "foto") {
      return (
        <div key={item.id} style={{
          ...getTarjetaEstilo(),
          margin: "0 0 18px 0",
          width: "100%",
          position: "relative",
          color: config.colorTexto
        }}>
          <img src={item.imagen} alt={item.nombre} style={{ width: "100%", maxWidth: 265, borderRadius: 18, boxShadow: "0 2px 12px #0001", cursor: "pointer", margin: "auto" }}
            onClick={() => setPushUp(item)}
          />
          <div style={{ fontWeight: 700, marginTop: 10 }}>{item.nombre}</div>
          <div style={{ color: "#888", fontSize: 15 }}>
            {isCombo
              ? (item.precio ? `$${item.precio}` : "Precio combo")
              : (item.unidad ? `$${item.precio} / ${item.unidad}` : `$${item.precio}`)}
          </div>
          <button style={{ ...getBotonEstilo(), marginTop: 10 }}>Agregar</button>
        </div>
      );
    }
    return null;
  }

  // --- Preview del celu con notch ---
  const previewCelular = (
    <div style={{
      width: 370,
      minHeight: 740,
      borderRadius: 35,
      boxShadow: "0 2px 34px #0003, 0 1px 1px #fff6 inset",
      background: config.colorSecundario,
      position: "relative",
      margin: "0 auto",
      overflow: "hidden",
      fontFamily: config.fuente,
      fontSize: config.tamanoFuente,
      border: "5px solid #eee"
    }}>
      {/* Notch */}
      <div style={{ width: 100, height: 13, borderRadius: 7, background: "#222", margin: "10px auto 5px auto" }}></div>
      {/* Header y banner */}
      <div style={{
        background: config.colorPrincipal,
        color: "#fff",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: "12px 16px 8px 18px"
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {logoPreview && <img src={logoPreview} alt="logo" style={{ width: 38, height: 38, borderRadius: 9, marginRight: 10 }} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: 19 }}>{config.nombreNegocio || "Mi Tienda"}</div>
            {config.descripcion && <div style={{ fontSize: 13, color: "#e0e0e0" }}>{config.descripcion}</div>}
          </div>
        </div>
        {config.banner && <div style={{
          background: "#fff8",
          color: config.colorPrincipal,
          margin: "14px 0 0 0",
          borderRadius: 8,
          padding: "5px 12px",
          fontWeight: 600,
          fontSize: 14
        }}>{config.banner}</div>}
      </div>
      {/* Tabs de secciones */}
      <div style={{
        display: "flex",
        gap: 10,
        padding: "12px 13px 6px 13px",
        background: "#fff",
        justifyContent: "center",
        overflowX: "auto",
        maxWidth: "100%"
      }}>
        {seccionesActivas.length > 0 ? seccionesActivas.map(sec => (
          <div
            key={sec.id}
            onClick={() => setPreviewSection(sec.id)}
            style={{
              background: previewSection === sec.id ? config.colorPrincipal : "#e6e6e6",
              color: previewSection === sec.id ? "#fff" : "#444",
              borderRadius: 19,
              padding: "7px 17px",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: previewSection === sec.id ? "0 2px 6px #23705d33" : "none"
            }}>
            {sec.nombre}
          </div>
        )) : (
          <div style={{ color: "#bbb", fontSize: 15 }}>Sin secciones creadas</div>
        )}
      </div>
      {/* Catálogo */}
      <div style={{
        display: config.vistaCatalogo === "cuadricula" ? "flex" : "block",
        flexWrap: "wrap",
        gap: 0,
        padding: 12,
        justifyContent: config.vistaCatalogo === "cuadricula" ? "flex-start" : "unset"
      }}>
        {(itemsVista.length > 0
          ? itemsVista
          : Array(config.columnas).fill(null)
        ).map((item, i) => renderProducto(item, i))}
      </div>
      {/* Push up descriptivo */}
      {pushUp && (
        <div style={{
          position: "absolute",
          left: 0, bottom: 0,
          width: 370,
          maxWidth: "100vw",
          background: "#fff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -2px 22px #0003",
          padding: "26px 22px 22px 22px",
          zIndex: 30,
          animation: "pushUpIn 0.18s cubic-bezier(0.24,0.84,0.42,1.0)",
          fontFamily: config.fuente,
          fontSize: config.tamanoFuente
        }}>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>{pushUp.nombre}</div>
          <div style={{ color: "#3c3c3c", fontSize: 14, marginBottom: 13 }}>{pushUp.descripcion}</div>
          <button style={{ ...getBotonEstilo(), width: "100%" }} onClick={() => setPushUp(null)}>Agregar al carrito</button>
          <button style={{
            background: "none", border: "none", color: "#999", fontSize: 18, position: "absolute", top: 8, right: 16, cursor: "pointer"
          }} onClick={() => setPushUp(null)}>✕</button>
        </div>
      )}
      {/* Carrito flotante dentro del celu */}
      <div
        style={{
          position: "absolute",
          zIndex: 20,
          cursor: "pointer",
          width: 58,
          height: 58,
          borderRadius: 34,
          boxShadow: "0 2px 12px #0003",
          background: config.colorBoton,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...getPos(config.posicionCarrito)
        }}
        onClick={() => alert("Aquí se abrirá el resumen del carrito para finalizar compra")}
        title="Ver carrito"
      >
        <svg width="34" height="34" fill="#fff" viewBox="0 0 24 24">
          <path d="M10 21a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM5 6h16l-1.5 9h-13L3 2H0V0h3a1 1 0 011 1l.25 1.5L5 6zm2.16 2l1.24 7h9.2l1.25-7H7.16z" />
        </svg>
      </div>
      {/* WhatsApp flotante dentro del celu */}
      {config.mostrarWhatsapp && config.whatsappSecciones.includes(previewSection) && (
        <div style={{
          position: "absolute",
          zIndex: 20,
          cursor: "pointer",
          width: 54,
          height: 54,
          borderRadius: 32,
          boxShadow: "0 2px 8px #0002",
          background: "#25D366",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...getPos(config.whatsappPos)
        }} title="Chatear por WhatsApp">
          <svg width="32" height="32" fill="#fff" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="16" fill="#25D366" />
            <path d="M24.8 21.1c-.4-.2-2.4-1.2-2.7-1.4-.4-.2-.7-.3-1 .2-.3.5-1 1.4-1.3 1.7-.2.2-.5.3-.9.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.8-2.1-2-2.5-.2-.4 0-.6.1-.7.1-.1.2-.3.4-.5.1-.2.2-.4.3-.7.1-.2 0-.5-.1-.7-.1-.2-.9-2.2-1.2-3-.2-.5-.5-.4-.8-.4-.2 0-.5 0-.7.1-.2.1-.5.2-.7.5-.2.3-.9.9-.9 2.1s.9 2.3 1 2.5c.1.2 1.7 2.7 4.2 3.7 1.4.6 1.9.7 2.5.6.5-.1 1.3-.5 1.5-.9.2-.4.2-.8.1-1-.2-.3-.6-.4-1-.6z" fill="#fff" />
          </svg>
        </div>
      )}
      <style>
        {`
          @keyframes pushUpIn {
            from { transform: translateY(100%); opacity: 0.4 }
            to { transform: translateY(0); opacity: 1 }
          }
        `}
      </style>
    </div>
  );

  // --- FORMULARIO DE EDICIÓN ---
  return (
    <div style={{ display: "flex", gap: 32, alignItems: "flex-start", maxWidth: 1500, margin: "0 auto", padding: 20 }}>
      {/* Panel de edición */}
      <div style={{ width: 420, background: "#f9fbfa", borderRadius: 18, boxShadow: "0 2px 18px #0001", padding: 30 }}>
        <h2 style={{ fontSize: 25, fontWeight: 700, marginBottom: 18 }}>Apariencia de la Tienda</h2>

        {/* Logo, nombre y descripción */}
        <div style={{ marginBottom: 14 }}>
          <label><b>Logo:</b></label>
          <input type="file" accept="image/*" onChange={handleLogo} style={{ marginTop: 5 }} />
          {logoPreview && <img src={logoPreview} alt="logo" style={{ width: 48, height: 48, borderRadius: 9, marginLeft: 10, verticalAlign: "middle", background: "#eee" }} />}
        </div>
        <div style={{ marginBottom: 8 }}>
          <label><b>Nombre:</b></label>
          <input type="text" value={config.nombreNegocio}
            onChange={e => setConfig(c => ({ ...c, nombreNegocio: e.target.value }))}
            style={{ fontSize: 16, fontWeight: 600, borderRadius: 8, border: "1px solid #eee", padding: "7px 16px", marginLeft: 10, width: 220 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label><b>Descripción:</b></label>
          <input type="text" value={config.descripcion}
            onChange={e => setConfig(c => ({ ...c, descripcion: e.target.value }))}
            style={{ fontSize: 15, borderRadius: 8, border: "1px solid #eee", padding: "7px 16px", marginLeft: 10, width: 270 }}
            placeholder="Ej: Verduras frescas, bolsones y almacén"
          />
        </div>
        {/* Banner */}
        <div style={{ marginBottom: 18 }}>
          <label><b>Banner superior:</b></label>
          <input type="text" value={config.banner}
            onChange={e => setConfig(c => ({ ...c, banner: e.target.value }))}
            style={{ fontSize: 16, borderRadius: 8, border: "1px solid #eee", padding: "7px 16px", marginLeft: 12, width: 270 }}
            placeholder="Ej: Envíos gratis a partir de $5000"
          />
        </div>

        {/* Vista catálogo */}
        <div style={{ marginBottom: 15 }}>
          <label><b>Vista catálogo:</b></label>
          {VISTAS.map(v =>
            <label key={v.value} style={{ marginLeft: 13 }}>
              <input type="radio" name="vistaCatalogo" checked={config.vistaCatalogo === v.value}
                onChange={() => setConfig(c => ({ ...c, vistaCatalogo: v.value }))}
              /> {v.label}
            </label>
          )}
          {config.vistaCatalogo === "cuadricula" && (
            <>
              <span style={{ marginLeft: 13, color: "#555" }}>Columnas:</span>
              <select value={config.columnas}
                onChange={e => setConfig(c => ({ ...c, columnas: Number(e.target.value) }))}
                style={{ marginLeft: 8, borderRadius: 8, padding: "2px 8px" }}
              >
                {[1, 2, 3].map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </>
          )}
        </div>

        {/* Diseño tarjetas y botón */}
        <div style={{ marginBottom: 15 }}>
          <label><b>Diseño tarjeta:</b></label>
          <select value={config.disenoTarjeta}
            onChange={e => setConfig(c => ({ ...c, disenoTarjeta: e.target.value }))}
            style={{ marginLeft: 10, borderRadius: 8, padding: "2px 8px" }}
          >
            {TARJETAS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 15 }}>
          <label><b>Botón “Agregar”:</b></label>
          <select value={config.estiloBoton}
            onChange={e => setConfig(c => ({ ...c, estiloBoton: e.target.value }))}
            style={{ marginLeft: 10, borderRadius: 8, padding: "2px 8px" }}
          >
            {ESTILOS_BOTON.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Colores y tipografía */}
        <div style={{ marginBottom: 15 }}>
          <label><b>Color principal:</b></label>
          <input type="color" value={config.colorPrincipal}
            onChange={e => setConfig(c => ({ ...c, colorPrincipal: e.target.value }))}
            style={{ marginLeft: 10, width: 34, height: 24, border: "none" }} />
          <label style={{ marginLeft: 16 }}><b>Secundario:</b></label>
          <input type="color" value={config.colorSecundario}
            onChange={e => setConfig(c => ({ ...c, colorSecundario: e.target.value }))}
            style={{ marginLeft: 5, width: 34, height: 24, border: "none" }} />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label><b>Color botón:</b></label>
          <input type="color" value={config.colorBoton}
            onChange={e => setConfig(c => ({ ...c, colorBoton: e.target.value }))}
            style={{ marginLeft: 10, width: 34, height: 24, border: "none" }} />
          <label style={{ marginLeft: 16 }}><b>Color texto:</b></label>
          <input type="color" value={config.colorTexto}
            onChange={e => setConfig(c => ({ ...c, colorTexto: e.target.value }))}
            style={{ marginLeft: 5, width: 34, height: 24, border: "none" }} />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label><b>Tipografía:</b></label>
          <select value={config.fuente}
            onChange={e => setConfig(c => ({ ...c, fuente: e.target.value }))}
            style={{ marginLeft: 12, borderRadius: 8, padding: "2px 8px" }}
          >
            {FUENTES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <label style={{ marginLeft: 18 }}><b>Tamaño:</b></label>
          <select value={config.tamanoFuente}
            onChange={e => setConfig(c => ({ ...c, tamanoFuente: e.target.value }))}
            style={{ marginLeft: 6, borderRadius: 8, padding: "2px 8px" }}
          >
            {TAMANOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {/* Carrito */}
        <div style={{ marginBottom: 15 }}>
          <label><b>Posición carrito:</b></label>
          <select value={config.posicionCarrito}
            onChange={e => setConfig(c => ({ ...c, posicionCarrito: e.target.value }))}
            style={{ marginLeft: 12, borderRadius: 8, padding: "2px 8px" }}
          >
            {POSICIONES_CARRITO.map(pos => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
          </select>
        </div>
        {/* WhatsApp */}
        <div style={{ marginBottom: 15 }}>
          <label>
            <input type="checkbox" checked={config.mostrarWhatsapp}
              onChange={e => setConfig(c => ({ ...c, mostrarWhatsapp: e.target.checked }))}
            /> <b>Mostrar botón WhatsApp</b>
          </label>
          {config.mostrarWhatsapp && (
            <>
              <label style={{ marginLeft: 12 }}><b>Posición:</b></label>
              <select value={config.whatsappPos}
                onChange={e => setConfig(c => ({ ...c, whatsappPos: e.target.value }))}
                style={{ marginLeft: 5, borderRadius: 8, padding: "2px 8px" }}
              >
                {POSICIONES_CARRITO.map(pos => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
              </select>
              <div style={{ marginTop: 7, marginLeft: 12 }}>
                <label><b>En qué secciones mostrar:</b></label>
                <div>
                  {seccionesActivas.map(sec => (
                    <label key={sec.id} style={{ display: "block", marginLeft: 6 }}>
                      <input type="checkbox" checked={config.whatsappSecciones.includes(sec.id)}
                        onChange={e => {
                          let arr = [...config.whatsappSecciones];
                          if (e.target.checked) arr.push(sec.id); else arr = arr.filter(id => id !== sec.id);
                          setConfig(c => ({ ...c, whatsappSecciones: arr }));
                        }} />
                      {sec.nombre}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        {/* Guardar */}
        <div style={{ marginTop: 22 }}>
          <button onClick={guardarCambios} style={{
            background: config.colorPrincipal,
            color: "#fff",
            fontWeight: 700,
            fontSize: 17,
            border: "none",
            borderRadius: 8,
            padding: "13px 32px"
          }}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
          {mensaje && <span style={{ color: "green", marginLeft: 14 }}>{mensaje}</span>}
        </div>
      </div>
      {/* Preview móvil */}
      <div>
        {previewCelular}
      </div>
    </div>
  );
}
