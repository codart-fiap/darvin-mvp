// --- ARQUIVO: src/hooks/useAuth.js ---
// --- TECNOLOGIA: React (Hooks), JavaScript ---

import { useState, useEffect } from 'react';
import { getItem, setItem } from '../state/storage';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const session = getItem('session');
      if (session) {
        setUser(session);
      }
    } catch (error) {
      console.error("Falha ao carregar a sessão", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FUNÇÃO DE LOGIN ATUALIZADA
  // Agora faz o login com base no ID do ator (loja/indústria) e no tipo de perfil.
  const login = (actorId, role) => {
    const allUsers = getItem('users');
    // Encontra o primeiro usuário associado ao estabelecimento selecionado.
    const foundUser = allUsers.find(
      u => u.actorId === actorId && u.role === role
    );

    if (foundUser) {
      const sessionData = { 
        userId: foundUser.id, 
        role: foundUser.role, 
        actorId: foundUser.actorId, 
        displayName: foundUser.displayName 
      };
      setItem('session', sessionData);
      setUser(sessionData);
      return sessionData;
    }
    // Se, por algum motivo, não houver um usuário para aquele estabelecimento, retorna null.
    return null;
  };

  const logout = () => {
    setItem('session', null);
    setUser(null);
  };

  // Retorna a nova função de login.
  return { user, loading, login, logout };
};