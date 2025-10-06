import { AlertTriangle, Info, TrendingDown, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface Alternative {
  name: string;
  benefits: string[];
  risks: string[];
}

interface RiskItem {
  id: string;
  medication: string;
  riskLevel: 'green' | 'amber' | 'red';
  riskScore: number;
  explanation: string;
  alternatives: Alternative[];
  precautions: string[];
}

export default function RiskDashboard() {
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);

  const risks: RiskItem[] = [
    {
      id: '1',
      medication: 'Aspirin 100mg',
      riskLevel: 'red',
      riskScore: 8.5,
      explanation:
        'High risk of severe allergic reaction detected based on your medical history. You have a documented allergy to salicylates, which are present in Aspirin. Previous reactions included difficulty breathing and skin rashes.',
      alternatives: [
        {
          name: 'Clopidogrel 75mg',
          benefits: ['Effective blood thinning', 'No cross-reactivity with salicylates'],
          risks: ['Minor bleeding risk', 'Requires monitoring'],
        },
        {
          name: 'Dipyridamole 200mg',
          benefits: ['Safe alternative', 'Well tolerated'],
          risks: ['Headaches possible', 'Less potent'],
        },
      ],
      precautions: [
        'Avoid all aspirin-containing products',
        'Inform all healthcare providers of this allergy',
        'Carry emergency medication',
      ],
    },
    {
      id: '2',
      medication: 'Ibuprofen 400mg',
      riskLevel: 'amber',
      riskScore: 4.2,
      explanation:
        'Moderate risk due to potential stomach issues. Your medical history shows previous gastritis. While not contraindicated, careful monitoring is recommended.',
      alternatives: [
        {
          name: 'Acetaminophen 500mg',
          benefits: ['Gentler on stomach', 'Effective pain relief'],
          risks: ['Liver concerns with high doses'],
        },
      ],
      precautions: ['Take with food', 'Monitor for stomach pain', 'Avoid alcohol'],
    },
    {
      id: '3',
      medication: 'Vitamin D3 1000 IU',
      riskLevel: 'green',
      riskScore: 0.5,
      explanation:
        'No contraindications found. This supplement is safe based on your current health profile and medication regimen. Continue as prescribed.',
      alternatives: [],
      precautions: ['Take with meals for better absorption', 'Regular blood tests recommended'],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Risk Dashboard</h2>
        <p className="text-gray-600">AI-powered medication safety assessments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 glow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">1</p>
              <p className="text-sm text-gray-600">High Risk</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">1</p>
              <p className="text-sm text-gray-600">Moderate Risk</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">1</p>
              <p className="text-sm text-gray-600">Low Risk</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {risks.map((risk) => (
          <div key={risk.id} className={`${
            risk.riskLevel === 'red' ? 'risk-red' :
            risk.riskLevel === 'amber' ? 'risk-amber' :
            'risk-green'
          } rounded-2xl p-6`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`w-6 h-6 ${
                    risk.riskLevel === 'red'
                      ? 'text-red-600'
                      : risk.riskLevel === 'amber'
                      ? 'text-amber-600'
                      : 'text-green-600'
                  }`}
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{risk.medication}</h3>
                  <p className="text-sm text-gray-600">Risk Score: {risk.riskScore}/10</p>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-4 py-2 rounded-full uppercase ${
                  risk.riskLevel === 'red'
                    ? 'bg-red-100 text-red-700'
                    : risk.riskLevel === 'amber'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {risk.riskLevel === 'red' ? 'High Risk' : risk.riskLevel === 'amber' ? 'Caution' : 'Safe'}
              </span>
            </div>

            <div className="bg-white/30 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-2 mb-2">
                <Info className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Explanation</p>
                  <p className="text-sm text-gray-700">{risk.explanation}</p>
                </div>
              </div>
            </div>

            {risk.alternatives.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold text-gray-800 mb-3">Safer Alternatives</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {risk.alternatives.map((alt, index) => (
                    <div key={index} className="bg-white/50 rounded-xl p-4">
                      <p className="font-bold text-gray-800 mb-2">{alt.name}</p>
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-green-700 mb-1">Benefits:</p>
                        {alt.benefits.map((benefit, i) => (
                          <p key={i} className="text-xs text-gray-700">• {benefit}</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-700 mb-1">Considerations:</p>
                        {alt.risks.map((r, i) => (
                          <p key={i} className="text-xs text-gray-700">• {r}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {risk.precautions.length > 0 && (
              <div>
                <p className="font-semibold text-gray-800 mb-2">Precautions</p>
                <div className="flex flex-wrap gap-2">
                  {risk.precautions.map((precaution, index) => (
                    <span
                      key={index}
                      className="text-xs bg-white/50 px-3 py-1 rounded-full text-gray-700"
                    >
                      {precaution}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
