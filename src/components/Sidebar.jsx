// --- ARQUIVO: src/components/Sidebar.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript, React Router ---
// Este arquivo define o componente da barra lateral de navegação (Sidebar).

import React, { useState } from 'react';
// `Nav` e `Collapse` são componentes do React Bootstrap para criar a estrutura de navegação.
import { Nav, Collapse } from 'react-bootstrap';
// `NavLink` é uma versão especial do `Link` do React Router que sabe quando está "ativo"
// (quando a URL corresponde ao seu `to`), permitindo estilização especial.
import { NavLink } from 'react-router-dom';
// Importamos os ícones que vamos usar da biblioteca `react-bootstrap-icons`.
import { 
    HouseDoorFill, 
    CartFill, 
    BoxSeam, 
    AwardFill, 
    GearFill, 
    ChevronDown, 
    ChatDotsFill, 
    Upload,
    LightbulbFill // Ícone para o Assistente.
} from 'react-bootstrap-icons';
// Importamos nosso hook de autenticação para saber o tipo de usuário logado.
import { useAuth } from '../hooks/useAuth';

// Criamos um pequeno componente auxiliar para evitar repetição de código.
// Ele renderiza um `NavLink` com um ícone e o texto.
const SidebarLink = ({ to, icon, children }) => (
    <NavLink to={to} className="nav-link">
        {icon}
        {children}
    </NavLink>
);

// Definição do componente principal `Sidebar`.
const Sidebar = () => {
  // Pega as informações do usuário logado.
  const { user } = useAuth();
  // Cria um estado para controlar se o submenu "Registrar Venda" está aberto ou fechado.
  const [vendasSubmenuOpen, setVendasSubmenuOpen] = useState(false);

  // Uma função que retorna o JSX para os links específicos do Varejo.
  const renderRetailLinks = () => (
    <>
      <SidebarLink to="/retail/dashboard" icon={<HouseDoorFill />}>Dashboard</SidebarLink>
      <SidebarLink to="/retail/assistant" icon={<LightbulbFill />}>Assistente</SidebarLink>
      
      {/* Item de Menu com Submenu Expansível */}
      <Nav.Link 
        // Ao clicar, invertemos o estado `vendasSubmenuOpen` (de `true` para `false` e vice-versa).
        onClick={() => setVendasSubmenuOpen(!vendasSubmenuOpen)} 
        className="d-flex justify-content-between align-items-center"
        aria-controls="vendas-submenu"
        aria-expanded={vendasSubmenuOpen}
      >
        <span><CartFill className="me-2" /> Registrar Venda</span>
        {/* A seta gira com base no estado `vendasSubmenuOpen`. */}
        <ChevronDown style={{ transform: vendasSubmenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </Nav.Link>
      {/* O componente `Collapse` do React Bootstrap mostra ou esconde seu conteúdo com uma animação.
          `in={vendasSubmenuOpen}` conecta a visibilidade ao nosso estado. */}
      <Collapse in={vendasSubmenuOpen}>
        <div id="vendas-submenu" style={{ paddingLeft: '2rem' }}>
          <SidebarLink to="/retail/pos/traditional" icon={<CartFill />}>PDV Tradicional</SidebarLink>
          <SidebarLink to="/retail/pos/chatbot" icon={<ChatDotsFill />}>"Anota Aí"</SidebarLink>
          <SidebarLink to="/retail/pos/upload" icon={<Upload />}>Upload de Planilha</SidebarLink>
        </div>
      </Collapse>

      <SidebarLink to="/retail/inventory" icon={<BoxSeam />}>Estoque</SidebarLink>
      <SidebarLink to="/retail/programs" icon={<AwardFill />}>Programas</SidebarLink>
      <SidebarLink to="/retail/settings" icon={<GearFill />}>Configurações</SidebarLink>
    </>
  );

  // Uma função que retorna os links para a Indústria.
  const renderIndustryLinks = () => (
    <>
      <SidebarLink to="/industry/dashboard" icon={<HouseDoorFill />}>Dashboard</SidebarLink>
      {/* Outros links da Indústria viriam aqui. */}
    </>
  );

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <Nav as="nav" className="flex-column sidebar">
      <h4 className="sidebar-title mb-4">DARVIN</h4>
      {/* --- Renderização Condicional ---
          Verificamos o `role` do usuário e chamamos a função apropriada
          para renderizar os links corretos. */}
      {user?.role === 'retail' && renderRetailLinks()}
      {user?.role === 'industry' && renderIndustryLinks()}
    </Nav>
  );
};

export default Sidebar;