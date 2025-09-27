// --- ARQUIVO: vite.config.js ---
// --- TECNOLOGIA: Vite, Node.js ---
// Olá! Este é o arquivo de configuração do Vite. O Vite é a ferramenta que "constrói"
// seu projeto, transformando seus arquivos de código (React, JSX, CSS) em arquivos estáticos
// que o navegador entende (HTML, CSS, JavaScript puro).
// Este arquivo é lido pelo Node.js, por isso usa a sintaxe `import` e `export default`.

// Importamos as funções necessárias do pacote 'vite'.
import { defineConfig } from 'vite'
// Importamos o plugin oficial do React para o Vite. É ele que ensina o Vite a entender JSX.
import react from '@vitejs/plugin-react'

// O Vite nos dá um link para a documentação oficial para mais detalhes.
// https://vitejs.dev/config/
export default defineConfig({
  // A seção 'plugins' é onde adicionamos funcionalidades extras ao Vite.
  // Aqui, estamos dizendo para ele usar o plugin do React que importamos acima.
  plugins: [react()],
})
