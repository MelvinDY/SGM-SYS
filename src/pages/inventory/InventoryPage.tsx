import { useState } from 'react';
import { Plus, Search, Download, MoreVertical, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '../../components/ui/Table';
import {
  formatCurrency,
  formatWeight,
  formatDate,
  getPurityLabel,
  getGoldTypeLabel,
  generateBarcode,
  getCategoryCode,
} from '../../lib/utils';
import {
  useInventory,
  useInventoryStats,
  useCategories,
  useAddInventory,
  useCreateProduct,
  useUpdateInventory,
  useDeleteInventory,
} from '../../hooks/useInventory';
import { useAuth } from '../../hooks/useAuth';
import type { Inventory } from '../../types';

const statuses = [
  { value: '', label: 'Semua Status' },
  { value: 'available', label: 'Tersedia' },
  { value: 'sold', label: 'Terjual' },
  { value: 'reserved', label: 'Reserved' },
];

const locations = [
  { value: '', label: 'Semua Lokasi' },
  { value: 'etalase', label: 'Etalase' },
  { value: 'brankas', label: 'Brankas' },
];

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [deletingItem, setDeletingItem] = useState<Inventory | null>(null);

  // Form state for add
  const [formData, setFormData] = useState({
    category: '',
    productName: '',
    goldType: 'LM' as 'LM' | 'UBS' | 'Lokal',
    purity: '750',
    weight: '',
    purchasePrice: '',
    laborCost: '',
    barcode: '',
    location: 'etalase',
    supplier: '',
  });

  // Form state for edit
  const [editFormData, setEditFormData] = useState({
    location: '',
    purchasePrice: '',
    supplier: '',
    notes: '',
  });

  const { user } = useAuth();
  const { data: inventory, isLoading: inventoryLoading } = useInventory(statusFilter || undefined);
  const { data: stats, isLoading: statsLoading } = useInventoryStats();
  const { data: categories } = useCategories();
  const addInventory = useAddInventory();
  const createProduct = useCreateProduct();
  const updateInventory = useUpdateInventory();
  const deleteInventory = useDeleteInventory();

  // Filter inventory
  const filteredInventory = inventory?.filter((item) => {
    const matchesSearch =
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      !locationFilter || item.location?.toLowerCase() === locationFilter.toLowerCase();

    return matchesSearch && matchesLocation;
  }) || [];

  // Generate barcode when category changes
  const handleCategoryChange = (category: string) => {
    const categoryCode = getCategoryCode(category);
    // Generate a random sequence for new items
    const sequence = Math.floor(Math.random() * 999999) + 1;
    const newBarcode = generateBarcode(categoryCode, sequence);
    setFormData({ ...formData, category, barcode: newBarcode });
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // First create the product
      const product = await createProduct.mutateAsync({
        category_id: formData.category,
        name: formData.productName,
        gold_type: formData.goldType,
        gold_purity: parseInt(formData.purity),
        weight_gram: parseFloat(formData.weight),
        labor_cost: parseInt(formData.laborCost.replace(/\D/g, '')),
      });

      // Then add inventory with the product
      await addInventory.mutateAsync({
        request: {
          product_id: product.id,
          barcode: formData.barcode,
          purchase_price: parseInt(formData.purchasePrice.replace(/\D/g, '')),
          location: formData.location,
        },
        branchId: user.branch_id,
      });

      // Reset form and close modal
      setFormData({
        category: '',
        productName: '',
        goldType: 'LM',
        purity: '750',
        weight: '',
        purchasePrice: '',
        laborCost: '',
        barcode: '',
        location: 'etalase',
        supplier: '',
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add inventory:', error);
      alert('Gagal menambah stok. Silakan coba lagi.');
    }
  };

  // Category options from API or fallback
  const categoryOptions = categories?.map((c) => ({
    value: c.id,
    label: c.name,
  })) || [
    { value: 'cincin', label: 'Cincin' },
    { value: 'kalung', label: 'Kalung' },
    { value: 'gelang', label: 'Gelang' },
    { value: 'anting', label: 'Anting' },
  ];

  const isLoading = inventoryLoading || statsLoading;

  // Handle edit inventory
  const handleEditClick = (item: Inventory) => {
    setEditingItem(item);
    setEditFormData({
      location: item.location || '',
      purchasePrice: formatCurrency(item.purchase_price),
      supplier: item.supplier || '',
      notes: item.notes || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await updateInventory.mutateAsync({
        inventoryId: editingItem.id,
        request: {
          location: editFormData.location || undefined,
          purchase_price: editFormData.purchasePrice
            ? parseInt(editFormData.purchasePrice.replace(/\D/g, ''))
            : undefined,
          supplier: editFormData.supplier || undefined,
          notes: editFormData.notes || undefined,
        },
      });
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to update inventory:', error);
      alert('Gagal mengupdate stok. Silakan coba lagi.');
    }
  };

  // Handle delete inventory
  const handleDeleteClick = (item: Inventory) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      await deleteInventory.mutateAsync(deletingItem.id);
      setShowDeleteModal(false);
      setDeletingItem(null);
    } catch (error) {
      console.error('Failed to delete inventory:', error);
      alert('Gagal menghapus stok. Silakan coba lagi.');
    }
  };

  // Handle export to CSV
  const handleExport = () => {
    if (!filteredInventory.length) return;

    const headers = ['Barcode', 'Produk', 'Jenis', 'Kadar', 'Berat (gr)', 'Harga Beli', 'Status', 'Lokasi', 'Tanggal'];
    const rows = filteredInventory.map((item) => [
      item.barcode,
      item.product?.name || '',
      item.product?.gold_type || '',
      item.product?.gold_purity?.toString() || '',
      item.product?.weight_gram?.toString() || '',
      item.purchase_price.toString(),
      item.status,
      item.location || '',
      item.created_at.split('T')[0],
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Stok</h1>
          <p className="text-gray-500">Kelola inventori toko emas</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Stok
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Item</p>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mt-2" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Tersedia</p>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mt-2" />
            ) : (
              <p className="text-2xl font-bold text-emerald-600">{stats?.available || 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Terjual</p>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mt-2" />
            ) : (
              <p className="text-2xl font-bold text-blue-600">{stats?.sold || 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Berat</p>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mt-2" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{stats?.total_weight.toFixed(1) || 0} gr</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Nilai Stok</p>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mt-2" />
            ) : (
              <p className="text-xl font-bold text-amber-600">{formatCurrency(stats?.total_value || 0)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari barcode, nama produk..."
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statuses}
              className="w-40"
            />
            <Select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              options={locations}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barcode</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Berat</TableHead>
                <TableHead>Kadar</TableHead>
                <TableHead>Harga Beli</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="w-12">&nbsp;</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length === 0 ? (
                <TableEmpty colSpan={9} message="Tidak ada data inventori" />
              ) : (
                filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="font-mono text-sm">{item.barcode}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{item.product?.name}</p>
                        <p className="text-xs text-gray-500">
                          {getGoldTypeLabel(item.product?.gold_type || '')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatWeight(item.product?.weight_gram || 0)}</TableCell>
                    <TableCell>{getPurityLabel(item.product?.gold_purity || 0)}</TableCell>
                    <TableCell>{formatCurrency(item.purchase_price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'available'
                            ? 'success'
                            : item.status === 'sold'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {item.status === 'available'
                          ? 'Tersedia'
                          : item.status === 'sold'
                          ? 'Terjual'
                          : 'Reserved'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.location || '-'}</TableCell>
                    <TableCell className="text-gray-500">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="relative group">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block z-10">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4" />
                            Detail
                          </button>
                          <button
                            onClick={() => handleEditClick(item)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            disabled={item.status !== 'available'}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
                              item.status === 'available'
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                          </button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add Inventory Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Stok" size="lg">
        <form className="space-y-4" onSubmit={handleAddInventory}>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Kategori"
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              options={categoryOptions}
              placeholder="Pilih kategori"
            />
            <Input
              label="Nama Produk"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="Masukkan nama produk"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Jenis Emas"
              value={formData.goldType}
              onChange={(e) => setFormData({ ...formData, goldType: e.target.value as 'LM' | 'UBS' | 'Lokal' })}
              options={[
                { value: 'LM', label: 'Logam Mulia (ANTAM)' },
                { value: 'UBS', label: 'UBS' },
                { value: 'Lokal', label: 'Emas Lokal' },
              ]}
              placeholder="Pilih jenis"
            />
            <Select
              label="Kadar"
              value={formData.purity}
              onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
              options={[
                { value: '375', label: '9K (375)' },
                { value: '750', label: '18K (750)' },
                { value: '875', label: '21K (875)' },
                { value: '999', label: '24K (999)' },
              ]}
              placeholder="Pilih kadar"
            />
            <Input
              label="Berat (gram)"
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Harga Beli"
              value={formData.purchasePrice}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, purchasePrice: value ? formatCurrency(parseInt(value)) : '' });
              }}
              placeholder="Rp 0"
            />
            <Input
              label="Ongkos Pembuatan"
              value={formData.laborCost}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, laborCost: value ? formatCurrency(parseInt(value)) : '' });
              }}
              placeholder="Rp 0"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="EM-XX-000000-0"
            />
            <Select
              label="Lokasi"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              options={[
                { value: 'etalase', label: 'Etalase' },
                { value: 'brankas', label: 'Brankas' },
              ]}
              placeholder="Pilih lokasi"
            />
          </div>
          <Input
            label="Supplier"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            placeholder="Nama supplier"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={createProduct.isPending || addInventory.isPending}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Detail Inventori"
        size="md"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="font-mono text-lg">{selectedItem.barcode}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {selectedItem.product?.name}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Jenis Emas</p>
                <p className="font-medium">{getGoldTypeLabel(selectedItem.product?.gold_type || '')}</p>
              </div>
              <div>
                <p className="text-gray-500">Kadar</p>
                <p className="font-medium">{getPurityLabel(selectedItem.product?.gold_purity || 0)}</p>
              </div>
              <div>
                <p className="text-gray-500">Berat</p>
                <p className="font-medium">{formatWeight(selectedItem.product?.weight_gram || 0)}</p>
              </div>
              <div>
                <p className="text-gray-500">Ongkos</p>
                <p className="font-medium">{formatCurrency(selectedItem.product?.labor_cost || 0)}</p>
              </div>
              <div>
                <p className="text-gray-500">Harga Beli</p>
                <p className="font-medium">{formatCurrency(selectedItem.purchase_price)}</p>
              </div>
              <div>
                <p className="text-gray-500">Lokasi</p>
                <p className="font-medium">{selectedItem.location || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Supplier</p>
                <p className="font-medium">{selectedItem.supplier || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Tanggal Beli</p>
                <p className="font-medium">
                  {selectedItem.purchase_date ? formatDate(selectedItem.purchase_date) : '-'}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-gray-500 text-sm">Status</p>
              <Badge
                variant={
                  selectedItem.status === 'available'
                    ? 'success'
                    : selectedItem.status === 'sold'
                    ? 'danger'
                    : 'warning'
                }
                className="mt-1"
              >
                {selectedItem.status === 'available'
                  ? 'Tersedia'
                  : selectedItem.status === 'sold'
                  ? 'Terjual'
                  : 'Reserved'}
              </Badge>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        title="Edit Inventori"
        size="md"
      >
        {editingItem && (
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-mono text-sm text-gray-500">{editingItem.barcode}</p>
              <p className="font-semibold text-gray-900">{editingItem.product?.name}</p>
            </div>
            <Select
              label="Lokasi"
              value={editFormData.location}
              onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              options={[
                { value: 'etalase', label: 'Etalase' },
                { value: 'brankas', label: 'Brankas' },
                { value: 'gudang', label: 'Gudang' },
              ]}
              placeholder="Pilih lokasi"
            />
            <Input
              label="Harga Beli"
              value={editFormData.purchasePrice}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setEditFormData({
                  ...editFormData,
                  purchasePrice: value ? formatCurrency(parseInt(value)) : '',
                });
              }}
              placeholder="Rp 0"
            />
            <Input
              label="Supplier"
              value={editFormData.supplier}
              onChange={(e) => setEditFormData({ ...editFormData, supplier: e.target.value })}
              placeholder="Nama supplier"
            />
            <Input
              label="Catatan"
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              placeholder="Catatan tambahan"
            />
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" isLoading={updateInventory.isPending}>
                Simpan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingItem(null);
        }}
        title="Hapus Inventori"
        size="sm"
      >
        {deletingItem && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <Trash2 className="w-12 h-12 mx-auto text-red-500 mb-3" />
              <p className="text-gray-700">
                Apakah Anda yakin ingin menghapus item ini?
              </p>
              <p className="font-semibold text-gray-900 mt-2">{deletingItem.product?.name}</p>
              <p className="text-sm text-gray-500">{deletingItem.barcode}</p>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingItem(null);
                }}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDeleteConfirm}
                isLoading={deleteInventory.isPending}
              >
                Hapus
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
