import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  DollarSign,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDashboardSummary, useSalesReport, useDateRanges } from '../../hooks/useReports';
import { useTodayPrices } from '../../hooks/useGoldPrices';
import { useTransactions } from '../../hooks/useTransactions';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  iconBg: string;
  isLoading?: boolean;
}

function StatCard({ title, value, change, icon: Icon, iconBg, isLoading }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            {isLoading ? (
              <div className="flex items-center gap-2 mt-1">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                <div
                  className={`flex items-center gap-1 mt-2 text-sm ${
                    isPositive ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{Math.abs(change)}%</span>
                  <span className="text-gray-500">vs kemarin</span>
                </div>
              </>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: goldPrices, isLoading: pricesLoading } = useTodayPrices();
  const { data: recentTransactions, isLoading: transactionsLoading } = useTransactions();
  const dateRanges = useDateRanges();
  const { data: salesReport } = useSalesReport(dateRanges.last7Days.from, dateRanges.last7Days.to);

  // Transform sales report data for chart
  const salesChartData = salesReport?.map((report) => ({
    day: new Date(report.date).toLocaleDateString('id-ID', { weekday: 'short' }),
    amount: report.total_sales,
  })) || [];

  // Transform gold prices for display
  const priceDisplay = goldPrices?.slice(0, 4).map((price) => ({
    type: `${price.gold_type} ${price.purity}`,
    sell: price.sell_price,
    buy: price.buy_price,
  })) || [];

  // Get last 4 recent transactions
  const recentTxList = recentTransactions?.slice(0, 4).map((tx) => ({
    id: tx.invoice_no,
    customer: tx.customer_name || 'Walk-in',
    amount: tx.total,
    type: tx.type,
    time: new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Ringkasan bisnis hari ini</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Penjualan Hari Ini"
          value={summary ? formatCurrency(summary.today_sales) : 'Rp 0'}
          change={summary?.sales_change || 0}
          icon={DollarSign}
          iconBg="bg-emerald-500"
          isLoading={summaryLoading}
        />
        <StatCard
          title="Transaksi"
          value={summary?.today_transactions.toString() || '0'}
          change={summary?.transactions_change || 0}
          icon={ShoppingCart}
          iconBg="bg-blue-500"
          isLoading={summaryLoading}
        />
        <StatCard
          title="Stok Tersedia"
          value={`${summary?.total_stock || 0} item`}
          change={0}
          icon={Package}
          iconBg="bg-amber-500"
          isLoading={summaryLoading}
        />
        <StatCard
          title="Total Berat"
          value={`${summary?.total_weight.toFixed(1) || 0} gr`}
          change={0}
          icon={TrendingUp}
          iconBg="bg-purple-500"
          isLoading={summaryLoading}
        />
      </div>

      {/* Charts and Gold Price */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {salesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Penjualan']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#d97706"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Belum ada data penjualan
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gold Prices */}
        <Card>
          <CardHeader>
            <CardTitle>Harga Emas Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {pricesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : priceDisplay.length > 0 ? (
              <div className="space-y-4">
                {priceDisplay.map((price) => (
                  <div
                    key={price.type}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <p className="font-medium text-gray-900">{price.type}</p>
                    <div className="flex justify-between mt-2 text-sm">
                      <div>
                        <p className="text-gray-500">Jual</p>
                        <p className="font-semibold text-emerald-600">
                          {formatCurrency(price.sell)}/gr
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500">Beli</p>
                        <p className="font-semibold text-blue-600">
                          {formatCurrency(price.buy)}/gr
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Belum ada harga emas hari ini
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaksi Terakhir</CardTitle>
          <a
            href="/reports"
            className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            Lihat semua
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : recentTxList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Invoice</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Pelanggan</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Tipe</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-600">Jumlah</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-600">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxList.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100">
                      <td className="py-3 text-sm font-medium text-gray-900">{tx.id}</td>
                      <td className="py-3 text-sm text-gray-600">{tx.customer}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            tx.type === 'sale'
                              ? 'bg-emerald-100 text-emerald-700'
                              : tx.type === 'buyback'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {tx.type === 'sale' ? 'Jual' : tx.type === 'buyback' ? 'Beli' : 'Tukar'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 text-sm text-right text-gray-500">{tx.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Belum ada transaksi hari ini
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
