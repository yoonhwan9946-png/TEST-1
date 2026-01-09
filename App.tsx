
import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AssetLibrary from './pages/AssetLibrary';
import TrendLab from './pages/TrendLab';
import TrendEditor from './pages/TrendEditor'; // Import Editor
import AdminDashboard from './pages/AdminDashboard';
import Brainstorming from './pages/Brainstorming';
import MyProjects from './pages/MyProjects';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const Layout: React.FC = () => {
  const location = useLocation();
  const isBrainstorming = location.pathname === '/brainstorming';
  // Hide Navbar/Footer on Editor page as well for immersive writing
  const isEditor = location.pathname === '/trend/editor'; 
  const hideGlobalNav = isBrainstorming || isEditor;

  return (
    <div className={`flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans ${isBrainstorming ? 'h-screen overflow-hidden' : ''}`}>
      <ScrollToTop />
      
      {!hideGlobalNav && <Navbar />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<AssetLibrary />} />
          <Route path="/trend" element={<TrendLab />} />
          <Route path="/trend/editor" element={<TrendEditor />} /> 
          <Route path="/projects" element={<MyProjects />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/brainstorming" element={<Brainstorming />} />
        </Routes>
      </main>

      {!hideGlobalNav && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout />
    </Router>
  );
};

export default App;
