import React, { useState, useEffect, useCallback } from 'react';
import AuthLayout from './layout/AuthLayout';
import Dashboard from './components/Dashboard';
import Sidebar from './layout/Sidebar';
import { Plus, FileText, Settings, Search, Trash2, Edit2, X, Inbox, Save, Loader2, WifiOff, Hash, Calendar, AlertCircle, LogOut, Tag, Users, Building, ArrowRight, Copy } from 'lucide-react';

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

const getShortCode = (value) => {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
};

const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeMenu, setActiveMenu] = useState('dashboard'); 
  const [activeTab, setActiveTab] = useState('daftar');
  const [activeMasterTab, setActiveMasterTab] = useState('Jenis Surat');
  const [activeMasterCard, setActiveMasterCard] = useState('Kategori Surat');
  
  const [showModal, setShowModal] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [suratList, setSuratList] = useState([]);
  const [masterData, setMasterData] = useState({
    'Jenis Surat': [],
    'Kategori Surat': [
      { id: 1, nama: 'Penting', deskripsi: 'Membutuhkan respon segera' },
      { id: 2, nama: 'Biasa', deskripsi: 'Korespondensi umum' }
    ],
    'Struktur Organisasi': [
      { id: 1, nama: 'DIR', jabatan: 'Direktur' },
      { id: 2, nama: 'KS', jabatan: 'Kepala Sekolah' }
    ],
    'Instansi': [
      { id: 1, nama: 'IJF' },
      { id: 2, nama: 'KEN' },
      { id: 3, nama: 'MEDC' },
      { id: 4, nama: 'OPS' },
      { id: 5, nama: 'FIN' }
    ],
    'Kepada (Internal)': [
      { id: 1, nama: 'Divisi HRD' },
      { id: 2, nama: 'Divisi Finance' },
      { id: 3, nama: 'Divisi IT' },
      { id: 4, nama: 'Divisi Marketing' },
      { id: 5, nama: 'Divisi Operasional' }
    ]
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua Kategori');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [editingMaster, setEditingMaster] = useState(null);
  const [editingSurat, setEditingSurat] = useState(null);
  const [masterForm, setMasterForm] = useState({ nama: '', deskripsi: '', jabatan: '' });

  const initialFormData = {
    jenisSurat: '',
    dari: '',
    instansi: '',
    tglSurat: new Date().toISOString().split('T')[0],
    perihal: '',
    kategori: 'Biasa',
    nomorSurat: '',
    status: 'Draft',
    fileSurat: null,
    fileSuratName: ''
  };
  const [formData, setFormData] = useState(initialFormData);

  const fetchData = useCallback(async (retryCount = 0) => {
    setIsLoading(true);
    try {
      const fetchOptions = { method: 'GET', headers: { 'Accept': 'application/json' }, mode: 'cors' };
      const [resSurat, resJenis, resStruktur, resKategori, resInstansi, resKepada] = await Promise.all([
        fetch(`${API_BASE}/surat`, fetchOptions),
        fetch(`${API_BASE}/setting/jenis`, fetchOptions),
        fetch(`${API_BASE}/setting/internal`, fetchOptions),
        fetch(`${API_BASE}/setting/kategori`, fetchOptions),
        fetch(`${API_BASE}/setting/instansi`, fetchOptions),
        fetch(`${API_BASE}/setting/kepada`, fetchOptions)
      ]);

      if (!resSurat.ok || !resJenis.ok || !resStruktur.ok || !resKategori.ok || !resInstansi.ok || !resKepada.ok) {
        throw new Error('Server merespon dengan error');
      }

      const dataSurat = await resSurat.json();
      const dataJenis = await resJenis.json();
      const dataStruktur = await resStruktur.json();
      const dataKategori = await resKategori.json();
      const dataInstansi = await resInstansi.json();
      const dataKepada = await resKepada.json();

      setSuratList(Array.isArray(dataSurat) ? dataSurat : []);
      setMasterData(prev => ({
        ...prev,
        'Jenis Surat': Array.isArray(dataJenis) ? dataJenis : [],
        'Struktur Organisasi': Array.isArray(dataStruktur) ? dataStruktur : [],
        'Kategori Surat': Array.isArray(dataKategori) ? dataKategori : prev['Kategori Surat'],
        'Instansi': Array.isArray(dataInstansi) ? dataInstansi : prev['Instansi'],
        'Kepada (Internal)': Array.isArray(dataKepada) ? dataKepada : prev['Kepada (Internal)']
      }));

      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
      if (retryCount < 2) setTimeout(() => fetchData(retryCount + 1), 2000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [fetchData, user]);

  useEffect(() => {
    if (formData.jenisSurat && formData.dari && formData.instansi) {
      const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
      const d = new Date(formData.tglSurat);
      const year = d.getFullYear();
      const month = romans[d.getMonth()];
      const count = (suratList?.length || 0) + 1;
      const short = getShortCode(formData.jenisSurat);
      const num = `${String(count).padStart(3, '0')}/${short}-${formData.dari}/${formData.instansi}/${month}/${year}`;
      setFormData(prev => ({ ...prev, nomorSurat: num }));
    }
  }, [formData.jenisSurat, formData.dari, formData.instansi, formData.tglSurat, suratList.length]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    window.location.reload();
  };

  const resetForm = () => {
    setEditingSurat(null);
    setFormData(initialFormData);
  };

  const getMasterEndpoint = (category) => {
    if (category === 'Jenis Surat') return 'jenis';
    if (category === 'Struktur Organisasi') return 'internal';
    if (category === 'Kategori Surat') return 'kategori';
    if (category === 'Instansi') return 'instansi';
    if (category === 'Kepada (Internal)') return 'kepada';
    return null;
  };

  const handleSaveMaster = async () => {
    if (!masterForm.nama.trim()) return alert("Nama referensi wajib diisi.");

    const category = activeMasterCard || activeMasterTab;
    const endpoint = getMasterEndpoint(category);
    const payload = {
      nama: masterForm.nama,
      deskripsi: masterForm.deskripsi || '',
      jabatan: masterForm.jabatan || ''
    };

    if (!endpoint) {
      if (editingMaster) {
        setMasterData(prev => ({
          ...prev,
          [category]: prev[category].map(item => item.id === editingMaster.id ? { ...item, ...payload } : item)
        }));
      } else {
        setMasterData(prev => ({ ...prev, [category]: [...prev[category], { id: Date.now(), ...payload }] }));
      }
      setShowMasterModal(false);
      setEditingMaster(null);
      setMasterForm({ nama: '', deskripsi: '', jabatan: '' });
      return;
    }

    try {
      const method = editingMaster ? 'PUT' : 'POST';
      const url = editingMaster ? `${API_BASE}/setting/${endpoint}/${editingMaster.id}` : `${API_BASE}/setting/${endpoint}`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Gagal menyimpan master data");
      await fetchData();
      setShowMasterModal(false);
      setEditingMaster(null);
      setMasterForm({ nama: '', deskripsi: '', jabatan: '' });
    } catch (err) {
      alert(`Koneksi gagal: Pastikan endpoint backend ${API_BASE} sudah tersedia.`);
    }
  };

  const handleDeleteMaster = async (item, categoryOverride) => {
    const category = categoryOverride || activeMasterCard || activeMasterTab;
    const endpoint = getMasterEndpoint(category);

    if (!item?.id) return;
    if (!window.confirm(`Hapus "${item.nama}" dari ${category}?`)) return;

    if (!endpoint) {
      setMasterData(prev => ({ ...prev, [category]: prev[category].filter(i => i.id !== item.id) }));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/setting/${endpoint}/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Gagal menghapus master data");
      await fetchData();
    } catch (err) {
      alert("Gagal menghapus master data.");
    }
  };

  const handleSave = async () => {
    const perihalTrimmed = String(formData.perihal || "").trim();
    const jenisSuratTrimmed = String(formData.jenisSurat || "").trim();
    const dariTrimmed = String(formData.dari || "").trim();
    const instansiTrimmed = String(formData.instansi || "").trim();

    if (!perihalTrimmed || !jenisSuratTrimmed || !dariTrimmed || !instansiTrimmed) {
      return alert("Kolom wajib diisi (Perihal, Jenis, Pengirim, Instansi)");
    }

    setIsSaving(true);
    try {
      const method = editingSurat ? 'PUT' : 'POST';
      const url = editingSurat ? `${API_BASE}/surat/${editingSurat.id}` : `${API_BASE}/surat`;

      const payload = new FormData();
      payload.append("jenisSurat", jenisSuratTrimmed);
      payload.append("tglSurat", formData.tglSurat || "");
      payload.append("dari", dariTrimmed);
      payload.append("instansi", instansiTrimmed);
      payload.append("perihal", perihalTrimmed);
      payload.append("kategori", formData.kategori || "Biasa");
      payload.append("nomorSurat", formData.nomorSurat || "");
      payload.append("status", formData.status || "Draft");
      if (formData.fileSurat) payload.append("fileSurat", formData.fileSurat);

      const res = await fetch(url, { method, body: payload });
      if (!res.ok) throw new Error("Respon server gagal");

      await fetchData();
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert(`Gagal menyimpan data.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSurat = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus arsip surat ini?")) return;
    try {
      const res = await fetch(`${API_BASE}/surat/${id}`, { method: 'DELETE' });
      if (!res.ok) return alert("Gagal menghapus: Server memberikan respon negatif.");
      await fetchData();
    } catch (err) {
      alert("Koneksi terputus ke server.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, fileSurat: file, fileSuratName: file ? file.name : '' }));
  };

  const handleCopyNomorSurat = async (nomor) => {
    if (!nomor) return;
    try {
      await navigator.clipboard.writeText(nomor);
      alert('Nomor surat disalin ke clipboard.');
    } catch (err) {
      alert('Gagal menyalin nomor surat.');
    }
  };

  const openEditSurat = (surat) => {
    setEditingSurat(surat);
    setFormData({
      ...initialFormData,
      ...surat,
      tglSurat: surat?.tglSurat ? new Date(surat.tglSurat).toISOString().split('T')[0] : initialFormData.tglSurat,
      fileSurat: null,
      fileSuratName: surat?.fileSuratName || surat?.lampiran || ''
    });
    setShowModal(true);
  };


  const categoryOptions = ['Semua Kategori', ...(masterData['Kategori Surat'] || []).map(k => k.nama)];
  const statusOptions = ['Semua Status', 'Draft', 'Terkirim', 'Selesai'];

  const visibleSuratList = (suratList || []).filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || (
      s.perihal?.toLowerCase().includes(query) ||
      s.nomorSurat?.toLowerCase().includes(query) ||
      s.dari?.toLowerCase().includes(query) ||
      s.tujuan?.toLowerCase().includes(query)
    );
    const matchesCategory = filterCategory === 'Semua Kategori' || s.kategori === filterCategory;
    const matchesStatus = filterStatus === 'Semua Status' || s.status === filterStatus;
    return matchesQuery && matchesCategory && matchesStatus;
  });

  const countByStatus = (status) => (suratList || []).filter(s => String(s.status || '').toLowerCase() === status.toLowerCase()).length;
  const totalCount = suratList.length;
  const draftCount = countByStatus('Draft');
  const terkirimCount = countByStatus('Terkirim');
  const selesaiCount = countByStatus('Selesai');

  const masterCardConfig = [
    { key: 'Jenis Surat', title: 'Jenis Surat', subtitle: 'Tipe surat: keputusan, permohonan, dll', icon: <FileText size={16} /> },
    { key: 'Kategori Surat', title: 'Kategori', subtitle: 'Jenis kategori surat', icon: <Tag size={16} /> },
    { key: 'Struktur Organisasi', title: 'Dari (Pengirim)', subtitle: 'Pengirim surat internal', icon: <Users size={16} /> },
    { key: 'Instansi', title: 'Instansi', subtitle: 'Unit / cabang terkait', icon: <Building size={16} /> },
    { key: 'Kepada (Internal)', title: 'Kepada (Internal)', subtitle: 'Tujuan internal surat', icon: <ArrowRight size={16} /> }
  ];

  const getHeaderTitle = () => {
    switch (activeMenu) {
      case 'dashboard': return 'Dashboard Utama';
      case 'surat-masuk': return 'Manajemen Surat Masuk';
      case 'surat-keluar': return 'Manajemen Surat Keluar';
      case 'laporan': return 'Laporan Arsip';
      case 'manajemen-user': return 'Manajemen Akses User';
      default: return 'Sistem Surat';
    }
  };

  if (!user) {
    return <AuthLayout />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased overflow-hidden">
      
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        onLogout={handleLogout} 
        userRole={user?.role || 'Staff'} 
      />

      <div className="flex-1 flex flex-col h-screen md:ml-56 relative">

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
            <h2 className="text-xl md:text-2xl font-bold text-black tracking-tight" style={{ color: '#000000 !important' }}>
              {getHeaderTitle()}
            </h2>
            
            <div className="flex items-center gap-4">
              {(activeMenu === 'surat-keluar' || activeMenu === 'surat-masuk') && (
                <button
                  onClick={() => { resetForm(); setShowModal(true); }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm hover:bg-blue-700 hover:-translate-y-0.5"
                >
                  <Plus size={16} strokeWidth={2.5} /> Tambah Surat
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-20">
          
          {activeMenu === 'dashboard' && (
            <Dashboard suratList={suratList} />
          )}

          {(activeMenu === 'surat-masuk' || activeMenu === 'laporan' || activeMenu === 'manajemen-user') && (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-2xl bg-white mt-4">
              <Settings className="text-slate-300 mb-3" size={40} />
              <h3 className="text-lg font-semibold text-slate-700">Halaman {getHeaderTitle()}</h3>
              <p className="text-sm text-slate-500 mt-1">Fitur ini sedang dalam tahap pengembangan.</p>
            </div>
          )}

          {activeMenu === 'surat-keluar' && (
            <>
              <div className="flex flex-col gap-4 mb-6 border-b border-slate-200 md:flex-row md:items-center md:justify-between mt-2">
                <div className="flex items-center gap-6">
                  <button onClick={() => setActiveTab('daftar')} className={`pb-4 flex items-center gap-2 text-xs md:text-sm font-semibold uppercase tracking-[0.14em] transition-all relative ${activeTab === 'daftar' ? 'text-blue-600' : 'text-slate-400'}`}>
                    <FileText size={16} /> Daftar Surat
                    {activeTab === 'daftar' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
                  </button>
                  <button onClick={() => setActiveTab('master')} className={`pb-4 flex items-center gap-2 text-xs md:text-sm font-semibold uppercase tracking-[0.14em] transition-all relative ${activeTab === 'master' ? 'text-blue-600' : 'text-slate-400'}`}>
                    <Settings size={16} /> Master Data
                    {activeTab === 'master' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
                  </button>
                </div>
              </div>

              {activeTab === 'daftar' ? (
                <div>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="relative flex-1 min-w-0">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input className="input-field search-field" placeholder="Cari nomor, perihal, tujuan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 w-full max-w-xl sm:grid-cols-2">
                        <select className="input-field" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                          {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                        <select className="input-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                          {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-3 mt-4 md:grid-cols-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Surat</p>
                        <p className="mt-0.5 text-xl font-bold text-slate-900">{totalCount}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Draft</p>
                        <p className="mt-0.5 text-xl font-bold text-amber-500">{draftCount}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Terkirim</p>
                        <p className="mt-0.5 text-xl font-bold text-blue-600">{terkirimCount}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Selesai</p>
                        <p className="mt-0.5 text-xl font-bold text-emerald-500">{selesaiCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider">Nomor Surat</th>
                            <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider">Perihal</th>
                            <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider">Pengirim</th>
                            <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider">Tanggal</th>
                            <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {visibleSuratList.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-semibold text-blue-600 text-xs break-all">{s.nomorSurat}</span>
                                  <button onClick={() => handleCopyNomorSurat(s.nomorSurat)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded transition-all">
                                    <Copy size={13} />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-[13px] text-slate-800 max-w-xs truncate">{s.perihal}</div>
                                <div className="text-[10px] text-slate-500 uppercase mt-0.5 font-medium">{s.jenisSurat} • {s.kategori}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                                    {s.dari?.substring(0, 2).toUpperCase() || '??'}
                                  </div>
                                  <span className="text-[13px] font-medium text-slate-600">{s.dari}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[13px] text-slate-600 font-medium">
                                {s.tglSurat ? new Date(s.tglSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => openEditSurat(s)} className="p-1.5 text-amber-500 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-lg transition-all shadow-sm">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => handleDeleteSurat(s.id)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {visibleSuratList.length === 0 && !isLoading && (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-slate-400 italic text-sm">
                                {isConnected ? "Tidak ada arsip surat." : "Gagal memuat data dari server."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-slate-900">Konfigurasi Referensi</h2>
                    <p className="mt-1 text-sm text-slate-500">Kelola master data untuk opsi *dropdown* di dalam formulir surat.</p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {masterCardConfig.map((card) => (
                      <div key={card.key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              {card.icon}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-[15px] font-semibold text-slate-900">{card.title}</h3>
                              <p className="text-[11px] text-slate-500">{card.subtitle}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setActiveMasterCard(card.key);
                              setEditingMaster(null);
                              setMasterForm({ nama: '', deskripsi: '', jabatan: '' });
                              setShowMasterModal(true);
                            }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                          >
                            + Tambah
                          </button>
                        </div>
                        <div className="mt-5 space-y-2">
                          {(masterData[card.key] || []).map((item, index) => (
                            <div key={item.id || index} className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="font-semibold text-slate-800 text-[13px]">{item.nama}</div>
                                  {(item.deskripsi || item.jabatan) && <div className="mt-0.5 text-[11px] text-slate-500">{item.deskripsi || item.jabatan}</div>}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => { setActiveMasterCard(card.key); setEditingMaster(item); setMasterForm({ nama: item.nama || '', deskripsi: item.deskripsi || '', jabatan: item.jabatan || '' }); setShowMasterModal(true); }} className="rounded-md p-1.5 text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-blue-600 hover:border-blue-200 transition-all">
                                    <Edit2 size={12} />
                                  </button>
                                  <button onClick={() => handleDeleteMaster(item, card.key)} className="rounded-md p-1.5 text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-red-500 hover:border-red-200 transition-all">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showMasterModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <h2 className="text-lg font-bold text-slate-900">{editingMaster ? 'Update' : 'New'} {activeMasterCard || activeMasterTab}</h2>
              <button onClick={() => setShowMasterModal(false)} className="text-slate-400 hover:text-slate-900"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 block">Nama Referensi</label>
                <input className="input-field" value={masterForm.nama} onChange={e => setMasterForm({ ...masterForm, nama: e.target.value })} placeholder="Input nama..." />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 block">{(activeMasterCard || activeMasterTab) === 'Struktur Organisasi' ? 'Jabatan / Divisi' : 'Keterangan'}</label>
                <input className="input-field" value={(activeMasterCard || activeMasterTab) === 'Struktur Organisasi' ? masterForm.jabatan : masterForm.deskripsi} onChange={e => setMasterForm({ ...masterForm, [(activeMasterCard || activeMasterTab) === 'Struktur Organisasi' ? 'jabatan' : 'deskripsi']: e.target.value })} placeholder="..." />
              </div>
            </div>
            <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowMasterModal(false)} className="text-sm font-medium text-slate-400">Cancel</button>
              <button onClick={handleSaveMaster} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-white/20">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{editingSurat ? 'Perbarui Arsip' : 'Formulir Surat Baru'}</h2>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking- mt-0.5">Sinkronisasi data otomatis</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Jenis Surat *</label>
                    <select className="input-field" value={formData.jenisSurat} onChange={e => setFormData({ ...formData, jenisSurat: e.target.value })}>
                      <option value="">-- Pilih Jenis Surat --</option>
                      {masterData['Jenis Surat'].map(j => <option key={j.id} value={j.nama}>{j.nama}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Dari (Pengirim) *</label>
                    <select className="input-field" value={formData.dari} onChange={e => setFormData({ ...formData, dari: e.target.value })}>
                      <option value="">-- Pilih Pengirim --</option>
                      {masterData['Struktur Organisasi'].map(s => <option key={s.id} value={s.nama}>{s.nama} {s.jabatan ? `(${s.jabatan})` : ''}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Kategori *</label>
                    <select className="input-field" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })}>
                      {masterData['Kategori Surat'].map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Perihal Surat *</label>
                    <textarea className="input-field min-h-20 resize-none" value={formData.perihal} onChange={e => setFormData({ ...formData, perihal: e.target.value })} placeholder="Ringkasan isi surat..." />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Tanggal Surat</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input type="date" className="input-field pl-9" value={formData.tglSurat} onChange={e => setFormData({ ...formData, tglSurat: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Instansi *</label>
                    <select className="input-field" value={formData.instansi} onChange={e => setFormData({ ...formData, instansi: e.target.value })}>
                      <option value="">-- Pilih Instansi --</option>
                      {masterData['Instansi'].map(i => <option key={i.id} value={i.nama}>{i.nama}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 block">Upload Dokumen</label>
                    <input type="file" className="input-field file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-blue-600 text-xs" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} />
                    <p className="text-[10px] text-slate-400">Opsional. {formData.fileSuratName ? ` File: ${formData.fileSuratName}` : ''}</p>
                  </div>
                  <div className="pt-1">
                    <div className="p-3 bg-slate-900 rounded-xl text-center shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10"><Hash size={36} className="text-white" /></div>
                      <label className="text-[9px] font-bold text-slate-400 mb-1 block uppercase tracking-[0.2em]">Nomor Surat Terbentuk</label>
                      <div className="font-mono font-bold text-white text-xs tracking-tight break-all">{formData.nomorSurat || "Menunggu Input..."}</div>
                    </div>
                  </div>
                </div>
              </div>  
            </div>
            <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex justify-end items-center gap-3">
              <button onClick={() => setShowModal(false)} className="text-xs font-medium text-slate-400 hover:text-slate-600">Discard</button>
              <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-md disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                {editingSurat ? 'Simpan Perubahan' : 'Simpan Arsip'}
              </button>
            </div>
          </div>
        </div>
      )}

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
  );
};

export default App;