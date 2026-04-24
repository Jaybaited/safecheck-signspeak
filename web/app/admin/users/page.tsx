'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Download, UserPlus,
  Shield, GraduationCap, UserCheck, Users,
  MoreVertical, Trash2, CheckCircle, XCircle, X,
} from 'lucide-react';
import { api, User as ApiUser, CreateUserDto } from '@/lib/api';
import Sidebar from '@/components/admin/Sidebar';
import AddUserModal from '@/components/admin/AddUserModal';
import DeleteUserModal from '@/components/admin/DeleteUserModal';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

type RoleFilter = 'ALL' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

// ── Excel export helper (no external lib needed)
function exportToExcel(users: ApiUser[], filename: string) {
  const headers = ['First Name','Last Name','Username','Email','Role','Grade Level','RFID Card','Created Date'];

  const formatGrade = (g: string | null | undefined) => g ? g.replace('GRADE_', 'Grade ') : 'N/A';
  const formatDate  = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const rows = users.map((u) => [
    u.firstName,
    u.lastName,
    u.username,
    u.email      ?? '',
    u.role,
    formatGrade(u.gradeLevel),
    u.rfidCard   ?? 'Not Assigned',
    formatDate(u.createdAt),
  ]);

  // Build CSV with BOM for Excel UTF-8
  const bom   = '\uFEFF';
  const csv   = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ManageUsersPage() {
  const router = useRouter();

  const [user,            setUser]            = useState<User | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [users,           setUsers]           = useState<ApiUser[]>([]);
  const [openDropdown,    setOpenDropdown]    = useState<string | null>(null);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser,    setSelectedUser]    = useState<ApiUser | null>(null);
  const [error,           setError]           = useState<string | null>(null);
  const [isDeleting,      setIsDeleting]      = useState(false);

  // ── Search + Filter state
  const [searchTerm,    setSearchTerm]    = useState('');
  const [roleFilter,    setRoleFilter]    = useState<RoleFilter>('ALL');
  const [showFilter,    setShowFilter]    = useState(false);

  // ── Auth guard
  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'ADMIN') { router.push('/login'); return; }
      setUser(parsedUser);
      fetchUsers();
    } catch { router.push('/login'); }
    finally  { setLoading(false); }
  }, [router]);

  const fetchUsers = async () => {
    try {
      setUsers(await api.getUsers());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleAddUser = async (formData: CreateUserDto) => {
    try {
      setError(null);
      await api.createUser(formData);
      await fetchUsers();
      setShowAddModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      throw err;
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteUser(selectedUser.id);
      await fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
      setOpenDropdown(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Live search + role filter (computed, no extra state)
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return users.filter((u) => {
      const matchesSearch =
        !term ||
        u.firstName.toLowerCase().includes(term)  ||
        u.lastName.toLowerCase().includes(term)   ||
        u.username.toLowerCase().includes(term)   ||
        (u.email ?? '').toLowerCase().includes(term);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const formatDate       = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatGradeLevel = (g: string | null | undefined) =>
    g ? g.replace('GRADE_', 'Grade ') : 'N/A';

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Admins',   count: users.filter((u) => u.role === 'ADMIN').length,   icon: Shield,        iconBg: 'bg-[#7B1113]/10 dark:bg-[#7B1113]/20',   iconColor: 'text-[#7B1113] dark:text-[#E8C96A]'    },
    { label: 'Teachers', count: users.filter((u) => u.role === 'TEACHER').length, icon: UserCheck,     iconBg: 'bg-blue-100 dark:bg-blue-500/10',         iconColor: 'text-blue-600 dark:text-blue-400'       },
    { label: 'Students', count: users.filter((u) => u.role === 'STUDENT').length, icon: GraduationCap, iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',   iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Parents',  count: users.filter((u) => u.role === 'PARENT').length,  icon: Users,         iconBg: 'bg-[#C4972A]/10',                         iconColor: 'text-[#8B6818] dark:text-[#E8C96A]'    },
  ];

  const ROLE_OPTIONS: RoleFilter[] = ['ALL','ADMIN','TEACHER','STUDENT','PARENT'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={user} />

      <main className="ml-64 p-6">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Manage Users</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Create, edit, and manage system users across all roles
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* ── Error ──────────────────────────────────────────────── */}
        {error && (
          <div className="mb-5 flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm dark:shadow-none"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">{card.label}</p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.count}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── User Table ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none">

          {/* Toolbar */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2 flex-wrap">

              {/* Live search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, username, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg pl-9 pr-8 py-2 w-64 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] placeholder:text-slate-400 dark:placeholder:text-gray-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilter((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
                    roleFilter !== 'ALL'
                      ? 'bg-[#7B1113]/10 border-[#7B1113]/30 text-[#7B1113] dark:text-[#E8C96A]'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  {roleFilter === 'ALL' ? 'Filter' : roleFilter}
                  {roleFilter !== 'ALL' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setRoleFilter('ALL'); }}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </button>

                {showFilter && (
                  <div className="absolute top-full mt-1 left-0 w-40 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role}
                        onClick={() => { setRoleFilter(role); setShowFilter(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          roleFilter === role
                            ? 'bg-[#7B1113]/10 text-[#7B1113] dark:text-[#E8C96A] font-medium'
                            : 'text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {role === 'ALL' ? 'All Roles' : role.charAt(0) + role.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Export — all users */}
              <button
                onClick={() => exportToExcel(users, 'all-users')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export All
              </button>

              {/* Export — filtered/searched */}
              {(searchTerm || roleFilter !== 'ALL') && filteredUsers.length > 0 && (
                <button
                  onClick={() => exportToExcel(filteredUsers, `users-${roleFilter.toLowerCase()}-filtered`)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#7B1113]/10 hover:bg-[#7B1113]/20 border border-[#7B1113]/20 text-[#7B1113] dark:text-[#E8C96A] rounded-lg text-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Filtered ({filteredUsers.length})
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>

          {/* Active filters indicator */}
          {(searchTerm || roleFilter !== 'ALL') && (
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 dark:text-gray-400">
              <span>Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredUsers.length}</span> of <span className="font-semibold">{users.length}</span> users</span>
              {roleFilter !== 'ALL' && (
                <span className="px-2 py-0.5 bg-[#7B1113]/10 text-[#7B1113] dark:text-[#E8C96A] rounded-full font-medium">
                  Role: {roleFilter}
                </span>
              )}
              {searchTerm && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-full">
                  Search: &quot;{searchTerm}&quot;
                </span>
              )}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-gray-800">
                <tr className="text-left text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Username</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Grade</th>
                  <th className="pb-3 font-semibold">RFID Card</th>
                  <th className="pb-3 font-semibold">Created</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userData) => (
                  <tr
                    key={userData.id}
                    className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {userData.firstName?.[0]}{userData.lastName?.[0]}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {userData.firstName} {userData.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-gray-400">{userData.username}</td>
                    <td className="py-3 text-slate-500 dark:text-gray-400">{userData.email || '—'}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        userData.role === 'ADMIN'
                          ? 'bg-[#7B1113]/10 text-[#7B1113] border-[#7B1113]/20 dark:bg-[#7B1113]/20 dark:text-[#E8C96A] dark:border-[#7B1113]/30'
                          : userData.role === 'TEACHER'
                          ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                          : userData.role === 'STUDENT'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          : 'bg-[#C4972A]/10 text-[#8B6818] border-[#C4972A]/20 dark:text-[#E8C96A]'
                      }`}>
                        {userData.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-gray-400">{formatGradeLevel(userData.gradeLevel)}</td>
                    <td className="py-3">
                      {userData.rfidCard ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs">
                          <CheckCircle className="w-3.5 h-3.5" />{userData.rfidCard}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400 dark:text-gray-500 text-xs">
                          <XCircle className="w-3.5 h-3.5" />Not Assigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-gray-400">{formatDate(userData.createdAt)}</td>
                    <td className="py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === userData.id ? null : userData.id)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                        {openDropdown === userData.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                            <button
                              onClick={() => {
                                setSelectedUser(userData);
                                setShowDeleteModal(true);
                                setOpenDropdown(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 text-sm transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete user
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty states */}
            {filteredUsers.length === 0 && users.length > 0 && (
              <div className="text-center py-10">
                <Search className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">No users match your search</p>
                <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">
                  Try a different name, username, or adjust the role filter
                </p>
                <button
                  onClick={() => { setSearchTerm(''); setRoleFilter('ALL'); }}
                  className="mt-3 text-xs text-[#7B1113] dark:text-[#E8C96A] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
            {users.length === 0 && (
              <div className="text-center py-10">
                <Users className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-slate-400 dark:text-gray-500 text-sm">No users found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-200 dark:border-gray-800">
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Showing {filteredUsers.length} of {users.length} users
            </p>
            <div className="flex items-center gap-1.5">
              <button className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 rounded-lg text-xs transition-colors">
                Previous
              </button>
              <button className="px-3 py-1.5 bg-[#7B1113] text-white rounded-lg text-xs font-medium">1</button>
              <button className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 rounded-lg text-xs transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Click outside to close dropdown & filter */}
      {(openDropdown || showFilter) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setOpenDropdown(null); setShowFilter(false); }}
        />
      )}

      <AddUserModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setError(null); }}
        onSubmit={handleAddUser}
        error={error}
      />
      <DeleteUserModal
        isOpen={showDeleteModal}
        user={selectedUser}
        onClose={() => { setShowDeleteModal(false); setSelectedUser(null); setError(null); }}
        onConfirm={handleDeleteUser}
        isDeleting={isDeleting}
        error={error}
      />
    </div>
  );
}