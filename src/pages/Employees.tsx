import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Employee } from '../types';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeList from '../components/EmployeeList';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const shopId = `shop_${auth.currentUser?.uid}`;

  useEffect(() => {
    if (!auth.currentUser) return;

    const employeesQuery = query(collection(db, 'shops', shopId, 'employees'));

    const unsubscribe = onSnapshot(employeesQuery, (snapshot) => {
      const employeeList: Employee[] = [];
      snapshot.forEach((doc) => {
        employeeList.push({ id: doc.id, ...doc.data() } as Employee);
      });
      
      // İsme göre sırala
      employeeList.sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));
      
      setEmployees(employeeList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shopId]);

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Bu çalışanı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'shops', shopId, 'employees', employeeId));
    } catch (error) {
      console.error('Çalışan silme hatası:', error);
      alert('Çalışan silinirken bir hata oluştu.');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEmployee(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Çalışanlar</h1>
          <p className="text-gray-600">Çalışan bilgilerini yönetin</p>
        </div>
        <button
          onClick={handleAddEmployee}
          className="btn-primary"
        >
          + Yeni Çalışan
        </button>
      </div>

      {/* Çalışan listesi */}
      <div className="card">
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz çalışan eklenmemiş
            </h3>
            <p className="text-gray-600 mb-4">
              İlk çalışanınızı ekleyerek başlayın
            </p>
            <button
              onClick={handleAddEmployee}
              className="btn-primary"
            >
              Çalışan Ekle
            </button>
          </div>
        ) : (
          <EmployeeList
            employees={employees}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
          />
        )}
      </div>

      {/* Çalışan formu modal */}
      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          onClose={handleFormClose}
          shopId={shopId}
        />
      )}
    </div>
  );
};

export default Employees;

