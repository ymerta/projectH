import React, { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Employee, EmployeeFormData } from '../types';

interface EmployeeFormProps {
  employee: Employee | null;
  onClose: () => void;
  shopId: string;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onClose, shopId }) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    fullName: '',
    hourlyRate: 150,
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.fullName,
        hourlyRate: employee.hourlyRate,
        active: employee.active
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Form doğrulaması
    if (!formData.fullName.trim()) {
      setError('Çalışan adı gereklidir');
      setLoading(false);
      return;
    }

    if (formData.hourlyRate <= 0) {
      setError('Saatlik ücret 0\'dan büyük olmalıdır');
      setLoading(false);
      return;
    }

    try {
      if (employee) {
        // Güncelleme
        const employeeRef = doc(db, 'shops', shopId, 'employees', employee.id);
        await updateDoc(employeeRef, {
          fullName: formData.fullName.trim(),
          hourlyRate: formData.hourlyRate,
          active: formData.active,
          updatedAt: new Date()
        });
      } else {
        // Yeni ekleme
        const employeeRef = doc(collection(db, 'shops', shopId, 'employees'));
        await setDoc(employeeRef, {
          fullName: formData.fullName.trim(),
          hourlyRate: formData.hourlyRate,
          active: formData.active,
          createdAt: new Date()
        });
      }

      onClose();
    } catch (error) {
      console.error('Çalışan kaydetme hatası:', error);
      setError('Çalışan kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {employee ? 'Çalışanı Düzenle' : 'Yeni Çalışan'}
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
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Çalışan Adı *
            </label>
            <input
              type="text"
              id="fullName"
              className="input-field"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Örn: Mustafa (1)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Aynı isimli çalışanlar için (1), (2) gibi ayırt edici ekleyebilirsiniz
            </p>
          </div>

          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
              Saatlik Ücret (₺) *
            </label>
            <input
              type="number"
              id="hourlyRate"
              className="input-field"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
              Aktif çalışan
            </label>
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
                employee ? 'Güncelle' : 'Kaydet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;

