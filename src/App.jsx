// --- ARQUIVO ATUALIZADO: src/App.jsx ---
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/auth/Login';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas do Varejo
import DashboardRetail from './pages/retail/DashboardRetail';
import TraditionalPOS from './pages/retail/pos/TraditionalPOS';
import UploadPOS from './pages/retail/pos/UploadPOS';
import OnlineSheetPOS from './pages/retail/pos/OnlineSheetPOS';
import SalesHistory from './pages/retail/pos/SalesHistory';
import Inventory from './pages/retail/Inventory';
import Programs from './pages/retail/Programs';
import SettingsRetail from './pages/retail/SettingsRetail';
import Assistant from './pages/retail/Assistant';

// Páginas da Indústria
import DashboardIndustry from './pages/industry/DashboardIndustry';
import DarvinVision from './pages/industry/DarvinVision'; 
import ProgramsIndustry from './pages/industry/ProgramsIndustry';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* --- ROTAS PROTEGIDAS PARA VAREJO --- */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['retail']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/retail/dashboard" element={<DashboardRetail />} />
          <Route path="/retail/pos/traditional" element={<TraditionalPOS />} />
          {/* ROTA PARA /chatbot REMOVIDA */}
          <Route path="/retail/pos/upload" element={<UploadPOS />} />
          <Route path="/retail/pos/online-sheet" element={<OnlineSheetPOS />} />
          <Route path="/retail/pos/sales-history" element={<SalesHistory />} />
          <Route path="/retail/inventory" element={<Inventory />} />
          <Route path="/retail/programs" element={<Programs />} />
          <Route path="/retail/settings" element={<SettingsRetail />} />
          <Route path="/retail/assistant" element={<Assistant />} />
        </Route>
        
        {/* --- ROTAS PROTEGIDAS PARA INDÚSTRIA --- */}
         <Route 
          element={
            <ProtectedRoute allowedRoles={['industry']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/industry/dashboard" element={<DashboardIndustry />} />
          <Route path="/industry/programs" element={<ProgramsIndustry />} />
          <Route path="/industry/vision" element={<DarvinVision />} />
        </Route>

        {/* --- ROTA PADRÃO --- */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;