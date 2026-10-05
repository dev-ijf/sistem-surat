import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, Shield, UserCircle, MoreVertical, ChevronLeft, ChevronRight, X } from 'lucide-react';

const ManajemenUser = ({ globalSearch }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPaginating, setIsPaginating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    nama: '',
    email: '',
    role: '',
    status: 'Aktif'
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterRole, setFilterRole] = useState('Semua Peran');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [filterSearch, setFilterSearch] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    role: 'Semua Peran',
    status: 'Semua Status',
    search: ''
  });

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

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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


  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const data = await res.json();
        const mappedData = data.map(u => ({
          ...u,
          lastLogin: u.created_at ? new Date(u.created_at).toLocaleString('id-ID') : 'Belum login'
        }));
        setUsers(mappedData);
      }
    } catch (err) {
      console.error('Gagal memuat data users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const query = (globalSearch || '').toLowerCase();
    const filterQuery = (appliedFilters.search || '').toLowerCase();

    const matchesGlobal = !query || user.nama.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    const matchesFilterQuery = !filterQuery || user.nama.toLowerCase().includes(filterQuery) || user.email.toLowerCase().includes(filterQuery);

    const matchesRole = appliedFilters.role === 'Semua Peran' || user.role === appliedFilters.role;
    const matchesStatus = appliedFilters.status === 'Semua Status' || user.status === appliedFilters.status;

    return matchesGlobal && matchesFilterQuery && matchesRole && matchesStatus;
  });

  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="space-y-5">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold !text-slate-900">Manajemen Akses User</div>
          <p className="text-sm text-slate-500 mt-0.5">Kelola hak akses dan informasi akun pengguna sistem.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowFilterModal(!showFilterModal)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 border px-4 py-2.5 rounded-xl transition-all font-medium text-sm shadow-sm ${showFilterModal ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Filter size={16} />
            <span>Filter</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:bg-blue-700 transition-all hover:-translate-y-0.5"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {showFilterModal && (
        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl transition-all duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 block">Peran</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="Semua Peran">Semua Peran</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 block">Status</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="Semua Status">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 block">Pencarian</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 flex justify-start border-t border-slate-100">
            <button
              onClick={() => {
                setAppliedFilters({
                  role: filterRole,
                  status: filterStatus,
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

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 w-16 text-center">No</th>
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Peran</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Terakhir Login</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(isPaginating || isLoading) ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-sm text-slate-500 font-medium">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : currentUsers.length > 0 ? (
                currentUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-500">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                          {user.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{user.nama}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Shield size={14} className={user.role === 'Super Admin' ? 'text-purple-600' : 'text-slate-400'} />
                        <span className="font-medium">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${user.status === 'Aktif'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                        }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-amber-500 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-lg transition-all shadow-sm" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-400 italic">
                    Tidak ada data pengguna.
                  </td>
                </tr>
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold !text-slate-900 tracking-tight">Tambah User</h2>
                <p className="text-sm text-slate-500">Tambahkan pengguna baru</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="Masukkan nama lengkap"
                  value={newUser.nama}
                  onChange={(e) => setNewUser({ ...newUser, nama: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="user@email.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role / Hak Akses <span className="text-red-500">*</span></label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="" disabled>Pilih role</option>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status Akun</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                  value={newUser.status}
                  onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/users`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(newUser)
                    });

                    if (res.ok) {
                      setShowAddModal(false);
                      setNewUser({ nama: '', email: '', role: '', status: 'Aktif' });
                      fetchUsers();
                    } else {
                      const errData = await res.json();
                      alert(errData.message || 'Gagal menyimpan user');
                    }
                  } catch (err) {
                    console.error('Error saving user', err);
                    alert('Terjadi kesalahan pada server');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold !text-slate-900 tracking-tight">Edit User</h2>
                <p className="text-sm text-slate-500">Perbarui informasi pengguna</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="Masukkan nama lengkap"
                  value={editingUser.nama}
                  onChange={(e) => setEditingUser({ ...editingUser, nama: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="user@email.com"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role / Hak Akses <span className="text-red-500">*</span></label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="" disabled>Pilih role</option>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status Akun</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/users/${editingUser.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(editingUser)
                    });

                    if (res.ok) {
                      setShowEditModal(false);
                      setEditingUser(null);
                      fetchUsers();
                    } else {
                      const errData = await res.json();
                      alert(errData.message || 'Gagal memperbarui user');
                    }
                  } catch (err) {
                    console.error('Error updating user', err);
                    alert('Terjadi kesalahan pada server');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[450px] p-6 flex flex-col gap-6">
            <p className="text-[15px] font-medium text-slate-800">
              Apakah Anda yakin ingin menghapus pengguna <span className="font-bold">{deletingUser.nama}</span>?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletingUser(null); }}
                className="text-sm font-medium text-slate-700 px-6 py-2.5 hover:bg-slate-50 border border-slate-300 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/users/${deletingUser.id}`, {
                      method: 'DELETE'
                    });

                    if (res.ok) {
                      setShowDeleteModal(false);
                      setDeletingUser(null);
                      fetchUsers();
                    } else {
                      const errData = await res.json();
                      alert(errData.message || 'Gagal menghapus user');
                    }
                  } catch (err) {
                    console.error('Error deleting user', err);
                    alert('Terjadi kesalahan pada server');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManajemenUser;
