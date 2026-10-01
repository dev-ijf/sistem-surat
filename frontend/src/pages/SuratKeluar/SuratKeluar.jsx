import React, { useState, useEffect } from 'react';
import { Plus, FileText, Settings, Search, Trash2, Edit2, X, Save, Loader2, Hash, Calendar, Copy, Filter, Tag, Users, Building, ArrowRight, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const getShortCode = (value) => {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
};

const SuratKeluar = ({ suratList, masterData, setMasterData, fetchData, isLoading, isConnected, API_BASE, globalSearch }) => {
  const [activeTab, setActiveTab] = useState(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    return hashParts[1] || 'daftar';
  });
  const [activeMasterTab] = useState('Jenis Surat');
  const [activeMasterCard, setActiveMasterCard] = useState(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    return hashParts[2] ? decodeURIComponent(hashParts[2]) : 'Kategori Surat';
  });

  const [showModal, setShowModal] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, title: '', targetName: '', onConfirm: null });

  const templateOptions = (masterData['Kop Surat'] || []).map(k => k.nama);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const menu = 'surat-keluar';
    const hashStr = `#${menu}/${activeTab}/${encodeURIComponent(activeMasterCard)}`;
    const currentHash = window.location.hash;

    if (currentHash !== hashStr && currentHash.startsWith(`#${menu}`)) {
      if (currentHash === `#${menu}`) {
        window.history.replaceState(null, '', hashStr);
      } else {
        window.history.pushState(null, '', hashStr);
      }
    }
  }, [activeTab, activeMasterCard]);

  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'surat-keluar') {
        if (hashParts[1]) setActiveTab(hashParts[1]);
        if (hashParts[2]) setActiveMasterCard(decodeURIComponent(hashParts[2]));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginating, setIsPaginating] = useState(false);

  const handlePageChange = (newPage) => {
    setIsPaginating(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsPaginating(false);
    }, 350);
  };

  const handleLimitChange = (newLimit) => {
    setIsPaginating(true);
    setTimeout(() => {
      setItemsPerPage(newLimit);
      setCurrentPage(1);
      setIsPaginating(false);
    }, 350);
  };

  const [filterCategory, setFilterCategory] = useState('Semua Kategori');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [filterInstansi, setFilterInstansi] = useState('Semua Instansi');
  const [filterPengirim, setFilterPengirim] = useState('Semua Pengirim');
  const [filterJenisSurat, setFilterJenisSurat] = useState('Semua Jenis Surat');
  const [filterSearch, setFilterSearch] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    kategori: 'Semua Kategori',
    status: 'Semua Status',
    instansi: 'Semua Instansi',
    pengirim: 'Semua Pengirim',
    jenisSurat: 'Semua Jenis Surat',
    search: ''
  });
  const [editingMaster, setEditingMaster] = useState(null);
  const [editingSurat, setEditingSurat] = useState(null);
  const [masterForm, setMasterForm] = useState({ nama: '', deskripsi: '', jabatan: '' });

  const initialFormData = {
    jenisSurat: '',
    dari: '',
    instansi: '',
    tglSurat: new Date().toISOString().split('T')[0],
    perihal: '',
    judul: '',
    kategori: 'Biasa',
    nomorSurat: '',
    status: 'Draft',
    fileSurat: null,
    fileSuratName: ''
  };
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (formData.jenisSurat && formData.dari && formData.instansi) {
      const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
      const d = new Date(formData.tglSurat);
      const year = d.getFullYear();
      const month = romans[d.getMonth()];
      const count = (suratList?.length || 0) + 1;
      const short = getShortCode(formData.jenisSurat);
      const num = `${String(count).padStart(3, '0')}/${short}-${formData.dari}/${formData.instansi}/${month}/${year}`;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({ ...prev, nomorSurat: num }));
    }
  }, [formData.jenisSurat, formData.dari, formData.instansi, formData.tglSurat, suratList?.length]);

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
    } catch {
      alert(`Koneksi gagal: Pastikan endpoint backend ${API_BASE} sudah tersedia.`);
    }
  };

  const handleDeleteMaster = (item, categoryOverride) => {
    const category = categoryOverride || activeMasterCard || activeMasterTab;
    const endpoint = getMasterEndpoint(category);

    if (!item?.id) return;
    
    setDeleteModalConfig({
      isOpen: true,
      targetName: `Hapus "${item.nama}" dari ${category}?`,
      onConfirm: async () => {
        setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
        if (!endpoint) {
          setMasterData(prev => ({ ...prev, [category]: prev[category].filter(i => i.id !== item.id) }));
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/setting/${endpoint}/${item.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error("Gagal menghapus master data");
          await fetchData();
        } catch {
          alert("Gagal menghapus master data.");
        }
      }
    });
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
      payload.append("judul", String(formData.judul || "").trim());
      payload.append("kategori", formData.kategori || "Biasa");
      payload.append("nomorSurat", formData.nomorSurat || "");
      payload.append("status", formData.status || "Draft");
      if (formData.fileSurat) payload.append("fileSurat", formData.fileSurat);
      if (formData.templateKop && !editingSurat) payload.append("templateKop", formData.templateKop);

      const res = await fetch(url, { method, body: payload });
      if (!res.ok) throw new Error("Respon server gagal");

      const disposition = res.headers.get('Content-Disposition');
      if (disposition && disposition.includes('attachment')) {
        await res.blob(); // Consume the stream but don't download
      }

      await fetchData();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert(`Gagal menyimpan data.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSurat = (s) => {
    setDeleteModalConfig({
      isOpen: true,
      targetName: `Hapus surat "${s.perihal || s.nomorsurat || 'ini'}"?`,
      onConfirm: async () => {
        setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_BASE}/surat/${s.id}`, { method: 'DELETE' });
          if (!res.ok) return alert("Gagal menghapus: Server memberikan respon negatif.");
          await fetchData();
        } catch {
          alert("Koneksi terputus ke server.");
        }
      }
    });
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
    } catch {
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
  const instansiOptions = ['Semua Instansi', ...(masterData['Instansi'] || []).map(i => i.nama)];
  const pengirimOptions = ['Semua Pengirim', ...(masterData['Struktur Organisasi'] || []).map(p => p.nama)];
  const jenisSuratOptions = ['Semua Jenis Surat', ...(masterData['Jenis Surat'] || []).map(j => j.nama)];

  const visibleSuratList = (suratList || []).filter((s) => {
    const query = (globalSearch || '').toLowerCase();
    const filterQuery = (appliedFilters.search || '').toLowerCase();

    const matchesQuery = !query || (
      s.perihal?.toLowerCase().includes(query) ||
      s.nomorSurat?.toLowerCase().includes(query) ||
      s.dari?.toLowerCase().includes(query) ||
      s.tujuan?.toLowerCase().includes(query)
    );

    const matchesFilterQuery = !filterQuery || (
      s.perihal?.toLowerCase().includes(filterQuery) ||
      s.nomorSurat?.toLowerCase().includes(filterQuery) ||
      s.dari?.toLowerCase().includes(filterQuery) ||
      s.tujuan?.toLowerCase().includes(filterQuery)
    );

    const matchesCategory = appliedFilters.kategori === 'Semua Kategori' || s.kategori === appliedFilters.kategori;
    const matchesStatus = appliedFilters.status === 'Semua Status' || s.status === appliedFilters.status;
    const matchesInstansi = appliedFilters.instansi === 'Semua Instansi' || s.instansi === appliedFilters.instansi;
    const matchesPengirim = appliedFilters.pengirim === 'Semua Pengirim' || s.dari === appliedFilters.pengirim;
    const matchesJenisSurat = appliedFilters.jenisSurat === 'Semua Jenis Surat' || s.jenisSurat === appliedFilters.jenisSurat;

    return matchesQuery && matchesFilterQuery && matchesCategory && matchesStatus && matchesInstansi && matchesPengirim && matchesJenisSurat;
  });

  const totalItems = visibleSuratList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentSuratList = visibleSuratList.slice(startIndex, endIndex);

  const countByStatus = (status) => (suratList || []).filter(s => String(s.status || '').toLowerCase() === status.toLowerCase()).length;
  const totalCount = suratList?.length || 0;
  const draftCount = countByStatus('Draft');
  const terkirimCount = countByStatus('Terkirim');
  const selesaiCount = countByStatus('Selesai');

  const masterCardConfig = [
    { key: 'Jenis Surat', title: 'Jenis Surat', subtitle: 'Tipe surat: keputusan, permohonan, dll', icon: <FileText size={16} /> },
    { key: 'Kategori Surat', title: 'Kategori', subtitle: 'Jenis kategori surat', icon: <Tag size={16} /> },
    { key: 'Struktur Organisasi', title: 'Dari (Pengirim)', subtitle: 'Pengirim surat internal', icon: <Users size={16} /> },
    { key: 'Instansi', title: 'Instansi', subtitle: 'Unit / cabang terkait', icon: <Building size={16} /> },
    { key: 'Kepada (Internal)', title: 'Kepada (Internal)', subtitle: 'Tujuan internal surat', icon: <ArrowRight size={16} /> },
    { key: 'Kop Surat', title: 'Kop Surat', subtitle: 'Template Kop Surat', icon: <FileText size={16} /> }
  ];

  return (
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
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800">Manajemen Surat</h3>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowFilterModal(!showFilterModal)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow-sm ${showFilterModal ? 'bg-slate-100 text-slate-800 border border-slate-300' : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'}`}>
                  <Filter size={16} /> Filter
                </button>
                <button
                  onClick={() => { resetForm(); setShowModal(true); }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm hover:bg-blue-700 hover:-translate-y-0.5"
                >
                  <Plus size={16} strokeWidth={2.5} /> Tambah Surat
                </button>

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

          {/* Expanded Filter Section Outside Card */}
          {showFilterModal && (
            <div className="mb-4 p-5 bg-white border border-slate-200 shadow-sm rounded-xl transition-all duration-300">


              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 block">Kategori</label>
                  <select className="input-field text-sm py-2 bg-slate-50 border-slate-200" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 block">Status</label>
                  <select className="input-field text-sm py-2 bg-slate-50 border-slate-200" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 block">Instansi</label>
                  <select className="input-field text-sm py-2 bg-slate-50 border-slate-200" value={filterInstansi} onChange={(e) => setFilterInstansi(e.target.value)}>
                    {instansiOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 block">Pengirim</label>
                  <select className="input-field text-sm py-2 bg-slate-50 border-slate-200" value={filterPengirim} onChange={(e) => setFilterPengirim(e.target.value)}>
                    {pengirimOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 block">Jenis Surat</label>
                  <select className="input-field text-sm py-2 bg-slate-50 border-slate-200" value={filterJenisSurat} onChange={(e) => setFilterJenisSurat(e.target.value)}>
                    {jenisSuratOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari surat berdasarkan perihal, nomor..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 flex justify-start">
                <button
                  onClick={() => {
                    setAppliedFilters({
                      kategori: filterCategory,
                      status: filterStatus,
                      instansi: filterInstansi,
                      pengirim: filterPengirim,
                      jenisSurat: filterJenisSurat,
                      search: filterSearch
                    });
                  }}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all shadow-sm"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider w-12 text-center">No</th>
                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider">Nomor Surat</th>
                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider">Perihal</th>
                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider">Pengirim</th>
                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider">Tanggal</th>
                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider text-center">File</th>
                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-slate-900 tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isPaginating ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                          <span className="text-sm text-slate-500 font-medium">Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentSuratList.length > 0 ? (
                    currentSuratList.map((s, index) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-center text-[13px] font-medium text-slate-500">
                          {startIndex + index + 1}
                        </td>
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
                        <td className="px-4 py-3 text-center">
                          {s.fileSuratPath ? (
                            <a href={`${API_BASE}/surat/preview/${s.fileSuratPath.split('/').pop().replace('.docx', '.pdf')}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-all">Lihat</a>
                          ) : s.fileSuratName ? (
                            <a href={`https://docs.google.com/viewer?url=${encodeURIComponent((API_BASE.startsWith('/') ? window.location.origin + API_BASE : API_BASE) + `/surat/preview-template/${s.id}/file.docx`)}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-all">Lihat</a>
                          ) : (
                            <span className="text-[13px] text-slate-400 italic">Belum ada</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => openEditSurat(s)} className="p-1.5 text-amber-500 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-lg transition-all shadow-sm">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteSurat(s)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))) : (
                    !isLoading && (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400 italic text-sm">
                          {isConnected ? "Tidak ada arsip surat." : "Gagal memuat data dari server."}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 bg-white">
              <div className="flex items-center gap-4">
                <div>
                  Menampilkan {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} dari {totalItems}
                </div>
                <div className="flex items-center gap-2">
                  <span>Baris</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    disabled={isPaginating}
                    className="input-field py-1 px-2 pr-7 text-xs w-auto border-slate-200 shadow-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || isPaginating}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <span className="font-medium text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || isPaginating}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                >
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-semibold !text-slate-900">Konfigurasi Referensi</h2>
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

      {showMasterModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <h2 className="text-lg font-bold !text-slate-900">{editingMaster ? 'Update' : 'New'} {activeMasterCard || activeMasterTab}</h2>
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
                <h2 className="text-lg font-bold !text-slate-900 tracking-tight">{editingSurat ? 'Perbarui Arsip' : 'Formulir Surat Baru'}</h2>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking- mt-0.5">Sinkronisasi data otomatis</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Jenis Surat <span className="text-red-500">*</span></label>
                    <select className="input-field" value={formData.jenisSurat} onChange={e => setFormData({ ...formData, jenisSurat: e.target.value })}>
                      <option value="">-- Pilih Jenis Surat --</option>
                      {masterData['Jenis Surat']?.map(j => <option key={j.id} value={j.nama}>{j.nama}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Dari (Pengirim) <span className="text-red-500">*</span></label>
                    <select className="input-field" value={formData.dari} onChange={e => setFormData({ ...formData, dari: e.target.value })}>
                      <option value="">-- Pilih Pengirim --</option>
                      {masterData['Struktur Organisasi']?.map(s => <option key={s.id} value={s.nama}>{s.nama} {s.jabatan ? `(${s.jabatan})` : ''}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Kategori <span className="text-red-500">*</span></label>
                    <select className="input-field" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })}>
                      {masterData['Kategori Surat']?.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Perihal Surat <span className="text-red-500">*</span></label>
                    <textarea className="input-field min-h-20 resize-none" value={formData.perihal} onChange={e => setFormData({ ...formData, perihal: e.target.value })} placeholder="Ringkasan isi surat..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Judul Surat</label>
                    <textarea className="input-field min-h-20 resize-none" value={formData.judul} onChange={e => setFormData({ ...formData, judul: e.target.value })} placeholder="Judul surat..." />
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
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Instansi <span className="text-red-500">*</span></label>
                    <select className="input-field" value={formData.instansi} onChange={e => setFormData({ ...formData, instansi: e.target.value })}>
                      <option value="">-- Pilih Instansi --</option>
                      {masterData['Instansi']?.map(i => <option key={i.id} value={i.nama}>{i.nama}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block uppercase tracking-[0.12em]">Status Surat <span className="text-red-500">*</span></label>
                    <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="Draft">Draft</option>
                      <option value="Terkirim">Terkirim</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>
                  {editingSurat ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 block">Upload Dokumen Final (Opsional)</label>
                      <input type="file" className="input-field file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-blue-600 text-xs" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} />
                      <p className="text-[10px] text-slate-400">File lama: {formData.fileSuratName || 'Belum ada'}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 block">Kop Surat (Template) <span className="text-red-500">*</span></label>
                      <select
                        className="input-field"
                        value={formData.templateKop || ''}
                        onChange={e => setFormData({ ...formData, templateKop: e.target.value })}
                      >
                        <option value="">{formData.instansi ? '-- Pilih Kop Surat --' : '-- Pilih Instansi Dahulu --'}</option>
                        {templateOptions
                          .filter(t => {
                            if (!formData.instansi) return false;
                            const keywords = formData.instansi.toLowerCase().split(' ').filter(w => w.length > 2);
                            return keywords.some(kw => t.toLowerCase().includes(kw));
                          })
                          .map((t, idx) => (
                            <option key={idx} value={t}>{t.replace('.docx', '')}</option>
                          ))
                        }
                      </select>
                    </div>
                  )}
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




      {deleteModalConfig.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[450px] p-8 min-h-[200px] flex flex-col justify-between">
            <p className="text-[15px] font-medium text-slate-800">
              {deleteModalConfig.targetName}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))} className="text-sm font-medium text-slate-700 px-6 py-2.5 hover:bg-slate-50 border border-slate-300 rounded-xl transition-all">Batal</button>
              <button onClick={deleteModalConfig.onConfirm} className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm">Hapus</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default SuratKeluar;
