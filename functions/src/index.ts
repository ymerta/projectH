import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Vardiya oluşturulduğunda veya güncellendiğinde
 * aylık timesheet'i günceller (isteğe bağlı özellik)
 */
export const onShiftWrite = functions.firestore
  .document('shops/{shopId}/shifts/{shiftId}')
  .onWrite(async (change, context) => {
    const { shopId } = context.params;
    
    try {
      // Yeni veya güncellenen vardiya
      const shiftData = change.after.exists ? change.after.data() : null;
      
      if (!shiftData) {
        // Vardiya silindi, timesheet'i güncelle
        console.log('Vardiya silindi, timesheet güncelleniyor...');
        return;
      }

      const { employeeId, date, totalHours } = shiftData;
      const shiftDate = date.toDate();
      const yearMonth = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}`;

      // Bu ayın tüm vardiyalarını al
      const shiftsSnapshot = await admin.firestore()
        .collection(`shops/${shopId}/shifts`)
        .where('employeeId', '==', employeeId)
        .where('date', '>=', new Date(shiftDate.getFullYear(), shiftDate.getMonth(), 1))
        .where('date', '<=', new Date(shiftDate.getFullYear(), shiftDate.getMonth() + 1, 0))
        .get();

      // Toplam saatleri hesapla
      let totalMonthlyHours = 0;
      shiftsSnapshot.forEach(doc => {
        const shift = doc.data();
        totalMonthlyHours += shift.totalHours || 0;
      });

      // Çalışan bilgilerini al
      const employeeDoc = await admin.firestore()
        .doc(`shops/${shopId}/employees/${employeeId}`)
        .get();

      if (!employeeDoc.exists) {
        console.error('Çalışan bulunamadı:', employeeId);
        return;
      }

      const employee = employeeDoc.data();
      const totalPay = totalMonthlyHours * (employee?.hourlyRate || 0);

      // Timesheet'i güncelle
      const timesheetRef = admin.firestore()
        .doc(`shops/${shopId}/timesheets/${yearMonth}/employees/${employeeId}`);

      await timesheetRef.set({
        totalHours: Math.round(totalMonthlyHours * 100) / 100,
        totalPay: Math.round(totalPay * 100) / 100,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Timesheet güncellendi: ${employeeId} - ${yearMonth}`);
    } catch (error) {
      console.error('Timesheet güncelleme hatası:', error);
    }
  });

/**
 * Çalışan oluşturulduğunda hoş geldin e-postası gönder
 * (isteğe bağlı - e-posta servisi gerektirir)
 */
export const onEmployeeCreate = functions.firestore
  .document('shops/{shopId}/employees/{employeeId}')
  .onCreate(async (snap, context) => {
    const employee = snap.data();
    const { shopId, employeeId } = context.params;

    console.log(`Yeni çalışan oluşturuldu: ${employee.fullName} (${employeeId}) - Shop: ${shopId}`);
    
    // Burada e-posta gönderme servisi entegre edilebilir
    // Örnek: SendGrid, Nodemailer, vs.
    
    return null;
  });

/**
 * Aylık rapor oluşturma fonksiyonu
 * HTTP trigger ile çağrılabilir
 */
export const generateMonthlyReport = functions.https.onCall(async (data, context) => {
  // Kullanıcı kimlik doğrulaması
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Kimlik doğrulaması gerekli');
  }

  const { shopId, year, month } = data;
  
  if (!shopId || !year || !month) {
    throw new functions.https.HttpsError('invalid-argument', 'shopId, year ve month parametreleri gerekli');
  }

  try {
    // Mağaza sahibi kontrolü
    const shopDoc = await admin.firestore().doc(`shops/${shopId}`).get();
    if (!shopDoc.exists || shopDoc.data()?.ownerUid !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Bu mağazaya erişim yetkiniz yok');
    }

    // Ay aralığını hesapla
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Vardiyaları al
    const shiftsSnapshot = await admin.firestore()
      .collection(`shops/${shopId}/shifts`)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    // Çalışanları al
    const employeesSnapshot = await admin.firestore()
      .collection(`shops/${shopId}/employees`)
      .get();

    const employees: any = {};
    employeesSnapshot.forEach(doc => {
      employees[doc.id] = { id: doc.id, ...doc.data() };
    });

    // Çalışan bazında topla
    const summary: any = {};
    shiftsSnapshot.forEach(doc => {
      const shift = doc.data();
      const empId = shift.employeeId;
      
      if (!summary[empId]) {
        summary[empId] = {
          employee: employees[empId],
          totalHours: 0,
          totalPay: 0
        };
      }
      
      summary[empId].totalHours += shift.totalHours || 0;
    });

    // Maaş hesapla
    Object.keys(summary).forEach(empId => {
      const emp = summary[empId];
      emp.totalPay = emp.totalHours * (emp.employee?.hourlyRate || 0);
      emp.totalHours = Math.round(emp.totalHours * 100) / 100;
      emp.totalPay = Math.round(emp.totalPay * 100) / 100;
    });

    return {
      success: true,
      summary: Object.values(summary),
      period: `${year}-${String(month).padStart(2, '0')}`
    };
  } catch (error) {
    console.error('Rapor oluşturma hatası:', error);
    throw new functions.https.HttpsError('internal', 'Rapor oluşturulamadı');
  }
});

