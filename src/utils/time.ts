import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/tr';

// dayjs eklentilerini etkinleştir
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('tr');

// Türkiye saat dilimi
export const TIMEZONE = 'Europe/Istanbul';

/**
 * Saat ve dakikayı ondalık saate çevirir
 * @param timeStr "HH:mm" formatında saat
 * @returns Ondalık saat değeri
 */
export function timeToDecimal(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + (minutes / 60);
}

/**
 * Ondalık saati "HH:mm" formatına çevirir
 * @param decimal Ondalık saat değeri
 * @returns "HH:mm" formatında saat
 */
export function decimalToTime(decimal: number): string {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Çalışılan saat hesaplama fonksiyonu
 * Gece devri ve 00:00 = 24:00 kurallarını uygular
 * @param startTime Başlangıç saati "HH:mm"
 * @param endTime Bitiş saati "HH:mm" 
 * @param breakMinutes Mola dakikası (varsayılan 0)
 * @returns Toplam çalışılan saat (ondalık)
 */
export function hoursWorked(startTime: string, endTime: string, breakMinutes: number = 0): number {
  // Giriş doğrulaması
  if (!startTime || !endTime) {
    return 0;
  }

  // Saat formatı kontrolü
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return 0;
  }

  let startDecimal = timeToDecimal(startTime);
  let endDecimal = timeToDecimal(endTime);

  // 00:00 = 24:00 kuralı
  if (endTime === '00:00') {
    endDecimal = 24;
  }

  // Gece devri kontrolü - bitiş başlangıçtan küçükse ertesi güne geçmiş
  if (endDecimal < startDecimal && endTime !== '00:00') {
    endDecimal += 24;
  }

  // Toplam süreyi hesapla
  const totalDecimal = endDecimal - startDecimal;
  
  // Mola süresini çıkar (dakikayı saate çevir)
  const breakHours = breakMinutes / 60;
  const finalHours = totalDecimal - breakHours;

  // Negatif değerleri engelle
  const result = Math.max(0, finalHours);
  
  // 2 ondalık basamağa yuvarla
  return Math.round(result * 100) / 100;
}

/**
 * Dakikaları 15 dakikalık dilimlere yuvarlar
 * @param minutes Dakika değeri
 * @returns Yuvarlanmış dakika (0, 15, 30, 45)
 */
export function roundToQuarterHour(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

/**
 * Tarihi Türkiye saat dilimine göre formatlar
 * @param date Tarih
 * @param format Format string (varsayılan: DD/MM/YYYY)
 * @returns Formatlanmış tarih string'i
 */
export function formatDate(date: Date | string, format: string = 'DD/MM/YYYY'): string {
  return dayjs(date).tz(TIMEZONE).format(format);
}

/**
 * Ay başı ve sonu tarihlerini döndürür
 * @param year Yıl
 * @param month Ay (1-12)
 * @returns {start: Date, end: Date}
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = dayjs().year(year).month(month - 1).startOf('month').toDate();
  const end = dayjs().year(year).month(month - 1).endOf('month').toDate();
  return { start, end };
}

/**
 * Bugünün tarihini YYYY-MM-DD formatında döndürür
 */
export function getTodayString(): string {
  return dayjs().tz(TIMEZONE).format('YYYY-MM-DD');
}

/**
 * Saat string'ini doğrular
 * @param timeStr Saat string'i
 * @returns Geçerli ise true
 */
export function isValidTime(timeStr: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

/**
 * Tarih string'ini doğrular (YYYY-MM-DD)
 * @param dateStr Tarih string'i
 * @returns Geçerli ise true
 */
export function isValidDate(dateStr: string): boolean {
  const date = dayjs(dateStr);
  return date.isValid() && !!dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
}

