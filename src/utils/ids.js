// --- ARQUIVO: src/utils/ids.js ---
// --- TECNOLOGIA: JavaScript ---
// Este é outro arquivo de utilitário, bem simples. Sua única função é criar um
// identificador (ID) único e aleatório sempre que precisarmos.

// A palavra 'export' permite que outras partes do nosso código importem e usem esta função.
export const generateId = () => {
  // `Math.random()` gera um número aleatório entre 0 e 1 (ex: 0.12345).
  // `.toString(36)` converte esse número para uma string usando letras e números (base 36).
  // `.substr(2, 9)` pega um pedaço dessa string, começando do 3º caractere, com 9 caracteres de comprimento.
  // Isso nos dá um ID curto e razoavelmente único, como "kjf7g4s8a".
  return Math.random().toString(36).substr(2, 9);
};
