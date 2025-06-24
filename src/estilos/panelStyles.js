const panelStyles = {

  contenedor: {
    padding: 24,
    background: "#f9fafc",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif"
  },
  tarjeta: {
    background: "#ffffff",
    border: "1px solid #dbe3e9",
    padding: 16,
    borderRadius: 12,
    maxWidth: 900,
    marginBottom: 20,
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)"
  },
  tarjetaVerdeClaro: {
    background: "#eaf7ea",
    border: "1px solid #c6e2d7",
    padding: 16,
    borderRadius: 12,
    maxWidth: 900,
    marginBottom: 20,
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
    display: "flex",
    gap: 15,
    alignItems: "flex-start",
    flexWrap: "wrap",
    justifyContent: "flex-start"
  },
  tarjetaAzulClaro: {
    background: "#eaf1f7",
    border: "1px solid #a7c8e7",
    padding: 16,
    borderRadius: 12,
    maxWidth: 900,
    marginBottom: 20,
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)"
  },
  tarjetaGrisClaro: {
    background: "#f5f7f7",
    border: "1px solid #d6dbe0",
    padding: 16,
    borderRadius: 12,
    maxWidth: 900,
    marginBottom: 20,
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)"
  },
  tarjetaPrecios: {
    background: "#ffffff",
    border: "1px solid #e1e1e1",
    borderRadius: 8,
    padding: 10,
    margin: "14px 0 8px 0",
    maxWidth: 340,
    fontSize: 16,
    lineHeight: 1.7,
    boxShadow: "0 1px 5px rgba(0, 0, 0, 0.03)"
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    fontSize: 15
  },
  inputBusqueda: {
    padding: "8px 12px",
    width: "100%",
    maxWidth: 340,
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    fontSize: 15,
    boxSizing: 'border-box',
  },
  inputAncho: { // Este estilo ya no se usa directamente para imagen, pero se mantiene por si acaso
    padding: "8px 12px",
    width: "100%",
    maxWidth: 250,
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    fontSize: 15,
    boxSizing: 'border-box',
  },
  inputChico: {
    padding: "6px 8px",
    fontSize: 14,
    borderRadius: 4,
    border: "1px solid #cbd5e1",
    width: '100%',
    maxWidth: 100,
    boxSizing: 'border-box',
  },
  inputTabla: {
    padding: "4px 6px",
    fontSize: 13,
    borderRadius: 4,
    border: "1px solid #cbd5e1",
    width: '100%',
    boxSizing: 'border-box',
  },
  
  botonAgregar: {
    background: "#3b82f6",
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    borderRadius: 6,
    fontSize: 15,
    padding: "8px 20px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(59, 130, 246, 0.3)",
    transition: "background-color 0.2s ease"
  },
  botonExportar: {
    background: "#10b981", // Verde para Excel
    color: "#fff",
    border: "none",
    padding: "8px 18px",
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(16, 185, 129, 0.3)",
    // marginLeft: "auto", // Quitado, ahora es parte de un flex gap
    transition: "background-color 0.2s ease"
  },
  botonExportarPDF: { // Nuevo estilo para botón de PDF
    background: "#ef4444", // Rojo para PDF
    color: "#fff",
    border: "none",
    padding: "8px 18px",
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(239, 68, 68, 0.3)",
    transition: "background-color 0.2s ease"
  },
  botonEditarColumna: {
    marginLeft: 8,
    background: "transparent",
    border: "none",
    color: "#0f172a",
    cursor: "pointer",
    fontSize: 15,
    padding: "4px 8px",
    borderRadius: 4,
    transition: "background-color 0.2s ease",
  },
  botonEliminarColumna: {
    marginLeft: 6,
    background: "transparent",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: 15,
    padding: "4px 8px",
    borderRadius: 4,
    transition: "background-color 0.2s ease",
  },
  botonCancelar: {
    marginLeft: 8,
    background: "#f3f4f6",
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    padding: "6px 10px",
    cursor: "pointer",
    transition: "background-color 0.2s ease"
  },
  botonEliminarFila: {
    background: "#ef4444",
    border: "none",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 4,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    marginLeft: 8
  },
  botonGuardar: {
    background: "#22c55e",
    color: "white",
    border: "none",
    padding: "10px 20px",
    fontSize: 16,
    borderRadius: 8,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(34, 197, 94, 0.2)",
    transition: "background-color 0.2s ease"
  },
  botonIrAPanelLista: {
    fontSize: 14,
    padding: "4px 14px",
    border: "1.5px solid #60a5fa",
    borderRadius: 7,
    background: "#eff6ff",
    marginLeft: 8,
    cursor: "pointer",
    transition: "background-color 0.2s ease"
  },
  botonEditarOpciones: {
    fontSize: 13,
    padding: "5px 10px",
    marginLeft: 8,
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    cursor: "pointer",
    transition: "background-color 0.2s ease"
  },
  botonAlternarVisibilidad: {
    fontSize: 12,
    padding: "4px 10px",
    marginLeft: 8,
    borderRadius: 5,
    border: "1px solid #a8a8a8",
    background: "#f0f0f0",
    color: "#4a4a4a",
    cursor: "pointer",
    transition: "background-color 0.2s ease"
  },

  tabla: { display: 'none' }, 
  tablaEncabezado: { display: 'none' },
  tablaCelda: { display: 'none' },
  tablaCeldaAcciones: { display: 'none' },
  tablaCeldaImagen: { display: 'none' },
  filaPar: { display: 'none' },
  filaImpar: { display: 'none' },
  filaEdicion: { display: 'none' },


  error: {
    color: "#ef4444",
    marginTop: 7,
    fontSize: 14
  },
  linkEdicion: {
    color: "#3b82f6",
    textDecoration: "underline"
  },
  mensajeFiltro: {
    color: "#334155",
    fontSize: 13,
    marginBottom: 8
  },
  inputColCabecera: {
    padding: "5px 8px",
    fontSize: 14,
    borderRadius: 4,
    border: "1px solid #cbd5e1",
    marginRight: 4
  },

  margenInferior: {
    marginBottom: 16
  },
  sinRegistros: {
    fontStyle: "italic",
    color: "#64748b",
    marginTop: 16,
    padding: "12px 15px",
    background: "#eef0f4",
    border: "1px solid #c1c1c1",
    borderRadius: 6,
    fontSize: 15,
    marginBottom: 12
  },

  campoFijo: {
    marginBottom: 12,
    borderBottom: "1px solid #eee",
    paddingBottom: 8
  },
  campoEditable: {
    marginBottom: 12,
    borderBottom: "1px solid #eee",
    paddingBottom: 8
  },

  alertaError: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #ef4444",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 14
  },
  alertaExito: {
    background: "#dcfce7",
    color: "#16a34a",
    border: "1px solid #22c55e",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 14
  },
  alertaInfo: {
    background: "#fffbeb",
    border: "1px solid #fde047",
    color: "#b45309",
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 18
  },

  contenedorPrincipal: {
    padding: 24,
    maxWidth: 950,
    background: "#f9fafc",
    fontFamily: "system-ui, sans-serif",
    minHeight: "90vh",
    margin: "auto"
  },
  headerSuperior: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 15
  },

  subtituloFijo: {
    marginBottom: 20,
    fontSize: 14,
    fontWeight: "bold",
    color: "#666"
  },

  botonListaContenedor: {
    marginLeft: 16
  },

  tituloSeccion: {
    fontSize: 30,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 8
  },
  descripcionCampos: {
    color: "#555"
  },
  agregarCampoBloque: {
    margin: "12px 0 18px 0",
    display: "flex",
    alignItems: "center",
    gap: 10
  },

  botonGuardarContenedor: {
    marginTop: 32,
    display: "flex",
    justifyContent: "flex-end"
  },

  flexColumn: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    flexBasis: 'min(100%, 150px)', // Ajustado para un ancho base de 150px (antes 180px)
    minWidth: '0', // Fundamental para que se encoja correctamente
    marginBottom: 8
  },
  label: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 4
  },
  tooltipIcon: {
    marginLeft: 4,
    color: "#2976d1",
    cursor: "help"
  },
  flexGap12Wrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12
  },
  productoItemCantidad: {
    minWidth: 150,
    marginBottom: 2,
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  productoNombreUnidad: {
    fontWeight: 500,
    fontSize: 15,
    color: "#1a202c"
  },
  productoUnidad: {
    fontSize: 13,
    color: "#666"
  },
  busquedaResultsContenedor: {
    background: "#fff",
    border: "1px solid #d6d6d6",
    borderRadius: 5,
    maxHeight: 120,
    overflowY: "auto",
    marginBottom: 6
  },
  busquedaResultadoItem: {
    padding: "8px 12px",
    cursor: "pointer",
    borderBottom: "1px solid #eaeaea",
    transition: "background-color 0.2s ease",
  },
  busquedaSinResultados: {
    padding: 10,
    color: "#999",
    fontSize: 14,
    textAlign: "center"
  },
  productoSeleccionadoItem: {
    border: "1px solid #c6c6c6",
    borderRadius: 6,
    padding: "5px 12px",
    display: "flex",
    alignItems: "center",
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  botonQuitarProducto: {
    marginLeft: 10,
    color: "#c71111",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
    padding: "0 4px"
  },
  precioResumen: {
    fontWeight: 600,
    color: "#334155"
  },
  precioFinalDestacado: {
    color: "#127312",
    fontWeight: 700
  },
  tablaImagenCombo: {
    borderRadius: 8,
    border: "1px solid #ccc"
  },
  tablaDescripcionCombo: {
    maxWidth: 160,
    fontSize: 13,
    color: "#444"
  },
  listaProductosCombo: {
    margin: 0,
    padding: "0 0 0 15px",
    listStyle: "disc",
    fontSize: 13,
    color: "#333"
  },
  estadoVisible: {
    color: "green",
    fontWeight: 500
  },
  estadoOculto: {
    color: "crimson",
    fontWeight: 500
  },

  listaTarjetasCombos: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
    marginTop: 20,
    paddingBottom: 20
  },
  comboCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 280,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  comboCardEdit: {
    background: "#fef9c3",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: 280,
    gridColumn: '1 / -1'
  },
  cardImageContainer: {
    width: '100%',
    height: 120,
    overflow: 'hidden',
    borderRadius: 8,
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f0f0f0'
  },
  cardImage: {
    width: 'auto',
    height: '100%',
    objectFit: 'contain'
  },
  cardContent: {
    flexGrow: 1,
    marginBottom: 15
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 8,
    color: '#1a202c'
  },
  cardText: {
    fontSize: 14,
    lineHeight: 1.5,
    color: '#4a5568',
    marginBottom: 4
  },
  cardActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 10,
    borderTop: '1px solid #e2e8f0'
  },
  cardField: {
    marginBottom: 8
  }
};

export default panelStyles;