import { useState, useRef, useEffect } from 'react';
import { Search, Barcode, Trash2, User, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatWeight, getPurityLabel, getGoldTypeLabel } from '../../lib/utils';
import { useCartStore } from '../../store/cartStore';
import type { Inventory, Customer } from '../../types';

// Demo inventory data
const demoInventory: Inventory[] = [
  {
    id: '1',
    product_id: '1',
    branch_id: '1',
    barcode: 'EM-CN-000001-7',
    status: 'available',
    location: 'Etalase',
    purchase_price: 4800000,
    created_at: new Date().toISOString(),
    product: {
      id: '1',
      category_id: '1',
      name: 'Cincin Polos',
      gold_type: 'LM',
      gold_purity: 750,
      weight_gram: 5,
      labor_cost: 200000,
      is_active: true,
      created_at: new Date().toISOString(),
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
    created_at: new Date().toISOString(),
    product: {
      id: '2',
      category_id: '2',
      name: 'Kalung Rantai',
      gold_type: 'LM',
      gold_purity: 750,
      weight_gram: 10,
      labor_cost: 350000,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: '3',
    product_id: '3',
    branch_id: '1',
    barcode: 'EM-GL-000001-9',
    status: 'available',
    location: 'Etalase',
    purchase_price: 3800000,
    created_at: new Date().toISOString(),
    product: {
      id: '3',
      category_id: '3',
      name: 'Gelang Keroncong',
      gold_type: 'Lokal',
      gold_purity: 375,
      weight_gram: 8,
      labor_cost: 150000,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  },
];

// Gold price per gram (would come from gold_prices table)
const GOLD_PRICE_PER_GRAM: Record<string, Record<number, number>> = {
  LM: { 999: 1250000, 750: 1050000, 375: 525000 },
  UBS: { 999: 1245000, 750: 1045000, 375: 522000 },
  Lokal: { 999: 1200000, 750: 980000, 375: 490000 },
};

function calculateSellPrice(item: Inventory): number {
  if (!item.product) return 0;
  const pricePerGram = GOLD_PRICE_PER_GRAM[item.product.gold_type]?.[item.product.gold_purity] || 0;
  return Math.round(item.product.weight_gram * pricePerGram + item.product.labor_cost);
}

export function POSPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'bank_transfer'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { cart, addItem, removeItem, setDiscount, clearCart } = useCartStore();

  // Focus on search input for barcode scanning
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filter inventory based on search
  const filteredInventory = demoInventory.filter(
    (item) =>
      item.status === 'available' &&
      (item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddToCart = (item: Inventory) => {
    const sellPrice = calculateSellPrice(item);
    addItem(item, sellPrice);
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredInventory.length === 1) {
      handleAddToCart(filteredInventory[0]);
    }
  };

  const handleProcessPayment = () => {
    // TODO: Process payment via Tauri command
    console.log('Processing payment...', {
      cart,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? parseInt(cashReceived.replace(/\D/g, '')) : 0,
      customer: selectedCustomer,
    });

    // Clear cart after successful payment
    clearCart();
    setShowPaymentModal(false);
    setCashReceived('');
    setSelectedCustomer(null);
  };

  const cashReceivedAmount = parseInt(cashReceived.replace(/\D/g, '')) || 0;
  const change = cashReceivedAmount - cart.total;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Left: Product Search & List */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Point of Sale</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scan barcode atau cari produk..."
                className="pl-10"
              />
              <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInventory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 cursor-pointer transition-colors"
                  onClick={() => handleAddToCart(item)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{item.product?.name}</h3>
                    <Badge variant="success">Ready</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="font-mono text-xs">{item.barcode}</p>
                    <p>
                      {getGoldTypeLabel(item.product?.gold_type || '')} -{' '}
                      {getPurityLabel(item.product?.gold_purity || 0)}
                    </p>
                    <p>{formatWeight(item.product?.weight_gram || 0)}</p>
                  </div>
                  <p className="mt-2 text-lg font-bold text-amber-600">
                    {formatCurrency(calculateSellPrice(item))}
                  </p>
                </div>
              ))}
              {filteredInventory.length === 0 && searchTerm && (
                <div className="col-span-2 py-12 text-center text-gray-500">
                  Produk tidak ditemukan
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Cart */}
      <div className="w-96 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Keranjang</CardTitle>
              {cart.items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Kosongkan
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto py-4">
            {cart.items.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Barcode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Scan barcode untuk menambah item</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div
                    key={item.inventory.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.inventory.product?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatWeight(item.inventory.product?.weight_gram || 0)} -{' '}
                          {getPurityLabel(item.inventory.product?.gold_purity || 0)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.inventory.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-right font-semibold text-amber-600">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Cart Summary */}
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Diskon</span>
              <Input
                type="text"
                value={cart.discount ? formatCurrency(cart.discount) : ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                  setDiscount(value);
                }}
                placeholder="Rp 0"
                className="w-32 text-right"
              />
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total</span>
              <span className="text-amber-600">{formatCurrency(cart.total)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={cart.items.length === 0}
              onClick={() => setShowPaymentModal(true)}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Bayar Sekarang
            </Button>
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Pembayaran"
        size="md"
      >
        <div className="space-y-6">
          {/* Total */}
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Pembayaran</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(cart.total)}</p>
          </div>

          {/* Customer (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pelanggan (Opsional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Cari pelanggan..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'cash', label: 'Cash', icon: '💵' },
                { id: 'qris', label: 'QRIS', icon: '📱' },
                { id: 'bank_transfer', label: 'Transfer', icon: '🏦' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    paymentMethod === method.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <p className="mt-1 text-sm font-medium">{method.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Input */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Diterima
              </label>
              <Input
                type="text"
                value={cashReceived}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setCashReceived(value ? formatCurrency(parseInt(value)) : '');
                }}
                placeholder="Rp 0"
                className="text-lg font-semibold"
              />
              {cashReceivedAmount >= cart.total && (
                <div className="mt-2 p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-emerald-700">
                    Kembalian: <span className="font-bold">{formatCurrency(change)}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* QRIS Placeholder */}
          {paymentMethod === 'qris' && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">QR Code</p>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Scan QR code di atas menggunakan aplikasi e-wallet atau mobile banking
              </p>
            </div>
          )}

          {/* Bank Transfer Placeholder */}
          {paymentMethod === 'bank_transfer' && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Bank</span>
                <span className="font-medium">BCA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No. Rekening</span>
                <span className="font-mono font-medium">123-456-7890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Atas Nama</span>
                <span className="font-medium">Toko Emas Sejahtera</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowPaymentModal(false)}
            >
              Batal
            </Button>
            <Button
              className="flex-1"
              onClick={handleProcessPayment}
              disabled={
                paymentMethod === 'cash' && cashReceivedAmount < cart.total
              }
            >
              Proses Pembayaran
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
