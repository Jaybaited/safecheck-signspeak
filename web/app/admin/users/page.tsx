'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  Filter,
  Download,
  UserPlus,
  Shield,
  GraduationCap,
  UserCheck,
  Users,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { api, User as ApiUser, CreateUserDto } from '@/lib/api';
import Sidebar from '@/components/admin/Sidebar';
import AddUserModal from '@/components/admin/AddUserModal';
import DeleteUserModal from '@/components/admin/DeleteUserModal';
import ThemeToggle from '@/components/ThemeToggle'; // Added ThemeToggle import

interface User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
}

export default function ManageUsersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.role !== 'ADMIN') {
        router.push('/login');
        return;
      }
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatGradeLevel = (gradeLevel: string | null) => {
    if (!gradeLevel) return 'N/A';
    return gradeLevel.replace('GRADE_', 'Grade ');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-500">
        <div className="text-slate-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white transition-colors duration-500">
      <Sidebar onLogout={handleLogout} />

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
            <p className="text-slate-500 dark:text-gray-400">
              Create, edit, and manage system users across all roles
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Added Theme Toggle Here */}
            <ThemeToggle />

            <button className="relative p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors" />
              <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-50 dark:border-gray-950">
                3
              </div>
            </button>

            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-md"></div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-gray-400 text-sm">Admins</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {users.filter((u) => u.role === 'ADMIN').length}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-gray-400 text-sm">Teachers</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {users.filter((u) => u.role === 'TEACHER').length}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-gray-400 text-sm">Students</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {users.filter((u) => u.role === 'STUDENT').length}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-gray-400 text-sm">Parents</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {users.filter((u) => u.role === 'PARENT').length}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors">
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg px-4 py-2 pl-10 w-80 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 text-sm text-slate-900 dark:text-white transition-colors"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-gray-400" />
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filter</span>
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm">Export</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 dark:bg-cyan-500 hover:bg-cyan-700 dark:hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-gray-800 transition-colors">
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
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm">
                          {userData.firstName[0]}
                          {userData.lastName[0]}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {userData.firstName} {userData.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-500 dark:text-gray-400">{userData.username}</td>
                    <td className="py-4 text-slate-500 dark:text-gray-400">
                      {userData.email || '-'}
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          userData.role === 'ADMIN'
                            ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                            : userData.role === 'TEACHER'
                            ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                            : userData.role === 'STUDENT'
                            ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20'
                            : 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                        }`}
                      >
                        {userData.role}
                      </span>
                    </td>
                    <td className="py-4 text-slate-500 dark:text-gray-400 text-sm">
                      {formatGradeLevel(userData.gradeLevel)}
                    </td>
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
                    <td className="py-4 text-slate-500 dark:text-gray-400 text-sm">
                      {formatDate(userData.createdAt)}
                    </td>
                    <td className="py-4">
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(i)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-slate-400 dark:text-gray-400" />
                        </button>

                        {openDropdown === i && (
                          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                            <div className="py-2">
                              <button
                                onClick={() => openDeleteModalHandler(userData)}
                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-left text-red-600 dark:text-red-400"
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
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-gray-800 transition-colors">
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Showing 1 to {users.length} of {users.length} users
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 rounded border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 text-sm transition-colors shadow-sm">
                Previous
              </button>
              <button className="px-3 py-1 bg-cyan-600 dark:bg-cyan-500 text-white rounded text-sm shadow-sm">
                1
              </button>
              <button className="px-3 py-1 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 rounded border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 text-sm transition-colors shadow-sm">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setError(null);
        }}
        onSubmit={handleAddUser}
        error={error}
      />

      <DeleteUserModal
        isOpen={showDeleteModal}
        user={selectedUser}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
          setError(null);
        }}
        onConfirm={handleDeleteUser}
        isDeleting={isDeleting}
        error={error}
      />
    </div>
  );
}
