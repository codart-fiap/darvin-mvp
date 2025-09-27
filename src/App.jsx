// --- ARQUIVO: src/App.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript, React Router ---
// Este é o componente raiz do seu aplicativo. Sua principal função é configurar
// o sistema de roteamento, que decide qual página (componente) mostrar com base
// na URL que o usuário está acessando.

// Importamos os componentes necessários do `react-router-dom`, a biblioteca
// que cuida do roteamento em aplicações React.
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importamos todos os componentes que servirão como páginas.
import Login from './pages/auth/Login';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas do Varejo
import DashboardRetail from './pages/retail/DashboardRetail';
import TraditionalPOS from './pages/retail/pos/TraditionalPOS';
import ChatbotPOS from './pages/retail/pos/ChatbotPOS';
import UploadPOS from './pages/retail/pos/UploadPOS';
import Inventory from './pages/retail/Inventory';
import Marketplace from './pages/retail/Marketplace';
import Conecta from './pages/retail/Conecta';
import Programs from './pages/retail/Programs';
import SettingsRetail from './pages/retail/SettingsRetail';
import Assistant from './pages/retail/Assistant';

// Componentes "placeholder" para seções ainda não construídas.
const SupplierDashboard = () => <div>Dashboard do Fornecedor (em construção)</div>;
const IndustryDashboard = () => <div>Dashboard da Indústria (em construção)</div>;

// O componente funcional `App`.
function App() {
  // O `return` define a estrutura de roteamento.
  return (
    // `<Router>` (apelidado de `BrowserRouter`) envolve todo o aplicativo,
    // habilitando o roteamento baseado na URL do navegador.
    <Router>
      {/* `<Routes>` é o contêiner para todas as nossas rotas individuais. */}
      <Routes>
        {/* --- ROTA PÚBLICA --- */}
        {/* `<Route>` define uma rota específica.
            `path` é o caminho na URL.
            `element` é o componente React que será renderizado para esse caminho. */}
        <Route path="/login" element={<Login />} />

        {/* --- ROTAS PROTEGIDAS PARA VAREJO --- */}
        {/* Esta é uma configuração mais avançada. Usamos uma "rota de layout".
            O `element` desta rota é o nosso componente `<ProtectedRoute>`, que por sua vez
            envolve o `<AppLayout>`. Isso significa que QUALQUER rota aninhada aqui dentro
            passará primeiro pelo "porteiro" (`ProtectedRoute`). Se o usuário tiver
            permissão, o `<AppLayout>` (com a sidebar) será renderizado, e o componente
            da rota filha será renderizado dentro do `<Outlet>` do `AppLayout`. */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['retail']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Estas são as rotas filhas. Elas só podem ser acessadas por usuários
              logados com o `role` de 'retail'. */}
          <Route path="/retail/dashboard" element={<DashboardRetail />} />
          <Route path="/retail/pos/traditional" element={<TraditionalPOS />} />
          <Route path="/retail/pos/chatbot" element={<ChatbotPOS />} />
          <Route path="/retail/pos/upload" element={<UploadPOS />} />
          <Route path="/retail/inventory" element={<Inventory />} />
          <Route path="/retail/marketplace" element={<Marketplace />} />
          <Route path="/retail/conecta" element={<Conecta />} />
          <Route path="/retail/programs" element={<Programs />} />
          <Route path="/retail/settings" element={<SettingsRetail />} />
          <Route path="/retail/assistant" element={<Assistant />} />
        </Route>
        
        {/* --- ROTAS PROTEGIDAS PARA FORNECEDOR (Exemplo) --- */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
        </Route>

        {/* --- ROTAS PROTEGIDAS PARA INDÚSTRIA (Exemplo) --- */}
         <Route 
          element={
            <ProtectedRoute allowedRoles={['industry']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/industry/dashboard" element={<IndustryDashboard />} />
        </Route>

        {/* --- ROTA PADRÃO --- */}
        {/* O `path="*"` é um curinga. Se nenhuma das rotas acima corresponder à URL,
            esta rota será usada. Aqui, redirecionamos qualquer URL desconhecida para o login. */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
