import { useState } from 'react';
import { Edit, TrendingUp, RefreshCw, Save } from 'lucide-react';
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
import type { GoldPrice } from '../../types';

// Demo data
const todayPrices: GoldPrice[] = [
  { id: '1', date: '2026-01-15', gold_type: 'LM', purity: 999, buy_price: 1150000, sell_price: 1250000, source: 'Manual', created_at: new Date().toISOString() },
  { id: '2', date: '2026-01-15', gold_type: 'LM', purity: 750, buy_price: 950000, sell_price: 1050000, source: 'Manual', created_at: new Date().toISOString() },
  { id: '3', date: '2026-01-15', gold_type: 'LM', purity: 375, buy_price: 475000, sell_price: 525000, source: 'Manual', created_at: new Date().toISOString() },
  { id: '4', date: '2026-01-15', gold_type: 'UBS', purity: 999, buy_price: 1145000, sell_price: 1245000, source: 'Manual', created_at: new Date().toISOString() },
  { id: '5', date: '2026-01-15', gold_type: 'UBS', purity: 750, buy_price: 945000, sell_price: 1045000, source: 'Manual', created_at: new Date().toISOString() },
  { id: '6', date: '2026-01-15', gold_type: 'Lokal', purity: 750, buy_price: 880000, sell_price: 980000, source: 'Manual', created_at: new Date().toISOString() },
];

const priceHistory = [
  { date: '10 Jan', LM999: 1240000, LM750: 1040000, UBS999: 1235000 },
  { date: '11 Jan', LM999: 1245000, LM750: 1045000, UBS999: 1240000 },
  { date: '12 Jan', LM999: 1242000, LM750: 1042000, UBS999: 1237000 },
  { date: '13 Jan', LM999: 1248000, LM750: 1048000, UBS999: 1243000 },
  { date: '14 Jan', LM999: 1250000, LM750: 1050000, UBS999: 1245000 },
  { date: '15 Jan', LM999: 1250000, LM750: 1050000, UBS999: 1245000 },
];

export function GoldPricesPage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<GoldPrice | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Fetch from API
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const handleEdit = (price: GoldPrice) => {
    setEditingPrice(price);
    setShowEditModal(true);
  };

  const handleSave = () => {
    // TODO: Save via Tauri command
    setShowEditModal(false);
    setEditingPrice(null);
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
          <Button variant="outline" onClick={handleRefresh} isLoading={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh dari API
          </Button>
        </div>
      </div>

      {/* Price Cards */}
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

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Harga 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory}>
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
          </div>
        </CardContent>
      </Card>

      {/* Price Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Harga Hari Ini - {formatDate(new Date().toISOString())}</CardTitle>
        </CardHeader>
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
            {todayPrices.map((price) => {
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
                  <TableCell className="text-gray-500">{price.source}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(price)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
                defaultValue={editingPrice.sell_price}
              />
              <Input
                label="Harga Beli (per gram)"
                type="number"
                defaultValue={editingPrice.buy_price}
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
              <Button className="flex-1" onClick={handleSave}>
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
