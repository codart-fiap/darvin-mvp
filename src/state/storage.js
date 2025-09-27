// --- ARQUIVO: src/state/storage.js ---
// --- TECNOLOGIA: JavaScript, Web APIs (localStorage) ---
// Este arquivo é como um "porteiro" para o nosso banco de dados.
// Ele nos ajuda a salvar e carregar informações no `localStorage` do navegador.
// O `localStorage` é um pequeno espaço de armazenamento que os sites podem usar para
// guardar dados que persistem mesmo se você fechar a aba ou o navegador.

// Definimos um "NAMESPACE" (um prefixo) para evitar que nossos dados se misturem
// com dados de outros sites ou outras versões do nosso app.
const NAMESPACE = 'darvin';

// Função para SALVAR um item.
// Recebe uma `key` (chave, como 'users') e um `value` (valor, a lista de usuários).
export const setItem = (key, value) => {
  try {
    // O localStorage só guarda texto (strings). Então, transformamos nosso objeto/array em texto JSON.
    const serializedValue = JSON.stringify(value);
    // Salvamos o valor no localStorage usando nossa chave com prefixo (ex: 'darvin/users').
    localStorage.setItem(`${NAMESPACE}/${key}`, serializedValue);
  } catch (error) {
    // Se algo der errado (ex: localStorage está cheio), mostramos um erro no console.
    console.error(`Error setting item ${key} in localStorage`, error);
  }
};

// Função para LER um item.
// Recebe a `key` do item que queremos buscar.
export const getItem = (key) => {
  try {
    // Lemos o valor do localStorage usando a chave com prefixo.
    const serializedValue = localStorage.getItem(`${NAMESPACE}/${key}`);
    // Se não houver nada salvo com essa chave, `serializedValue` será `null`, e retornamos `null`.
    if (serializedValue === null) { return null; }
    // Se encontramos algo, transformamos o texto JSON de volta para um objeto/array JavaScript.
    return JSON.parse(serializedValue);
  } catch (error) {
    // Se o dado salvo estiver corrompido e não puder ser lido, mostramos um erro.
    console.error(`Error getting item ${key} from localStorage`, error);
    return null;
  }
};
