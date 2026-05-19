'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Download, UserPlus,
  GraduationCap, UserCheck, Users,
  MoreVertical, Trash2, CheckCircle, XCircle, X, Pencil,
} from 'lucide-react';
import { api, User as ApiUser, CreateUserDto, ChildInfo } from '@/lib/api';
import Sidebar from '@/components/admin/Sidebar';
import AddUserModal from '@/components/admin/AddUserModal';
import DeleteUserModal from '@/components/admin/DeleteUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string; username: string; role: string;
  firstName: string; lastName: string;
}

type RoleFilter = 'ALL' | 'TEACHER' | 'STUDENT' | 'PARENT';

function exportToExcel(users: ApiUser[], filename: string) {
  const headers = ['First Name','Last Name','Username','Email','Role','Grade Level','RFID Card','Created Date'];
  const formatGrade = (g: string | null | undefined) => g ? g.replace('GRADE_', 'Grade ') : 'N/A';
  const formatDate  = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const rows = users.map((u) => [
    u.firstName, u.lastName, u.username,
    u.email ?? '', u.role,
    formatGrade(u.gradeLevel),
    u.rfidCard ?? 'Not Assigned',
    formatDate(u.createdAt),
  ]);
  const bom = '\uFEFF';
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('rfidCard') || msg.includes('"rfidCard"'))
    return 'This RFID card is already assigned to another student.';
  if (msg.includes('username') && (msg.includes('Unique') || msg.includes('23505')))
    return 'This username is already taken. Please choose another.';
  if (msg.includes('email') && (msg.includes('Unique') || msg.includes('23505')))
    return 'This email is already in use.';
  if (msg.includes('401') || msg.toLowerCase().includes('unauthorized'))
    return 'Your session has expired. Please log in again.';
  if (msg.toLowerCase().includes('network') || msg.includes('fetch') || msg.includes('500'))
    return 'Something went wrong. Please try again.';
  return msg || 'Something went wrong. Please try again.';
}

export default function ManageUsersPage() {
  const router = useRouter();

  const [user,            setUser]            = useState<User | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [users,           setUsers]           = useState<ApiUser[]>([]);
  const [openDropdown,    setOpenDropdown]    = useState<string | null>(null);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [selectedUser,    setSelectedUser]    = useState<ApiUser | null>(null);
  const [error,           setError]           = useState<string | null>(null);
  const [successMsg,      setSuccessMsg]      = useState<string | null>(null);
  const [isDeleting,      setIsDeleting]      = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [showFilter, setShowFilter] = useState(false);

  const [parentChildMap, setParentChildMap] = useState<Record<string, ChildInfo>>({});

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
    const allUsers = await api.getUsers();
    setUsers(allUsers);
    setError(null);

    // Build parentChildMap: for each PARENT, look up their first linked child
    const parents = allUsers.filter((u) => u.role === 'PARENT');
    if (parents.length > 0) {
      const entries = await Promise.all(
        parents.map(async (p) => {
          try {
            const children = await api.getParentChildren(p.id);
            return children.length > 0 ? [p.id, children[0]] as const : null;
          } catch {
            return null;
          }
        }),
      );
      const map: Record<string, ChildInfo> = {};
      for (const entry of entries) {
        if (entry) map[entry[0]] = entry[1];
      }
      setParentChildMap(map);
    }
  } catch (err) {
    setError(friendlyError(err));
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleAddUser = async (formData: CreateUserDto) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await api.createUser(formData);
      await fetchUsers();
      return result;
    } catch (err) {
      const msg = friendlyError(err);
      setError(msg);
      throw new Error(msg);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteUser(selectedUser.id);
      await fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
      setOpenDropdown(null);
      setSuccessMsg('User deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) { setError(friendlyError(err)); }
    finally { setIsDeleting(false); }
  };

  // ✅ Revision 10: update the user in local state without full refetch
  const handleEditSuccess = (updated: ApiUser) => {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
    setSuccessMsg(`${updated.firstName} ${updated.lastName} updated successfully.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

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
    { label: 'Teachers', count: users.filter((u) => u.role === 'TEACHER').length, icon: UserCheck,     iconBg: 'bg-blue-100 dark:bg-blue-500/10',       iconColor: 'text-blue-600 dark:text-blue-400'       },
    { label: 'Students', count: users.filter((u) => u.role === 'STUDENT').length, icon: GraduationCap, iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Parents',  count: users.filter((u) => u.role === 'PARENT').length,  icon: Users,         iconBg: 'bg-[#C4972A]/10',                       iconColor: 'text-[#8B6818] dark:text-[#E8C96A]'    },
    { label: 'Total',    count: users.length,                                     icon: Users,         iconBg: 'bg-slate-100 dark:bg-gray-800',         iconColor: 'text-slate-600 dark:text-gray-400'     },
  ];

  const ROLE_OPTIONS: RoleFilter[] = ['ALL', 'TEACHER', 'STUDENT', 'PARENT'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar onLogout={handleLogout} admin={user} />

      <main className="ml-64 p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Manage Users</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Create, edit, and manage system users across all roles
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div className="mb-5 flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-emerald-700 dark:text-emerald-400">{successMsg}</span>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-4 shadow-sm dark:shadow-none">
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

        {/* User Table */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-none">

          {/* Toolbar */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg pl-9 pr-8 py-2 w-64 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] placeholder:text-slate-400 dark:placeholder:text-gray-500 transition-colors"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter */}
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
                    <span
                      role="button"
                      aria-label="Clear filter"
                      onClick={(e) => { e.stopPropagation(); setRoleFilter('ALL'); }}
                      className="ml-1 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </span>
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

              {/* Export */}
              <button
                onClick={() => exportToExcel(users, 'all-users')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export All
              </button>

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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>

          {/* Active filters */}
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
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Grade</th>
                  <th className="pb-3 font-semibold">RFID Card</th>
                  <th className="pb-3 font-semibold">Phone</th>
                  <th className="pb-3 font-semibold">Created</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3">
  <div className="flex items-center gap-2.5">
    <div className="w-7 h-7 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
      {userData.firstName?.[0]}{userData.lastName?.[0]}
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-slate-900 dark:text-white leading-tight">
        {userData.firstName} {userData.lastName}
      </span>
      {/* Option B: child chip for parent rows */}
      {userData.role === 'PARENT' && parentChildMap[userData.id] && (() => {
        const child = parentChildMap[userData.id];
        const grade = child.gradeLevel ? child.gradeLevel.replace('GRADE_', 'Gr. ') : null;
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#C4972A]/10 dark:bg-[#C4972A]/15 border border-[#C4972A]/20 dark:border-[#C4972A]/25 rounded-full text-[10px] font-medium text-[#8B6818] dark:text-[#E8C96A] leading-none w-fit">
            <span>👦</span>
            {child.firstName} {child.lastName}
            {grade && <span className="opacity-70">· {grade}</span>}
          </span>
        );
      })()}
      {/* No child linked yet */}
      {userData.role === 'PARENT' && !parentChildMap[userData.id] && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-gray-800 rounded-full text-[10px] text-slate-400 dark:text-gray-500 leading-none w-fit">
          No linked student
        </span>
      )}
    </div>
  </div>
</td>
                    <td className="py-3 text-slate-500 dark:text-gray-400 font-mono text-xs">{userData.username}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        userData.role === 'TEACHER'
                          ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                          : userData.role === 'STUDENT'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          : 'bg-[#C4972A]/10 text-[#8B6818] border-[#C4972A]/20 dark:text-[#E8C96A]'
                      }`}>
                        {userData.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-gray-400 text-xs">{formatGradeLevel(userData.gradeLevel)}</td>
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
                    <td className="py-3 text-slate-500 dark:text-gray-400 text-xs">
                      {(userData as any).phoneNumber || '—'}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-gray-400 text-xs">{formatDate(userData.createdAt)}</td>
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
                            {/* ✅ Revision 10: Edit user */}
                            <button
                              onClick={() => {
                                setSelectedUser(userData);
                                setShowEditModal(true);
                                setOpenDropdown(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 text-sm transition-colors"
                            >
                              <Pencil className="w-4 h-4" /> Edit user
                            </button>
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

            {filteredUsers.length === 0 && users.length > 0 && (
              <div className="text-center py-10">
                <Search className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">No users match your search</p>
                <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">Try a different name, username, or adjust the role filter</p>
                <button onClick={() => { setSearchTerm(''); setRoleFilter('ALL'); }} className="mt-3 text-xs text-[#7B1113] dark:text-[#E8C96A] hover:underline">
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
              <button className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 rounded-lg text-xs transition-colors">Previous</button>
              <button className="px-3 py-1.5 bg-[#7B1113] text-white rounded-lg text-xs font-medium">1</button>
              <button className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 rounded-lg text-xs transition-colors">Next</button>
            </div>
          </div>
        </div>
      </main>

      {(openDropdown || showFilter) && (
        <div className="fixed inset-0 z-40" onClick={() => { setOpenDropdown(null); setShowFilter(false); }} />
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
      {/* ✅ Revision 10: Edit modal */}
      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}