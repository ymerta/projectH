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
  const [isMobile, setIsMobile] = useState(false);

  const shopId = `shop_${auth.currentUser?.uid}`;

  // Mobil cihaz kontrolü
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleDateClick = (clickInfo: any) => {
    // Mobilde date click için alternatif
    if (isMobile) {
      const selectedDate = clickInfo.dateStr;
      setSelectedDate(selectedDate);
      setSelectedShift(null);
      setShowForm(true);
    }
  };

  const handleAddShift = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
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
      {/* Mobil için vardiya ekleme butonu */}
      {isMobile && (
        <div className="bg-white rounded-lg p-4">
          <button
            onClick={handleAddShift}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span className="text-lg">+</span>
            <span>Yeni Vardiya Ekle</span>
          </button>
        </div>
      )}

      {/* Takvim */}
      <div className="bg-white rounded-lg p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={isMobile ? {
            left: 'prev,next',
            center: 'title',
            right: 'today'
          } : {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
          }}
          initialView="dayGridMonth"
          locale="tr"
          firstDay={1} // Pazartesi
          height={isMobile ? 400 : "auto"}
          events={events}
          selectable={!isMobile}
          selectMirror={true}
          dayMaxEvents={isMobile ? 2 : true}
          weekends={true}
          select={handleDateSelect}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDisplay="block"
          displayEventTime={!isMobile}
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
          moreLinkText="daha fazla"
          dayHeaderContent={isMobile ? (args) => {
            const day = args.date.toLocaleDateString('tr-TR', { weekday: 'short' });
            return day.charAt(0).toUpperCase() + day.slice(1);
          } : undefined}
        />
      </div>

      {/* Açıklama */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p><strong>Kullanım:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {isMobile ? (
            <>
              <li>Yeni vardiya eklemek için yukarıdaki "Yeni Vardiya Ekle" butonunu kullanın</li>
              <li>Mevcut vardiyayı düzenlemek için vardiya üzerine tıklayın</li>
              <li>Tarihe tıklayarak o güne vardiya ekleyebilirsiniz</li>
            </>
          ) : (
            <>
              <li>Yeni vardiya eklemek için takvimde bir tarihe tıklayın</li>
              <li>Mevcut vardiyayı düzenlemek için vardiya üzerine tıklayın</li>
              <li>Haftalık görünüm için sağ üstteki "Hafta" butonunu kullanın</li>
            </>
          )}
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

