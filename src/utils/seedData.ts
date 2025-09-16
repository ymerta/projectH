import { doc, setDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Örnek veri oluşturma fonksiyonları
 */

export interface SeedOptions {
  shopId: string;
  clearExisting?: boolean;
}

/**
 * Örnek çalışanları oluşturur
 */
export async function seedEmployees(shopId: string) {
  const employees = [
    {
      fullName: 'Mustafa (1)',
      hourlyRate: 150,
      active: true,
      createdAt: new Date()
    },
    {
      fullName: 'Mustafa (2)', 
      hourlyRate: 150,
      active: true,
      createdAt: new Date()
    },
    {
      fullName: 'Ayşe Yılmaz',
      hourlyRate: 140,
      active: true,
      createdAt: new Date()
    },
    {
      fullName: 'Mehmet Demir',
      hourlyRate: 160,
      active: false, // Pasif çalışan örneği
      createdAt: new Date()
    }
  ];

  const employeeIds: string[] = [];

  for (const employee of employees) {
    const employeeRef = doc(collection(db, 'shops', shopId, 'employees'));
    await setDoc(employeeRef, employee);
    employeeIds.push(employeeRef.id);
    console.log(`Çalışan oluşturuldu: ${employee.fullName}`);
  }

  return employeeIds;
}

/**
 * Örnek vardiyaları oluşturur
 */
export async function seedShifts(shopId: string, employeeIds: string[]) {
  if (employeeIds.length < 2) {
    throw new Error('En az 2 çalışan ID\'si gerekli');
  }

  const shifts = [
    // 2025-09-10, Mustafa(1), 10:00→20:00, mola 60 → 9.0 saat
    {
      employeeId: employeeIds[0],
      date: Timestamp.fromDate(new Date('2025-09-10T00:00:00')),
      start: '10:00',
      end: '20:00',
      breakMin: 60,
      totalHours: 9.0,
      notes: 'Normal vardiya',
      createdAt: new Date()
    },
    // 2025-09-11, Mustafa(2), 21:00→05:00, mola 30 → 7.5 saat
    {
      employeeId: employeeIds[1],
      date: Timestamp.fromDate(new Date('2025-09-11T00:00:00')),
      start: '21:00',
      end: '05:00',
      breakMin: 30,
      totalHours: 7.5,
      notes: 'Gece vardiyası',
      createdAt: new Date()
    },
    // 2025-09-12, Mustafa(1), 10:00→00:00, mola 30 → 13.5 saat
    {
      employeeId: employeeIds[0],
      date: Timestamp.fromDate(new Date('2025-09-12T00:00:00')),
      start: '10:00',
      end: '00:00',
      breakMin: 30,
      totalHours: 13.5,
      notes: '00:00 = 24:00 örneği',
      createdAt: new Date()
    },
    // Bu aydan birkaç örnek daha
    {
      employeeId: employeeIds[1],
      date: Timestamp.fromDate(new Date('2025-09-13T00:00:00')),
      start: '08:00',
      end: '16:00',
      breakMin: 45,
      totalHours: 7.25,
      notes: 'Sabah vardiyası',
      createdAt: new Date()
    },
    {
      employeeId: employeeIds[0],
      date: Timestamp.fromDate(new Date('2025-09-14T00:00:00')),
      start: '14:00',
      end: '22:00',
      breakMin: 30,
      totalHours: 7.5,
      notes: 'Öğleden sonra vardiyası',
      createdAt: new Date()
    },
    // Ayşe için örnekler
    {
      employeeId: employeeIds[2],
      date: Timestamp.fromDate(new Date('2025-09-15T00:00:00')),
      start: '09:00',
      end: '17:00',
      breakMin: 60,
      totalHours: 7.0,
      notes: 'Hafta sonu vardiyası',
      createdAt: new Date()
    },
    {
      employeeId: employeeIds[2],
      date: Timestamp.fromDate(new Date('2025-09-16T00:00:00')),
      start: '12:00',
      end: '20:00',
      breakMin: 30,
      totalHours: 7.5,
      notes: '',
      createdAt: new Date()
    }
  ];

  for (const shift of shifts) {
    const shiftRef = doc(collection(db, 'shops', shopId, 'shifts'));
    await setDoc(shiftRef, shift);
    console.log(`Vardiya oluşturuldu: ${shift.date.toDate().toLocaleDateString('tr-TR')} - ${shift.start}-${shift.end}`);
  }

  return shifts.length;
}

/**
 * Tüm örnek verileri oluşturur
 */
export async function seedAllData(options: SeedOptions) {
  const { shopId } = options;

  try {
    console.log('Örnek veri oluşturma başlıyor...');

    // 1. Çalışanları oluştur
    console.log('Çalışanlar oluşturuluyor...');
    const employeeIds = await seedEmployees(shopId);
    console.log(`${employeeIds.length} çalışan oluşturuldu`);

    // 2. Vardiyaları oluştur
    console.log('Vardiyalar oluşturuluyor...');
    const shiftCount = await seedShifts(shopId, employeeIds);
    console.log(`${shiftCount} vardiya oluşturuldu`);

    console.log('Örnek veri oluşturma tamamlandı!');
    
    return {
      success: true,
      employeeCount: employeeIds.length,
      shiftCount
    };
  } catch (error) {
    console.error('Örnek veri oluşturma hatası:', error);
    throw error;
  }
}

/**
 * Geliştirme ortamı için hızlı seed fonksiyonu
 */
export async function quickSeed(userId: string) {
  const shopId = `shop_${userId}`;
  
  try {
    const result = await seedAllData({ shopId });
    return result;
  } catch (error) {
    console.error('Hızlı seed hatası:', error);
    throw error;
  }
}

/**
 * Seed verilerinin mevcut olup olmadığını kontrol eder
 */
export async function checkSeedData(_shopId: string): Promise<boolean> {
  try {
    // Bu fonksiyon isteğe bağlı - gerçek uygulamada Firestore'dan veri sayısını kontrol edebilir
    // Şimdilik basit bir kontrol yapalım
    return false; // Her zaman seed yapılabilir
  } catch (error) {
    console.error('Seed kontrol hatası:', error);
    return false;
  }
}

