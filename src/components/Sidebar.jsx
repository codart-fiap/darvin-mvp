// --- ARQUIVO ATUALIZADO: src/components/Sidebar.jsx ---
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
    Upload,
    LightbulbFill,
    FileEarmarkSpreadsheetFill,
    BinocularsFill,
    ClockHistory
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
        <span><CartFill className="me-2" /> Vendas</span>
        <ChevronDown style={{ transform: vendasSubmenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </Nav.Link>
      <Collapse in={vendasSubmenuOpen}>
        <div id="vendas-submenu" style={{ paddingLeft: '2rem' }}>
          <SidebarLink to="/retail/pos/traditional" icon={<CartFill />}>PDV Tradicional</SidebarLink>
          {/* NOME E ÍCONE ATUALIZADOS */}
          <SidebarLink to="/retail/pos/online-sheet" icon={<FileEarmarkSpreadsheetFill />}>Anota Aí</SidebarLink>
          <SidebarLink to="/retail/pos/upload" icon={<Upload />}>Upload de Planilha</SidebarLink>
          <SidebarLink to="/retail/pos/sales-history" icon={<ClockHistory />}>Histórico de Vendas</SidebarLink>
        </div>
      </Collapse>

      <SidebarLink to="/retail/inventory" icon={<BoxSeam />}>Estoque</SidebarLink>
      <SidebarLink to="/retail/programs" icon={<AwardFill />}>Programas</SidebarLink>
      <SidebarLink to="/retail/settings" icon={<GearFill />}>Configurações</SidebarLink>
    </>
  );

  const renderIndustryLinks = () => (
    <>
      <SidebarLink to="/industry/dashboard" icon={<HouseDoorFill />}>Dashboard</SidebarLink>
      <SidebarLink to="/industry/vision" icon={<BinocularsFill />}>Darvin Vision</SidebarLink>
    </>
  );

  return (
    <Nav as="nav" className="flex-column sidebar">
      <h4 className="sidebar-title mb-4">DARVIN</h4>
      {user?.role === 'retail' && renderRetailLinks()}
      {user?.role === 'industry' && renderIndustryLinks()}
    </Nav>
  );
};

export default Sidebar;