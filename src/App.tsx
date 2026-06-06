import React, { useState } from 'react';
import { getDatabase, saveDatabase } from './data';
import { FinancialAppDB } from './types';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  FileText, 
  DollarSign, 
  Briefcase, 
  TrendingUp, 
  ShieldAlert, 
  Activity,
  Menu,
  X,
  User,
  Shield,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Importación de componentes divididos criollos
import Dashboard from './components/Dashboard';
import Clientes from './components/Clientes';
import Vehiculos from './components/Vehiculos';
import Financiamientos from './components/Financiamientos';
import Cobros from './components/Cobros';
import Caja from './components/Caja';
import CuentasCobrar from './components/CuentasCobrar';
import Reportes from './components/Reportes';
import Seguridad from './components/Seguridad';

export default function App() {
  const [db, setDb] = useState<FinancialAppDB>(() => getDatabase());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Guardar en LocalStorage de manera reactiva ante cualquier cambio consolidado
  const handleUpdateDb = (newDb: FinancialAppDB) => {
    setDb(newDb);
    saveDatabase(newDb);
  };

  // Listado de pestañas con sus íconos
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Gestión Clientes', icon: Users },
    { id: 'vehiculos', label: 'Gestión Vehículos', icon: Car },
    { id: 'financiamientos', label: 'Financiamientos', icon: FileText },
    { id: 'cobros', label: 'Cobros y Pagos', icon: DollarSign },
    { id: 'caja', label: 'Caja Recaudadora', icon: Briefcase },
    { id: 'cuotas-cobrar', label: 'Cuentas x Cobrar', icon: ShieldAlert },
    { id: 'reportes', label: 'Reportes y PDF', icon: TrendingUp },
    { id: 'seguridad', label: 'Roles y Seguridad', icon: Activity },
  ];

  // Renderizador dinámico de vistas
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard db={db} onSetTab={(tab) => { setActiveTab(tab); }} />;
      case 'clientes':
        return <Clientes db={db} onUpdateDb={handleUpdateDb} />;
      case 'vehiculos':
        return <Vehiculos db={db} onUpdateDb={handleUpdateDb} />;
      case 'financiamientos':
        return <Financiamientos db={db} onUpdateDb={handleUpdateDb} onSetTab={(tab) => { setActiveTab(tab); }} />;
      case 'cobros':
        return <Cobros db={db} onUpdateDb={handleUpdateDb} onSetTab={(tab) => { setActiveTab(tab); }} />;
      case 'caja':
        return <Caja db={db} onUpdateDb={handleUpdateDb} />;
      case 'cuotas-cobrar':
        return <CuentasCobrar db={db} onUpdateDb={handleUpdateDb} />;
      case 'reportes':
        return <Reportes db={db} />;
      case 'seguridad':
        return <Seguridad db={db} onUpdateDb={handleUpdateDb} />;
      default:
        return <Dashboard db={db} onSetTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-800 selection:bg-indigo-650 selection:text-white" id="main-system-layout">
      
      {/* 1. Sidebar - Desktop view */}
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-indigo-950 via-slate-900 to-blue-950 text-white shrink-0 shadow-2xl border-r border-indigo-900/30 justify-between relative overflow-hidden" id="desktop-sidebar">
        {/* Ambient glow accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="py-7 px-5 flex flex-col gap-6 z-10">
          {/* Logo Brand RD */}
          <div className="space-y-1.5" id="brand-logo-area">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-blue-500 rounded-sm shadow-md animate-pulse"></span>
              <span className="w-2.5 h-6 bg-white rounded-sm shadow-md"></span>
              <span className="w-2.5 h-6 bg-rose-500 rounded-sm shadow-md animate-pulse"></span>
              {/* <span className="font-extrabold text-base tracking-wider font-sans leading-none bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent">AutoFin RD</span> */}
            </div>
            <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest font-mono">República Dominicana</p>
          </div>

          {/* Menú Ítems */}
          <nav className="flex flex-col gap-1.5" id="desktop-sidebar-nav">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-extrabold shadow-lg border-l-4 border-amber-400 scale-[1.02]' 
                      : 'text-indigo-200 hover:text-white hover:bg-white/10'
                  }`}
                  id={`tab-${item.id}`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-indigo-300'}`} />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar displaying current Swapper profile */}
        <div className="border-t border-indigo-900/30 p-4 bg-slate-950/40 shrink-0 z-10" id="desktop-sidebar-footer">
          <div className="flex gap-2.5 items-center bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-inner">
            <img src={db.currentUser.avatar} alt={db.currentUser.name} className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-indigo-400/30" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-tight">{db.currentUser.name}</p>
              <span className="text-[9px] text-amber-300 font-extrabold font-mono tracking-wider block mt-0.5 uppercase">{db.currentUser.role}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Responsive Navbar */}
      <header className="md:hidden bg-gradient-to-r from-indigo-950 to-blue-950 text-white px-5 py-4 flex justify-between items-center z-40 border-b border-indigo-900/30 relative" id="mobile-navbar">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500" />
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-500 rounded-sm"></span>
          <span className="w-1.5 h-4 bg-white rounded-sm"></span>
          <span className="w-1.5 h-4 bg-rose-500 rounded-sm"></span>
          <span className="font-extrabold text-xs tracking-wider">A-FIN RD</span>
        </div>

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-300 hover:text-white p-1 cursor-pointer bg-white/5 rounded-lg border border-white/10"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-slate-950 border-b border-indigo-900/40 z-30 flex flex-col p-4 space-y-4 absolute w-full top-[57px] shadow-2xl" id="mobile-dropdown-menu"
          >
            <nav className="flex flex-col gap-1.5">
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold border-l-4 border-amber-400' 
                        : 'text-indigo-200 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-indigo-900/30 pt-3 flex gap-2.5 items-center p-1">
              <img src={db.currentUser.avatar} alt={db.currentUser.name} className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-indigo-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-tight">{db.currentUser.name}</p>
                <span className="text-[9px] text-amber-300 font-extrabold font-mono block uppercase">{db.currentUser.role}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main content area */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content-area">
        {/* Upper Header Status Bar for dates and user display */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200/60 justify-between items-center px-8 shrink-0 shadow-sm">
          <div className="text-xs text-slate-500 font-bold font-mono flex items-center gap-2">
            <span className="text-blue-600">RNC: 1-31-01934-2</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Santo Domingo, República Dominicana</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Acceso de Seguridad</span>
              <p className="font-extrabold text-slate-800">{db.currentUser.name}</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-extrabold border border-indigo-100 uppercase text-[10px] tracking-wide flex items-center gap-1.5 shadow-sm">
              <Shield className="h-3.5 w-3.5 text-indigo-600" />
              <span>{db.currentUser.role}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Tab container with page transition */}
        <div className="flex-1 overflow-y-auto relative bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="p-4 md:p-8"
              id="dynamic-tab-container"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* System copyright bottom status bar */}
        <footer className="bg-white border-t border-slate-200/60 py-3.5 px-8 text-center text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0 shadow-inner">
          <p className="font-medium text-slate-500">© 2026 Sistema de financiera RD • Sistema Unificado de Gestión de Financiamiento Vehicular Dominicana</p>
         
        </footer>
      </main>
    </div>
  );
}
