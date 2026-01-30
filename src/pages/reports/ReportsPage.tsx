import { useState } from 'react';
import { Download, Filter, Calendar, TrendingUp, TrendingDown, FileText, Loader2 } from 'lucide-react';
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
import { useSalesReport, useDailySummary, useStockReport, useDateRanges } from '../../hooks/useReports';
import { useTransactions } from '../../hooks/useTransactions';

const reportTypes = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'custom', label: 'Custom' },
];

const categoryColors = ['#d97706', '#059669', '#3b82f6', '#8b5cf6', '#6b7280'];

export function ReportsPage() {
  const dateRanges = useDateRanges();
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState(dateRanges.last7Days.from);
  const [endDate, setEndDate] = useState(dateRanges.today);

  const { data: salesReport, isLoading: salesLoading } = useSalesReport(startDate, endDate);
  const { data: dailySummary } = useDailySummary(dateRanges.today);
  const { data: stockReport, isLoading: stockLoading } = useStockReport();
  const { data: transactions, isLoading: txLoading } = useTransactions({
    date_from: startDate,
    date_to: endDate,
  });

  // Calculate totals from sales report
  const totalSales = salesReport?.reduce((sum, r) => sum + r.total_sales, 0) || 0;
  const totalBuyback = salesReport?.reduce((sum, r) => sum + (r.total_buyback || 0), 0) || 0;
  const netSales = totalSales - totalBuyback;
  const totalTransactions = transactions?.length || 0;

  // Transform sales report for chart
  const chartData = salesReport?.map((r) => ({
    date: new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    sales: r.total_sales,
    buyback: r.total_buyback || 0,
    net: r.total_sales - (r.total_buyback || 0),
  })) || [];

  // Transform stock report for pie chart
  const categoryData = stockReport?.map((s, index) => ({
    name: s.category,
    value: s.total_items,
    color: categoryColors[index % categoryColors.length],
  })) || [];

  // Payment method breakdown (from daily summary if available)
  const paymentData = dailySummary?.payment_breakdown
    ? Object.entries(dailySummary.payment_breakdown).map(([method, amount]) => ({
        name: method === 'cash' ? 'Cash' : method === 'qris' ? 'QRIS' : 'Transfer',
        value: amount as number,
        color: method === 'cash' ? '#10b981' : method === 'qris' ? '#3b82f6' : '#8b5cf6',
      }))
    : [];


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
              onChange={(e) => {
                setReportType(e.target.value);
                if (e.target.value === 'daily') {
                  setStartDate(dateRanges.today);
                  setEndDate(dateRanges.today);
                } else if (e.target.value === 'weekly') {
                  setStartDate(dateRanges.last7Days.from);
                  setEndDate(dateRanges.last7Days.to);
                } else if (e.target.value === 'monthly') {
                  setStartDate(dateRanges.thisMonth.from);
                  setEndDate(dateRanges.thisMonth.to);
                }
              }}
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
                {salesLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalSales)}</p>
                )}
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
                {salesLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalBuyback)}</p>
                )}
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
                {salesLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(netSales)}</p>
                )}
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
                {txLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
                )}
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
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
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
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {salesLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  ) : (
                    'Belum ada data penjualan'
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Stok per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {stockLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  ) : (
                    'Belum ada data stok'
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Summary */}
      {paymentData.length > 0 && (
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
                  <p className="text-2xl font-bold">{formatCurrency(item.value)}</p>
                  <p className="text-sm text-gray-500">{item.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        {txLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions && transactions.length > 0 ? (
                transactions.slice(0, 10).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-sm">{tx.invoice_no}</TableCell>
                    <TableCell>{formatDateTime(tx.created_at)}</TableCell>
                    <TableCell>{tx.customer_name || 'Walk-in'}</TableCell>
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
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(tx.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.status === 'completed' ? 'success' : 'danger'}>
                        {tx.status === 'completed' ? 'Selesai' : tx.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Belum ada transaksi dalam periode ini
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
