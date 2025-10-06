import { useState } from 'react';
import { AlertCircle, Plus, Info } from 'lucide-react';

interface Allergy {
  id: string;
  name: string;
  type: string;
  severity: 'mild' | 'moderate' | 'severe';
  symptoms: string[];
  detectedDate: string;
}

export default function AllergyDetection() {
  const [allergies] = useState<Allergy[]>([
    {
      id: '1',
      name: 'Penicillin',
      type: 'Medication',
      severity: 'severe',
      symptoms: ['Rash', 'Difficulty breathing', 'Swelling'],
      detectedDate: '2023-05-12',
    },
    {
      id: '2',
      name: 'Peanuts',
      type: 'Food',
      severity: 'moderate',
      symptoms: ['Hives', 'Itching', 'Nausea'],
      detectedDate: '2022-11-03',
    },
  ]);

  const [showSymptomInput, setShowSymptomInput] = useState(false);
  const [symptoms, setSymptoms] = useState('');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'risk-red';
      case 'moderate':
        return 'risk-amber';
      case 'mild':
        return 'risk-green';
      default:
        return 'bg-gray-100';
    }
  };

  const handleAnalyzeSymptoms = () => {
    if (symptoms.trim()) {
      alert('AI analysis would process symptoms: ' + symptoms);
      setSymptoms('');
      setShowSymptomInput(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Allergy Detection</h2>
          <p className="text-gray-600">Track and manage your allergies</p>
        </div>
        <button
          onClick={() => setShowSymptomInput(!showSymptomInput)}
          className="px-6 py-3 rounded-xl gradient-blue-purple text-white font-semibold hover:scale-[1.02] transition glow-blue flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Symptoms
        </button>
      </div>

      {showSymptomInput && (
        <div className="glass rounded-2xl p-6 glow-soft">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Symptom-Based Detection</h3>
          <p className="text-sm text-gray-600 mb-4">
            Describe your symptoms and our AI will help detect potential allergies
          </p>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="E.g., Itchy skin, runny nose after eating shellfish..."
            className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition min-h-[120px]"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAnalyzeSymptoms}
              className="px-6 py-3 rounded-xl gradient-blue-purple text-white font-semibold hover:scale-[1.02] transition"
            >
              Analyze Symptoms
            </button>
            <button
              onClick={() => setShowSymptomInput(false)}
              className="px-6 py-3 rounded-xl bg-white/50 hover:bg-white/80 transition font-semibold text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6 glow-soft">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Known Allergies</h3>
        <div className="space-y-4">
          {allergies.map((allergy) => (
            <div key={allergy.id} className={`${getSeverityColor(allergy.severity)} rounded-xl p-6`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <AlertCircle
                    className={`w-6 h-6 ${
                      allergy.severity === 'severe'
                        ? 'text-red-600'
                        : allergy.severity === 'moderate'
                        ? 'text-amber-600'
                        : 'text-green-600'
                    }`}
                  />
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">{allergy.name}</h4>
                    <p className="text-sm text-gray-600">{allergy.type} Allergy</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                    allergy.severity === 'severe'
                      ? 'bg-red-100 text-red-700'
                      : allergy.severity === 'moderate'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {allergy.severity}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Symptoms:</p>
                <div className="flex flex-wrap gap-2">
                  {allergy.symptoms.map((symptom, index) => (
                    <span
                      key={index}
                      className="text-xs bg-white/50 px-3 py-1 rounded-full text-gray-700"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Detected: {allergy.detectedDate}</p>
                <button className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  <Info className="w-4 h-4" />
                  View Treatment Options
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
