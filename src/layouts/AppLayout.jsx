// --- ARQUIVO: src/layouts/AppLayout.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript, React Router ---
// Este componente define a estrutura visual principal para as páginas que estão
// "dentro" do aplicativo (ou seja, depois do login). Ele inclui a barra lateral
// e a área principal de conteúdo.

import React from 'react';
// `Outlet` é um componente especial do React Router. Ele atua como um espaço reservado
// onde as rotas filhas serão renderizadas.
// `useNavigate` é um hook para navegação programática.
import { Outlet, useNavigate } from 'react-router-dom';
// Importamos nosso componente de barra lateral.
import Sidebar from '../components/Sidebar';
// Importamos o hook de autenticação para saber quem está logado e para poder fazer logout.
import { useAuth } from '../hooks/useAuth';
import { PersonCircle } from 'react-bootstrap-icons'; // Ícone para o usuário.

// Definição do componente funcional `AppLayout`.
const AppLayout = () => {
  // Obtemos as informações e funções do usuário do nosso hook.
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Função para lidar com o clique no botão de sair.
  const handleLogout = () => {
    // Chama a função de logout do nosso hook.
    logout();
    // Navega o usuário de volta para a página de login.
    navigate('/login');
  };

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    // Esta `div` principal usa flexbox para posicionar a sidebar e o conteúdo lado a lado.
    <div className="app-container">
      {/* Renderiza o componente da barra lateral. */}
      <Sidebar />
      {/* Esta `main` é o contêiner para o conteúdo principal da página. */}
      <main className="content-container">
        {/* Um pequeno cabeçalho (topbar) dentro da área de conteúdo. */}
        <div className="d-flex justify-content-end align-items-center mb-4">
          <span className="me-3 d-flex align-items-center">
            <PersonCircle className="me-2" size={20} /> Olá, {user?.displayName}
          </span>
          <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm"> 
            Sair
          </button>
        </div>
        
        {/* AQUI É O PONTO-CHAVE:
            O componente <Outlet /> renderizará o componente da rota ativa.
            Por exemplo, se a URL for `/retail/dashboard`, o <DashboardRetail />
            será renderizado aqui. Se for `/retail/inventory`, o <Inventory />
            será renderizado aqui. */}
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
