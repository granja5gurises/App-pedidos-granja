
import React from 'react'

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/5493447514517"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#25D366',
        color: 'white',
        borderRadius: '50%',
        padding: '15px',
        fontSize: '24px',
        zIndex: 1000,
        textDecoration: 'none',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      🟢
    </a>
  )
}

export default WhatsAppButton
