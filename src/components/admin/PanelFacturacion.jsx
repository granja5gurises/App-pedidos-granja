import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  addDoc,
  runTransaction,
} from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from "react-i18next";
import BotonVolver from "./BotonVolver";

const CAMPOS_ENCABEZADO = [
  { key: "nombre", labelKey: "facturacion.nombre" },
  { key: "direccion", labelKey: "facturacion.direccion" },
  { key: "cuit", labelKey: "facturacion.cuit" },
  { key: "tel", labelKey: "facturacion.tel" },
  { key: "email", labelKey: "facturacion.email" },
  { key: "iva", labelKey: "facturacion.iva" },
  { key: "ciudad", labelKey: "facturacion.ciudad" },
  { key: "provincia", labelKey: "facturacion.provincia" },
];

export default function PanelFacturacion() {
  const { t } = useTranslation();

  const [datos, setDatos] = useState({
    logo: "",
    nombre: "",
    direccion: "",
    cuit: "",
    tel: "",
    email: "",
    iva: "",
    ciudad: "",
    provincia: "",
    leyenda: "",
  });
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      const ref = doc(db, "configuracion", "facturacion");
      const snap = await getDoc(ref);
      if (snap.exists()) setDatos((prev) => ({ ...prev, ...snap.data() }));
    };
    cargarDatos();
  }, []);

  const handleInput = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const guardarDatos = async () => {
    await setDoc(doc(db, "configuracion", "facturacion"), datos, { merge: true });
    setMensaje(t("facturacion.guardado"));
    setTimeout(() => setMensaje(""), 1800);
  };

  const [pedidos, setPedidos] = useState([]);
  const [busquedaPedidos, setBusquedaPedidos] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);
  useEffect(() => {
    const fetchPedidos = async () => {
      const snap = await getDocs(collection(db, "pedidos"));
      setPedidos(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchPedidos();
  }, []);

  const pedidosFiltrados = pedidos.filter((p) => {
    const str = busquedaPedidos.toLowerCase();
    const campos = [
      p.nombre,
      p.apellido,
      p.ciudad,
      p.comprobante,
      p.fecha?.seconds
        ? new Date(p.fecha.seconds * 1000).toLocaleDateString()
        : "",
    ];
    return campos.some((v) => (v || "").toString().toLowerCase().includes(str));
  });

  const toggleSeleccionado = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const [facturas, setFacturas] = useState([]);
  const [busquedaFact, setBusquedaFact] = useState("");
  useEffect(() => {
    const fetchFacturas = async () => {
      const snap = await getDocs(collection(db, "facturas"));
      setFacturas(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchFacturas();
  }, []);
  const facturasFiltradas = facturas.filter((f) => {
    const str = busquedaFact.toLowerCase();
    const campos = [
      f.nroFactura,
      f.cliente,
      f.ciudad,
      f.fecha ? new Date(f.fecha.seconds * 1000).toLocaleDateString() : "",
    ];
    return campos.some((v) => (v || "").toString().toLowerCase().includes(str));
  });

  async function getNuevoNroFactura() {
    const ref = doc(db, "configuracion", "correlativos");
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      let nroFactura = 1;
      if (snap.exists()) {
        nroFactura = snap.data().nroFactura || 1;
      }
      transaction.set(ref, { nroFactura: nroFactura + 1 }, { merge: true });
      return "F" + String(nroFactura).padStart(6, "0");
    });
  }

  const handleGenerarFactura = async () => {
    if (seleccionados.length === 0) return;
    const pedidosAFacturar = pedidos.filter((p) => seleccionados.includes(p.id));
    for (const p of pedidosAFacturar) {
      const nroFactura = await getNuevoNroFactura();
      await generarPDF(p, nroFactura);
      await guardarFacturaEnFirestore(p, nroFactura);
    }
    setSeleccionados([]);
    alert(t("facturacion.facturasGeneradas"));
    const snap = await getDocs(collection(db, "facturas"));
    setFacturas(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  async function generarPDF(pedido, nroFactura) {
    const docPdf = new jsPDF("p", "mm", "a4");
    let yPos = 14;

    if (datos.logo) {
      try {
        const img = await toDataURL(datos.logo);
        docPdf.addImage(img, "PNG", 15, yPos, 32, 18, undefined, "FAST");
      } catch {
        /* ignore */
      }
    }

    // Número comprobante centrado arriba
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(16);
    docPdf.text(
      `${t("facturacion.tipoComprobante")} Nº ${nroFactura}`,
      docPdf.internal.pageSize.getWidth() / 2,
      yPos + 7,
      { align: "center" }
    );

    // Leyenda "No válido como factura"
    docPdf.setFontSize(11);
    docPdf.setTextColor(100);
    docPdf.text(
      t("facturacion.noValido"),
      docPdf.internal.pageSize.getWidth() / 2,
      yPos + 14,
      { align: "center" }
    );

    // Fecha emisión debajo, centrada
    docPdf.text(
      `${t("facturacion.fechaEmision")}: ${new Date().toLocaleDateString()}`,
      docPdf.internal.pageSize.getWidth() / 2,
      yPos + 21,
      { align: "center" }
    );

    // Datos empresa alineados a la izquierda, más abajo
    const xDatos = 15;
    let yDatos = yPos + 30;
    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(11);
    const campos = CAMPOS_ENCABEZADO.filter((c) => datos[c.key]);
    campos.forEach((item, idx) => {
      docPdf.text(`${t(item.labelKey)}: ${datos[item.key]}`, xDatos, yDatos + idx * 6);
    });

    // Datos cliente y pedido
    let yCliente = yDatos + campos.length * 6 + 12;
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(11);
    docPdf.text(
      `${t("facturacion.cliente")}: ${pedido.apellido || ""}, ${pedido.nombre || ""}`,
      xDatos,
      yCliente
    );
    if (pedido.dni) {
      docPdf.text(`${t("facturacion.dni")}: ${pedido.dni}`, 110, yCliente);
    }
    yCliente += 6;
    docPdf.setFont("helvetica", "normal");
    if (pedido.direccion) {
      docPdf.text(`${t("facturacion.direccion")}: ${pedido.direccion}`, xDatos, yCliente);
      yCliente += 6;
    }
    if (pedido.ciudad) {
      docPdf.text(`${t("facturacion.ciudad")}: ${pedido.ciudad}`, xDatos, yCliente);
      yCliente += 6;
    }
    docPdf.text(`${t("facturacion.condicionVenta")}: ${t("facturacion.contado")}`, xDatos, yCliente);
    yCliente += 8;

    // Tabla productos
    autoTable(docPdf, {
      startY: yCliente,
      head: [[t("facturacion.cant"), t("facturacion.descripcion"), t("facturacion.pUnit"), t("facturacion.totalCol")]],
      body: (pedido.productos || []).map((prod) => [
        prod.cantidad,
        prod.nombre,
        `$${prod.precio}`,
        `$${prod.precio * prod.cantidad}`,
      ]),
      theme: "plain",
      styles: {
        fontSize: 10,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      didDrawCell: (data) => {
        if (data.section === "body" || data.section === "head") {
          docPdf.setLineWidth(0.1);
          docPdf.setDrawColor(0);
          docPdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        }
      },
    });

    // Total
    let tableEnd = docPdf.lastAutoTable.finalY || (yCliente + 25);
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(13);
    docPdf.text(`${t("facturacion.total")}: $${pedido.total || 0}`, 195 - 15, tableEnd + 10, {
      align: "right",
    });

    // Pie de página centrado con leyenda (si hay)
    if (datos.leyenda) {
      docPdf.setFontSize(10);
      docPdf.setFont("helvetica", "italic");
      docPdf.text(
        datos.leyenda,
        docPdf.internal.pageSize.getWidth() / 2,
        287,
        { align: "center" }
      );
    }

    // Guardar PDF en carpeta por defecto
    docPdf.save(`comprobante_${nroFactura}.pdf`);
  }

  async function guardarFacturaEnFirestore(pedido, nroFactura) {
    await addDoc(collection(db, "facturas"), {
      nroFactura,
      fecha: new Date(),
      cliente: pedido.nombre + " " + (pedido.apellido || ""),
      ciudad: pedido.ciudad,
      total: pedido.total,
      pedidos: [pedido.id],
    });
  }

  function toDataURL(url) {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // Abrir PDF guardado (asume carpeta por defecto Descargas)
  const abrirPDF = (nroFactura) => {
    const url = `${window.location.origin}/comprobante_${nroFactura}.pdf`;
    window.open(url, "_blank");
  };

  return (
    <div style={{ padding: 28, maxWidth: 1250 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 0 }}>
          {t("facturacion.titulo")}
        </h2>
        <BotonVolver ruta="/dashboard-admin" />
      </div>
      <div
        style={{
          background: "#f5f5fa",
          border: "1px solid #dde",
          padding: "18px 20px",
          borderRadius: 9,
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontWeight: 700, fontSize: 20 }}>{t("facturacion.encabezado")}</h3>
        <div style={{ marginBottom: 8, fontSize: 14, color: "#555" }}>
          {t("facturacion.aclaracion")}
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <label>
              {t("facturacion.logo")}
              <br />
              <input
                type="text"
                name="logo"
                value={datos.logo}
                onChange={handleInput}
                placeholder={t("facturacion.placeholderLogo")}
                style={{ width: 260 }}
              />
            </label>
            {datos.logo && (
              <div
                style={{
                  marginTop: 5,
                  maxWidth: 140,
                  maxHeight: 70,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
              >
                <img
                  src={datos.logo}
                  alt="Logo"
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                />
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CAMPOS_ENCABEZADO.map((campo) => (
              <label key={campo.key}>
                {t(campo.labelKey)}
                <br />
                <input
                  type="text"
                  name={campo.key}
                  value={datos[campo.key]}
                  onChange={handleInput}
                  style={{ width: 250 }}
                />
              </label>
            ))}
          </div>
        </div>
        <label style={{ display: "block", marginTop: 10 }}>
          {t("facturacion.leyenda")}
          <input
            type="text"
            name="leyenda"
            value={datos.leyenda}
            onChange={handleInput}
            placeholder={t("facturacion.placeholderLeyenda")}
            style={{ width: 380, marginLeft: 7 }}
          />
        </label>
        <button
          onClick={guardarDatos}
          style={{
            marginTop: 14,
            padding: "8px 30px",
            fontSize: 15,
            fontWeight: 700,
            borderRadius: 8,
          }}
        >
          {t("facturacion.guardar")}
        </button>
        {mensaje && (
          <span style={{ color: "green", marginLeft: 15 }}>{mensaje}</span>
        )}
      </div>

      <div
        style={{
          background: "#f7f8ff",
          border: "1px solid #e1e5f1",
          padding: "16px 16px",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontWeight: 600, marginBottom: 12 }}>
          {t("facturacion.pedidosAFacturar")}
        </h3>
        <input
          type="text"
          placeholder={t("facturacion.buscarPedido")}
          value={busquedaPedidos}
          onChange={(e) => setBusquedaPedidos(e.target.value)}
          style={{ marginBottom: 10, padding: "6px 15px", fontSize: 15, width: 330 }}
        />
        <div style={{ maxHeight: 330, overflowY: "auto" }}>
          {pedidosFiltrados.length === 0 ? (
            <div style={{ color: "#aaa", fontSize: 18, marginTop: 24 }}>
              {t("facturacion.noPedidos")}
            </div>
          ) : (
            <table
              border={1}
              cellPadding={7}
              style={{ marginTop: 10, width: "100%", background: "#fff" }}
            >
              <thead style={{ background: "#e8ebf7" }}>
                <tr>
                  <th></th>
                  <th>{t("facturacion.nroPedido")}</th>
                  <th>{t("facturacion.nombre")}</th>
                  <th>{t("facturacion.ciudad")}</th>
                  <th>{t("facturacion.fecha")}</th>
                  <th>{t("facturacion.total")}</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={seleccionados.includes(p.id)}
                        onChange={() => toggleSeleccionado(p.id)}
                      />
                    </td>
                    <td>{p.comprobante}</td>
                    <td>
                      {p.nombre} {p.apellido}
                    </td>
                    <td>{p.ciudad}</td>
                    <td>
                      {p.fecha
                        ? new Date(p.fecha.seconds * 1000).toLocaleDateString()
                        : ""}
                    </td>
                    <td>${p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <button
          onClick={handleGenerarFactura}
          disabled={seleccionados.length === 0}
          style={{
            marginTop: 20,
            padding: "10px 34px",
            fontSize: 17,
            fontWeight: 800,
            borderRadius: 9,
            background: "#1a3bad",
            color: "#fff",
            border: "none",
          }}
        >
          {t("facturacion.generarFactura")}
        </button>
      </div>

      <div
        style={{
          background: "#f5faf7",
          border: "1px solid #cbe6d2",
          padding: "14px 16px",
          borderRadius: 8,
        }}
      >
        <h3 style={{ fontWeight: 600, marginBottom: 12 }}>
          {t("facturacion.facturasEmitidas")}
        </h3>
        <input
          type="text"
          placeholder={t("facturacion.buscarFactura")}
          value={busquedaFact}
          onChange={(e) => setBusquedaFact(e.target.value)}
          style={{ marginBottom: 10, padding: "6px 15px", fontSize: 15, width: 340 }}
        />
        <div style={{ maxHeight: 330, overflowY: "auto" }}>
          {facturasFiltradas.length === 0 ? (
            <div style={{ color: "#aaa", fontSize: 18, marginTop: 24 }}>
              {t("facturacion.noFacturas")}
            </div>
          ) : (
            <table
              border={1}
              cellPadding={7}
              style={{ marginTop: 10, width: "100%", background: "#fff" }}
            >
              <thead style={{ background: "#e6f3ea" }}>
                <tr>
                  <th>{t("facturacion.nroFactura")}</th>
                  <th>{t("facturacion.nombre")}</th>
                  <th>{t("facturacion.ciudad")}</th>
                  <th>{t("facturacion.fecha")}</th>
                  <th>{t("facturacion.total")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {facturasFiltradas.map((f) => (
                  <tr key={f.id}>
                    <td>{f.nroFactura}</td>
                    <td>{f.cliente}</td>
                    <td>{f.ciudad}</td>
                    <td>
                      {f.fecha
                        ? new Date(f.fecha.seconds * 1000).toLocaleDateString()
                        : ""}
                    </td>
                    <td>${f.total}</td>
                    <td>
                      <button
                        onClick={() =>
                          window.open(
                            `${window.location.origin}/comprobante_${f.nroFactura}.pdf`,
                            "_blank"
                          )
                        }
                      >
                        {t("facturacion.verPDF")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
