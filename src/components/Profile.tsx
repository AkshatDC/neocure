import { User, Mail, Phone, Calendar, Shield, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { user, theme, setTheme } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Profile Settings</h2>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="glass rounded-2xl p-6 glow-soft">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-2xl gradient-blue-purple flex items-center justify-center text-white text-3xl font-bold">
            {user?.fullName.charAt(0)}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{user?.fullName}</h3>
            <p className="text-gray-600 capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={user?.fullName}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={user?.email}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={user?.phone || ''}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={user?.dateOfBirth || ''}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 glow-soft">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Preferences</h3>

        <div className="space-y-4">
          <div className="bg-white/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'light' ? (
                  <Sun className="w-5 h-5 text-gray-600" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
                <div>
                  <p className="font-semibold text-gray-800">Theme</p>
                  <p className="text-sm text-gray-600">Switch between light and dark mode</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-4 py-2 rounded-lg transition ${
                    theme === 'light'
                      ? 'gradient-blue-purple text-white'
                      : 'bg-white/50 text-gray-600'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-2 rounded-lg transition ${
                    theme === 'dark'
                      ? 'gradient-blue-purple text-white'
                      : 'bg-white/50 text-gray-600'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {user?.role === 'patient' && (
        <div className="glass rounded-2xl p-6 glow-soft">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Health Background
            </div>
          </h3>
          <p className="text-gray-600 mb-4">
            This information helps our AI provide more accurate risk assessments
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Genetic Background
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition min-h-[100px]"
                placeholder="Family history, genetic conditions, etc."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Environmental Factors
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition min-h-[100px]"
                placeholder="Living conditions, occupation, exposure to allergens, etc."
              />
            </div>

            <button className="px-6 py-3 rounded-xl gradient-blue-purple text-white font-semibold hover:scale-[1.02] transition">
              Update Information
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
