// FILE: src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas do Varejo
import DashboardRetail from './pages/retail/DashboardRetail';
import TraditionalPOS from './pages/retail/pos/TraditionalPOS';
import ChatbotPOS from './pages/retail/pos/ChatbotPOS';
import UploadPOS from './pages/retail/pos/UploadPOS';
import SalesHistory from './pages/retail/pos/SalesHistory'; // NOVO
import Inventory from './pages/retail/Inventory';
import Marketplace from './pages/retail/Marketplace';
import Conecta from './pages/retail/Conecta';
import Programs from './pages/retail/Programs';
import SettingsRetail from './pages/retail/SettingsRetail';
import Assistant from './pages/retail/Assistant';

// Placeholders para outros atores
const SupplierDashboard = () => <div>Dashboard do Fornecedor (em construção)</div>;
const IndustryDashboard = () => <div>Dashboard da Indústria (em construção)</div>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota Pública */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas para Varejo */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['retail']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/retail/dashboard" element={<DashboardRetail />} />
          <Route path="/retail/pos/traditional" element={<TraditionalPOS />} />
          <Route path="/retail/pos/chatbot" element={<ChatbotPOS />} />
          <Route path="/retail/pos/upload" element={<UploadPOS />} />
          <Route path="/retail/pos/history" element={<SalesHistory />} /> {/* NOVO */}
          <Route path="/retail/inventory" element={<Inventory />} />
          <Route path="/retail/marketplace" element={<Marketplace />} />
          <Route path="/retail/conecta" element={<Conecta />} />
          <Route path="/retail/programs" element={<Programs />} />
          <Route path="/retail/settings" element={<SettingsRetail />} />
          <Route path="/retail/assistant" element={<Assistant />} />
        </Route>
        
        {/* Rotas Protegidas para Fornecedor (Exemplo) */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
        </Route>

        {/* Rotas Protegidas para Indústria (Exemplo) */}
         <Route 
          element={
            <ProtectedRoute allowedRoles={['industry']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/industry/dashboard" element={<IndustryDashboard />} />
        </Route>

        {/* Rota Padrão - Redireciona para o login */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;