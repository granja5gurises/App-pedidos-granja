
import React from "react";

export default function VistaComandas({ pedidosFiltrados, configComanda, t, buscado }) {
  if (!buscado) return null;

  return (
    <div
      className="comandas-container"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0,
        justifyContent: "flex-start"
      }}
    >
      {pedidosFiltrados.length === 0 && (
        <div style={{ fontSize: 20, color: "#999", margin: "2cm auto" }}>
          {t("prepararPedidos.noPedidos")}
        </div>
      )}

      {pedidosFiltrados.length > 0 && configComanda && pedidosFiltrados.map(p => {
        const isEnvio = p.tipoEntrega === "envio";
        const costoEnvio = isEnvio ? Number(p.costoEnvio || 0) : 0;
        const totalProductos = (p.productos || []).reduce((sum, prod) => sum + (prod.precio || 0) * (prod.cantidad || 1), 0);
        const totalFinal = totalProductos + costoEnvio;

        return (
          <div
            key={p.id}
            className="comanda"
            style={{
              width: "100%",
              maxWidth: "360px",
              minHeight: "300px",
              border: "1px solid #222",
              margin: "0.5cm",
              marginBottom: "1rem",
              boxSizing: "border-box",
              pageBreakInside: "avoid",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontSize: "clamp(14px, 2.5vw, 18px)",
              padding: "10px",
              background: configComanda.colorFondo || "#ffffff",
              breakInside: "avoid"
            }}
          >
            {configComanda.logoURL && (
              <img
                src={configComanda.logoURL}
                alt="logo"
                style={{
                  width: 48,
                  marginBottom: 8,
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto"
                }}
              />
            )}

            {configComanda.campos.filter(f => f.mostrar).map(f => (
              <div
                key={f.campo}
                style={{
                  textAlign:
                    f.alineacion === "izq"
                      ? "left"
                      : f.alineacion === "centro"
                      ? "center"
                      : "right",
                  margin: 3,
                  fontWeight:
                    f.campo === "nombre" || f.campo === "apellido" ? 700 : 400
                }}
              >
                <span>{t(`aparienciaComanda.${f.campo}`) || f.campo}:</span>{" "}
                <span>
                  {f.campo === "fecha" && p.fecha?.seconds
                    ? new Date(p.fecha.seconds * 1000).toLocaleDateString()
                    : p[f.campo] || "--"}
                </span>
              </div>
            ))}

            {configComanda.mostrarProductos && (
              <div style={{ margin: 6 }}>
                <b>{t("aparienciaComanda.productos")}:</b>
                <ul style={{ margin: 0, fontSize: "clamp(13px, 2.3vw, 15px)" }}>
                  {(p.productos || []).map((prod, i) => (
                    <li key={i}>
                      {prod.nombre} x {prod.cantidad} - ${prod.precio ? prod.precio * prod.cantidad : 0}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {configComanda.mostrarTotales && (
              <div
                style={{
                  margin: 5,
                  fontWeight: "bold",
                  fontSize: "clamp(15px, 3vw, 19px)",
                  textAlign: "right"
                }}
              >
                {t("aparienciaComanda.total")}: ${totalFinal}
              </div>
            )}

            {configComanda.leyenda && (
              <div
                style={{
                  marginTop: 8,
                  textAlign: "center",
                  color: "#008"
                }}
              >
                {configComanda.leyenda}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
