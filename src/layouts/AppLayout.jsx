import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { PersonCircle } from 'react-bootstrap-icons';


const AppLayout = () => {
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

 
  const handleLogout = () => {
   
    logout();
 
    navigate('/login');
  };


  return (
   
    <div className="app-container">
      {}
      <Sidebar />
      {}
      <main className="content-container">
        {}
        <div className="d-flex justify-content-end align-items-center mb-4">
          <span className="me-3 d-flex align-items-center">
            <PersonCircle className="me-2" size={20} /> Olá, {user?.displayName}
          </span>
          <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm"> 
            Sair
          </button>
        </div>
        
        {}
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
