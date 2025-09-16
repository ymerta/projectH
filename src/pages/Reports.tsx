import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Shift, Employee, EmployeeMonthlySummary } from '../types';
import { getMonthRange, formatDate } from '../utils/time';
import { calculateMonthlySummary, calculateGrandTotal, prepareExcelData } from '../report/monthly';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const Reports: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [summaries, setSummaries] = useState<EmployeeMonthlySummary[]>([]);
  
  const printRef = useRef<HTMLDivElement>(null);
  const shopId = `shop_${auth.currentUser?.uid}`;
  const shopName = import.meta.env.VITE_SHOP_NAME || 'Mağaza';

  // Yazdırma fonksiyonu
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Aylık Rapor - ${formatDate(new Date(selectedMonth + '-01'), 'MMMM YYYY')}`,
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    // Çalışanları dinle
    const employeesQuery = query(collection(db, 'shops', shopId, 'employees'));
    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const employeeList: Employee[] = [];
      snapshot.forEach((doc) => {
        employeeList.push({ id: doc.id, ...doc.data() } as Employee);
      });
      setEmployees(employeeList);
    });

    return () => unsubscribeEmployees();
  }, [shopId]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Seçili ayın vardiyalarını dinle
    const [year, month] = selectedMonth.split('-').map(Number);
    const { start, end } = getMonthRange(year, month);

    const shiftsQuery = query(
      collection(db, 'shops', shopId, 'shifts'),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
      orderBy('date', 'asc')
    );

    const unsubscribeShifts = onSnapshot(shiftsQuery, (snapshot) => {
      const shiftList: Shift[] = [];
      snapshot.forEach((doc) => {
        shiftList.push({ id: doc.id, ...doc.data() } as Shift);
      });
      setShifts(shiftList);
      setLoading(false);
    });

    return () => unsubscribeShifts();
  }, [shopId, selectedMonth]);

  useEffect(() => {
    // Özetleri hesapla
    const monthlySummaries = calculateMonthlySummary(shifts, employees);
    setSummaries(monthlySummaries);
  }, [shifts, employees]);

  const handleExcelExport = () => {
    const monthYear = formatDate(new Date(selectedMonth + '-01'), 'MMMM YYYY');
    const { data } = prepareExcelData(summaries, monthYear, shopName);

    // Workbook oluştur
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Sütun genişlikleri
    ws['!cols'] = [
      { width: 25 }, // Çalışan Adı
      { width: 15 }, // Toplam Saat
      { width: 18 }, // Saatlik Ücret
      { width: 18 }  // Toplam Tutar
    ];

    // Stil ayarları (basit)
    // const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Başlık satırlarını kalın yap
    for (let R = 0; R <= 4; R++) {
      for (let C = 0; C <= 3; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress]) {
          if (!ws[cellAddress].s) ws[cellAddress].s = {};
          ws[cellAddress].s.font = { bold: true };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Aylık Rapor');
    
    const fileName = `Aylik_Rapor_${selectedMonth}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const grandTotal = calculateGrandTotal(summaries);
  const monthYear = formatDate(new Date(selectedMonth + '-01'), 'MMMM YYYY');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve eylemler */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aylık Raporlar</h1>
          <p className="text-gray-600">Çalışan bazında aylık saat ve maaş raporları</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExcelExport}
            className="btn-secondary"
            disabled={summaries.length === 0}
          >
            📊 Excel İndir
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary"
            disabled={summaries.length === 0}
          >
            🖨️ Yazdır
          </button>
        </div>
      </div>

      {/* Ay seçimi */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Rapor Dönemi
            </label>
            <input
              type="month"
              id="month"
              className="input-field"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Seçili Dönem</div>
            <div className="text-lg font-semibold text-gray-900">{monthYear}</div>
          </div>
        </div>
      </div>

      {/* Rapor içeriği */}
      <div className="card">
        {summaries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Rapor verisi bulunamadı
            </h3>
            <p className="text-gray-600">
              Seçili dönem için vardiya kaydı bulunmuyor
            </p>
          </div>
        ) : (
          <div ref={printRef}>
            {/* Yazdırma başlığı */}
            <div className="print-only hidden text-center mb-6">
              <h1 className="text-xl font-bold">Vardiya Çizelgesi Aylık Raporu</h1>
              <h2 className="text-lg text-gray-600">{shopName}</h2>
              <h3 className="text-md text-gray-500">{monthYear}</h3>
            </div>

            {/* Özet kartları */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {grandTotal.employeeCount}
                </div>
                <div className="text-sm text-blue-800">Çalışan Sayısı</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {grandTotal.totalHours.toFixed(2)}
                </div>
                <div className="text-sm text-green-800">Toplam Saat</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ₺{grandTotal.averageHourlyRate.toFixed(2)}
                </div>
                <div className="text-sm text-purple-800">Ort. Saatlik Ücret</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  ₺{grandTotal.totalPay.toFixed(2)}
                </div>
                <div className="text-sm text-orange-800">Toplam Maaş</div>
              </div>
            </div>

            {/* Detay tablosu */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Çalışan Adı
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Toplam Saat
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saatlik Ücret (₺)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Toplam Tutar (₺)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaries.map((summary) => (
                    <tr key={summary.employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {summary.employee.fullName}
                          </div>
                          {!summary.employee.active && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Pasif
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">
                          {summary.totalHours.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">
                          {summary.employee.hourlyRate.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {summary.totalPay.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Toplam satırı */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        GENEL TOPLAM
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {grandTotal.totalHours.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {grandTotal.averageHourlyRate.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {grandTotal.totalPay.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Yazdırma için özet */}
            <div className="print-only hidden mt-8 p-4 bg-gray-50 rounded">
              <h4 className="font-bold mb-2">Özet Bilgiler</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Toplam Çalışan:</strong> {grandTotal.employeeCount}</div>
                <div><strong>Toplam Saat:</strong> {grandTotal.totalHours.toFixed(2)}</div>
                <div><strong>Ortalama Saatlik Ücret:</strong> ₺{grandTotal.averageHourlyRate.toFixed(2)}</div>
                <div><strong>Toplam Maaş:</strong> ₺{grandTotal.totalPay.toFixed(2)}</div>
              </div>
              <div className="mt-4 text-xs text-gray-500 text-center">
                Rapor Tarihi: {formatDate(new Date(), 'DD/MM/YYYY HH:mm')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;

