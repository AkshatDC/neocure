import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { drugInteractionsApi, DrugInteraction } from '../api/drugInteractions';

export function DrugInteractionAnalytics() {
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await drugInteractionsApi.getHistory();
      setInteractions(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const severityCount = {
    CRITICAL: interactions.filter(i => i.severity === 'CRITICAL').length,
    SEVERE: interactions.filter(i => i.severity === 'SEVERE').length,
    MODERATE: interactions.filter(i => i.severity === 'MODERATE').length,
    MILD: interactions.filter(i => i.severity === 'MILD').length,
    NONE: interactions.filter(i => i.severity === 'NONE').length,
  };

  const totalChecks = interactions.length;
  const autoChecks = interactions.filter(i => i.autoChecked).length;
  const manualChecks = totalChecks - autoChecks;

  const commonCombinations = interactions
    .reduce((acc, item) => {
      const key = item.drugsInvolved.sort().join(' + ');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topCombinations = Object.entries(commonCombinations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="text-center py-12 text-white/50">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <BarChart3 className="w-8 h-8" />
          Drug Interaction Analytics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">Total Checks</span>
              <TrendingUp className="w-5 h-5 text-purple-300" />
            </div>
            <div className="text-3xl font-bold text-white">{totalChecks}</div>
            <div className="text-sm text-white/50 mt-2">
              {autoChecks} auto • {manualChecks} manual
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">High Risk</span>
              <AlertTriangle className="w-5 h-5 text-red-300" />
            </div>
            <div className="text-3xl font-bold text-white">
              {severityCount.CRITICAL + severityCount.SEVERE}
            </div>
            <div className="text-sm text-white/50 mt-2">
              {severityCount.CRITICAL} critical • {severityCount.SEVERE} severe
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">Safe Checks</span>
              <CheckCircle className="w-5 h-5 text-green-300" />
            </div>
            <div className="text-3xl font-bold text-white">{severityCount.NONE}</div>
            <div className="text-sm text-white/50 mt-2">No interactions detected</div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Severity Distribution</h3>
          <div className="space-y-3">
            {Object.entries(severityCount).map(([severity, count]) => {
              const percentage = totalChecks > 0 ? (count / totalChecks) * 100 : 0;
              const colors = {
                CRITICAL: 'bg-red-600',
                SEVERE: 'bg-red-500',
                MODERATE: 'bg-yellow-500',
                MILD: 'bg-orange-400',
                NONE: 'bg-green-500',
              };
              return (
                <div key={severity}>
                  <div className="flex justify-between text-sm text-white/70 mb-1">
                    <span>{severity}</span>
                    <span>{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${colors[severity as keyof typeof colors]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {topCombinations.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Most Checked Combinations</h3>
            <div className="space-y-3">
              {topCombinations.map(([combo, count], index) => (
                <div key={combo} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-white/30">#{index + 1}</span>
                    <span className="text-white">{combo}</span>
                  </div>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold">
                    {count} {count === 1 ? 'check' : 'checks'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
