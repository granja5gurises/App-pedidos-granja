
import React from "react";
import { getNombreUnidad } from "./CombosHelpers";
import panelStyles from "../../../estilos/panelStyles";

const CombosTabla = ({ combos, productos, onEditar, onEliminar }) => {
  const handleEditar = (combo) => {
    const copia = {
      id: combo.id,
      nombre: combo.nombre,
      descuento: combo.descuento,
      productos: combo.productos,
      imagen: combo.imagen || "",
      precioFinal: combo.precioFinal,
    };
    onEditar(copia);
  };

  return (
    <div>
      <h3 style={panelStyles.titulo}>Combos existentes</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {combos.map((combo) => (
          <div key={combo.id} style={{ ...panelStyles.tarjeta, width: "300px" }}>
            {combo.imagen && (
              <img
                src={combo.imagen}
                alt={combo.nombre}
                style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "8px" }}
              />
            )}
            <div style={{ marginTop: "0.5rem" }}>
              <strong>{combo.nombre}</strong>
              <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
                {combo.productos.map((p, idx) => (
                  <li key={idx}>
                    {getNombreUnidad(productos, p.productoId)} x {p.cantidad}
                  </li>
                ))}
              </ul>
              <p style={{ margin: 0 }}>Descuento: {combo.descuento}%</p>
              <p style={{ marginBottom: "0.5rem" }}>Precio final: ${combo.precioFinal}</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => handleEditar(combo)} style={{ flex: 1 }}>Editar</button>
                <button
                  onClick={() => onEliminar(combo.id)}
                  style={{ flex: 1, backgroundColor: "#f44336", color: "white", border: "none" }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CombosTabla;
