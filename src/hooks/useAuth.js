// FILE: src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { getItem, setItem } from '../state/storage';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  // --- ADICIONADO: Estado de carregamento ---
  // Inicia como 'true' pois estamos sempre verificando a sessão no início.
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
      // --- ADICIONADO: Termina o carregamento ---
      // Diz à aplicação que a verificação inicial terminou.
      setLoading(false);
    }
  }, []); // O array vazio [] garante que isso rode apenas uma vez.

  const login = (email, password, role) => {
    const allUsers = getItem('users');
    const foundUser = allUsers.find(
      u => u.email === email && u.password === password && u.role === role
    );

    if (foundUser) {
      const sessionData = { userId: foundUser.id, role: foundUser.role, actorId: foundUser.actorId, displayName: foundUser.displayName };
      setItem('session', sessionData);
      setUser(sessionData);
      return sessionData;
    }
    return null;
  };

  const logout = () => {
    setItem('session', null);
    setUser(null);
  };

  // --- ATUALIZADO: Retorna o 'loading' também ---
  return { user, loading, login, logout };
};