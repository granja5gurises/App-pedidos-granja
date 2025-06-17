import React, { useEffect, useState } from 'react'
import { db } from '../../firebase'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'
import BotonVolver from './BotonVolver'

function desglosarBolsones(productos) {
  let resultado = {}
  productos.forEach(item => {
    if (item.esBolson && item.contenido) {
      item.contenido.forEach(compo => {
        if (!resultado[compo.nombre]) resultado[compo.nombre] = 0
        resultado[compo.nombre] += (compo.cantidad || 1) * (item.cantidad || 1)
      })
    } else {
      if (!resultado[item.nombre]) resultado[item.nombre] = 0
      resultado[item.nombre] += (item.cantidad || 1)
    }
  })
  return resultado
}

export default function PanelProductor() {
  const { t } = useTranslation();
  const [pedidos, setPedidos] = useState([])
  const [filtros, setFiltros] = useState({
    ciudad: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: '',
    entrega: '',
    producto: '',
    cliente: ''
  })
  const [ciudades, setCiudades] = useState([])
  const [camposRegistro, setCamposRegistro] = useState([])

  useEffect(() => {
    const fetchPedidos = async () => {
      const querySnapshot = await getDocs(collection(db, 'pedidos'))
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPedidos(data)
    }
    fetchPedidos()
  }, [])

  useEffect(() => {
    const fetchCiudades = async () => {
      const snap = await getDocs(collection(db, 'ciudades'));
      setCiudades(snap.docs.map(doc => doc.id));
    }
    fetchCiudades();
  }, [])

  useEffect(() => {
    const fetchCamposRegistro = async () => {
      const ref = doc(db, "configuracion", "general");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        let arr = snap.data().camposRegistro;
        if (!Array.isArray(arr)) {
          arr = Object.entries(arr).map(([nombre, props]) => ({
            nombre,
            ...props
          }));
        }
        setCamposRegistro(arr.filter(c => c.visible !== false));
      }
    };
    fetchCamposRegistro();
  }, []);

  const productosUnicos = [
    ...new Set(
      pedidos.flatMap(p => (p.productos || []).map(it => it.nombre))
    ),
  ].filter(Boolean)

  const clientesUnicos = [
    ...new Set(
      pedidos.map(p =>
        camposRegistro.length
          ? camposRegistro.filter(c => c.visible !== false && (c.nombre === "nombre" || c.nombre === "apellido"))
            .map(campo => p[campo.nombre]).join(" ").trim()
          : `${p.nombre || ""} ${p.apellido || ""}`.trim()
      )
    ),
  ].filter(Boolean)

  function filtrarPedidos() {
    return pedidos.filter(p => {
      let ok = true
      if (filtros.ciudad && p.ciudad !== filtros.ciudad) ok = false
      if (filtros.fechaDesde && new Date(p.fecha?.seconds * 1000) < new Date(filtros.fechaDesde)) ok = false
      if (filtros.fechaHasta && new Date(p.fecha?.seconds * 1000) > new Date(filtros.fechaHasta)) ok = false
      if (filtros.estado && p.estado !== filtros.estado) ok = false
      if (filtros.entrega && p.entrega !== filtros.entrega) ok = false
      if (filtros.producto && !((p.productos || []).some(prod => prod.nombre === filtros.producto))) ok = false
      if (filtros.cliente && !(
        (camposRegistro.length
          ? camposRegistro.filter(c => c.visible !== false && (c.nombre === "nombre" || c.nombre === "apellido"))
            .map(campo => p[campo.nombre]).join(" ").trim()
          : `${p.nombre || ""} ${p.apellido || ""}`.trim()
        ) === filtros.cliente
      )) ok = false
      return ok
    })
  }

  function resumenProductos() {
    const resumen = {}
    filtrarPedidos().forEach(p => {
      (p.productos || []).forEach(item => {
        if (item.esBolson && item.contenido) {
          item.contenido.forEach(compo => {
            if (!resumen[compo.nombre]) resumen[compo.nombre] = 0
            resumen[compo.nombre] += (compo.cantidad || 1) * (item.cantidad || 1)
          })
        } else {
          if (!resumen[item.nombre]) resumen[item.nombre] = 0
          resumen[item.nombre] += (item.cantidad || 1)
        }
      })
    })
    return resumen
  }

  const imprimir = () => window.print()
  const resumen = resumenProductos()
  const pedidosFiltrados = filtrarPedidos()

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "auto" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <h2>{t("panel.titulo")}</h2>
        <BotonVolver ruta="/dashboard-admin" />
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        background: "#eee",
        padding: 10,
        borderRadius: 8,
        marginBottom: 20
      }}>
        <select value={filtros.ciudad} onChange={e => setFiltros({ ...filtros, ciudad: e.target.value })}>
          <option value="">{t("panel.filtros.ciudad")}</option>
          {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={filtros.fechaDesde} onChange={e => setFiltros({ ...filtros, fechaDesde: e.target.value })} />
        <input type="date" value={filtros.fechaHasta} onChange={e => setFiltros({ ...filtros, fechaHasta: e.target.value })} />
        <select value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">{t("panel.filtros.estado")}</option>
          <option value="pendiente">{t("panel.pendiente")}</option>
          <option value="entregado">{t("panel.entregado")}</option>
          <option value="cancelado">{t("panel.cancelado")}</option>
        </select>
        <select value={filtros.entrega} onChange={e => setFiltros({ ...filtros, entrega: e.target.value })}>
          <option value="">{t("panel.filtros.entrega")}</option>
          <option value="retiro">{t("panel.entrega.retiro")}</option>
          <option value="envio">{t("panel.entrega.envio")}</option>
        </select>
        <select value={filtros.producto} onChange={e => setFiltros({ ...filtros, producto: e.target.value })}>
          <option value="">{t("panel.filtros.producto")}</option>
          {productosUnicos.map(nombre =>
            <option key={nombre} value={nombre}>{nombre}</option>
          )}
        </select>
        <select value={filtros.cliente} onChange={e => setFiltros({ ...filtros, cliente: e.target.value })}>
          <option value="">{t("panel.filtros.cliente")}</option>
          {clientesUnicos.map(cliente =>
            <option key={cliente} value={cliente}>{cliente}</option>
          )}
        </select>
        <button onClick={imprimir}>{t("panel.imprimir")}</button>
      </div>

      <h3>{t("panel.resumen")}</h3>
      <table border={1} cellPadding={4}>
        <thead>
          <tr>
            <th>{t("panel.producto")}</th>
            <th>{t("panel.totalUnidades")}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(resumen).map(([prod, cant]) =>
            <tr key={prod}>
              <td>{prod}</td>
              <td>{cant}</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3>{t("panel.pedidos")}</h3>
      <table border={1} cellPadding={4} style={{ width: "100%", fontSize: 14 }}>
        <thead>
          <tr>
            <th>{t("panel.fecha")}</th>
            {/* Internacionalización de nombre y apellido */}
            {camposRegistro
              .filter(campo =>
                campo.visible !== false &&
                ["nombre", "apellido"].includes(campo.nombre)
              )
              .map(campo => (
                <th key={campo.nombre}>
                  {campo.nombre === "nombre"
                    ? t("panel.nombre")
                    : campo.nombre === "apellido"
                      ? t("panel.apellido")
                      : (campo.label || campo.nombre.charAt(0).toUpperCase() + campo.nombre.slice(1))}
                </th>
              ))}
            <th>{t("panel.ciudad")}</th>
            <th>{t("panel.entrega.titulo")}</th>
            <th>{t("panel.productos")}</th>
            <th>{t("panel.total")}</th>
            <th>{t("panel.estado")}</th>
          </tr>
        </thead>
        <tbody>
          {pedidosFiltrados.map(p => (
            <tr key={p.id}>
              <td>{p.fecha?.seconds ? new Date(p.fecha.seconds * 1000).toLocaleDateString() : ''}</td>
              {camposRegistro
                .filter(campo =>
                  campo.visible !== false &&
                  ["nombre", "apellido"].includes(campo.nombre)
                )
                .map(campo => (
                  <td key={campo.nombre}>
                    {p[campo.nombre] || ""}
                  </td>
                ))}
              <td>{p.ciudad}</td>
              <td>
                {p.entrega === "retiro"
                  ? t("panel.entrega.retiro")
                  : p.entrega === "envio"
                  ? t("panel.entrega.envio")
                  : p.entrega}
              </td>
              <td>{(p.productos || []).map(it => `${it.nombre} (${it.cantidad})`).join(', ')}</td>
              <td>${p.total}</td>
              <td>
                {p.estado === "entregado"
                  ? t("panel.entregado")
                  : p.estado === "cancelado"
                  ? t("panel.cancelado")
                  : t("panel.pendiente")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
