import { useState } from 'react';
import { ArrowLeftRight, Search, Barcode, User, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatWeight } from '../../lib/utils';
import type { Inventory } from '../../types';

// Gold prices
const SELL_PRICES: Record<string, Record<number, number>> = {
  LM: { 999: 1250000, 750: 1050000, 375: 525000 },
  UBS: { 999: 1245000, 750: 1045000, 375: 522000 },
  Lokal: { 999: 1200000, 750: 980000, 375: 490000 },
};

const BUYBACK_PRICES: Record<string, Record<number, number>> = {
  LM: { 999: 1150000, 750: 950000, 375: 475000 },
  UBS: { 999: 1145000, 750: 945000, 375: 472000 },
  Lokal: { 999: 1100000, 750: 880000, 375: 440000 },
};

// Demo inventory for new items
const demoInventory: Inventory[] = [
  {
    id: '1',
    product_id: '1',
    branch_id: '1',
    barcode: 'EM-CN-000002-4',
    status: 'available',
    location: 'Etalase',
    purchase_price: 4800000,
    created_at: new Date().toISOString(),
    product: {
      id: '1',
      category_id: '1',
      name: 'Cincin Ukir',
      gold_type: 'LM',
      gold_purity: 750,
      weight_gram: 5,
      labor_cost: 250000,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: '2',
    product_id: '2',
    branch_id: '1',
    barcode: 'EM-KL-000002-0',
    status: 'available',
    location: 'Etalase',
    purchase_price: 9600000,
    created_at: new Date().toISOString(),
    product: {
      id: '2',
      category_id: '2',
      name: 'Kalung Liontin',
      gold_type: 'LM',
      gold_purity: 750,
      weight_gram: 10,
      labor_cost: 400000,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  },
];

interface OldGold {
  goldType: 'LM' | 'UBS' | 'Lokal';
  purity: number;
  weight: number;
  pricePerGram: number;
  total: number;
}

function calculateSellPrice(item: Inventory): number {
  if (!item.product) return 0;
  const pricePerGram = SELL_PRICES[item.product.gold_type]?.[item.product.gold_purity] || 0;
  return Math.round(item.product.weight_gram * pricePerGram + item.product.labor_cost);
}

export function ExchangePage() {
  // Old gold state
  const [oldGoldType, setOldGoldType] = useState<'LM' | 'UBS' | 'Lokal'>('LM');
  const [oldPurity, setOldPurity] = useState<number>(750);
  const [oldWeight, setOldWeight] = useState<string>('');
  const [oldItems, setOldItems] = useState<OldGold[]>([]);

  // New gold state
  const [searchTerm, setSearchTerm] = useState('');
  const [newItems, setNewItems] = useState<Inventory[]>([]);

  // Customer state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Calculate old gold
  const oldPricePerGram = BUYBACK_PRICES[oldGoldType]?.[oldPurity] || 0;
  const oldWeightNum = parseFloat(oldWeight) || 0;
  const oldItemTotal = Math.round(oldWeightNum * oldPricePerGram);
  const totalOldGold = oldItems.reduce((sum, item) => sum + item.total, 0);

  // Calculate new gold
  const totalNewGold = newItems.reduce((sum, item) => sum + calculateSellPrice(item), 0);

  // Calculate difference
  const difference = totalNewGold - totalOldGold;

  const filteredInventory = demoInventory.filter(
    (item) =>
      item.status === 'available' &&
      !newItems.find((ni) => ni.id === item.id) &&
      (item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddOldItem = () => {
    if (!oldWeightNum || !oldPricePerGram) return;

    const newItem: OldGold = {
      goldType: oldGoldType,
      purity: oldPurity,
      weight: oldWeightNum,
      pricePerGram: oldPricePerGram,
      total: oldItemTotal,
    };

    setOldItems([...oldItems, newItem]);
    setOldWeight('');
  };

  const handleAddNewItem = (item: Inventory) => {
    setNewItems([...newItems, item]);
    setSearchTerm('');
  };

  const handleRemoveOldItem = (index: number) => {
    setOldItems(oldItems.filter((_, i) => i !== index));
  };

  const handleRemoveNewItem = (id: string) => {
    setNewItems(newItems.filter((item) => item.id !== id));
  };

  const handleProcessExchange = () => {
    // TODO: Process exchange via Tauri command
    console.log('Processing exchange...', {
      customer: { name: customerName, phone: customerPhone },
      oldItems,
      newItems,
      totalOld: totalOldGold,
      totalNew: totalNewGold,
      difference,
    });

    // Clear form
    setOldItems([]);
    setNewItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setShowPaymentModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tukar Tambah</h1>
        <p className="text-gray-500">Tukar emas lama dengan emas baru</p>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Data Pelanggan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama pelanggan"
            />
            <Input
              label="No. HP"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Old Gold (Buyback) */}
        <Card>
          <CardHeader className="bg-blue-50 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <ArrowLeftRight className="w-5 h-5" />
              Emas Lama (Buyback)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Input Form */}
            <div className="grid grid-cols-3 gap-3">
              <Select
                value={oldGoldType}
                onChange={(e) => setOldGoldType(e.target.value as typeof oldGoldType)}
                options={[
                  { value: 'LM', label: 'LM' },
                  { value: 'UBS', label: 'UBS' },
                  { value: 'Lokal', label: 'Lokal' },
                ]}
              />
              <Select
                value={oldPurity.toString()}
                onChange={(e) => setOldPurity(parseInt(e.target.value))}
                options={[
                  { value: '375', label: '375' },
                  { value: '750', label: '750' },
                  { value: '999', label: '999' },
                ]}
              />
              <Input
                type="number"
                step="0.01"
                value={oldWeight}
                onChange={(e) => setOldWeight(e.target.value)}
                placeholder="Berat (gr)"
              />
            </div>
            <Button onClick={handleAddOldItem} disabled={!oldWeightNum} className="w-full">
              Tambah Item Lama
            </Button>

            {/* Old Items List */}
            <div className="space-y-2">
              {oldItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-sm">
                    <p className="font-medium">
                      {item.goldType} {item.purity}
                    </p>
                    <p className="text-gray-500">{formatWeight(item.weight)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-blue-600">{formatCurrency(item.total)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOldItem(index)}
                      className="text-red-500"
                    >
                      &times;
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total Buyback</span>
                <span className="font-bold text-blue-600">{formatCurrency(totalOldGold)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: New Gold (Sale) */}
        <Card>
          <CardHeader className="bg-amber-50 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Barcode className="w-5 h-5" />
              Emas Baru (Jual)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Scan barcode atau cari..."
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchTerm && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-gray-200 rounded-lg hover:border-amber-500 cursor-pointer"
                    onClick={() => handleAddNewItem(item)}
                  >
                    <p className="font-medium">{item.product?.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatWeight(item.product?.weight_gram || 0)} -{' '}
                      {formatCurrency(calculateSellPrice(item))}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* New Items List */}
            <div className="space-y-2">
              {newItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-sm">
                    <p className="font-medium">{item.product?.name}</p>
                    <p className="text-gray-500">{formatWeight(item.product?.weight_gram || 0)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-amber-600">
                      {formatCurrency(calculateSellPrice(item))}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveNewItem(item.id)}
                      className="text-red-500"
                    >
                      &times;
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total Jual</span>
                <span className="font-bold text-amber-600">{formatCurrency(totalNewGold)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Ringkasan Tukar Tambah
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Total Emas Lama</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalOldGold)}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-600">Total Emas Baru</p>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalNewGold)}</p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                difference > 0 ? 'bg-green-50' : difference < 0 ? 'bg-red-50' : 'bg-gray-50'
              }`}
            >
              <p className={`text-sm ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {difference > 0 ? 'Pelanggan Bayar' : difference < 0 ? 'Kembalian' : 'Selisih'}
              </p>
              <p
                className={`text-2xl font-bold ${
                  difference > 0 ? 'text-green-700' : difference < 0 ? 'text-red-700' : 'text-gray-700'
                }`}
              >
                {formatCurrency(Math.abs(difference))}
              </p>
            </div>
            <div className="flex items-center">
              <Button
                className="w-full"
                size="lg"
                disabled={oldItems.length === 0 && newItems.length === 0}
                onClick={() => setShowPaymentModal(true)}
              >
                Proses Tukar Tambah
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Konfirmasi Tukar Tambah"
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Emas Lama</span>
              <span className="font-semibold text-blue-600">{formatCurrency(totalOldGold)}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Emas Baru</span>
              <span className="font-semibold text-amber-600">{formatCurrency(totalNewGold)}</span>
            </div>
            <div className="flex justify-between p-4 bg-emerald-50 rounded-lg">
              <span className="font-semibold">
                {difference > 0 ? 'Pelanggan Bayar' : 'Kembalian ke Pelanggan'}
              </span>
              <span className="text-xl font-bold text-emerald-600">
                {formatCurrency(Math.abs(difference))}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowPaymentModal(false)}>
              Batal
            </Button>
            <Button className="flex-1" onClick={handleProcessExchange}>
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
