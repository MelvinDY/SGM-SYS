import { useState, useEffect } from 'react';
import { Save, Store, Printer, CreditCard, Cloud, Database, TestTube, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  useSyncConfig,
  useSyncStatus,
  useSaveSyncConfig,
  useTestSfConnection,
  useManualSync,
} from '../../hooks/useSync';
import type { SaveSyncConfigRequest } from '../../types';

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

  // Salesforce Sync settings
  const [sfClientId, setSfClientId] = useState('');
  const [sfClientSecret, setSfClientSecret] = useState('');
  const [sfUsername, setSfUsername] = useState('');
  const [sfPassword, setSfPassword] = useState('');
  const [sfSecurityToken, setSfSecurityToken] = useState('');
  const [sfIsSandbox, setSfIsSandbox] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState('15');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // React Query hooks
  const { data: syncConfig } = useSyncConfig();
  const { data: syncStatus } = useSyncStatus();
  const saveSyncConfigMutation = useSaveSyncConfig();
  const testConnectionMutation = useTestSfConnection();
  const manualSyncMutation = useManualSync();

  // Load config when data arrives
  useEffect(() => {
    if (syncConfig) {
      setSfClientId(syncConfig.sf_client_id || '');
      setSfClientSecret(syncConfig.sf_client_secret || '');
      setSfUsername(syncConfig.sf_username || '');
      setSfPassword(syncConfig.sf_password || '');
      setSfSecurityToken(syncConfig.sf_security_token || '');
      setSfIsSandbox(syncConfig.is_sandbox);
      setSyncEnabled(syncConfig.sync_enabled);
      setSyncInterval(syncConfig.sync_interval_minutes.toString());
    }
  }, [syncConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save via Tauri command
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleSaveSyncConfig = async () => {
    const request: SaveSyncConfigRequest = {
      sf_client_id: sfClientId,
      sf_client_secret: sfClientSecret,
      sf_username: sfUsername,
      sf_password: sfPassword,
      sf_security_token: sfSecurityToken,
      is_sandbox: sfIsSandbox,
      sync_enabled: syncEnabled,
      sync_interval_minutes: parseInt(syncInterval),
    };

    try {
      await saveSyncConfigMutation.mutateAsync(request);
      setTestResult({ success: true, message: 'Konfigurasi tersimpan!' });
    } catch (error) {
      setTestResult({ success: false, message: error instanceof Error ? error.message : 'Gagal menyimpan' });
    }
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    try {
      const result = await testConnectionMutation.mutateAsync();
      setTestResult({ success: true, message: result || 'Koneksi berhasil!' });
    } catch (error) {
      setTestResult({ success: false, message: error instanceof Error ? error.message : 'Koneksi gagal' });
    }
  };

  const handleManualSync = async () => {
    try {
      const result = await manualSyncMutation.mutateAsync();
      if (result?.success) {
        setTestResult({
          success: true,
          message: `Sync berhasil! Push: ${result.records_pushed}, Pull: ${result.records_pulled}`
        });
      } else {
        setTestResult({
          success: false,
          message: result?.errors?.join(', ') || 'Sync gagal'
        });
      }
    } catch (error) {
      setTestResult({ success: false, message: error instanceof Error ? error.message : 'Sync gagal' });
    }
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

          {/* Sync Settings - Salesforce */}
          {activeTab === 'sync' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Sinkronisasi Cloud (Salesforce)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enable/Disable Sync */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Aktifkan Sinkronisasi</p>
                    <p className="text-sm text-gray-500">Sinkronisasi data dengan Salesforce</p>
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

                {/* Salesforce Credentials */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-700">Kredensial Connected App</h4>

                  <Select
                    label="Environment"
                    value={sfIsSandbox ? 'sandbox' : 'production'}
                    onChange={(e) => setSfIsSandbox(e.target.value === 'sandbox')}
                    options={[
                      { value: 'sandbox', label: 'Sandbox / Developer Edition' },
                      { value: 'production', label: 'Production' },
                    ]}
                  />

                  <Input
                    label="Consumer Key (Client ID)"
                    value={sfClientId}
                    onChange={(e) => setSfClientId(e.target.value)}
                    placeholder="3MVG9..."
                  />

                  <Input
                    label="Consumer Secret (Client Secret)"
                    type="password"
                    value={sfClientSecret}
                    onChange={(e) => setSfClientSecret(e.target.value)}
                    placeholder="***"
                  />

                  <Input
                    label="Username"
                    value={sfUsername}
                    onChange={(e) => setSfUsername(e.target.value)}
                    placeholder="user@company.com"
                  />

                  <Input
                    label="Password"
                    type="password"
                    value={sfPassword}
                    onChange={(e) => setSfPassword(e.target.value)}
                    placeholder="***"
                  />

                  <Input
                    label="Security Token"
                    type="password"
                    value={sfSecurityToken}
                    onChange={(e) => setSfSecurityToken(e.target.value)}
                    placeholder="Token dari email Salesforce"
                  />

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
                </div>

                {/* Test Result */}
                {testResult && (
                  <div className={`p-4 rounded-lg ${testResult.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${testResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                        {testResult.success ? 'Berhasil' : 'Gagal'}
                      </span>
                    </div>
                    <p className={`text-sm ${testResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                      {testResult.message}
                    </p>
                  </div>
                )}

                {/* Sync Status */}
                {syncStatus && (
                  <div className={`p-4 rounded-lg ${syncStatus.is_connected ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {syncStatus.is_connected ? (
                        <>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="font-medium text-emerald-700">Terhubung</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-amber-700">Belum Terhubung</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm space-y-1">
                      {syncStatus.last_sync_at && (
                        <p className={syncStatus.is_connected ? 'text-emerald-600' : 'text-amber-600'}>
                          Sync terakhir: {new Date(syncStatus.last_sync_at).toLocaleString('id-ID')}
                        </p>
                      )}
                      <p className={syncStatus.is_connected ? 'text-emerald-600' : 'text-amber-600'}>
                        Pending: {syncStatus.pending_changes} perubahan
                      </p>
                      {syncStatus.error_message && (
                        <p className="text-red-600">Error: {syncStatus.error_message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    isLoading={testConnectionMutation.isPending}
                    className="flex-1"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Koneksi
                  </Button>
                  <Button
                    onClick={handleSaveSyncConfig}
                    isLoading={saveSyncConfigMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Simpan
                  </Button>
                </div>

                {syncEnabled && syncStatus?.is_connected && (
                  <Button
                    variant="outline"
                    onClick={handleManualSync}
                    isLoading={manualSyncMutation.isPending}
                    className="w-full"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${manualSyncMutation.isPending ? 'animate-spin' : ''}`} />
                    Sync Sekarang
                  </Button>
                )}

                {/* Help Text */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    <strong>Cara mendapatkan kredensial:</strong>
                  </p>
                  <ol className="text-sm text-gray-500 list-decimal list-inside mt-2 space-y-1">
                    <li>Login ke Salesforce Setup</li>
                    <li>Buat Connected App di App Manager</li>
                    <li>Enable OAuth Settings dengan Full Access scope</li>
                    <li>Copy Consumer Key dan Consumer Secret</li>
                    <li>Reset Security Token dari Settings &gt; Reset My Security Token</li>
                  </ol>
                </div>
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
