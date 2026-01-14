import { useState } from 'react';
import { Plus, Search, Edit, Key, UserCheck, UserX } from 'lucide-react';
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
import type { User } from '../../types';

// Demo data
const demoUsers: User[] = [
  {
    id: '1',
    branch_id: '1',
    username: 'admin',
    full_name: 'Administrator',
    role: 'owner',
    is_active: true,
    last_login: '2026-01-15T14:30:00Z',
    created_at: '2026-01-01T10:00:00Z',
  },
  {
    id: '2',
    branch_id: '1',
    username: 'kasir1',
    full_name: 'Budi Santoso',
    role: 'kasir',
    is_active: true,
    last_login: '2026-01-15T08:00:00Z',
    created_at: '2026-01-05T10:00:00Z',
  },
  {
    id: '3',
    branch_id: '1',
    username: 'kasir2',
    full_name: 'Siti Rahayu',
    role: 'kasir',
    is_active: true,
    last_login: '2026-01-14T16:00:00Z',
    created_at: '2026-01-08T10:00:00Z',
  },
  {
    id: '4',
    branch_id: '1',
    username: 'kasir3',
    full_name: 'Ahmad Wijaya',
    role: 'kasir',
    is_active: false,
    last_login: '2026-01-10T12:00:00Z',
    created_at: '2026-01-10T10:00:00Z',
  },
];

export function UsersPage() {
  const [users] = useState<User[]>(demoUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = users.filter((u) => !u.is_active).length;

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };

  const handleToggleStatus = (user: User) => {
    // TODO: Toggle user status via Tauri command
    console.log('Toggle status:', user);
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
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
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
                <p className="text-2xl font-bold text-emerald-600">{activeUsers}</p>
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
                <p className="text-2xl font-bold text-red-600">{inactiveUsers}</p>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Login Terakhir</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-32">&nbsp;</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableEmpty colSpan={7} message="Tidak ada user ditemukan" />
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
                  <TableCell className="text-gray-500">
                    {user.last_login ? formatDateTime(user.last_login) : '-'}
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
                        onClick={() => handleResetPassword(user)}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        onClick={() => handleToggleStatus(user)}
                        className={user.is_active ? 'text-red-600' : 'text-emerald-600'}
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
      </Card>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah User" size="md">
        <form className="space-y-4">
          <Input label="Nama Lengkap" placeholder="Masukkan nama lengkap" />
          <Input label="Username" placeholder="Masukkan username" />
          <Input label="Password" type="password" placeholder="Masukkan password" />
          <Input label="Konfirmasi Password" type="password" placeholder="Ulangi password" />
          <Select
            label="Role"
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
            <Button type="submit" className="flex-1">
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
            <Input label="Password Baru" type="password" placeholder="Masukkan password baru" />
            <Input label="Konfirmasi Password" type="password" placeholder="Ulangi password baru" />
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
              <Button className="flex-1">Reset Password</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
