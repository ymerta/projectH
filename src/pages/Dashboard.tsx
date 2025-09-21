import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Shift, Employee } from '../types';
import ScheduleView from '../components/ScheduleView';
import { formatDate, getTodayString } from '../utils/time';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayShifts: 0,
    weeklyHours: 0,
    monthlyHours: 0,
    activeEmployees: 0
  });

  const shopId = `shop_${auth.currentUser?.uid}`;

  useEffect(() => {
    if (!auth.currentUser) return;

    // Çalışanları dinle
    const employeesQuery = query(
      collection(db, 'shops', shopId, 'employees'),
      where('active', '==', true)
    );

    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const employeeList: Employee[] = [];
      snapshot.forEach((doc) => {
        employeeList.push({ id: doc.id, ...doc.data() } as Employee);
      });
      setEmployees(employeeList);
    });

    // Bu ayın vardiyalarını dinle
    const startOfMonth = dayjs().startOf('month').toDate();
    const endOfMonth = dayjs().endOf('month').toDate();

    const shiftsQuery = query(
      collection(db, 'shops', shopId, 'shifts'),
      where('date', '>=', Timestamp.fromDate(startOfMonth)),
      where('date', '<=', Timestamp.fromDate(endOfMonth)),
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

    return () => {
      unsubscribeEmployees();
      unsubscribeShifts();
    };
  }, [shopId]);

  useEffect(() => {
    // İstatistikleri hesapla
    const today = getTodayString();
    const startOfWeek = dayjs().startOf('week').toDate();
    const startOfMonth = dayjs().startOf('month').toDate();

    const todayShifts = shifts.filter(shift => 
      formatDate(shift.date.toDate(), 'YYYY-MM-DD') === today
    ).length;

    const weeklyHours = shifts
      .filter(shift => shift.date.toDate() >= startOfWeek && !shift.isLeave)
      .reduce((sum, shift) => sum + shift.totalHours, 0);

    const monthlyHours = shifts
      .filter(shift => shift.date.toDate() >= startOfMonth && !shift.isLeave)
      .reduce((sum, shift) => sum + shift.totalHours, 0);

    setStats({
      todayShifts,
      weeklyHours: Math.round(weeklyHours * 100) / 100,
      monthlyHours: Math.round(monthlyHours * 100) / 100,
      activeEmployees: employees.length
    });
  }, [shifts, employees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ana Sayfa</h1>
        <p className="text-gray-600">Vardiya çizelgesi ve hızlı özet</p>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bugünkü Vardiyalar</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayShifts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">⏰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Haftalık Saat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.weeklyHours}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aylık Saat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlyHours}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aktif Çalışan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeEmployees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Takvim görünümü */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vardiya Çizelgesi</h2>
        <ScheduleView shifts={shifts} employees={employees} />
      </div>
    </div>
  );
};

export default Dashboard;
