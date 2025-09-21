import React, { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Shift, Employee, ShiftFormData, LeaveType, LEAVE_TYPE_LABELS } from '../types';
import { hoursWorked, isValidTime, isValidDate, getTodayString } from '../utils/time';

interface ShiftFormProps {
  shift: Shift | null;
  employees: Employee[];
  onClose: () => void;
  shopId: string;
  initialDate?: string;
}

const ShiftForm: React.FC<ShiftFormProps> = ({ 
  shift, 
  employees, 
  onClose, 
  shopId, 
  initialDate 
}) => {
  const [formData, setFormData] = useState<ShiftFormData>({
    employeeId: '',
    date: initialDate || getTodayString(),
    start: '09:00',
    end: '17:00',
    breakMin: 0,
    notes: '',
    isLeave: false,
    leaveType: undefined
  });
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Aktif çalışanları filtrele
  const activeEmployees = employees.filter(emp => emp.active);

  useEffect(() => {
    if (shift) {
      setFormData({
        employeeId: shift.employeeId,
        date: shift.date.toDate().toISOString().split('T')[0],
        start: shift.start,
        end: shift.end,
        breakMin: shift.breakMin,
        notes: shift.notes || '',
        isLeave: shift.isLeave || false,
        leaveType: shift.leaveType
      });
    }
  }, [shift]);

  // Saat hesaplamasını güncelle
  useEffect(() => {
    if (formData.isLeave) {
      setCalculatedHours(0);
    } else if (formData.start && formData.end) {
      const hours = hoursWorked(formData.start, formData.end, formData.breakMin);
      setCalculatedHours(hours);
    }
  }, [formData.start, formData.end, formData.breakMin, formData.isLeave]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Form doğrulaması
    if (!formData.employeeId) {
      setError('Çalışan seçimi gereklidir');
      setLoading(false);
      return;
    }

    if (!isValidDate(formData.date)) {
      setError('Geçerli bir tarih giriniz');
      setLoading(false);
      return;
    }

    // İzin kontrolü
    if (formData.isLeave) {
      if (!formData.leaveType) {
        setError('İzin türü seçimi gereklidir');
        setLoading(false);
        return;
      }
    } else {
      // Normal vardiya kontrolü
      if (!isValidTime(formData.start) || !isValidTime(formData.end)) {
        setError('Geçerli saat formatı giriniz (HH:mm)');
        setLoading(false);
        return;
      }

      if (formData.breakMin < 0) {
        setError('Mola süresi negatif olamaz');
        setLoading(false);
        return;
      }

      if (calculatedHours <= 0) {
        setError('Çalışma süresi 0\'dan büyük olmalıdır');
        setLoading(false);
        return;
      }
    }

    try {
      const shiftData: any = {
        employeeId: formData.employeeId,
        date: Timestamp.fromDate(new Date(formData.date + 'T00:00:00')),
        start: formData.isLeave ? '' : formData.start,
        end: formData.isLeave ? '' : formData.end,
        breakMin: formData.isLeave ? 0 : formData.breakMin,
        totalHours: calculatedHours,
        notes: formData.notes?.trim() || '',
        isLeave: formData.isLeave || false,
        updatedAt: new Date()
      };

      // Only add leaveType field if it's a leave entry
      if (formData.isLeave && formData.leaveType) {
        shiftData.leaveType = formData.leaveType;
      } else if (!formData.isLeave) {
        // If switching from leave to shift, explicitly remove leaveType
        shiftData.leaveType = null;
      }

      if (shift) {
        // Güncelleme
        const shiftRef = doc(db, 'shops', shopId, 'shifts', shift.id);
        await updateDoc(shiftRef, shiftData);
      } else {
        // Yeni ekleme
        const shiftRef = doc(collection(db, 'shops', shopId, 'shifts'));
        await setDoc(shiftRef, {
          ...shiftData,
          createdAt: new Date()
        });
      }

      onClose();
    } catch (error) {
      console.error('Vardiya kaydetme hatası:', error);
      setError('Vardiya kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {shift ? 
              (shift.isLeave ? 'İzni Düzenle' : 'Vardiyayı Düzenle') : 
              'Yeni Kayıt'
            }
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
              Çalışan *
            </label>
            <select
              id="employeeId"
              className="input-field"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              required
            >
              <option value="">Çalışan seçiniz</option>
              {activeEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Tarih *
            </label>
            <input
              type="date"
              id="date"
              className="input-field"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* İzin/Vardiya seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kayıt Türü *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recordType"
                  value="shift"
                  checked={!formData.isLeave}
                  onChange={() => setFormData({ 
                    ...formData, 
                    isLeave: false, 
                    leaveType: undefined,
                    start: '09:00',
                    end: '17:00',
                    breakMin: 0
                  })}
                  className="mr-2"
                />
                Vardiya
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recordType"
                  value="leave"
                  checked={formData.isLeave}
                  onChange={() => setFormData({ 
                    ...formData, 
                    isLeave: true,
                    start: '',
                    end: '',
                    breakMin: 0
                  })}
                  className="mr-2"
                />
                İzin
              </label>
            </div>
          </div>

          {/* İzin türü seçimi */}
          {formData.isLeave && (
            <div>
              <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
                İzin Türü *
              </label>
              <select
                id="leaveType"
                className="input-field"
                value={formData.leaveType || ''}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as LeaveType })}
                required
              >
                <option value="">İzin türü seçiniz</option>
                {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Vardiya saatleri - sadece izin değilse göster */}
          {!formData.isLeave && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-1">
                    Başlangıç Saati *
                  </label>
                  <input
                    type="time"
                    id="start"
                    className="input-field"
                    value={formData.start}
                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-1">
                    Bitiş Saati *
                  </label>
                  <input
                    type="time"
                    id="end"
                    className="input-field"
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    00:00 = 24:00 (gece yarısı) olarak kabul edilir
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="breakMin" className="block text-sm font-medium text-gray-700 mb-1">
                  Mola Süresi (dakika)
                </label>
                <select
                  id="breakMin"
                  className="input-field"
                  value={formData.breakMin}
                  onChange={(e) => setFormData({ ...formData, breakMin: Number(e.target.value) })}
                >
                  <option value={0}>Mola yok</option>
                  <option value={15}>15 dakika</option>
                  <option value={30}>30 dakika</option>
                  <option value={45}>45 dakika</option>
                  <option value={60}>1 saat</option>
                  <option value={90}>1.5 saat</option>
                  <option value={120}>2 saat</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              id="notes"
              className="input-field"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="İsteğe bağlı notlar..."
            />
          </div>

          {/* Hesaplanan saat gösterimi */}
          <div className="bg-gray-50 p-3 rounded-lg">
            {formData.isLeave ? (
              <>
                <div className="text-sm text-gray-600">İzin Türü:</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formData.leaveType ? LEAVE_TYPE_LABELS[formData.leaveType] : 'İzin türü seçilmedi'}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-gray-600">Toplam Çalışma Saati:</div>
                <div className="text-lg font-semibold text-gray-900">
                  {calculatedHours.toFixed(2)} saat
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                shift ? 'Güncelle' : 'Kaydet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftForm;

