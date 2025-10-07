import {
  LayoutDashboard,
  FileText,
  AlertCircle,
  Pill,
  Bell,
  Stethoscope,
  User,
  LogOut,
  Heart,
  ShieldAlert,
  History,
  BarChart3
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useApp();

  const patientMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'allergies', label: 'Allergy Detection', icon: AlertCircle },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'drug-interactions', label: 'Drug Interactions', icon: ShieldAlert },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'interaction-history', label: 'Interaction History', icon: History },
    { id: 'risk', label: 'Risk Dashboard', icon: Stethoscope },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const doctorMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: User },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'drug-interactions', label: 'Drug Interactions', icon: ShieldAlert },
    { id: 'interaction-history', label: 'Interaction History', icon: History },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'treatments', label: 'Treatments', icon: Stethoscope },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: User },
    { id: 'analytics', label: 'Drug Analytics', icon: BarChart3 },
    { id: 'interaction-history', label: 'All Interactions', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const menuItems =
    user?.role === 'doctor' ? doctorMenuItems :
    user?.role === 'admin' ? adminMenuItems :
    patientMenuItems;

  return (
    <div className="w-72 h-screen glass border-r border-white/30 flex flex-col">
      <div className="p-6 border-b border-white/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-blue-purple flex items-center justify-center glow-blue">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">NeoCure</h1>
            <p className="text-xs text-gray-600">Healing Safely</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'gradient-blue-purple text-white glow-blue'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-white/30">
        <div className="glass-dark rounded-xl p-4 mb-3">
          <p className="text-sm font-semibold text-gray-800">{user?.fullName}</p>
          <p className="text-xs text-gray-600">{user?.email}</p>
          <p className="text-xs text-gray-500 mt-1 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
