import { useState } from 'react';
import { Plus, Search, Edit, Key, UserCheck, UserX, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '../../components/ui/Table';
import { formatDateTime } from '../../lib/utils';
import { useUsers, useCreateUser, useChangePassword, useToggleUserStatus } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types';

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'kasir' as 'owner' | 'kasir',
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const changePassword = useChangePassword();
  const toggleStatus = useToggleUserStatus();

  const filteredUsers = users?.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeUsers = users?.filter((u) => u.is_active).length || 0;
  const inactiveUsers = users?.filter((u) => !u.is_active).length || 0;

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowResetModal(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleStatus.mutateAsync(user.id);
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('Gagal mengubah status user.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Password tidak cocok');
      return;
    }

    if (!currentUser) return;

    try {
      await createUser.mutateAsync({
        full_name: formData.fullName,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        branch_id: currentUser.branch_id,
      });

      setFormData({
        fullName: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'kasir',
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Gagal membuat user. Silakan coba lagi.');
    }
  };

  const handleSavePassword = async () => {
    if (!selectedUser) return;

    if (newPassword !== confirmNewPassword) {
      alert('Password tidak cocok');
      return;
    }

    try {
      await changePassword.mutateAsync({
        userId: selectedUser.id,
        newPassword,
      });

      setShowResetModal(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Gagal mengubah password. Silakan coba lagi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
          <p className="text-gray-500">Kelola akses pengguna sistem</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total User</p>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{users?.length || 0}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">User Aktif</p>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-emerald-600">{activeUsers}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">User Nonaktif</p>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-red-600">{inactiveUsers}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama atau username..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="w-32">&nbsp;</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableEmpty colSpan={6} message="Tidak ada user ditemukan" />
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-amber-700 font-semibold">
                            {user.full_name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'owner' ? 'warning' : 'info'}>
                        {user.role === 'owner' ? 'Owner' : 'Kasir'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'success' : 'danger'}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDateTime(user.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Reset Password"
                          onClick={() => handleResetPassword(user as User)}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          onClick={() => handleToggleStatus(user as User)}
                          className={user.is_active ? 'text-red-600' : 'text-emerald-600'}
                          disabled={toggleStatus.isPending}
                        >
                          {user.is_active ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah User" size="md">
        <form className="space-y-4" onSubmit={handleCreateUser}>
          <Input
            label="Nama Lengkap"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Masukkan nama lengkap"
          />
          <Input
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Masukkan username"
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Masukkan password"
          />
          <Input
            label="Konfirmasi Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Ulangi password"
          />
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'owner' | 'kasir' })}
            options={[
              { value: 'kasir', label: 'Kasir' },
              { value: 'owner', label: 'Owner' },
            ]}
            placeholder="Pilih role"
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button type="submit" className="flex-1" isLoading={createUser.isPending}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setSelectedUser(null);
        }}
        title="Reset Password"
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Reset password untuk user <span className="font-semibold">{selectedUser.full_name}</span>?
            </p>
            <Input
              label="Password Baru"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru"
            />
            <Input
              label="Konfirmasi Password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Ulangi password baru"
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowResetModal(false);
                  setSelectedUser(null);
                }}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={handleSavePassword}
                isLoading={changePassword.isPending}
              >
                Reset Password
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
