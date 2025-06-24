import React from "react";

function PanelProductorConfigCampos({ camposPosibles, columnasSeleccionadas, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <strong>Columnas a mostrar:</strong>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {camposPosibles.map(campo => (
          <label key={campo}>
            <input
              type="checkbox"
              checked={columnasSeleccionadas.includes(campo)}
              onChange={() => {
                if (columnasSeleccionadas.includes(campo)) {
                  onChange(columnasSeleccionadas.filter(c => c !== campo));
                } else {
                  onChange([...columnasSeleccionadas, campo]);
                }
              }}
            />
            {campo}
          </label>
        ))}
      </div>
    </div>
  );
}

export default PanelProductorConfigCampos;