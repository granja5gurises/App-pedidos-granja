import { useState } from "react";

const [nuevo, setNuevo] = useState({
  nombre: "",
  descripcion: "",
  imagen: "",
  productos: [],
  descuento: 0,
  stock: "",
  oculto: false,
  seccionId: ""
});
const [busquedaProducto, setBusquedaProducto] = useState("");
const [redondeoTipo, setRedondeoTipo] = useState("arriba");
const [redondeoMultiplo, setRedondeoMultiplo] = useState(10);

const opcionesMultiplo = [
  { label: t("combos.unidad"), value: 1 },
  { label: t("combos.decena"), value: 10 },
  { label: t("combos.centena"), value: 100 },
  { label: t("combos.mil"), value: 1000 },
];

const getProducto = (id) => productos.find(p => p.id === id);

const redondear = (valor, tipo, multiplo) => {
  if (multiplo <= 1) return Math[tipo === "arriba" ? "ceil" : "floor"](valor);
  const factor = multiplo;
  return tipo === "arriba"
    ? Math.ceil(valor / factor) * factor
    : Math.floor(valor / factor) * factor;
};

const calcularPrecios = (productosCombo, descuento = 0) => {
  let suma = 0;
  productosCombo.forEach(item => {
    const p = getProducto(item.productoId);
    if (p && p.precio && item.cantidad > 0) {
      suma += Number(p.precio) * Number(item.cantidad);
    }
  });
  const precioBase = suma;
  const precioDesc = descuento > 0 && descuento < 100
    ? precioBase * (1 - descuento / 100)
    : precioBase;
  const precioRed = redondear(precioDesc, redondeoTipo, Number(redondeoMultiplo));
  return {
    base: precioBase,
    descuento: precioDesc,
    redondeado: precioRed
  };
};

const handleCantidad = (productoId, cant) => {
  setNuevo(n => {
    const productos = n.productos.filter(p => p.productoId !== productoId);
    if (cant > 0) productos.push({ productoId, cantidad: Number(cant) });
    return { ...n, productos };
  });
};

const agregarProductoBuscado = (productoId) => {
  setNuevo(n => {
    if (n.productos.some(x => x.productoId === productoId)) return n;
    return {
      ...n,
      productos: [...n.productos, { productoId, cantidad: 1 }]
    };
  });
  setBusquedaProducto("");
};

const quitarProductoBuscado = (productoId) => {
  setNuevo(n => ({
    ...n,
    productos: n.productos.filter(x => x.productoId !== productoId)
  }));
};

const preciosMostrados = calcularPrecios(nuevo.productos, nuevo.descuento);

const handleNuevoCombo = () => {
  if (!nuevo.nombre || !nuevo.stock || !nuevo.seccionId || !nuevo.productos.length) {
    toast.error(t("combos.errorCompleta"));
    return;
  }
  const precios = calcularPrecios(nuevo.productos, nuevo.descuento);
  const comboFinal = {
    ...nuevo,
    stock: Number(nuevo.stock),
    descuento: Number(nuevo.descuento),
    precioFinal: precios.redondeado
  };
  crearDocumento("combos", comboFinal)
    .then(() => {
      toast.success(t("combos.creado"));
      cargarCombos();
      setNuevo({
        nombre: "",
        descripcion: "",
        imagen: "",
        productos: [],
        descuento: 0,
        stock: "",
        oculto: false,
        seccionId: ""
      });
    })
    .catch(() => toast.error(t("combos.errorCrear")));
};


export default CombosForm;
