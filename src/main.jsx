// --- ARQUIVO: src/main.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript ---
// Este é o ponto de partida do seu aplicativo React. É o primeiro arquivo JavaScript
// que é executado. Sua principal responsabilidade é renderizar o componente principal (`App`)
// na página HTML.

import React from 'react';
// `ReactDOM` é a biblioteca que sabe como "desenhar" os componentes React no navegador.
import ReactDOM from 'react-dom/client';
// `App` é o nosso componente principal, que contém toda a estrutura de rotas.
import App from './App.jsx';

// --- IMPORTAÇÃO DE ESTILOS (CSS) ---
// A ordem aqui é importante!
// 1. Importamos o CSS da biblioteca Bootstrap primeiro, como base.
import 'bootstrap/dist/css/bootstrap.min.css';
// 2. Importamos nossos estilos personalizados, que podem sobrescrever regras do Bootstrap.
import './assets/css/custom.css';
// 3. Por fim, importamos os estilos globais finais.
import './index.css';

// Importamos nossas funções para ler do localStorage e para popular os dados iniciais.
import { getItem } from './state/storage';
import { seedDatabase } from './state/seed';

// Função para inicializar o aplicativo.
const initializeApp = () => {
  // Verificamos se já existem usuários salvos no localStorage.
  const users = getItem('users');
  // Se não houver usuários (primeira vez que o app roda),...
  if (!users || users.length === 0) {
    // ...chamamos a função `seedDatabase` para criar os dados iniciais.
    seedDatabase(); 
  }
};

// Executamos a função de inicialização.
initializeApp();

// Aqui a mágica acontece:
// `ReactDOM.createRoot` cria a "raiz" do nosso aplicativo React, atrelando-a ao
// elemento HTML com o id 'root' (que está no nosso `index.html`).
// `.render()` diz ao React para desenhar o que está dentro dele na tela.
ReactDOM.createRoot(document.getElementById('root')).render(
  // `<React.StrictMode>` é uma ferramenta de desenvolvimento que ajuda a encontrar
  // problemas potenciais no seu aplicativo. Ele não afeta a versão de produção.
  <React.StrictMode>
    {/* Renderizamos nosso componente `App` principal. */}
    <App />
  </React.StrictMode>,
);
