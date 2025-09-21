import { Shift, Employee, EmployeeMonthlySummary } from '../types';

/**
 * Aylık rapor hesaplama fonksiyonları
 */

/**
 * Çalışan bazında aylık özet hesaplar
 * @param shifts Ay içindeki tüm vardiyalar
 * @param employees Çalışan listesi
 * @returns Çalışan bazında özet listesi
 */
export function calculateMonthlySummary(
  shifts: Shift[], 
  employees: Employee[]
): EmployeeMonthlySummary[] {
  // Çalışan ID'sine göre vardiyaları grupla
  const shiftsByEmployee = shifts.reduce((acc, shift) => {
    if (!acc[shift.employeeId]) {
      acc[shift.employeeId] = [];
    }
    acc[shift.employeeId].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  // Her çalışan için özet hesapla
  const summaries: EmployeeMonthlySummary[] = [];

  employees.forEach(employee => {
    const employeeShifts = shiftsByEmployee[employee.id] || [];
    // Sadece izin olmayan vardiyaları say
    const workingShifts = employeeShifts.filter(shift => !shift.isLeave);
    const totalHours = workingShifts.reduce((sum, shift) => sum + shift.totalHours, 0);
    const totalPay = totalHours * employee.hourlyRate;

    summaries.push({
      employee,
      totalHours: Math.round(totalHours * 100) / 100,
      totalPay: Math.round(totalPay * 100) / 100
    });
  });

  // Toplam saate göre sırala (büyükten küçüğe)
  return summaries.sort((a, b) => b.totalHours - a.totalHours);
}

/**
 * Genel toplam hesaplar
 * @param summaries Çalışan özetleri
 * @returns Genel toplam bilgileri
 */
export function calculateGrandTotal(summaries: EmployeeMonthlySummary[]) {
  const totalHours = summaries.reduce((sum, summary) => sum + summary.totalHours, 0);
  const totalPay = summaries.reduce((sum, summary) => sum + summary.totalPay, 0);
  const averageHourlyRate = totalHours > 0 ? totalPay / totalHours : 0;

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalPay: Math.round(totalPay * 100) / 100,
    averageHourlyRate: Math.round(averageHourlyRate * 100) / 100,
    employeeCount: summaries.filter(s => s.totalHours > 0).length
  };
}

/**
 * Excel export için veri hazırlar
 * @param summaries Çalışan özetleri
 * @param monthYear Ay/Yıl bilgisi (örn: "Eylül 2025")
 * @param shopName Mağaza adı
 */
export function prepareExcelData(
  summaries: EmployeeMonthlySummary[], 
  monthYear: string,
  shopName: string
) {
  const grandTotal = calculateGrandTotal(summaries);

  // Başlık satırları
  const headers = [
    ['Vardiya Çizelgesi Aylık Raporu'],
    [shopName],
    [monthYear],
    [''],
    ['Çalışan Adı', 'Toplam Saat', 'Saatlik Ücret (₺)', 'Toplam Tutar (₺)']
  ];

  // Çalışan verileri
  const employeeData = summaries.map(summary => [
    summary.employee.fullName,
    summary.totalHours.toFixed(2),
    summary.employee.hourlyRate.toFixed(2),
    summary.totalPay.toFixed(2)
  ]);

  // Toplam satırı
  const totalRow = [
    'GENEL TOPLAM',
    grandTotal.totalHours.toFixed(2),
    grandTotal.averageHourlyRate.toFixed(2),
    grandTotal.totalPay.toFixed(2)
  ];

  return {
    data: [...headers, ...employeeData, [''], totalRow],
    grandTotal
  };
}

/**
 * Yazdırma için HTML tablosu oluşturur
 * @param summaries Çalışan özetleri
 * @param monthYear Ay/Yıl bilgisi
 * @param shopName Mağaza adı
 */
export function generatePrintHTML(
  summaries: EmployeeMonthlySummary[], 
  monthYear: string,
  shopName: string
): string {
  const grandTotal = calculateGrandTotal(summaries);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Aylık Rapor - ${monthYear}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12px; 
          margin: 20px;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 18px; 
        }
        .header h2 { 
          margin: 5px 0; 
          font-size: 16px; 
          color: #666; 
        }
        .header h3 { 
          margin: 5px 0; 
          font-size: 14px; 
          color: #888; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px; 
        }
        th, td { 
          border: 1px solid #000; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background-color: #f0f0f0; 
          font-weight: bold; 
        }
        .number { 
          text-align: right; 
        }
        .total-row { 
          font-weight: bold; 
          background-color: #f9f9f9; 
        }
        .summary { 
          margin-top: 30px; 
          padding: 15px; 
          background-color: #f5f5f5; 
          border-radius: 5px; 
        }
        .summary h4 { 
          margin: 0 0 10px 0; 
        }
        .summary-item { 
          margin: 5px 0; 
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Vardiya Çizelgesi Aylık Raporu</h1>
        <h2>${shopName}</h2>
        <h3>${monthYear}</h3>
      </div>

      <table>
        <thead>
          <tr>
            <th>Çalışan Adı</th>
            <th>Toplam Saat</th>
            <th>Saatlik Ücret (₺)</th>
            <th>Toplam Tutar (₺)</th>
          </tr>
        </thead>
        <tbody>
          ${summaries.map(summary => `
            <tr>
              <td>${summary.employee.fullName}</td>
              <td class="number">${summary.totalHours.toFixed(2)}</td>
              <td class="number">${summary.employee.hourlyRate.toFixed(2)}</td>
              <td class="number">${summary.totalPay.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td><strong>GENEL TOPLAM</strong></td>
            <td class="number"><strong>${grandTotal.totalHours.toFixed(2)}</strong></td>
            <td class="number"><strong>${grandTotal.averageHourlyRate.toFixed(2)}</strong></td>
            <td class="number"><strong>${grandTotal.totalPay.toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="summary">
        <h4>Özet Bilgiler</h4>
        <div class="summary-item"><strong>Toplam Çalışan Sayısı:</strong> ${grandTotal.employeeCount}</div>
        <div class="summary-item"><strong>Toplam Çalışma Saati:</strong> ${grandTotal.totalHours.toFixed(2)} saat</div>
        <div class="summary-item"><strong>Toplam Maaş Tutarı:</strong> ₺${grandTotal.totalPay.toFixed(2)}</div>
        <div class="summary-item"><strong>Ortalama Saatlik Ücret:</strong> ₺${grandTotal.averageHourlyRate.toFixed(2)}</div>
      </div>

      <div style="margin-top: 50px; text-align: center; color: #666; font-size: 10px;">
        Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}
      </div>
    </body>
    </html>
  `;
}

