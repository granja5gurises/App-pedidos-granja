
const FilaEdicion = ({ fila, campos, onGuardar, onCancelar, onCambio }) => {
  return (
    <tr>
      {campos.map((campo) => (
        <td key={campo} className="p-1">
          <input
            className="border rounded w-full px-2 py-1 text-xs"
            value={fila[campo] || ""}
            onChange={(e) => onCambio(campo, e.target.value)}
          />
        </td>
      ))}
      <td className="flex flex-row gap-1 p-1">
        <button className="bg-green-600 text-white rounded px-2 py-1 text-xs" onClick={onGuardar}>
          💾
        </button>
        <button className="bg-gray-400 text-white rounded px-2 py-1 text-xs" onClick={onCancelar}>
          ❌
        </button>
      </td>
    </tr>
  );
};

export default FilaEdicion;
