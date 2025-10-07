import { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, FileText, Pill, Clock } from 'lucide-react';
import { apiClient } from '../api/client';

interface Alert {
  id: string;
  type: 'ADR' | 'NEW_DOCUMENT' | 'CRITICAL_INTERACTION' | 'MEDICATION_REMINDER';
  patientId: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export default function AlertsNotification() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<Alert[]>('/alerts?limit=10');
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await apiClient.request(`/alerts/${alertId}/read`, {
        method: 'PATCH',
      });
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'CRITICAL_INTERACTION':
        return <AlertTriangle className="w-5 h-5" />;
      case 'NEW_DOCUMENT':
        return <FileText className="w-5 h-5" />;
      case 'MEDICATION_REMINDER':
        return <Pill className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MODERATE':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-96 glass rounded-2xl shadow-xl z-50 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading && alerts.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200/50">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 hover:bg-gray-50/50 transition cursor-pointer ${
                        !alert.read ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => !alert.read && markAsRead(alert.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${getSeverityColor(
                            alert.severity
                          )} flex items-center justify-center text-white flex-shrink-0`}
                        >
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {alert.title}
                            </h4>
                            {!alert.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {alerts.length > 0 && (
              <div className="p-3 border-t border-gray-200/50">
                <button
                  onClick={() => {
                    // Navigate to alerts page
                    setShowDropdown(false);
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
