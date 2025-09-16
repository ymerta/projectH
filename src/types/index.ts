import { Timestamp } from 'firebase/firestore';

// Mağaza tipi
export interface Shop {
  id: string;
  ownerUid: string;
  name: string;
}

// Çalışan tipi
export interface Employee {
  id: string;
  fullName: string;
  hourlyRate: number;
  active: boolean;
}

// Vardiya tipi
export interface Shift {
  id: string;
  employeeId: string;
  date: Timestamp;
  start: string; // "HH:mm" formatında
  end: string;   // "HH:mm" formatında
  breakMin: number;
  totalHours: number;
  notes?: string;
}

// Aylık özet tipi
export interface MonthlyTimesheet {
  employeeId: string;
  totalHours: number;
  totalPay: number;
  lastUpdated: Timestamp;
}

// Rapor için çalışan özeti
export interface EmployeeMonthlySummary {
  employee: Employee;
  totalHours: number;
  totalPay: number;
}

// Form verileri için tipler
export interface ShiftFormData {
  employeeId: string;
  date: string; // YYYY-MM-DD formatında
  start: string;
  end: string;
  breakMin: number;
  notes?: string;
}

export interface EmployeeFormData {
  fullName: string;
  hourlyRate: number;
  active: boolean;
}

