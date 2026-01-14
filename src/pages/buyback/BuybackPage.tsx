import { useState } from 'react';
import { User, Scale, Calculator, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatWeight, getPurityLabel, getGoldTypeLabel } from '../../lib/utils';

// Gold buyback prices per gram
const BUYBACK_PRICES: Record<string, Record<number, number>> = {
  LM: { 999: 1150000, 750: 950000, 375: 475000 },
  UBS: { 999: 1145000, 750: 945000, 375: 472000 },
  Lokal: { 999: 1100000, 750: 880000, 375: 440000 },
};

interface BuybackItem {
  goldType: 'LM' | 'UBS' | 'Lokal';
  purity: number;
  weight: number;
  pricePerGram: number;
  total: number;
}

export function BuybackPage() {
  const [goldType, setGoldType] = useState<'LM' | 'UBS' | 'Lokal'>('LM');
  const [purity, setPurity] = useState<number>(750);
  const [weight, setWeight] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNik, setCustomerNik] = useState('');
  const [items, setItems] = useState<BuybackItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash');

  const pricePerGram = BUYBACK_PRICES[goldType]?.[purity] || 0;
  const weightNum = parseFloat(weight) || 0;
  const itemTotal = Math.round(weightNum * pricePerGram);

  const totalBuyback = items.reduce((sum, item) => sum + item.total, 0);

  const handleAddItem = () => {
    if (!weightNum || !pricePerGram) return;

    const newItem: BuybackItem = {
      goldType,
      purity,
      weight: weightNum,
      pricePerGram,
      total: itemTotal,
    };

    setItems([...items, newItem]);
    setWeight('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProcessBuyback = () => {
    // TODO: Process buyback via Tauri command
    console.log('Processing buyback...', {
      customer: { name: customerName, phone: customerPhone, nik: customerNik },
      items,
      total: totalBuyback,
      paymentMethod,
    });

    // Clear form
    setItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerNik('');
    setShowPaymentModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buyback</h1>
        <p className="text-gray-500">Pembelian emas dari pelanggan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gold Price Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Harga Buyback Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(BUYBACK_PRICES.LM).map(([p, price]) => (
                  <div key={p} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">LM {getPurityLabel(parseInt(p))}</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(price)}/gr</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Data Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Input
                  label="NIK (untuk nilai besar)"
                  value={customerNik}
                  onChange={(e) => setCustomerNik(e.target.value)}
                  placeholder="16 digit NIK"
                />
              </div>
            </CardContent>
          </Card>

          {/* Gold Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Input Emas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select
                  label="Jenis Emas"
                  value={goldType}
                  onChange={(e) => setGoldType(e.target.value as typeof goldType)}
                  options={[
                    { value: 'LM', label: 'Logam Mulia (ANTAM)' },
                    { value: 'UBS', label: 'UBS' },
                    { value: 'Lokal', label: 'Emas Lokal' },
                  ]}
                />
                <Select
                  label="Kadar"
                  value={purity.toString()}
                  onChange={(e) => setPurity(parseInt(e.target.value))}
                  options={[
                    { value: '375', label: '9K (375)' },
                    { value: '750', label: '18K (750)' },
                    { value: '875', label: '21K (875)' },
                    { value: '999', label: '24K (999)' },
                  ]}
                />
                <Input
                  label="Berat (gram)"
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.00"
                />
                <div className="flex items-end">
                  <Button onClick={handleAddItem} disabled={!weightNum} className="w-full">
                    Tambah
                  </Button>
                </div>
              </div>

              {/* Price Preview */}
              {weightNum > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        {getGoldTypeLabel(goldType)} - {getPurityLabel(purity)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatWeight(weightNum)} x {formatCurrency(pricePerGram)}/gr
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Estimasi</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(itemTotal)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items List */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Item Buyback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {getGoldTypeLabel(item.goldType)} - {getPurityLabel(item.purity)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatWeight(item.weight)} x {formatCurrency(item.pricePerGram)}/gr
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold text-blue-600">{formatCurrency(item.total)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Ringkasan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Item</span>
                  <span className="font-medium">{items.length} item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Berat</span>
                  <span className="font-medium">
                    {formatWeight(items.reduce((sum, i) => sum + i.weight, 0))}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total Bayar</span>
                    <span className="font-bold text-blue-600">{formatCurrency(totalBuyback)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={items.length === 0 || !customerName}
                  onClick={() => setShowPaymentModal(true)}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proses Buyback
                </Button>

                {(!customerName && items.length > 0) && (
                  <p className="text-sm text-amber-600 text-center">
                    * Data pelanggan wajib diisi
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Proses Pembayaran Buyback"
        size="md"
      >
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total yang akan dibayarkan ke pelanggan</p>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalBuyback)}</p>
          </div>

          {/* Customer Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Pelanggan</p>
            <p className="font-medium">{customerName}</p>
            <p className="text-sm text-gray-500">{customerPhone}</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">💵</span>
                <p className="mt-1 text-sm font-medium">Cash</p>
              </button>
              <button
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">🏦</span>
                <p className="mt-1 text-sm font-medium">Transfer</p>
              </button>
            </div>
          </div>

          {/* Bank Transfer Details */}
          {paymentMethod === 'bank_transfer' && (
            <div className="space-y-4">
              <Select
                label="Bank Tujuan"
                options={[
                  { value: 'bca', label: 'BCA' },
                  { value: 'mandiri', label: 'Mandiri' },
                  { value: 'bni', label: 'BNI' },
                  { value: 'bri', label: 'BRI' },
                ]}
                placeholder="Pilih bank"
              />
              <Input label="No. Rekening" placeholder="Nomor rekening pelanggan" />
              <Input label="Atas Nama" placeholder="Nama pemilik rekening" />
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
            <Button className="flex-1" onClick={handleProcessBuyback}>
              Konfirmasi Pembayaran
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
