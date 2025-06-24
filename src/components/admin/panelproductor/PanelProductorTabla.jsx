import React from "react";

function mostrarDatoCelda(dato) {
  if (dato === null || dato === undefined) return "";
  if (Array.isArray(dato)) {
    // Mostrar nombre y cantidad si es array de productos
    if (dato.length && typeof dato[0] === "object") {
      return dato.map(
        it => (it.nombre ? `${it.nombre} (${it.cantidad ?? 1})` : JSON.stringify(it))
      ).join(", ");
    }
    return dato.join(", ");
  }
  if (typeof dato === "object") {
    // Si es fecha Firebase {seconds,...}
    if (dato.seconds) {
      const date = new Date(dato.seconds * 1000);
      return date.toLocaleDateString();
    }
    return JSON.stringify(dato);
  }
  return dato;
}

function PanelProductorTabla({ pedidos, columnas }) {
  // === AGREGADO: si no hay columnas, no se renderiza nada ===
  if (!columnas || columnas.length === 0) {
    return null;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table border={1} cellPadding={4} style={{ width: "100%", fontSize: 14 }}>
        <thead>
          <tr>
            {columnas.map(col => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p, i) => (
            <tr key={p.id || i}>
              {columnas.map(col => (
                <td key={col}>
                  {mostrarDatoCelda(p[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PanelProductorTabla;
