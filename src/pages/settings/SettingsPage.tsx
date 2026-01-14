import { useState } from 'react';
import { Save, Store, Printer, CreditCard, Cloud, Database, TestTube } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [isSaving, setIsSaving] = useState(false);

  // Store settings
  const [storeName, setStoreName] = useState('Toko Emas Sejahtera');
  const [storeAddress, setStoreAddress] = useState('Jl. Raya No. 123, Jakarta');
  const [storePhone, setStorePhone] = useState('021-1234567');

  // Printer settings
  const [printerEnabled, setPrinterEnabled] = useState(true);
  const [printerName, setPrinterName] = useState('EPSON TM-T82');
  const [paperWidth, setPaperWidth] = useState('80');

  // Payment settings
  const [midtransEnv, setMidtransEnv] = useState('sandbox');
  const [qrisEnabled, setQrisEnabled] = useState(true);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(true);

  // Sync settings
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState('5');

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save via Tauri command
    setTimeout(() => setIsSaving(false), 1000);
  };

  const tabs = [
    { id: 'store', label: 'Toko', icon: Store },
    { id: 'printer', label: 'Printer', icon: Printer },
    { id: 'payment', label: 'Pembayaran', icon: CreditCard },
    { id: 'sync', label: 'Sinkronisasi', icon: Cloud },
    { id: 'backup', label: 'Backup', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-500">Konfigurasi sistem EmasPOS</p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-amber-100 text-amber-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Store Settings */}
          {activeTab === 'store' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Informasi Toko
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Nama Toko"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Nama toko"
                />
                <Input
                  label="Alamat"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="Alamat lengkap"
                />
                <Input
                  label="Telepon"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="Nomor telepon"
                />
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Preview Struk:</p>
                  <div className="p-4 bg-gray-100 rounded-lg font-mono text-xs">
                    <p className="text-center font-bold">{storeName || 'NAMA TOKO'}</p>
                    <p className="text-center">{storeAddress || 'Alamat Toko'}</p>
                    <p className="text-center">Telp: {storePhone || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Printer Settings */}
          {activeTab === 'printer' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  Pengaturan Printer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Aktifkan Printer</p>
                    <p className="text-sm text-gray-500">Cetak struk setelah transaksi</p>
                  </div>
                  <button
                    onClick={() => setPrinterEnabled(!printerEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      printerEnabled ? 'bg-amber-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        printerEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {printerEnabled && (
                  <>
                    <Select
                      label="Printer"
                      value={printerName}
                      onChange={(e) => setPrinterName(e.target.value)}
                      options={[
                        { value: 'EPSON TM-T82', label: 'EPSON TM-T82' },
                        { value: 'EPSON TM-T88', label: 'EPSON TM-T88' },
                        { value: 'Xprinter XP-58', label: 'Xprinter XP-58' },
                        { value: 'Xprinter XP-80', label: 'Xprinter XP-80' },
                      ]}
                    />
                    <Select
                      label="Lebar Kertas"
                      value={paperWidth}
                      onChange={(e) => setPaperWidth(e.target.value)}
                      options={[
                        { value: '58', label: '58mm' },
                        { value: '80', label: '80mm' },
                      ]}
                    />
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1">
                        <TestTube className="w-4 h-4 mr-2" />
                        Test Print
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pengaturan Pembayaran (Midtrans)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Environment"
                  value={midtransEnv}
                  onChange={(e) => setMidtransEnv(e.target.value)}
                  options={[
                    { value: 'sandbox', label: 'Sandbox (Testing)' },
                    { value: 'production', label: 'Production' },
                  ]}
                />
                <Input label="Server Key" type="password" placeholder="SB-Mid-server-xxx" />
                <Input label="Client Key" type="password" placeholder="SB-Mid-client-xxx" />
                <Input label="Merchant ID" placeholder="G123456789" />

                <div className="space-y-3 pt-4 border-t">
                  <p className="font-medium">Metode Pembayaran</p>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📱</span>
                      <div>
                        <p className="font-medium">QRIS</p>
                        <p className="text-sm text-gray-500">MDR ~0.7%</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setQrisEnabled(!qrisEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        qrisEnabled ? 'bg-amber-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          qrisEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏦</span>
                      <div>
                        <p className="font-medium">Bank Transfer / VA</p>
                        <p className="text-sm text-gray-500">Rp 4.000/transaksi</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setBankTransferEnabled(!bankTransferEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        bankTransferEnabled ? 'bg-amber-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          bankTransferEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sync Settings */}
          {activeTab === 'sync' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Sinkronisasi Cloud (Supabase)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Aktifkan Sinkronisasi</p>
                    <p className="text-sm text-gray-500">Backup data ke cloud secara otomatis</p>
                  </div>
                  <button
                    onClick={() => setSyncEnabled(!syncEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      syncEnabled ? 'bg-amber-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        syncEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {syncEnabled && (
                  <>
                    <Input label="Supabase URL" placeholder="https://xxx.supabase.co" />
                    <Input label="Supabase Key" type="password" placeholder="eyJxxx..." />
                    <Select
                      label="Interval Sinkronisasi"
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(e.target.value)}
                      options={[
                        { value: '1', label: 'Setiap 1 menit' },
                        { value: '5', label: 'Setiap 5 menit' },
                        { value: '15', label: 'Setiap 15 menit' },
                        { value: '30', label: 'Setiap 30 menit' },
                      ]}
                    />

                    <div className="p-4 bg-emerald-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="font-medium text-emerald-700">Terhubung</span>
                      </div>
                      <p className="text-sm text-emerald-600">
                        Sync terakhir: 14:25 | Pending: 0 item
                      </p>
                    </div>

                    <Button variant="outline" className="w-full">
                      Sync Sekarang
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Backup & Restore
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Backup Otomatis</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Database di-backup secara otomatis setiap 6 jam ke folder lokal
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Lokasi: <code className="bg-gray-200 px-1 rounded">%APPDATA%/EmasPOS/backup/</code>
                  </p>
                  <p className="text-sm text-gray-500">Retensi: 7 hari terakhir</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Backup Manual
                  </Button>
                  <Button variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Restore Backup
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="font-medium mb-3">Backup Terakhir</p>
                  <div className="space-y-2">
                    {[
                      { date: '15 Jan 2026, 12:00', size: '2.5 MB' },
                      { date: '15 Jan 2026, 06:00', size: '2.4 MB' },
                      { date: '14 Jan 2026, 18:00', size: '2.4 MB' },
                    ].map((backup, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{backup.date}</p>
                          <p className="text-xs text-gray-500">{backup.size}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
