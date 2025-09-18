// FILE: src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // --- ATUALIZADO: Pega o 'loading' do hook ---
  const { user, loading } = useAuth();
  const location = useLocation();

  // --- ADICIONADO: Verificação de carregamento ---
  // Se a verificação da sessão ainda está em andamento, mostra uma mensagem.
  if (loading) {
    return <div>Verificando autenticação...</div>;
  }

  // Se a verificação terminou e não há usuário, redireciona para o login.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se o usuário não tem a permissão necessária, redireciona também.
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se tudo estiver OK, mostra a página solicitada.
  return children;
};

export default ProtectedRoute;