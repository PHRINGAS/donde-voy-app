import React, { useState, useEffect, useRef } from 'react';
import { Bell, Plus, Trash2, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Reminder {
  id: string;
  feriaId: string;
  feriaNombre: string;
  dateTime: string;
  message: string;
  active: boolean;
}

const ReminderSystem: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFeria, setSelectedFeria] = useState<string>('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Usar localStorage para persistir recordatorios
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('feriando-reminders', []);

  const { ferias } = useApp();

  // Timers vivos: se limpian y re-programan cuando cambian los recordatorios
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones');
      return;
    }

    setIsRequestingPermission(true);

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        toast.success('¡Notificaciones activadas! Ya puedes recibir recordatorios de Feriando', {
          duration: 5000
        });
      } else if (permission === 'denied') {
        toast.error('Notificaciones bloqueadas. Para activarlas ve a la configuración de tu navegador', {
          duration: 8000
        });
      } else {
        toast.warning('Permisos de notificación pendientes');
      }
    } catch {
      toast.error('Error al solicitar permisos de notificación');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const showNotification = (reminder: Reminder) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification('Feriando - Recordatorio', {
          body: reminder.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: reminder.id
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 10000);
      } catch (error) {
        console.error('Error al mostrar notificación:', error);
      }
    }

    toast.success(reminder.message, { duration: 10000 });
  };

  // Programa (y dispara si ya vencieron) todos los recordatorios activos.
  // Se re-ejecuta al montar y ante cada cambio => sobrevive recargas.
  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const now = Date.now();

    reminders.filter(r => r.active).forEach(reminder => {
      const delay = new Date(reminder.dateTime).getTime() - now;

      if (delay <= 0) {
        // Venció sin dispararse (ej. la app estaba cerrada)
        showNotification(reminder);
        setReminders(prev =>
          prev.map(r => (r.id === reminder.id ? { ...r, active: false } : r))
        );
      } else {
        const timer = setTimeout(() => {
          showNotification(reminder);
          setReminders(prev =>
            prev.map(r => (r.id === reminder.id ? { ...r, active: false } : r))
          );
        }, delay);
        timersRef.current.push(timer);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders]);

  const addReminder = () => {
    if (!selectedFeria || !reminderDate || !reminderTime) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const feria = ferias.find(f => f.id === selectedFeria);
    if (!feria) return;

    const dateTime = `${reminderDate}T${reminderTime}`;
    const reminderDateTime = new Date(dateTime);

    if (Number.isNaN(reminderDateTime.getTime()) || reminderDateTime <= new Date()) {
      toast.error('La fecha y hora debe ser futura');
      return;
    }

    const newReminder: Reminder = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      feriaId: selectedFeria,
      feriaNombre: feria.nombre,
      dateTime: dateTime,
      message: customMessage || `¡Recordatorio de Feriando! ${feria.nombre} estará disponible pronto`,
      active: true
    };

    setReminders(prev => [...prev, newReminder]);

    toast.success('Recordatorio creado exitosamente');
    resetForm();
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    toast.success('Recordatorio eliminado');
  };

  const resetForm = () => {
    setSelectedFeria('');
    setReminderDate('');
    setReminderTime('');
    setCustomMessage('');
    setShowAddForm(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Bell size={20} />
          Recordatorios
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {/* Estado de permisos simplificado */}
      {notificationPermission !== 'granted' && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertCircle size={20} className="text-orange-600 mt-0.5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-800 mb-1">
                Activa las notificaciones de Feriando
              </h3>
              <p className="text-xs text-orange-700 mb-3">
                Permite que Feriando te envíe recordatorios de tus ferias favoritas
              </p>
              <button
                onClick={requestNotificationPermission}
                disabled={isRequestingPermission}
                className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Bell size={14} />
                {isRequestingPermission ? 'Activando...' : 'Permitir Notificaciones'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario para agregar recordatorio */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-800">Nuevo Recordatorio</h3>

          <div>
            <label htmlFor="reminder-feria" className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Feria
            </label>
            <select
              id="reminder-feria"
              value={selectedFeria}
              onChange={(e) => setSelectedFeria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Selecciona una feria...</option>
              {ferias.map(feria => (
                <option key={feria.id} value={feria.id}>
                  {feria.nombre} - {feria.direccion}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reminder-date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                id="reminder-date"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="reminder-time" className="block text-sm font-medium text-gray-700 mb-1">
                Hora
              </label>
              <input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reminder-message" className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje personalizado (opcional)
            </label>
            <textarea
              id="reminder-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Escribe un mensaje personalizado para el recordatorio..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={addReminder}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              Crear Recordatorio
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de recordatorios */}
      <div className="space-y-3">
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No tienes recordatorios programados</p>
            <p className="text-sm">Agrega uno para no perderte ninguna feria</p>
          </div>
        ) : (
          reminders.map(reminder => (
            <div
              key={reminder.id}
              className={`bg-white border rounded-lg p-4 ${
                reminder.active ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {reminder.feriaNombre}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {reminder.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>
                      📅 {new Date(reminder.dateTime).toLocaleDateString('es-AR')}
                    </span>
                    <span>
                      🕒 {new Date(reminder.dateTime).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className={`px-2 py-1 rounded-full ${
                      reminder.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {reminder.active ? 'Activo' : 'Ejecutado'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteReminder(reminder.id)}
                  aria-label={`Eliminar recordatorio de ${reminder.feriaNombre}`}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReminderSystem;
