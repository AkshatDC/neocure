import React, { useState, useEffect } from 'react';
import { History, AlertTriangle, Clock } from 'lucide-react';
import { drugInteractionsApi, DrugInteraction } from '../api/drugInteractions';

export function InteractionHistory() {
  const [history, setHistory] = useState<DrugInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await drugInteractionsApi.getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': case 'SEVERE': return 'bg-red-500';
      case 'MODERATE': return 'bg-yellow-500';
      case 'MILD': return 'bg-orange-400';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <History className="w-8 h-8" />
          Interaction History
        </h2>

        {loading ? (
          <div className="text-center py-12 text-white/50">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No interaction checks yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-6 h-6 ${item.severity === 'SEVERE' || item.severity === 'CRITICAL' ? 'text-red-400' : 'text-yellow-400'}`} />
                    <div>
                      <h3 className="text-lg font-bold text-white">{item.drugsInvolved.join(' + ')}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(item.severity)} text-white mt-1`}>
                        {item.severity}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Clock className="w-4 h-4" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <p className="text-white/80 mb-3">{item.description}</p>

                {item.saferAlternatives.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-white mb-2 text-sm">Safer Alternatives:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.saferAlternatives.map((alt, i) => (
                        <span key={i} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.autoChecked && (
                  <div className="mt-3 text-xs text-purple-300">
                    ⚡ Automatically checked during prescription
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
