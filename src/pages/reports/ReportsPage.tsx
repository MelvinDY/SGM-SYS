import { useState } from 'react';
import { Download, Filter, Calendar, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Demo data
const dailyData = [
  { date: '10 Jan', sales: 45000000, buyback: 12000000, net: 33000000 },
  { date: '11 Jan', sales: 52000000, buyback: 18000000, net: 34000000 },
  { date: '12 Jan', sales: 38000000, buyback: 8000000, net: 30000000 },
  { date: '13 Jan', sales: 67000000, buyback: 22000000, net: 45000000 },
  { date: '14 Jan', sales: 55000000, buyback: 15000000, net: 40000000 },
  { date: '15 Jan', sales: 45500000, buyback: 10000000, net: 35500000 },
];

const categoryData = [
  { name: 'Cincin', value: 35, color: '#d97706' },
  { name: 'Kalung', value: 28, color: '#059669' },
  { name: 'Gelang', value: 20, color: '#3b82f6' },
  { name: 'Anting', value: 12, color: '#8b5cf6' },
  { name: 'Lainnya', value: 5, color: '#6b7280' },
];

const paymentData = [
  { name: 'Cash', value: 60, color: '#10b981' },
  { name: 'QRIS', value: 30, color: '#3b82f6' },
  { name: 'Transfer', value: 10, color: '#8b5cf6' },
];

const transactionHistory = [
  {
    id: 'INV-20260115-001',
    date: '2026-01-15T14:30:00',
    customer: 'Budi Santoso',
    type: 'sale',
    items: 2,
    total: 15500000,
    payment: 'QRIS',
    status: 'completed',
  },
  {
    id: 'BUY-20260115-001',
    date: '2026-01-15T13:15:00',
    customer: 'Siti Rahayu',
    type: 'buyback',
    items: 1,
    total: 3200000,
    payment: 'Cash',
    status: 'completed',
  },
  {
    id: 'INV-20260115-002',
    date: '2026-01-15T11:45:00',
    customer: 'Ahmad Yani',
    type: 'sale',
    items: 1,
    total: 10500000,
    payment: 'Cash',
    status: 'completed',
  },
  {
    id: 'EXC-20260115-001',
    date: '2026-01-15T10:20:00',
    customer: 'Dewi Lestari',
    type: 'exchange',
    items: 2,
    total: 2300000,
    payment: 'Cash',
    status: 'completed',
  },
  {
    id: 'INV-20260114-005',
    date: '2026-01-14T16:30:00',
    customer: 'Rudi Hermawan',
    type: 'sale',
    items: 3,
    total: 25000000,
    payment: 'Transfer',
    status: 'completed',
  },
];

const reportTypes = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'custom', label: 'Custom' },
];

export function ReportsPage() {
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState('2026-01-15');
  const [endDate, setEndDate] = useState('2026-01-15');

  // Summary calculations
  const totalSales = dailyData.reduce((sum, d) => sum + d.sales, 0);
  const totalBuyback = dailyData.reduce((sum, d) => sum + d.buyback, 0);
  const netSales = totalSales - totalBuyback;
  const totalTransactions = transactionHistory.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-500">Analisis penjualan dan performa bisnis</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <Select
              label="Periode"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={reportTypes}
              className="w-40"
            />
            <Input
              label="Dari Tanggal"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <Input
              label="Sampai Tanggal"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
            <Button>
              <Filter className="w-4 h-4 mr-2" />
              Terapkan Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Penjualan</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalSales)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Buyback</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalBuyback)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Penjualan</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(netSales)}</p>
              </div>
              <FileText className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Transaksi</p>
                <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Penjualan vs Buyback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(value) => `${value / 1000000}M`}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sales" name="Penjualan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="buyback" name="Buyback" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Metode Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {paymentData.map((item) => (
              <div key={item.name} className="text-center p-4 bg-gray-50 rounded-lg">
                <div
                  className="w-4 h-4 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-2xl font-bold">{item.value}%</p>
                <p className="text-sm text-gray-500">{item.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Pembayaran</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionHistory.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                <TableCell>{formatDateTime(tx.date)}</TableCell>
                <TableCell>{tx.customer}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tx.type === 'sale'
                        ? 'success'
                        : tx.type === 'buyback'
                        ? 'info'
                        : 'warning'
                    }
                  >
                    {tx.type === 'sale' ? 'Jual' : tx.type === 'buyback' ? 'Beli' : 'Tukar'}
                  </Badge>
                </TableCell>
                <TableCell>{tx.items} item</TableCell>
                <TableCell>{tx.payment}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(tx.total)}
                </TableCell>
                <TableCell>
                  <Badge variant="success">Selesai</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
