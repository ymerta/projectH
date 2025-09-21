import { Timestamp } from 'firebase/firestore';

// İzin türleri
export enum LeaveType {
  ANNUAL = 'annual',        // Yıllık izin
  UNPAID = 'unpaid',        // Ücretsiz izin
  WEEKLY = 'weekly',        // Haftalık izin
  EXCUSE = 'excuse',        // Mazeret izni
  MEDICAL = 'medical'       // Rapor
}

// İzin türü etiketleri
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  [LeaveType.ANNUAL]: 'Yıllık İzin',
  [LeaveType.UNPAID]: 'Ücretsiz İzin',
  [LeaveType.WEEKLY]: 'Haftalık İzin',
  [LeaveType.EXCUSE]: 'Mazeret İzni',
  [LeaveType.MEDICAL]: 'Rapor'
};

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
  color: string; // Hex renk kodu, örn: "#3B82F6"
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
  isLeave?: boolean; // İzin kaydı olup olmadığı
  leaveType?: LeaveType; // İzin türü
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
  isLeave?: boolean; // İzin kaydı olup olmadığı
  leaveType?: LeaveType; // İzin türü
}

export interface EmployeeFormData {
  fullName: string;
  hourlyRate: number;
  active: boolean;
  color: string;
}

