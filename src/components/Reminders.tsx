import { Bell, Plus, Clock, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';

interface Reminder {
  id: string;
  medicationName: string;
  time: string;
  days: string[];
  enabled: boolean;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      medicationName: 'Lisinopril 10mg',
      time: '08:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      enabled: true,
    },
    {
      id: '2',
      medicationName: 'Metformin 500mg',
      time: '08:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      enabled: true,
    },
    {
      id: '3',
      medicationName: 'Metformin 500mg',
      time: '20:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      enabled: true,
    },
  ]);

  const toggleReminder = (id: string) => {
    setReminders(
      reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Medicine Reminders</h2>
          <p className="text-gray-600">Never miss your medication schedule</p>
        </div>
        <button className="px-6 py-3 rounded-xl gradient-blue-purple text-white font-semibold hover:scale-[1.02] transition glow-blue flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Reminder
        </button>
      </div>

      <div className="glass rounded-2xl p-6 glow-soft">
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`bg-white/50 rounded-xl p-6 transition ${
                !reminder.enabled ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-blue-purple flex items-center justify-center">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{reminder.medicationName}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{reminder.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleReminder(reminder.id)}
                  className="text-gray-600 hover:text-gray-800 transition"
                >
                  {reminder.enabled ? (
                    <ToggleRight className="w-10 h-10 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-400" />
                  )}
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Repeat on:</span>
                </div>
                <div className="flex gap-2">
                  {reminder.days.map((day) => (
                    <span
                      key={day}
                      className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 glow-soft">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Notification Settings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-800">Push Notifications</p>
              <p className="text-sm text-gray-600">Receive alerts on your device</p>
            </div>
            <ToggleRight className="w-10 h-10 text-blue-600" />
          </div>
          <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-800">Email Reminders</p>
              <p className="text-sm text-gray-600">Get reminders via email</p>
            </div>
            <ToggleRight className="w-10 h-10 text-blue-600" />
          </div>
          <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-800">SMS Alerts</p>
              <p className="text-sm text-gray-600">Text message notifications</p>
            </div>
            <ToggleLeft className="w-10 h-10 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
