import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Shift, Employee } from '../types';
import ShiftForm from '../components/ShiftForm';
import { formatDate, getMonthRange } from '../utils/time';
import dayjs from 'dayjs';

const Shifts: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  
  // Filtreler
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const shopId = `shop_${auth.currentUser?.uid}`;

  useEffect(() => {
    if (!auth.currentUser) return;

    // Çalışanları dinle
    const employeesQuery = query(collection(db, 'shops', shopId, 'employees'));
    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const employeeList: Employee[] = [];
      snapshot.forEach((doc) => {
        employeeList.push({ id: doc.id, ...doc.data() } as Employee);
      });
      employeeList.sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));
      setEmployees(employeeList);
    });

    return () => unsubscribeEmployees();
  }, [shopId]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Seçili ayın vardiyalarını dinle
    const [year, month] = selectedMonth.split('-').map(Number);
    const { start, end } = getMonthRange(year, month);

    let shiftsQuery = query(
      collection(db, 'shops', shopId, 'shifts'),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
      orderBy('date', 'desc')
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

  // Filtrelenmiş vardiyalar
  const filteredShifts = shifts.filter(shift => {
    if (selectedEmployee && shift.employeeId !== selectedEmployee) {
      return false;
    }
    return true;
  });

  const handleAddShift = () => {
    setEditingShift(null);
    setShowForm(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShowForm(true);
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Bu vardiyayı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'shops', shopId, 'shifts', shiftId));
    } catch (error) {
      console.error('Vardiya silme hatası:', error);
      alert('Vardiya silinirken bir hata oluştu.');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingShift(null);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.fullName : 'Bilinmeyen Çalışan';
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Vardiyalar</h1>
          <p className="text-gray-600">Vardiya kayıtlarını görüntüleyin ve yönetin</p>
        </div>
        <button
          onClick={handleAddShift}
          className="btn-primary"
        >
          + Yeni Vardiya
        </button>
      </div>

      {/* Filtreler */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Ay Seçimi
            </label>
            <input
              type="month"
              id="month"
              className="input-field"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
              Çalışan Filtresi
            </label>
            <select
              id="employee"
              className="input-field"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Tüm Çalışanlar</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vardiya listesi */}
      <div className="card">
        {filteredShifts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Vardiya bulunamadı
            </h3>
            <p className="text-gray-600 mb-4">
              Seçili dönem için vardiya kaydı bulunmuyor
            </p>
            <button
              onClick={handleAddShift}
              className="btn-primary"
            >
              Vardiya Ekle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Çalışan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saat Aralığı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mola
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam Saat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notlar
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(shift.date.toDate(), 'DD/MM/YYYY')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(shift.date.toDate(), 'dddd')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getEmployeeName(shift.employeeId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {shift.start} - {shift.end}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {shift.breakMin > 0 ? `${shift.breakMin} dk` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {shift.totalHours.toFixed(2)} saat
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {shift.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditShift(shift)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Özet bilgiler */}
        {filteredShifts.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredShifts.length}
                </div>
                <div className="text-sm text-gray-600">Toplam Vardiya</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredShifts.reduce((sum, shift) => sum + shift.totalHours, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Toplam Saat</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(filteredShifts.reduce((sum, shift) => sum + shift.totalHours, 0) / filteredShifts.length * 100) / 100 || 0}
                </div>
                <div className="text-sm text-gray-600">Ortalama Saat</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vardiya formu modal */}
      {showForm && (
        <ShiftForm
          shift={editingShift}
          employees={employees}
          onClose={handleFormClose}
          shopId={shopId}
        />
      )}
    </div>
  );
};

export default Shifts;

