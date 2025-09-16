import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Shift, Employee } from '../types';
import ShiftForm from './ShiftForm';
import { auth } from '../firebase';

interface ScheduleViewProps {
  shifts: Shift[];
  employees: Employee[];
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ shifts, employees }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const shopId = `shop_${auth.currentUser?.uid}`;

  // Vardiyaları FullCalendar eventlerine çevir
  const events = shifts.map(shift => {
    const employee = employees.find(emp => emp.id === shift.employeeId);
    const date = shift.date.toDate();
    // const dateStr = date.toISOString().split('T')[0];
    
    // Başlangıç ve bitiş saatlerini hesapla
    const [startHour, startMin] = shift.start.split(':').map(Number);
    const [endHour, endMin] = shift.end.split(':').map(Number);
    
    let startDateTime = new Date(date);
    startDateTime.setHours(startHour, startMin, 0, 0);
    
    let endDateTime = new Date(date);
    
    // 00:00 = 24:00 kuralı ve gece devri
    if (shift.end === '00:00') {
      endDateTime.setDate(endDateTime.getDate() + 1);
      endDateTime.setHours(0, 0, 0, 0);
    } else if (endHour < startHour) {
      // Gece devri
      endDateTime.setDate(endDateTime.getDate() + 1);
      endDateTime.setHours(endHour, endMin, 0, 0);
    } else {
      endDateTime.setHours(endHour, endMin, 0, 0);
    }

    return {
      id: shift.id,
      title: employee ? employee.fullName : 'Bilinmeyen Çalışan',
      start: startDateTime,
      end: endDateTime,
      extendedProps: {
        shift,
        employee
      }
    };
  });

  const handleDateSelect = (selectInfo: any) => {
    const selectedDate = selectInfo.startStr.split('T')[0];
    setSelectedDate(selectedDate);
    setSelectedShift(null);
    setShowForm(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const shift = clickInfo.event.extendedProps.shift;
    setSelectedShift(shift);
    setSelectedDate('');
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedShift(null);
    setSelectedDate('');
  };

  return (
    <div className="space-y-4">
      {/* Takvim */}
      <div className="bg-white rounded-lg p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
          }}
          initialView="dayGridMonth"
          locale="tr"
          firstDay={1} // Pazartesi
          height="auto"
          events={events}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDisplay="block"
          displayEventTime={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          buttonText={{
            today: 'Bugün',
            month: 'Ay',
            week: 'Hafta',
            day: 'Gün'
          }}
          noEventsText="Vardiya bulunamadı"
        />
      </div>

      {/* Açıklama */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p><strong>Kullanım:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Yeni vardiya eklemek için takvimde bir tarihe tıklayın</li>
          <li>Mevcut vardiyayı düzenlemek için vardiya üzerine tıklayın</li>
          <li>Haftalık görünüm için sağ üstteki "Hafta" butonunu kullanın</li>
        </ul>
      </div>

      {/* Vardiya formu modal */}
      {showForm && (
        <ShiftForm
          shift={selectedShift}
          employees={employees}
          onClose={handleFormClose}
          shopId={shopId}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
};

export default ScheduleView;

