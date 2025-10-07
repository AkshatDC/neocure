import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { apiClient } from '../api/client';

interface DrugInteraction {
  id: string;
  drugsInvolved: string[];
  severity: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  description: string;
  saferAlternatives: string[];
  aiExplanation?: string;
  autoChecked: boolean;
  createdAt: string;
}

export default function DrugInteractionAlerts() {
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInteraction, setSelectedInteraction] = useState<DrugInteraction | null>(null);

  useEffect(() => {
    fetchInteractions();
  }, []);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<DrugInteraction[]>('/drug-interactions/history');
      setInteractions(data);
    } catch (error) {
      console.error('Failed to fetch interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'SEVERE':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'MILD':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'CRITICAL' || severity === 'SEVERE') {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <CheckCircle className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 glow-soft">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Drug Interaction Alerts</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const criticalInteractions = interactions.filter(
    (i) => i.severity === 'CRITICAL' || i.severity === 'SEVERE'
  );

  return (
    <>
      <div className="glass rounded-2xl p-6 glow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Drug Interaction Alerts</h3>
          {criticalInteractions.length > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
              {criticalInteractions.length} Critical
            </span>
          )}
        </div>

        {interactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No drug interactions detected</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {interactions.slice(0, 10).map((interaction) => (
              <div
                key={interaction.id}
                className={`p-4 rounded-xl border-2 cursor-pointer hover:shadow-md transition ${getSeverityColor(
                  interaction.severity
                )}`}
                onClick={() => setSelectedInteraction(interaction)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(interaction.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">
                          {interaction.drugsInvolved.join(' + ')}
                        </p>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/50">
                          {interaction.severity}
                        </span>
                      </div>
                      <p className="text-sm opacity-80 line-clamp-2">
                        {interaction.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                        <Clock className="w-3 h-3" />
                        {new Date(interaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInteraction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className={`p-6 flex items-center justify-between ${
              selectedInteraction.severity === 'CRITICAL' || selectedInteraction.severity === 'SEVERE'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}>
              <div className="flex items-center gap-3">
                {getSeverityIcon(selectedInteraction.severity)}
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Drug Interaction Details
                  </h2>
                  <p className="text-white/80 text-sm">
                    {selectedInteraction.drugsInvolved.join(' + ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInteraction(null)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Severity</h3>
                <span
                  className={`inline-block px-4 py-2 rounded-full font-semibold ${getSeverityColor(
                    selectedInteraction.severity
                  )}`}
                >
                  {selectedInteraction.severity}
                </span>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-700">{selectedInteraction.description}</p>
              </div>

              {selectedInteraction.saferAlternatives.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Safer Alternatives
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {selectedInteraction.saferAlternatives.map((alt, i) => (
                      <li key={i}>{alt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedInteraction.aiExplanation && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <span>🤖</span> AI Analysis
                  </h3>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedInteraction.aiExplanation}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Detected</span>
                  <p className="text-gray-800">
                    {new Date(selectedInteraction.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Type</span>
                  <p className="text-gray-800">
                    {selectedInteraction.autoChecked ? 'Auto-checked' : 'Manual check'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
