import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency to Indonesian Rupiah
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format number with thousand separators
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

// Format weight in grams
export function formatWeight(grams: number): string {
  return `${formatNumber(grams)} gram`;
}

// Format date to Indonesian locale
export function formatDate(dateStr: string, formatStr: string = 'dd MMM yyyy'): string {
  try {
    const date = parseISO(dateStr);
    return format(date, formatStr, { locale: id });
  } catch {
    return dateStr;
  }
}

// Format datetime
export function formatDateTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'dd MMM yyyy HH:mm', { locale: id });
  } catch {
    return dateStr;
  }
}

// Format time only
export function formatTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'HH:mm', { locale: id });
  } catch {
    return dateStr;
  }
}

// Generate UUID
export function generateUUID(): string {
  return crypto.randomUUID();
}

// Generate invoice number
export function generateInvoiceNo(type: 'sale' | 'buyback' | 'exchange'): string {
  const prefix = type === 'sale' ? 'INV' : type === 'buyback' ? 'BUY' : 'EXC';
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${date}-${random}`;
}

// Generate barcode
export function generateBarcode(categoryCode: string, sequence: number): string {
  const paddedSeq = sequence.toString().padStart(6, '0');
  const baseCode = `EM-${categoryCode}-${paddedSeq}`;
  const checkDigit = calculateLuhnCheckDigit(baseCode.replace(/[^0-9]/g, ''));
  return `${baseCode}-${checkDigit}`;
}

// Calculate Luhn check digit
function calculateLuhnCheckDigit(numStr: string): number {
  const digits = numStr.split('').map(Number);
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return (10 - (sum % 10)) % 10;
}

// Calculate gold price based on weight and purity
export function calculateGoldPrice(
  weightGram: number,
  pricePerGram: number,
  laborCost: number = 0
): number {
  return Math.round(weightGram * pricePerGram + laborCost);
}

// Calculate buyback price (typically 90-95% of sell price)
export function calculateBuybackPrice(sellPrice: number, percentage: number = 0.92): number {
  return Math.round(sellPrice * percentage);
}

// Validate barcode format
export function isValidBarcode(barcode: string): boolean {
  const pattern = /^EM-[A-Z]{2}-\d{6}-\d$/;
  return pattern.test(barcode);
}

// Get gold type label
export function getGoldTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LM: 'Logam Mulia (ANTAM)',
    UBS: 'UBS',
    Lokal: 'Emas Lokal',
  };
  return labels[type] || type;
}

// Get purity label (e.g., 750 -> "18K (750)")
export function getPurityLabel(purity: number): string {
  const karatMap: Record<number, string> = {
    375: '9K',
    417: '10K',
    585: '14K',
    750: '18K',
    875: '21K',
    916: '22K',
    958: '23K',
    999: '24K',
  };
  const karat = karatMap[purity] || '';
  return karat ? `${karat} (${purity})` : purity.toString();
}

// Get status badge color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'success',
    sold: 'danger',
    reserved: 'warning',
    pending: 'warning',
    completed: 'success',
    void: 'danger',
    success: 'success',
    failed: 'danger',
  };
  return colors[status] || 'info';
}

// Get category code from name
export function getCategoryCode(categoryName: string): string {
  const codes: Record<string, string> = {
    Cincin: 'CN',
    Kalung: 'KL',
    Gelang: 'GL',
    Anting: 'AT',
    Liontin: 'LT',
    Batangan: 'BT',
    Koin: 'KN',
  };
  return codes[categoryName] || categoryName.substring(0, 2).toUpperCase();
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

// Parse numeric input (removes non-numeric characters)
export function parseNumericInput(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}

// Format phone number
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+62' + cleaned.substring(1);
  }
  return '+62' + cleaned;
}

// Check if running in Tauri
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
