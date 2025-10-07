import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Pill, Loader } from 'lucide-react';
import { drugInteractionsApi, DrugInteractionResult } from '../api/drugInteractions';

export function DrugInteractionChecker() {
  const [drugs, setDrugs] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DrugInteractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addDrugField = () => setDrugs([...drugs, '']);
  const removeDrugField = (index: number) => setDrugs(drugs.filter((_, i) => i !== index));
  const updateDrug = (index: number, value: string) => {
    const updated = [...drugs];
    updated[index] = value;
    setDrugs(updated);
  };

  const handleCheck = async () => {
    const validDrugs = drugs.filter(d => d.trim());
    if (validDrugs.length < 2) {
      setError('Please enter at least 2 drugs');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await drugInteractionsApi.check(validDrugs);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to check interactions');
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <Pill className="w-8 h-8" />
          Drug Interaction Checker
        </h2>

        <div className="space-y-4 mb-6">
          {drugs.map((drug, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={drug}
                onChange={(e) => updateDrug(index, e.target.value)}
                placeholder={`Drug ${index + 1}`}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
              />
              {drugs.length > 2 && (
                <button onClick={() => removeDrugField(index)} className="px-4 py-3 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30">
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4 mb-6">
          <button onClick={addDrugField} className="px-6 py-3 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30">
            + Add Drug
          </button>
          <button onClick={handleCheck} disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader className="w-5 h-5 animate-spin" /> Checking...</> : 'Check Interactions'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className={`p-6 rounded-2xl ${result.interactionDetected ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
              <div className="flex items-center gap-3 mb-4">
                {result.interactionDetected ? <AlertTriangle className="w-8 h-8 text-red-400" /> : <CheckCircle className="w-8 h-8 text-green-400" />}
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {result.interactionDetected ? 'Interaction Detected' : 'No Interaction'}
                  </h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(result.severity)} text-white mt-1`}>
                    {result.severity}
                  </span>
                </div>
              </div>
              <p className="text-white/80 mb-4">{result.description}</p>
              
              {result.saferAlternatives.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-white mb-2">Safer Alternatives:</h4>
                  <ul className="list-disc list-inside text-white/70 space-y-1">
                    {result.saferAlternatives.map((alt, i) => <li key={i}>{alt}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {result.aiExplanation && (
              <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-2xl">🤖</span> AI Analysis
                </h4>
                <div className="text-white/80 whitespace-pre-wrap">{result.aiExplanation}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
