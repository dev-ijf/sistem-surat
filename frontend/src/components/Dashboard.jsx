import React from 'react';
import { FileText, Send, Users, Calendar, Inbox, TrendingUp, Bell} from 'lucide-react';

const Dashboard = ({ suratList = [] }) => {
  const totalSuratKeluar = suratList.length;
  const totalPengguna = 4;

  const todayFormatted = new Intl.DateTimeFormat('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  //dummy untuk sementara 
  const latestSuratMasuk = [
    { id: 1, instansi: 'Pemerintah Kota', perihal: 'Pemberitahuan Kegiatan k...', tanggal: '22 Jan 2026' },
    { id: 2, instansi: 'CV. Sumber Makmur', perihal: 'Permohonan Izin ke-2', tanggal: '01 Jan 2026' },
    { id: 3, instansi: 'Dinas Pendidikan', perihal: 'Pemberitahuan Kegiatan k...', tanggal: '28 Jan 2026' },
    { id: 4, instansi: 'PT. Maju Jaya', perihal: 'Pemberitahuan Kegiatan k...', tanggal: '09 Jan 2026' }
  ];

  return (
    <div className="space-y-4">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 -mt-2">
        <div>
          <h1 className="text-xl font-black tracking-tight text-black" style={{ color: '#000000 !important' }}>Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Selamat datang kembali, <span className="font-semibold text-slate-700">SuperAdmin</span>!</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-sm w-fit">
          <Calendar size={15} className="text-blue-600" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-black shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-3 top-3 opacity-10">
            <Inbox size={80} color="#000" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Surat Masuk</p>
            <h3 className="text-4xl font-black mt-2 text-black">20</h3>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Total arsip tersimpan</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-black shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-3 top-3 opacity-10">
            <Send size={80} color="#000" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Surat Keluar</p>
            <h3 className="text-4xl font-black mt-2 text-black">{totalSuratKeluar}</h3>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Total arsip tersimpan</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-black shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-3 top-3 opacity-10">
            <Users size={80} color="#000" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Pengguna Sistem</p>
            <h3 className="text-4xl font-black mt-2 text-black">{totalPengguna}</h3>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Admin & Petugas</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              <h3 className="font-bold text-slate-900 text-base">Statistik Surat Tahun 2026</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-blue-500 inline-block"></span> Surat Masuk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-emerald-500 inline-block"></span> Surat Keluar
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
          <p className="text-[11px] text-slate-400 text-center mt-3">Grafik perbandingan volume arsip surat masuk dan keluar bulanan.</p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-900 text-base">Surat Masuk Terbaru</h3>
          </div>

          <div className="space-y-4 flex-1">
            {latestSuratMasuk.map((item) => (
              <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-slate-200/70 last:border-0 last:pb-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Inbox size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-800 text-[13px] truncate">{item.instansi}</h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.perihal}</p>
                  <span className="text-[10px] font-bold text-blue-600 mt-1 block">{item.tanggal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;