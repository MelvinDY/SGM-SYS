import { forwardRef } from 'react';
import { Printer, X, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDateTime, formatWeight, getPurityLabel } from '../../lib/utils';
import type { CartItem } from '../../types';

interface ReceiptPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    invoice_no: string;
    type: 'sale' | 'buyback' | 'exchange';
    subtotal: number;
    discount: number;
    total: number;
    created_at: string;
    customer_name?: string;
  };
  items: CartItem[];
  payment: {
    method: 'cash' | 'qris' | 'bank_transfer';
    amount: number;
  };
  cashReceived?: number;
  storeInfo?: {
    name: string;
    address: string;
    phone: string;
  };
}

const ReceiptContent = forwardRef<HTMLDivElement, Omit<ReceiptPreviewProps, 'isOpen' | 'onClose'>>(
  ({ transaction, items, payment, cashReceived, storeInfo }, ref) => {
    const store = storeInfo || {
      name: 'Toko Emas Sejahtera',
      address: 'Jl. Raya No. 123, Jakarta',
      phone: '021-1234567',
    };

    const change = (cashReceived || 0) - transaction.total;

    return (
      <div ref={ref} className="bg-white p-6 font-mono text-sm max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
          <h1 className="text-lg font-bold">{store.name}</h1>
          <p className="text-xs text-gray-600">{store.address}</p>
          <p className="text-xs text-gray-600">Telp: {store.phone}</p>
        </div>

        {/* Transaction Info */}
        <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
          <div className="flex justify-between text-xs">
            <span>No. Invoice</span>
            <span className="font-semibold">{transaction.invoice_no}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Tanggal</span>
            <span>{formatDateTime(transaction.created_at)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Tipe</span>
            <span>
              {transaction.type === 'sale'
                ? 'Penjualan'
                : transaction.type === 'buyback'
                ? 'Buyback'
                : 'Tukar Tambah'}
            </span>
          </div>
          {transaction.customer_name && (
            <div className="flex justify-between text-xs">
              <span>Pelanggan</span>
              <span>{transaction.customer_name}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
          <p className="font-semibold mb-2">Item:</p>
          {items.map((item, index) => (
            <div key={index} className="mb-2">
              <p className="text-xs">{item.inventory.product?.name}</p>
              <div className="flex justify-between text-xs text-gray-600">
                <span>
                  {formatWeight(item.inventory.product?.weight_gram || 0)} -{' '}
                  {getPurityLabel(item.inventory.product?.gold_purity || 0)}
                </span>
                <span>{formatCurrency(item.unit_price)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-b border-dashed border-gray-300 pb-4 mb-4 space-y-1">
          <div className="flex justify-between text-xs">
            <span>Subtotal</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>
          {transaction.discount > 0 && (
            <div className="flex justify-between text-xs text-red-600">
              <span>Diskon</span>
              <span>-{formatCurrency(transaction.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{formatCurrency(transaction.total)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border-b border-dashed border-gray-300 pb-4 mb-4 space-y-1">
          <div className="flex justify-between text-xs">
            <span>Pembayaran</span>
            <span>
              {payment.method === 'cash'
                ? 'Tunai'
                : payment.method === 'qris'
                ? 'QRIS'
                : 'Transfer Bank'}
            </span>
          </div>
          {payment.method === 'cash' && cashReceived && cashReceived > 0 && (
            <>
              <div className="flex justify-between text-xs">
                <span>Diterima</span>
                <span>{formatCurrency(cashReceived)}</span>
              </div>
              {change > 0 && (
                <div className="flex justify-between text-xs font-semibold">
                  <span>Kembalian</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Terima kasih atas kunjungan Anda</p>
          <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
          <p className="mt-2">*** LUNAS ***</p>
        </div>
      </div>
    );
  }
);

ReceiptContent.displayName = 'ReceiptContent';

export function ReceiptPreview({
  isOpen,
  onClose,
  transaction,
  items,
  payment,
  cashReceived,
  storeInfo,
}: ReceiptPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
      <div className="space-y-4">
        {/* Success Icon */}
        <div className="text-center py-4">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-2" />
          <h2 className="text-xl font-bold text-gray-900">Transaksi Berhasil!</h2>
          <p className="text-gray-500">Pembayaran telah diterima</p>
        </div>

        {/* Receipt Preview */}
        <div className="bg-gray-50 rounded-lg overflow-hidden print:bg-white">
          <ReceiptContent
            transaction={transaction}
            items={items}
            payment={payment}
            cashReceived={cashReceived}
            storeInfo={storeInfo}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 print:hidden">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Tutup
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak Struk
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { ReceiptContent };
