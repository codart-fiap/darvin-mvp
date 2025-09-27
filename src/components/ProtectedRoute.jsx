// --- ARQUIVO: src/components/ProtectedRoute.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript, React Router ---
// Este é um componente muito importante para a segurança e lógica do seu aplicativo.
// Ele age como um "porteiro" para as suas rotas. Você "envolve" as rotas que quer
// proteger com este componente, e ele decide se o usuário pode ou não acessá-las.

import React from 'react';
// `Maps` é um componente do React Router que redireciona o usuário para outra rota.
// `useLocation` nos dá informações sobre a URL atual.
import { Navigate, useLocation } from 'react-router-dom';
// Importamos nosso hook de autenticação para verificar o status do usuário.
import { useAuth } from '../hooks/useAuth';

// O componente recebe duas "props" (propriedades):
// `children`: representa os componentes filhos que ele está envolvendo (as rotas).
// `allowedRoles`: uma lista de "cargos" (roles) que têm permissão para acessar a rota.
const ProtectedRoute = ({ children, allowedRoles }) => {
  // Pegamos o `user` e o estado `loading` do nosso hook.
  const { user, loading } = useAuth();
  const location = useLocation();

  // --- VERIFICAÇÃO DE CARREGAMENTO ---
  // Se `loading` for `true`, significa que o `useEffect` em `useAuth` ainda
  // não terminou de verificar se há uma sessão no localStorage.
  // Mostramos uma mensagem de espera para evitar que o usuário seja redirecionado
  // para o login antes mesmo da verificação terminar.
  if (loading) {
    return <div>Verificando autenticação...</div>;
  }

  // --- VERIFICAÇÃO DE AUTENTICAÇÃO ---
  // Se o carregamento terminou (`loading` é `false`) e não há usuário (`!user`),
  // significa que o usuário não está logado.
  if (!user) {
    // Redirecionamos para a página de login.
    // `state={{ from: location }}`: passamos a localização atual para que, após o login,
    // possamos redirecionar o usuário de volta para a página que ele tentou acessar.
    // `replace`: substitui a entrada atual no histórico de navegação, para que o usuário
    // não possa usar o botão "voltar" do navegador para acessar a página protegida.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- VERIFICAÇÃO DE AUTORIZAÇÃO ---
  // Se o usuário está logado, agora verificamos se o `role` dele está na lista
  // de `allowedRoles` que foi passada para este componente.
  if (!allowedRoles.includes(user.role)) {
    // Se ele não tem a permissão necessária, também o redirecionamos para o login.
    // Isso impede que, por exemplo, um usuário 'supplier' acesse o dashboard do 'retail'.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se o usuário passou por todas as verificações (está carregado, logado e autorizado),
  // simplesmente renderizamos os `children`, ou seja, a rota que ele estava tentando acessar.
  return children;
};

export default ProtectedRoute;
