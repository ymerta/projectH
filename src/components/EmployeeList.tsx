import React, { useState } from 'react';
import { Employee } from '../types';

interface EmployeeListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onEdit, onDelete }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredEmployees = employees.filter(employee => {
    if (filter === 'active') return employee.active;
    if (filter === 'inactive') return !employee.active;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === 'all' 
              ? 'bg-primary-100 text-primary-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tümü ({employees.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Aktif ({employees.filter(e => e.active).length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === 'inactive' 
              ? 'bg-red-100 text-red-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Pasif ({employees.filter(e => !e.active).length})
        </button>
      </div>

      {/* Çalışan listesi */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Çalışan Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saatlik Ücret
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-200 shadow-sm"
                      style={{ backgroundColor: employee.color || '#6366F1' }}
                      title={`Çalışan rengi: ${employee.color || '#6366F1'}`}
                    ></div>
                    <div className="text-sm font-medium text-gray-900">
                      {employee.fullName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ₺{employee.hourlyRate.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    employee.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(employee)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => onDelete(employee.id)}
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

      {filteredEmployees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {filter === 'all' 
            ? 'Henüz çalışan eklenmemiş' 
            : `${filter === 'active' ? 'Aktif' : 'Pasif'} çalışan bulunamadı`
          }
        </div>
      )}
    </div>
  );
};

export default EmployeeList;

