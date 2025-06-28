
import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Feria } from '../types';
import { toast } from 'sonner';

interface Reminder {
  id: string;
  feriaId: string;
  feriaNombre: string;
  dateTime: string;
  message: string;
  active: boolean;
}

const ReminderSystem: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFeria, setSelectedFeria] = useState<string>('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  const { ferias } = useApp();

  // Verificar permisos al cargar
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    loadReminders();
    
    // Verificar recordatorios cada minuto
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
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
        toast.error('Notificaciones bloqueadas. Para activarlas:', {
          duration: 8000,
          description: '1. Haz clic en el icono de candado en la barra de direcciones\n2. Selecciona "Permitir" para notificaciones\n3. Recarga la página'
        });
      } else {
        toast.warning('Permisos de notificación pendientes');
      }
    } catch (error) {
      toast.error('Error al solicitar permisos de notificación');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const loadReminders = () => {
    const saved = localStorage.getItem('feriando-reminders');
    if (saved) {
      setReminders(JSON.parse(saved));
    }
  };

  const saveReminders = (newReminders: Reminder[]) => {
    setReminders(newReminders);
    localStorage.setItem('feriando-reminders', JSON.stringify(newReminders));
  };

  const addReminder = () => {
    if (!selectedFeria || !reminderDate || !reminderTime) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const feria = ferias.find(f => f.id === selectedFeria);
    if (!feria) return;

    const dateTime = `${reminderDate}T${reminderTime}`;
    const reminderDateTime = new Date(dateTime);
    
    if (reminderDateTime <= new Date()) {
      toast.error('La fecha y hora debe ser futura');
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      feriaId: selectedFeria,
      feriaNombre: feria.nombre,
      dateTime: dateTime,
      message: customMessage || `¡Recordatorio de Feriando! ${feria.nombre} estará disponible pronto`,
      active: true
    };

    const updatedReminders = [...reminders, newReminder];
    saveReminders(updatedReminders);
    
    // Programar notificación
    scheduleNotification(newReminder);
    
    toast.success('Recordatorio creado exitosamente');
    resetForm();
  };

  const scheduleNotification = (reminder: Reminder) => {
    const now = new Date().getTime();
    const reminderTime = new Date(reminder.dateTime).getTime();
    const delay = reminderTime - now;

    if (delay > 0) {
      setTimeout(() => {
        showNotification(reminder);
      }, delay);
    }
  };

  const showNotification = (reminder: Reminder) => {
    if (notificationPermission === 'granted') {
      try {
        const notification = new Notification('Feriando - Recordatorio', {
          body: reminder.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: reminder.id,
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto cerrar después de 10 segundos
        setTimeout(() => notification.close(), 10000);
      } catch (error) {
        console.error('Error al mostrar notificación:', error);
      }
    }
    
    // También mostrar toast como respaldo
    toast.success(reminder.message, {
      duration: 10000,
      action: {
        label: 'Ver Feria',
        onClick: () => {
          console.log('Abrir feria:', reminder.feriaId);
        }
      }
    });
  };

  const checkReminders = () => {
    const now = new Date();
    const activeReminders = reminders.filter(r => r.active);
    
    activeReminders.forEach(reminder => {
      const reminderTime = new Date(reminder.dateTime);
      const timeDiff = reminderTime.getTime() - now.getTime();
      
      // Activar si faltan menos de 60 segundos
      if (timeDiff > 0 && timeDiff <= 60000) {
        showNotification(reminder);
        
        // Marcar como ejecutado
        const updatedReminders = reminders.map(r => 
          r.id === reminder.id ? { ...r, active: false } : r
        );
        saveReminders(updatedReminders);
      }
    });
  };

  const deleteReminder = (id: string) => {
    const updatedReminders = reminders.filter(r => r.id !== id);
    saveReminders(updatedReminders);
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

      {/* Estado de permisos mejorado */}
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
                Recibe recordatorios de tus ferias favoritas directamente en tu dispositivo
              </p>
              <button
                onClick={requestNotificationPermission}
                disabled={isRequestingPermission}
                className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Bell size={14} />
                {isRequestingPermission ? 'Activando...' : 'Activar Notificaciones'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Feria
            </label>
            <select
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje personalizado (opcional)
            </label>
            <textarea
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
                      📅 {new Date(reminder.dateTime).toLocaleDateString('es-ES')}
                    </span>
                    <span>
                      🕒 {new Date(reminder.dateTime).toLocaleTimeString('es-ES', { 
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
