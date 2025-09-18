// FILE: src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Ordem de importação de estilos
import 'bootstrap/dist/css/bootstrap.min.css'; // 1. CSS da Biblioteca
import './assets/css/custom.css';             // 2. Nossos estilos customizados (sobrescrevem o Bootstrap)
import './index.css';                          // 3. Estilos globais finais

import { getItem } from './state/storage';
import { seedDatabase } from './state/seed';

const initializeApp = () => {
  const users = getItem('users');
  if (!users || users.length === 0) {
    // Garante que o seed popula o localStorage se estiver vazio
    seedDatabase(); 
  }
};

initializeApp();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);