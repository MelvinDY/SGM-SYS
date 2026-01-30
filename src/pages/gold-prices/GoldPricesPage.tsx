import { useState } from 'react';
import { Edit, TrendingUp, RefreshCw, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { formatCurrency, formatDate, getPurityLabel, getGoldTypeLabel } from '../../lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTodayPrices, usePriceHistory, useSetGoldPrice } from '../../hooks/useGoldPrices';
import type { GoldPrice } from '../../types';

export function GoldPricesPage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<GoldPrice | null>(null);
  const [editSellPrice, setEditSellPrice] = useState('');
  const [editBuyPrice, setEditBuyPrice] = useState('');

  const { data: todayPrices, isLoading: pricesLoading, refetch } = useTodayPrices();
  const { data: lm999History } = usePriceHistory('LM', 999, 7);
  const { data: lm750History } = usePriceHistory('LM', 750, 7);
  const { data: ubs999History } = usePriceHistory('UBS', 999, 7);
  const setGoldPrice = useSetGoldPrice();

  // Build price history chart data
  const priceHistoryData = lm999History?.map((price, index) => ({
    date: new Date(price.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    LM999: price.sell_price,
    LM750: lm750History?.[index]?.sell_price || 0,
    UBS999: ubs999History?.[index]?.sell_price || 0,
  })) || [];

  const handleRefresh = async () => {
    await refetch();
  };

  const handleEdit = (price: GoldPrice) => {
    setEditingPrice(price);
    setEditSellPrice(price.sell_price.toString());
    setEditBuyPrice(price.buy_price.toString());
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingPrice) return;

    try {
      await setGoldPrice.mutateAsync({
        gold_type: editingPrice.gold_type as 'LM' | 'UBS' | 'Lokal',
        purity: editingPrice.purity,
        sell_price: parseInt(editSellPrice),
        buy_price: parseInt(editBuyPrice),
      });

      setShowEditModal(false);
      setEditingPrice(null);
    } catch (error) {
      console.error('Failed to save price:', error);
      alert('Gagal menyimpan harga. Silakan coba lagi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Harga Emas</h1>
          <p className="text-gray-500">Kelola harga emas harian</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} isLoading={pricesLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${pricesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Price Cards */}
      {pricesLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : todayPrices && todayPrices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {todayPrices.slice(0, 6).map((price) => (
            <Card key={price.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">
                    {price.gold_type} {price.purity}
                  </p>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <div>
                    <p className="text-xs text-gray-500">Jual</p>
                    <p className="font-bold text-emerald-600">{formatCurrency(price.sell_price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Beli</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(price.buy_price)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Belum ada harga emas hari ini. Klik "Edit" di tabel untuk menambah harga.
          </CardContent>
        </Card>
      )}

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Harga 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {priceHistoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(2)}M`}
                    domain={['dataMin - 10000', 'dataMax + 10000']}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), '']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="LM999"
                    name="LM 999"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={{ fill: '#d97706' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="LM750"
                    name="LM 750"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ fill: '#059669' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="UBS999"
                    name="UBS 999"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Belum ada data historis harga
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Harga Hari Ini - {formatDate(new Date().toISOString())}</CardTitle>
        </CardHeader>
        {pricesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis Emas</TableHead>
                <TableHead>Kadar</TableHead>
                <TableHead className="text-right">Harga Jual/gram</TableHead>
                <TableHead className="text-right">Harga Beli/gram</TableHead>
                <TableHead className="text-right">Spread</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead className="w-20">&nbsp;</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayPrices && todayPrices.length > 0 ? (
                todayPrices.map((price) => {
                  const spread = price.sell_price - price.buy_price;
                  const spreadPercent = ((spread / price.sell_price) * 100).toFixed(1);

                  return (
                    <TableRow key={price.id}>
                      <TableCell className="font-medium">{getGoldTypeLabel(price.gold_type)}</TableCell>
                      <TableCell>{getPurityLabel(price.purity)}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {formatCurrency(price.sell_price)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        {formatCurrency(price.buy_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-gray-600">
                          {formatCurrency(spread)} ({spreadPercent}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500">{price.source || 'Manual'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(price)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Belum ada data harga hari ini
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPrice(null);
        }}
        title="Edit Harga Emas"
        size="md"
      >
        {editingPrice && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">
                {getGoldTypeLabel(editingPrice.gold_type)} - {getPurityLabel(editingPrice.purity)}
              </p>
              <p className="text-sm text-gray-500">{formatDate(editingPrice.date)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Harga Jual (per gram)"
                type="number"
                value={editSellPrice}
                onChange={(e) => setEditSellPrice(e.target.value)}
              />
              <Input
                label="Harga Beli (per gram)"
                type="number"
                value={editBuyPrice}
                onChange={(e) => setEditBuyPrice(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPrice(null);
                }}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                isLoading={setGoldPrice.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
