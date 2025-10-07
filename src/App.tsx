import { useState } from 'react';
import { useApp } from './context/AppContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MedicalRecords from './components/MedicalRecords';
import AllergyDetection from './components/AllergyDetection';
import Medications from './components/Medications';
import RiskDashboard from './components/RiskDashboard';
import Reminders from './components/Reminders';
import Profile from './components/Profile';
import ChatBot from './components/ChatBot';
import { DrugInteractionChecker } from './components/DrugInteractionChecker';
import { PrescriptionManager } from './components/PrescriptionManager';
import { InteractionHistory } from './components/InteractionHistory';
import { DrugInteractionAnalytics } from './components/DrugInteractionAnalytics';

function App() {
  const { isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'records':
        return <MedicalRecords />;
      case 'allergies':
        return <AllergyDetection />;
      case 'medications':
        return <Medications />;
      case 'risk':
        return <RiskDashboard />;
      case 'reminders':
        return <Reminders />;
      case 'profile':
        return <Profile />;
      case 'drug-interactions':
        return <DrugInteractionChecker />;
      case 'prescriptions':
        return <PrescriptionManager />;
      case 'interaction-history':
        return <InteractionHistory />;
      case 'patients':
        return (
          <div className="glass rounded-2xl p-6 glow-soft">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Patients</h2>
            <p className="text-gray-600">Patient management coming soon...</p>
          </div>
        );
      case 'treatments':
        return (
          <div className="glass rounded-2xl p-6 glow-soft">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Treatments</h2>
            <p className="text-gray-600">Treatment management coming soon...</p>
          </div>
        );
      case 'users':
        return (
          <div className="glass rounded-2xl p-6 glow-soft">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">User Management</h2>
            <p className="text-gray-600">User administration coming soon...</p>
          </div>
        );
      case 'analytics':
        return <DrugInteractionAnalytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen gradient-light overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {renderContent()}
        </div>
      </div>

      <ChatBot />
    </div>
  );
}

export default App;
