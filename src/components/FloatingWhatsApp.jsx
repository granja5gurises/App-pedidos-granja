import React from 'react';

export default function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/5493447514517"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        backgroundColor: '#25D366',
        color: 'white',
        borderRadius: '30px',
        padding: '8px 12px',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="WhatsApp"
        style={{ width: 24, height: 24, marginRight: 8 }}
      />
      <span style={{ fontSize: '0.9rem' }}>¿Necesitás ayuda?</span>
    </a>
  );
}