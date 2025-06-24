
const FilaLectura = ({ fila, onEditar, onBorrar }) => {
  return (
    <tr>
      {Object.entries(fila).map(([clave, valor]) => (
        <td key={clave} className="border p-1">{valor}</td>
      ))}
      <td className="flex flex-row gap-1 p-1">
        <button className="bg-yellow-500 text-white rounded px-2 py-1 text-xs" onClick={onEditar}>
          ✏️
        </button>
        <button className="bg-red-500 text-white rounded px-2 py-1 text-xs" onClick={onBorrar}>
          🗑️
        </button>
      </td>
    </tr>
  );
};

export default FilaLectura;
