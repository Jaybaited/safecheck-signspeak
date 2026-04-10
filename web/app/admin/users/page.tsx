'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Search, Filter, Download, UserPlus,
  Shield, GraduationCap, UserCheck, Users,
  MoreVertical, Trash2, CheckCircle, XCircle,
} from 'lucide-react';
import { api, User as ApiUser, CreateUserDto } from '@/lib/api';
import Sidebar from '@/components/admin/Sidebar';
import AddUserModal from '@/components/admin/AddUserModal';
import DeleteUserModal from '@/components/admin/DeleteUserModal';
import ThemeToggle from '@/components/ThemeToggle';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id:        string;
  username:  string;
  role:      string;
  firstName: string;
  lastName:  string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ManageUsersPage() {
  const router = useRouter();

  const [user,            setUser]            = useState<User | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [users,           setUsers]           = useState<ApiUser[]>([]);
  const [openDropdown,    setOpenDropdown]    = useState<number | null>(null);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser,    setSelectedUser]    = useState<ApiUser | null>(null);
  const [error,           setError]           = useState<string | null>(null);
  const [isDeleting,      setIsDeleting]      = useState(false);

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
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
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

  const openDeleteModalHandler = (userData: ApiUser) => {
    setSelectedUser(userData);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const toggleDropdown = (index: number) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatGradeLevel = (gradeLevel: string | null) => {
    if (!gradeLevel) return 'N/A';
    return gradeLevel.replace('GRADE_', 'Grade ');
  };

  // ── Full-page loader
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-4 border-[#7B1113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label:     'Admins',
      count:     users.filter((u) => u.role === 'ADMIN').length,
      icon:      Shield,
      iconBg:    'bg-[#7B1113]/10 dark:bg-[#7B1113]/20',
      iconColor: 'text-[#7B1113] dark:text-[#E8C96A]',
    },
    {
      label:     'Teachers',
      count:     users.filter((u) => u.role === 'TEACHER').length,
      icon:      UserCheck,
      iconBg:    'bg-blue-100 dark:bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label:     'Students',
      count:     users.filter((u) => u.role === 'STUDENT').length,
      icon:      GraduationCap,
      iconBg:    'bg-emerald-100 dark:bg-green-500/10',
      iconColor: 'text-emerald-600 dark:text-green-400',
    },
    {
      label:     'Parents',
      count:     users.filter((u) => u.role === 'PARENT').length,
      icon:      Users,
      iconBg:    'bg-[#C4972A]/10 dark:bg-[#C4972A]/10',
      iconColor: 'text-[#8B6818] dark:text-[#E8C96A]',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-200">

      {/* ✅ admin prop now correctly passed */}
      <Sidebar onLogout={handleLogout} admin={user} />

      <main className="ml-64 p-8">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Manage Users</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              Create, edit, and manage system users across all roles
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <button
              aria-label="Notifications"
              className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-50 dark:border-gray-950">
                3
              </span>
            </button>

            <button
              onClick={() => router.push('/admin/profile')}
              aria-label="Admin profile"
              className="w-10 h-10 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center font-bold text-white shadow-md select-none hover:brightness-110 transition-all active:scale-95"
            >
              {user.firstName?.[0] ?? 'A'}{user.lastName?.[0] ?? ''}
            </button>
          </div>
        </div>

        {/* ── Error Banner ────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-slate-500 dark:text-gray-400 text-sm">{card.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {card.count}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── User Table ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-200">

          {/* Toolbar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 w-72 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B1113] focus:border-transparent transition-colors placeholder:text-slate-400 dark:placeholder:text-gray-500"
                />
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg text-sm transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg text-sm transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7B1113] hover:bg-[#9B2020] text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-gray-800">
                <tr className="text-left text-slate-500 dark:text-gray-400 text-sm">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Username</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Grade Level</th>
                  <th className="pb-3 font-medium">RFID Card</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userData, i) => (
                  <tr
                    key={userData.id}
                    className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    {/* Name */}
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#9B2020] to-[#7B1113] rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {userData.firstName?.[0]}{userData.lastName?.[0]}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {userData.firstName} {userData.lastName}
                        </span>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-4 text-slate-500 dark:text-gray-400 text-sm">
                      {userData.username}
                    </td>

                    {/* Email */}
                    <td className="py-4 text-slate-500 dark:text-gray-400 text-sm">
                      {userData.email || '—'}
                    </td>

                    {/* Role badge */}
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        userData.role === 'ADMIN'
                          ? 'bg-[#7B1113]/10 text-[#7B1113] border-[#7B1113]/20 dark:bg-[#7B1113]/20 dark:text-[#E8C96A] dark:border-[#7B1113]/30'
                          : userData.role === 'TEACHER'
                          ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                          : userData.role === 'STUDENT'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                          : 'bg-[#C4972A]/10 text-[#8B6818] border-[#C4972A]/20 dark:bg-[#C4972A]/10 dark:text-[#E8C96A] dark:border-[#C4972A]/20'
                      }`}>
                        {userData.role}
                      </span>
                    </td>

                    {/* Grade */}
                    <td className="py-4 text-slate-500 dark:text-gray-400 text-sm">
                      {formatGradeLevel(userData.gradeLevel ?? null)}
                    </td>

                    {/* RFID */}
                    <td className="py-4">
                      {userData.rfidCard ? (
                        <span className="flex items-center gap-2 text-emerald-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">{userData.rfidCard}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-slate-400 dark:text-gray-500">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Not Assigned</span>
                        </span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="py-4 text-slate-500 dark:text-gray-400 text-sm">
                      {formatDate(userData.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-4">
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(i)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          aria-label="User actions"
                        >
                          <MoreVertical className="w-5 h-5 text-slate-400 dark:text-gray-400" />
                        </button>

                        {openDropdown === i && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                            <div className="py-1">
                              <button
                                onClick={() => openDeleteModalHandler(userData)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors text-left"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Delete user</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty state */}
            {users.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-slate-400 dark:text-gray-500 text-sm">No users found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-gray-800">
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Showing 1 to {users.length} of {users.length} users
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 rounded-lg text-sm transition-colors">
                Previous
              </button>
              <button className="px-3 py-1.5 bg-[#7B1113] text-white rounded-lg text-sm font-medium">
                1
              </button>
              <button className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 rounded-lg text-sm transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
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