import { Pill, Plus, Calendar, User } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  purpose: string;
  status: 'active' | 'completed' | 'discontinued';
}

export default function Medications() {
  const medications: Medication[] = [
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      startDate: '2024-01-15',
      prescribedBy: 'Dr. Sarah Johnson',
      purpose: 'Blood pressure control',
      status: 'active',
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      startDate: '2024-02-20',
      prescribedBy: 'Dr. Michael Chen',
      purpose: 'Diabetes management',
      status: 'active',
    },
    {
      id: '3',
      name: 'Vitamin D3',
      dosage: '1000 IU',
      frequency: 'Once daily',
      startDate: '2024-03-10',
      prescribedBy: 'Dr. Sarah Johnson',
      purpose: 'Vitamin deficiency',
      status: 'active',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Medications</h2>
          <p className="text-gray-600">Manage your current and past medications</p>
        </div>
        <button className="px-6 py-3 rounded-xl gradient-blue-purple text-white font-semibold hover:scale-[1.02] transition glow-blue flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Medication
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {medications.map((med) => (
          <div key={med.id} className="glass rounded-2xl p-6 glow-soft hover:scale-[1.01] transition">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl gradient-blue-purple flex items-center justify-center">
                  <Pill className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{med.name}</h3>
                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                      {med.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Dosage</p>
                      <p className="font-semibold text-gray-800">{med.dosage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Frequency</p>
                      <p className="font-semibold text-gray-800">{med.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Purpose</p>
                      <p className="font-semibold text-gray-800">{med.purpose}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Start Date</p>
                      <p className="font-semibold text-gray-800">{med.startDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200/50">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Prescribed by {med.prescribedBy}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{med.startDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
