import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Pill, FileText, TrendingUp, Users, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import DrugInteractionAlerts from './DrugInteractionAlerts';

export default function Dashboard() {
  const { user } = useApp();

  if (user?.role === 'patient') {
    return <PatientDashboard />;
  } else if (user?.role === 'doctor') {
    return <DoctorDashboard />;
  } else {
    return <AdminDashboard />;
  }
}

function PatientDashboard() {
  const [stats, setStats] = useState([
    { label: 'Active Medications', value: '...', icon: Pill, color: 'blue' },
    { label: 'Known Allergies', value: '...', icon: AlertTriangle, color: 'amber' },
    { label: 'Medical Records', value: '...', icon: FileText, color: 'purple' },
    { label: 'Risk Alerts', value: '...', icon: Activity, color: 'red' },
  ]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [prescriptionsData, recordsData, interactionsData] = await Promise.all([
        apiClient.get<any[]>('/prescriptions?status=ACTIVE').catch(() => []),
        apiClient.get<any[]>('/records').catch(() => []),
        apiClient.get<any[]>('/drug-interactions/history').catch(() => []),
      ]);

      setPrescriptions(prescriptionsData);

      const criticalInteractions = interactionsData.filter(
        (i: any) => i.severity === 'CRITICAL' || i.severity === 'SEVERE'
      );

      setStats([
        { label: 'Active Medications', value: prescriptionsData.length.toString(), icon: Pill, color: 'blue' },
        { label: 'Known Allergies', value: '0', icon: AlertTriangle, color: 'amber' },
        { label: 'Medical Records', value: recordsData.length.toString(), icon: FileText, color: 'purple' },
        { label: 'Risk Alerts', value: criticalInteractions.length.toString(), icon: Activity, color: 'red' },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
        <p className="text-gray-600">Here's your health overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass rounded-2xl p-6 glow-soft hover:scale-[1.02] transition">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl gradient-${stat.color === 'blue' ? 'blue-purple' : 'primary'} flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DrugInteractionAlerts />

        <div className="glass rounded-2xl p-6 glow-soft">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Active Medications</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active medications</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="bg-white/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {prescription.drugName} {prescription.dosage}
                      </p>
                      <p className="text-sm text-gray-600">{prescription.frequency}</p>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                      {prescription.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DoctorDashboard() {
  const stats = [
    { label: 'Total Patients', value: '127', icon: Users, color: 'blue' },
    { label: 'Active Cases', value: '23', icon: Activity, color: 'purple' },
    { label: 'Pending Reviews', value: '8', icon: FileText, color: 'amber' },
    { label: 'Critical Alerts', value: '3', icon: AlertTriangle, color: 'red' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Doctor Dashboard</h2>
        <p className="text-gray-600">Manage your patients and cases</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass rounded-2xl p-6 glow-soft hover:scale-[1.02] transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl gradient-blue-purple flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-6 glow-soft">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Patient Activity</h3>
        <p className="text-gray-600">Patient management features coming soon...</p>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const stats = [
    { label: 'Total Users', value: '1,234', icon: Users, color: 'blue' },
    { label: 'Active Sessions', value: '456', icon: Activity, color: 'green' },
    { label: 'System Health', value: '98%', icon: TrendingUp, color: 'purple' },
    { label: 'Pending Issues', value: '12', icon: AlertTriangle, color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h2>
        <p className="text-gray-600">System overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass rounded-2xl p-6 glow-soft hover:scale-[1.02] transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl gradient-blue-purple flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-6 glow-soft">
        <h3 className="text-xl font-bold text-gray-800 mb-4">System Analytics</h3>
        <p className="text-gray-600">Analytics dashboard coming soon...</p>
      </div>
    </div>
  );
}
