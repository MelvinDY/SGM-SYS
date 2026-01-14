import { useState } from 'react';
import { Plus, Search, Download, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
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
} from '../../lib/utils';
import type { Inventory } from '../../types';

// Demo data
const demoInventory: Inventory[] = [
  {
    id: '1',
    product_id: '1',
    branch_id: '1',
    barcode: 'EM-CN-000001-7',
    status: 'available',
    location: 'Etalase',
    purchase_price: 4800000,
    purchase_date: '2026-01-10',
    supplier: 'PT. Logam Mulia',
    created_at: '2026-01-10T10:00:00Z',
    product: {
      id: '1',
      category_id: '1',
      name: 'Cincin Polos',
      gold_type: 'LM',
      gold_purity: 750,
      weight_gram: 5,
      labor_cost: 200000,
      is_active: true,
      created_at: '2026-01-10T10:00:00Z',
    },
  },
  {
    id: '2',
    product_id: '2',
    branch_id: '1',
    barcode: 'EM-KL-000001-3',
    status: 'available',
    location: 'Etalase',
    purchase_price: 9600000,
    purchase_date: '2026-01-08',
    supplier: 'PT. Logam Mulia',
    created_at: '2026-01-08T10:00:00Z',
    product: {
      id: '2',
      category_id: '2',
      name: 'Kalung Rantai',
      gold_type: 'LM',
      gold_purity: 750,
      weight_gram: 10,
      labor_cost: 350000,
      is_active: true,
      created_at: '2026-01-08T10:00:00Z',
    },
  },
  {
    id: '3',
    product_id: '3',
    branch_id: '1',
    barcode: 'EM-GL-000001-9',
    status: 'sold',
    location: '-',
    purchase_price: 3800000,
    purchase_date: '2026-01-05',
    supplier: 'Toko Emas ABC',
    sold_at: '2026-01-14T14:30:00Z',
    created_at: '2026-01-05T10:00:00Z',
    product: {
      id: '3',
      category_id: '3',
      name: 'Gelang Keroncong',
      gold_type: 'Lokal',
      gold_purity: 375,
      weight_gram: 8,
      labor_cost: 150000,
      is_active: true,
      created_at: '2026-01-05T10:00:00Z',
    },
  },
  {
    id: '4',
    product_id: '4',
    branch_id: '1',
    barcode: 'EM-AT-000001-5',
    status: 'available',
    location: 'Brankas',
    purchase_price: 2100000,
    purchase_date: '2026-01-12',
    supplier: 'PT. UBS Gold',
    created_at: '2026-01-12T10:00:00Z',
    product: {
      id: '4',
      category_id: '4',
      name: 'Anting Tindik',
      gold_type: 'UBS',
      gold_purity: 750,
      weight_gram: 2,
      labor_cost: 100000,
      is_active: true,
      created_at: '2026-01-12T10:00:00Z',
    },
  },
];

const categories = [
  { value: '', label: 'Semua Kategori' },
  { value: 'cincin', label: 'Cincin' },
  { value: 'kalung', label: 'Kalung' },
  { value: 'gelang', label: 'Gelang' },
  { value: 'anting', label: 'Anting' },
];

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
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);

  // Filter inventory
  const filteredInventory = demoInventory.filter((item) => {
    const matchesSearch =
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesLocation =
      !locationFilter || item.location?.toLowerCase() === locationFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Calculate summary
  const summary = {
    totalItems: demoInventory.length,
    availableItems: demoInventory.filter((i) => i.status === 'available').length,
    soldItems: demoInventory.filter((i) => i.status === 'sold').length,
    totalWeight: demoInventory
      .filter((i) => i.status === 'available')
      .reduce((sum, i) => sum + (i.product?.weight_gram || 0), 0),
    totalValue: demoInventory
      .filter((i) => i.status === 'available')
      .reduce((sum, i) => sum + i.purchase_price, 0),
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
          <Button variant="outline" onClick={() => {}}>
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
            <p className="text-2xl font-bold text-gray-900">{summary.totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Tersedia</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.availableItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Terjual</p>
            <p className="text-2xl font-bold text-blue-600">{summary.soldItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Berat</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalWeight} gr</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Nilai Stok</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(summary.totalValue)}</p>
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={categories}
              className="w-40"
            />
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
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
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
      </Card>

      {/* Add Inventory Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Stok" size="lg">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Kategori"
              options={categories.filter((c) => c.value)}
              placeholder="Pilih kategori"
            />
            <Input label="Nama Produk" placeholder="Masukkan nama produk" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Jenis Emas"
              options={[
                { value: 'LM', label: 'Logam Mulia (ANTAM)' },
                { value: 'UBS', label: 'UBS' },
                { value: 'Lokal', label: 'Emas Lokal' },
              ]}
              placeholder="Pilih jenis"
            />
            <Select
              label="Kadar"
              options={[
                { value: '375', label: '9K (375)' },
                { value: '750', label: '18K (750)' },
                { value: '875', label: '21K (875)' },
                { value: '999', label: '24K (999)' },
              ]}
              placeholder="Pilih kadar"
            />
            <Input label="Berat (gram)" type="number" step="0.01" placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Harga Beli" placeholder="Rp 0" />
            <Input label="Ongkos Pembuatan" placeholder="Rp 0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Barcode" placeholder="EM-XX-000000-0" />
            <Select
              label="Lokasi"
              options={[
                { value: 'etalase', label: 'Etalase' },
                { value: 'brankas', label: 'Brankas' },
              ]}
              placeholder="Pilih lokasi"
            />
          </div>
          <Input label="Supplier" placeholder="Nama supplier" />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
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
    </div>
  );
}
