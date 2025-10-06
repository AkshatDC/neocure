import { Activity, AlertTriangle, Pill, FileText, TrendingUp, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

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
  const stats = [
    { label: 'Active Medications', value: '3', icon: Pill, color: 'blue' },
    { label: 'Known Allergies', value: '2', icon: AlertTriangle, color: 'amber' },
    { label: 'Medical Records', value: '8', icon: FileText, color: 'purple' },
    { label: 'Risk Alerts', value: '1', icon: Activity, color: 'red' },
  ];

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
        <div className="glass rounded-2xl p-6 glow-soft">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Risk Assessments</h3>
          <div className="space-y-3">
            <div className="risk-red rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-red-700">Aspirin</p>
                <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                  HIGH RISK
                </span>
              </div>
              <p className="text-sm text-gray-700">Potential severe allergic reaction detected</p>
            </div>

            <div className="risk-green rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-green-700">Vitamin D3</p>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  SAFE
                </span>
              </div>
              <p className="text-sm text-gray-700">No contraindications found</p>
            </div>

            <div className="risk-amber rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-amber-700">Ibuprofen</p>
                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                  CAUTION
                </span>
              </div>
              <p className="text-sm text-gray-700">Monitor for mild side effects</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow-soft">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Upcoming Medication Reminders</h3>
          <div className="space-y-3">
            <div className="bg-white/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Lisinopril 10mg</p>
                  <p className="text-sm text-gray-600">Once daily</p>
                </div>
                <span className="text-sm font-bold text-blue-600">8:00 AM</span>
              </div>
            </div>

            <div className="bg-white/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Vitamin D3 1000 IU</p>
                  <p className="text-sm text-gray-600">Once daily</p>
                </div>
                <span className="text-sm font-bold text-blue-600">9:00 AM</span>
              </div>
            </div>

            <div className="bg-white/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Metformin 500mg</p>
                  <p className="text-sm text-gray-600">Twice daily</p>
                </div>
                <span className="text-sm font-bold text-blue-600">8:00 PM</span>
              </div>
            </div>
          </div>
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
