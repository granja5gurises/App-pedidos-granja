
// src/components/admin/panelcombos/CombosHelpers.jsx

// Buscar un producto por ID
export const getProducto = (productos, id) => {
  return productos.find(p => p.id === id);
};

// Mostrar nombre + unidad de un producto
export const getNombreUnidad = (productos, id) => {
  const p = getProducto(productos, id);
  return p ? `${p.nombre} (${p.unidad || ''})` : "";
};

// Redondear precio según tipo y múltiplo
export function redondear(valor, tipo, multiplo) {
  if (multiplo <= 1) return Math[tipo === "arriba" ? "ceil" : "floor"](valor);
  const factor = multiplo;
  return tipo === "arriba"
    ? Math.ceil(valor / factor) * factor
    : Math.floor(valor / factor) * factor;
}

// Calcular precios del combo (base, con descuento y redondeado final)
export function calcularPrecios({ productos, listaProductos, descuento = 0, tipo = "arriba", multiplo = 10 }) {
  let suma = 0;
  productos.forEach(item => {
    const p = getProducto(listaProductos, item.productoId);
    if (p && p.precio && item.cantidad > 0) {
      suma += Number(p.precio) * Number(item.cantidad);
    }
  });
  const precioBase = suma;
  const precioDesc = descuento > 0 && descuento < 100
    ? precioBase * (1 - descuento / 100)
    : precioBase;
  const precioRed = redondear(precioDesc, tipo, multiplo);
  return {
    base: precioBase,
    descuento: precioDesc,
    redondeado: precioRed
  };
}
