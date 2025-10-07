import React, { useState, useEffect } from 'react';
import { Pill, Plus, AlertTriangle, CheckCircle, Loader, X } from 'lucide-react';
import { prescriptionsApi, Prescription, InteractionWarning } from '../api/prescriptions';
import { authApi } from '../api/auth';

export function PrescriptionManager() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [warning, setWarning] = useState<InteractionWarning | null>(null);
  const currentUser = authApi.getCurrentUser();
  const isDoctor = currentUser?.role === 'DOCTOR' || currentUser?.role === 'ADMIN';

  const [formData, setFormData] = useState({
    userId: '',
    drugName: '',
    dosage: '',
    frequency: '',
    endDate: '',
    notes: '',
  });

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await prescriptionsApi.getAll('ACTIVE');
      setPrescriptions(data);
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.drugName || !formData.dosage || !formData.frequency) return;

    setLoading(true);
    setWarning(null);
    try {
      const response = await prescriptionsApi.add({
        ...formData,
        userId: formData.userId || currentUser!.id,
      });

      setPrescriptions([response.prescription, ...prescriptions]);
      
      if (response.interactionWarning.detected) {
        setWarning(response.interactionWarning);
      } else {
        setShowAddForm(false);
        setFormData({ userId: '', drugName: '', dosage: '', frequency: '', endDate: '', notes: '' });
      }
    } catch (error: any) {
      alert(error.message || 'Failed to add prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscontinue = async (id: string) => {
    if (!confirm('Discontinue this prescription?')) return;
    try {
      await prescriptionsApi.discontinue(id);
      setPrescriptions(prescriptions.filter(p => p.id !== id));
    } catch (error: any) {
      alert(error.message || 'Failed to discontinue prescription');
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Pill className="w-8 h-8" />
            Prescriptions
          </h2>
          {isDoctor && (
            <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add Prescription
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Add New Prescription</h3>
                <button onClick={() => { setShowAddForm(false); setWarning(null); }} className="text-white/70 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {warning && (
                <div className={`p-6 rounded-2xl mb-6 ${warning.detected ? 'bg-red-500/20 border border-red-500/50' : 'bg-green-500/20 border border-green-500/50'}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        Drug Interaction Warning
                        {warning.severity && (
                          <span className={`px-3 py-1 rounded-full text-xs ${getSeverityColor(warning.severity)} text-white`}>
                            {warning.severity}
                          </span>
                        )}
                      </h4>
                      <p className="text-white/80 mb-3">{warning.description}</p>
                      {warning.saferAlternatives && warning.saferAlternatives.length > 0 && (
                        <div className="mt-3">
                          <p className="font-semibold text-white mb-2">Safer Alternatives:</p>
                          <ul className="list-disc list-inside text-white/70 space-y-1">
                            {warning.saferAlternatives.map((alt, i) => <li key={i}>{alt}</li>)}
                          </ul>
                        </div>
                      )}
                      <div className="mt-4 flex gap-3">
                        <button onClick={() => { setShowAddForm(false); setWarning(null); loadPrescriptions(); }} className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30">
                          Review Prescription
                        </button>
                        <button onClick={() => setWarning(null)} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30">
                          Proceed Anyway
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleAdd} className="space-y-4">
                {isDoctor && (
                  <input
                    type="text"
                    placeholder="Patient User ID"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                  />
                )}
                <input
                  type="text"
                  placeholder="Drug Name *"
                  value={formData.drugName}
                  onChange={(e) => setFormData({ ...formData, drugName: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Dosage *"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    required
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                  />
                  <input
                    type="text"
                    placeholder="Frequency *"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    required
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <input
                  type="date"
                  placeholder="End Date (Optional)"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                />
                <textarea
                  placeholder="Notes (Optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                />
                <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader className="w-5 h-5 animate-spin" /> Checking Interactions...</> : 'Add Prescription'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {prescriptions.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <Pill className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No active prescriptions</p>
            </div>
          ) : (
            prescriptions.map((prescription) => (
              <div key={prescription.id} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{prescription.drugName}</h3>
                    <div className="space-y-1 text-white/70">
                      <p><span className="font-semibold">Dosage:</span> {prescription.dosage}</p>
                      <p><span className="font-semibold">Frequency:</span> {prescription.frequency}</p>
                      {prescription.notes && <p><span className="font-semibold">Notes:</span> {prescription.notes}</p>}
                      <p className="text-sm text-white/50">Started: {new Date(prescription.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {isDoctor && (
                    <button onClick={() => handleDiscontinue(prescription.id)} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 text-sm">
                      Discontinue
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
