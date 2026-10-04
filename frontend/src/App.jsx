import React, { useState, useEffect, useCallback } from 'react';
import AuthLayout from './layout/AuthLayout';
import Dashboard from './components/Dashboard';
import Sidebar from './layout/Sidebar';
import { Plus, FileText, Settings, Search, Trash2, Edit2, X, Inbox, Save, Loader2, WifiOff, Hash, Calendar, AlertCircle, LogOut, Tag, Users, Building, ArrowRight, Copy, Filter, Menu } from 'lucide-react';
import SuratKeluar from './pages/SuratKeluar/SuratKeluar';
import ManajemenUser from './pages/ManajemenUser/ManajemenUser';
const getApiBase = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  const isBrowser = typeof window !== "undefined";
  const isLocalPage = isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const pointsToLocalhost = configuredUrl && /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(configuredUrl);

  if (configuredUrl && (!pointsToLocalhost || isLocalPage)) {
    const normalizedUrl = configuredUrl.startsWith("/") || /^https?:\/\//i.test(configuredUrl)
      ? configuredUrl
      : `https://${configuredUrl}`;

    return normalizedUrl.replace(/\/$/, "");
  }
  return "/api";
};

const API_BASE = getApiBase();


const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeMenu, setActiveMenu] = useState(() => {
    const hash = window.location.hash.replace('#', '').split('/')[0];
    return ['dashboard', 'surat-keluar', 'manajemen-user'].includes(hash) ? hash : 'dashboard';
  });
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');

  const [suratList, setSuratList] = useState([]);
  const [masterData, setMasterData] = useState({
    'Jenis Surat': [],
    'Kategori Surat': [],
    'Struktur Organisasi': [],
    'Instansi': [],
    'Kepada (Internal)': [],
    'Kop Surat': []
  });



  const fetchData = useCallback(async function doFetch(retryCount = 0) {
    setIsLoading(true);
    try {
      const fetchOptions = { method: 'GET', headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }, mode: 'cors', cache: 'no-store' };
      const [resSurat, resJenis, resStruktur, resKategori, resInstansi, resKepada, resKop] = await Promise.all([
        fetch(`${API_BASE}/surat`, fetchOptions),
        fetch(`${API_BASE}/setting/jenis`, fetchOptions),
        fetch(`${API_BASE}/setting/internal`, fetchOptions),
        fetch(`${API_BASE}/setting/kategori`, fetchOptions),
        fetch(`${API_BASE}/setting/instansi`, fetchOptions),
        fetch(`${API_BASE}/setting/kepada`, fetchOptions),
        fetch(`${API_BASE}/setting/kopsurat`, fetchOptions)
      ]);

      if (!resSurat.ok || !resJenis.ok || !resStruktur.ok || !resKategori.ok || !resInstansi.ok || !resKepada.ok || !resKop.ok) {
        throw new Error('Server merespon dengan error');
      }

      const dataSurat = await resSurat.json();
      const dataJenis = await resJenis.json();
      const dataStruktur = await resStruktur.json();
      const dataKategori = await resKategori.json();
      const dataInstansi = await resInstansi.json();
      const dataKepada = await resKepada.json();
      const dataKop = await resKop.json();

      setSuratList(Array.isArray(dataSurat) ? dataSurat : []);
      setMasterData(prev => ({
        ...prev,
        'Jenis Surat': Array.isArray(dataJenis) ? dataJenis : [],
        'Struktur Organisasi': Array.isArray(dataStruktur) ? dataStruktur : [],
        'Kategori Surat': Array.isArray(dataKategori) ? dataKategori : prev['Kategori Surat'],
        'Instansi': Array.isArray(dataInstansi) ? dataInstansi : prev['Instansi'],
        'Kepada (Internal)': Array.isArray(dataKepada) ? dataKepada : prev['Kepada (Internal)'],
        'Kop Surat': Array.isArray(dataKop) ? dataKop : prev['Kop Surat']
      }));

      setIsConnected(true);
    } catch {
      setIsConnected(false);
      if (retryCount < 2) setTimeout(() => doFetch(retryCount + 1), 2000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [fetchData, user]);

  useEffect(() => {
    const currentMenu = window.location.hash.replace('#', '').split('/')[0];
    if (currentMenu !== activeMenu) {
      window.history.pushState(null, '', `#${activeMenu}`);
    }
  }, [activeMenu]);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '').split('/')[0];
      if (['dashboard', 'surat-keluar', 'manajemen-user'].includes(hash)) {
        setActiveMenu(hash);
      } else {
        setActiveMenu('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);



  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    window.location.reload();
  };



  const getHeaderTitle = () => {
    switch (activeMenu) {
      case 'dashboard': return 'Dashboard Utama';
      case 'surat-keluar': return 'Manajemen Surat Keluar';
      case 'manajemen-user': return 'Manajemen User';
      default: return 'Sistem Surat';
    }
  };

  if (!user) {
    return <AuthLayout />;
  }

  return (
    <div className="flex bg-slate-50 font-sans antialiased overflow-hidden" style={{ zoom: 0.85, height: '117.64vh' }}>

      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden shrink-0'}`}>
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          onLogout={handleLogout}
          userRole={user?.role || 'Staff'}
        />
      </div>

      <div className="flex-1 flex flex-col h-full relative transition-all duration-300 ease-in-out min-w-0">

        {!isConnected && (
          <div className="bg-red-600 text-white text-[10px] font-semibold py-2 px-4 flex items-center justify-center gap-2 uppercase tracking-[0.12em] w-full z-100 shadow-sm">
            <WifiOff size={13} strokeWidth={2.5} />
            Backend Offline ({API_BASE})
            <button onClick={() => fetchData()} className="ml-2 bg-white/20 px-2.5 py-1 rounded-md hover:bg-white/30 transition-all">
              Coba Lagi
            </button>
          </div>
        )}

        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl shrink-0">
          <div className="flex h-16 items-center justify-between gap-4 px-6 md:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-lg md:text-xl !font-semibold tracking-tight !m-0 !p-0 !text-slate-800 leading-none">
                {getHeaderTitle()}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Cari data..."
                  className="input-field search-field w-64 md:w-80 bg-slate-50/50"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 py-4 md:py-6 pb-20">

          {activeMenu === 'dashboard' && (
            <Dashboard suratList={suratList} user={user} />
          )}

          {activeMenu === 'manajemen-user' && (
            <ManajemenUser globalSearch={globalSearch} />
          )}

          {activeMenu === 'surat-keluar' && (
            <SuratKeluar
              suratList={suratList}
              masterData={masterData}
              setMasterData={setMasterData}
              fetchData={fetchData}
              isLoading={isLoading}
              isConnected={isConnected}
              API_BASE={API_BASE}
              globalSearch={globalSearch}
            />
          )}
        </main>

        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.01em; }
        .input-field { width: 100%; border: 1px solid #e2e8f0; background: white; padding: 0.4rem 0.6rem; border-radius: 0.4rem; outline: none; font-size: 0.8rem; font-weight: 500; transition: all 0.2s; color: #1e293b; }
        .input-field:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); background: #fff; }
        .search-field { padding-left: 2rem; padding-right: 0.6rem; }
        select.input-field { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 1rem; padding-right: 2.2rem; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        
        /* Custom Scrollbar Klasik, Elegan dan Transparan/Abu Muda */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1; /* slate-300: abu-abu muda elegan */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8; /* slate-400: Sedikit lebih gelap saat di-hover */
        }
      `}</style>
      </div>
    </div>
  );
};

export default App;