import React from 'react';
import { FileText, Send, Calendar, TrendingUp, Bell, Edit3, CheckCircle } from 'lucide-react';

const Dashboard = ({ suratList = [], user }) => {
  const totalSurat = suratList.length;
  const draftCount = suratList.filter(s => String(s.status).toLowerCase() === 'draft').length;
  const selesaiCount = suratList.filter(s => String(s.status).toLowerCase() === 'selesai' || String(s.status).toLowerCase() === 'terkirim').length;

  const todayFormatted = new Intl.DateTimeFormat('id-ID', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  const displayName = user?.role 
    ? (user.role.toLowerCase() === 'superadmin' ? 'Superadmin' : user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase())
    : 'Superadmin';

  const latestSurat = [...suratList]
    .sort((a, b) => new Date(b.tglSurat) - new Date(a.tglSurat))
    .slice(0, 4);

  return (
    <div className="space-y-4">
      
      <div className="pb-2 mt-2">
        <div>
          <h2 className="text-2xl !font-bold tracking-tight !text-black !mt-0">Selamat Datang, {displayName} 👋</h2>
          <p className="text-sm text-slate-500 mt-1">{todayFormatted}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 text-black shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">Total Surat Keluar</p>
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <FileText size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-semibold text-slate-800 leading-none">{totalSurat}</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-1.5">Keseluruhan arsip</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 text-black shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">Draft Surat</p>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Edit3 size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-semibold text-slate-800 leading-none">{draftCount}</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-1.5">Menunggu penyelesaian</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 text-black shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">Selesai / Terkirim</p>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-semibold text-slate-800 leading-none">{selesaiCount}</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-1.5">Surat berhasil diproses</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              <h3 className="font-bold text-slate-900 text-base">Statistik Pembuatan Surat 2026</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-emerald-500 inline-block"></span> Total Arsip Bulanan
              </span>
            </div>
          </div>

          <div className="h-64 w-full flex items-end justify-between gap-2 px-2 pt-10 pb-4 border-b border-slate-200/80 relative">
            <div className="absolute inset-x-0 top-0 border-t border-slate-200/60 flex items-center text-[10px] text-slate-400 pl-2">18</div>
            <div className="absolute inset-x-0 top-1/4 border-t border-slate-200/60 flex items-center text-[10px] text-slate-400 pl-2">14</div>
            <div className="absolute inset-x-0 top-2/4 border-t border-slate-200/60 flex items-center text-[10px] text-slate-400 pl-2">10</div>
            <div className="absolute inset-x-0 top-3/4 border-t border-slate-200/60 flex items-center text-[10px] text-slate-400 pl-2">6</div>

            <div className="w-full h-full flex items-end justify-around z-10">
              {[16, 8, 4, 3, 2, 2, 1, 1, 1, 1, 1, 1].map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end group">
                  <div 
                    className="w-3 bg-linear-to-t from-cyan-400 to-emerald-400 rounded-t-md transition-all duration-300 group-hover:brightness-110" 
                    style={{ height: `${val * 12}px` }}
                  />
                  <span className="text-[10px] text-slate-500 mt-1">{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-3">Grafik representasi volume pembuatan arsip surat keluar setiap bulannya.</p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-900 text-base">Arsip Terbaru</h3>
          </div>

          <div className="space-y-4 flex-1">
            {latestSurat.length > 0 ? latestSurat.map((item) => (
              <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-slate-200/70 last:border-0 last:pb-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Send size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-800 text-[13px] truncate">{item.nomorSurat || '-'}</h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.perihal || 'Tanpa perihal'}</p>
                  <span className="text-[10px] font-bold text-blue-600 mt-1 block">
                    {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(item.tglSurat))}
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                <FileText size={30} className="mb-2 opacity-30" />
                <p className="text-xs">Belum ada arsip surat terbaru.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;