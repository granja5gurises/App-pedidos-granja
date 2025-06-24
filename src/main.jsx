import './index.css';
import './i18n/i18n.js'; // <-- esta línea inicializa el sistema multiidioma
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<div style={{ display: "none" }}></div>}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Suspense>
    </I18nextProvider>
  </React.StrictMode>
);
  