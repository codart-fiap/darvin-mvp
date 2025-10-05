// --- ARQUIVO ATUALIZADO E CORRIGIDO: src/components/Sidebar.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript, React Router ---

import React, { useState } from 'react';
import { Nav, Collapse } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { 
    HouseDoorFill, 
    CartFill, 
    BoxSeam, 
    AwardFill, 
    GearFill, 
    ChevronDown, 
    ChatDotsFill, 
    Upload,
    LightbulbFill,
    FileEarmarkSpreadsheetFill,
    BinocularsFill // <-- ÍCONE PARA O DARVIN VISION ADICIONADO
} from 'react-bootstrap-icons';
import { useAuth } from '../hooks/useAuth';

const SidebarLink = ({ to, icon, children }) => (
    <NavLink to={to} className="nav-link">
        {icon}
        {children}
    </NavLink>
);

const Sidebar = () => {
  const { user } = useAuth();
  const [vendasSubmenuOpen, setVendasSubmenuOpen] = useState(false);

  const renderRetailLinks = () => (
    <>
      <SidebarLink to="/retail/dashboard" icon={<HouseDoorFill />}>Dashboard</SidebarLink>
      <SidebarLink to="/retail/assistant" icon={<LightbulbFill />}>Assistente</SidebarLink>
      
      <Nav.Link 
        onClick={() => setVendasSubmenuOpen(!vendasSubmenuOpen)} 
        className="d-flex justify-content-between align-items-center"
        aria-controls="vendas-submenu"
        aria-expanded={vendasSubmenuOpen}
      >
        <span><CartFill className="me-2" /> Registrar Venda</span>
        <ChevronDown style={{ transform: vendasSubmenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </Nav.Link>
      <Collapse in={vendasSubmenuOpen}>
        <div id="vendas-submenu" style={{ paddingLeft: '2rem' }}>
          <SidebarLink to="/retail/pos/traditional" icon={<CartFill />}>PDV Tradicional</SidebarLink>
          <SidebarLink to="/retail/pos/chatbot" icon={<ChatDotsFill />}>"Anota Aí"</SidebarLink>
          <SidebarLink to="/retail/pos/upload" icon={<Upload />}>Upload de Planilha</SidebarLink>
          <SidebarLink to="/retail/pos/online-sheet" icon={<FileEarmarkSpreadsheetFill />}>Planilha Online</SidebarLink>
        </div>
      </Collapse>

      <SidebarLink to="/retail/inventory" icon={<BoxSeam />}>Estoque</SidebarLink>
      <SidebarLink to="/retail/programs" icon={<AwardFill />}>Programas</SidebarLink>
      <SidebarLink to="/retail/settings" icon={<GearFill />}>Configurações</SidebarLink>
    </>
  );

  // --- ATUALIZAÇÃO APLICADA AQUI ---
  // Uma função que retorna os links para a Indústria.
  const renderIndustryLinks = () => (
    <>
      <SidebarLink to="/industry/dashboard" icon={<HouseDoorFill />}>Dashboard</SidebarLink>
      {/* O link para o Darvin Vision que faltava foi adicionado */}
      <SidebarLink to="/industry/vision" icon={<BinocularsFill />}>Darvin Vision</SidebarLink>
    </>
  );

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <Nav as="nav" className="flex-column sidebar">
      <h4 className="sidebar-title mb-4">DARVIN</h4>
      {/* Renderização condicional para os diferentes perfis */}
      {user?.role === 'retail' && renderRetailLinks()}
      {user?.role === 'industry' && renderIndustryLinks()}
    </Nav>
  );
};

export default Sidebar;