// --- ARQUIVO: src/hooks/useAuth.js ---
// --- TECNOLOGIA: React (Hooks), JavaScript ---
// Este arquivo define um "Custom Hook" do React. Um hook personalizado é uma função
// JavaScript que nos permite reutilizar lógica de estado em diferentes componentes.
// Este hook, `useAuth`, centraliza toda a lógica de autenticação.

import { useState, useEffect } from 'react';
import { getItem, setItem } from '../state/storage';

// A definição do nosso hook personalizado. Por convenção, hooks começam com "use".
export const useAuth = () => {
  // --- ESTADOS DO HOOK ---
  // `user`: guarda as informações do usuário logado. Começa como `null`.
  const [user, setUser] = useState(null);
  // `loading`: um estado booleano para sabermos se a verificação inicial da sessão já terminou.
  // Começa como `true` porque, ao carregar o app, sempre começamos verificando.
  const [loading, setLoading] = useState(true);

  // `useEffect` é usado para executar código que tem "efeitos colaterais",
  // como buscar dados. O array vazio `[]` no final significa que este efeito
  // será executado APENAS UMA VEZ, quando o componente que usa o hook for montado.
  useEffect(() => {
    try {
      // Tentamos buscar a 'session' salva no localStorage.
      const session = getItem('session');
      // Se uma sessão existir...
      if (session) {
        // ...atualizamos o estado `user` com os dados da sessão.
        setUser(session);
      }
    } catch (error) {
      // Se algo der errado, registramos o erro no console.
      console.error("Falha ao carregar a sessão", error);
    } finally {
      // O bloco `finally` sempre é executado, com ou sem erro.
      // Aqui, definimos `loading` como `false` para indicar que a verificação inicial terminou.
      setLoading(false);
    }
  }, []); // O array vazio [] garante que isso rode apenas uma vez.

  // Função de login que será usada pelo componente de Login.
  const login = (email, password, role) => {
    // Busca todos os usuários do "banco de dados".
    const allUsers = getItem('users');
    // Procura por um usuário que corresponda a todas as credenciais fornecidas.
    const foundUser = allUsers.find(
      u => u.email === email && u.password === password && u.role === role
    );

    // Se um usuário correspondente for encontrado...
    if (foundUser) {
      // ...criamos um objeto `sessionData` apenas com as informações necessárias.
      const sessionData = { userId: foundUser.id, role: foundUser.role, actorId: foundUser.actorId, displayName: foundUser.displayName };
      // Salvamos esses dados da sessão no localStorage.
      setItem('session', sessionData);
      // Atualizamos o estado `user` com os dados da sessão.
      setUser(sessionData);
      // Retornamos os dados para quem chamou a função.
      return sessionData;
    }
    // Se nenhum usuário for encontrado, retornamos `null`.
    return null;
  };

  // Função de logout.
  const logout = () => {
    // Remove a sessão do localStorage (salvando `null` no lugar).
    setItem('session', null);
    // Limpa o estado `user`, definindo-o como `null`.
    setUser(null);
  };

  // O hook retorna um objeto com o estado do usuário, o estado de carregamento,
  // e as funções de login e logout. Assim, qualquer componente pode usá-los.
  return { user, loading, login, logout };
};
