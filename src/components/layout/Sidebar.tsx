import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ArrowDownToLine,
  ArrowLeftRight,
  TrendingUp,
  BarChart3,
  Users,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Stok', href: '/inventory', icon: Package },
  { name: 'Buyback', href: '/buyback', icon: ArrowDownToLine },
  { name: 'Tukar Tambah', href: '/exchange', icon: ArrowLeftRight },
  { name: 'Harga Emas', href: '/gold-prices', icon: TrendingUp },
  { name: 'Laporan', href: '/reports', icon: BarChart3 },
  { name: 'User', href: '/users', icon: Users },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">E</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">EmasPOS</h1>
          <p className="text-xs text-gray-500">Manajemen Toko Emas</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors',
                isActive
                  ? 'bg-amber-100 text-amber-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>Online</span>
          <span className="mx-2">|</span>
          <span>Sync: OK</span>
        </div>
      </div>
    </aside>
  );
}
