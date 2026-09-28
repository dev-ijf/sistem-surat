import React from 'react';
import { LayoutDashboard, Inbox, Send, BarChart2, Users, LogOut} from 'lucide-react';

const Sidebar = ({ activeMenu, setActiveMenu, onLogout, userRole }) => {
  
  const getMenuItemClass = (menuName) => {
    const isActive = activeMenu === menuName;
    return `flex items-center gap-3 px-3 py-2 mx-3 my-1 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium ${
      isActive 
        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  };

  return (
    <aside className="w-56 h-screen bg-white border-r border-slate-200 flex flex-col justify-between fixed left-0 top-0 z-50">
      
      <div className="overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none pb-4">
        
        <div className="bg-linear-to-r from-purple-600 to-indigo-600 rounded-br-3xl px-4 py-5 mb-3 shadow-sm flex flex-col">
          
          <div className="flex items-center gap-3 relative z-10">
            <img 
              src="/public/LOGO-KREATIVA-EDUCATION-NETWORK-01.png" 
              alt="Logo Kreativa" 
              className="h-14 w-auto object-contain drop-shadow-sm shrink-0" 
            />
            <h1 className="text-white leading-none whitespace-nowrap" style={{ fontSize: '18px', letterSpacing: 'normal', fontWeight: 700}}>
              SISTEM SURAT
            </h1>
          </div>
          
          <p className="text-white/80 font-medium leading-tight text-center w-full -mt-2.5 relative z-0" style={{ fontSize: '12px' }}>
            Manajemen Arsip Digital
          </p>
          
        </div>

        <div className="flex flex-col mt-3">
          
          <div className="px-4 mb-2 mt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Menu Utama
            </span>
          </div>
          
          <div onClick={() => setActiveMenu('dashboard')} className={getMenuItemClass('dashboard')}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
          
          <div onClick={() => setActiveMenu('surat-masuk')} className={getMenuItemClass('surat-masuk')}>
            <Inbox size={18} />
            <span>Surat Masuk</span>
          </div>
          
          <div onClick={() => setActiveMenu('surat-keluar')} className={getMenuItemClass('surat-keluar')}>
            <Send size={18} />
            <span>Surat Keluar</span>
          </div>
          
          <div onClick={() => setActiveMenu('laporan')} className={getMenuItemClass('laporan')}>
            <BarChart2 size={18} />
            <span>Laporan</span>
          </div>

          {(userRole === 'Admin' || userRole === 'Super Admin') && (
            <>
              <div className="px-4 mb-2 mt-5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Administrator
                </span>
              </div>
              
              <div onClick={() => setActiveMenu('manajemen-user')} className={getMenuItemClass('manajemen-user')}>
                <Users size={18} />
                <span>Manajemen User</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-slate-100 shrink-0 bg-white">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all font-semibold text-sm"
        >
          <LogOut size={16} strokeWidth={2.5} />
          Logout
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;