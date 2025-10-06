import { useState } from 'react';
import { Heart, Mail, Lock, CircleUser as UserCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | 'admin'>('patient');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password, selectedRole);
  };

  return (
    <div className="min-h-screen gradient-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-blue-purple flex items-center justify-center glow-blue">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gradient">NeoCure</h1>
          </div>
          <p className="text-gray-600 font-medium">Healing Safely</p>
        </div>

        <div className="glass rounded-3xl p-8 glow-soft">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome Back</h2>

          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-3 block">Select Role</label>
            <div className="grid grid-cols-3 gap-3">
              {(['patient', 'doctor', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`p-3 rounded-xl transition-all ${
                    selectedRole === role
                      ? 'gradient-blue-purple text-white glow-blue'
                      : 'bg-white/50 text-gray-600 hover:bg-white/80'
                  }`}
                >
                  <UserCircle className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-xs font-medium capitalize">{role}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl gradient-blue-purple text-white font-semibold hover:scale-[1.02] transition glow-blue"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Demo credentials: any email and password
          </p>
        </div>
      </div>
    </div>
  );
}
