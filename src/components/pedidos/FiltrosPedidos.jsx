
import React from "react";
import { Link } from "react-router-dom";
import { Trans } from "react-i18next";

export default function FiltrosPedidos({
  t,
  filtros,
  setFiltros,
  camposLista,
  conceptoFiltro,
  setConceptoFiltro,
  valorFiltro,
  setValorFiltro,
  opcionesFiltro,
  buscado,
  setBuscado,
  exportarExcel,
  exportarPDF,
  imprimir
}) {
  return (
    <>
      <div style={{ marginTop: 10 }}>
        <h3 style={{ marginTop: "1rem" }}>
          {t("prepararPedidos.subtitulo")}
        </h3>
        <p style={{ fontStyle: "italic", marginBottom: "1.5rem" }}>
          <Trans
            i18nKey="prepararPedidos.leyenda"
            components={{
              1: <strong />,
              3: <Link to="/apariencia/comanda" />
            }}
          />
        </p>
      </div>

      <div className="no-print" style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        rowGap: 14,
        background: "#eee",
        padding: 10,
        borderRadius: 8,
        marginBottom: 16
      }}>
        {camposLista.length > 0 && (
          <>
            <label style={{ fontWeight: 600 }}>{t("prepararPedidos.filtrarPor")}</label>
            <select
              value={conceptoFiltro}
              onChange={e => setConceptoFiltro(e.target.value)}
              style={{ minWidth: 120, flex: "1 1 150px" }}
            >
              {camposLista.map(campo => (
                <option key={campo.nombre} value={campo.nombre}>
                  {t(`prepararPedidos.${campo.nombre}`) || (campo.nombre.charAt(0).toUpperCase() + campo.nombre.slice(1))}
                </option>
              ))}
            </select>
            <label style={{ fontWeight: 600 }}>{t("prepararPedidos.valor")}</label>
            <select
              value={valorFiltro}
              onChange={e => setValorFiltro(e.target.value)}
              style={{ minWidth: 120, flex: "1 1 150px" }}
            >
              <option value="">{t("prepararPedidos.seleccioneValor", { concepto: conceptoFiltro })}</option>
              {opcionesFiltro.map(opcion => (
                <option key={opcion.id} value={opcion.nombre}>
                  {opcion.nombre}
                </option>
              ))}
            </select>
          </>
        )}
        <input type="date" value={filtros.fechaDesde} onChange={e => setFiltros({ ...filtros, fechaDesde: e.target.value })} placeholder={t("prepararPedidos.fechaDesde")} />
        <input type="date" value={filtros.fechaHasta} onChange={e => setFiltros({ ...filtros, fechaHasta: e.target.value })} placeholder={t("prepararPedidos.fechaHasta")} />
        <input
          type="text"
          placeholder={t("prepararPedidos.buscarCliente")}
          value={filtros.search}
          onChange={e => setFiltros({ ...filtros, search: e.target.value })}
          style={{ minWidth: 180, flex: "1 1 200px" }}
        />
        <button onClick={() => setBuscado(true)}>{t("prepararPedidos.buscar")}</button>
        {buscado && (
          <>
            <button onClick={imprimir}>{t("prepararPedidos.imprimir")}</button>
            <button onClick={exportarExcel}>{t("prepararPedidos.exportarExcel")}</button>
            <button onClick={exportarPDF}>{t("prepararPedidos.exportarPDF")}</button>
          </>
        )}
      </div>
    </>
  );
}
