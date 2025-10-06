import { useState } from 'react';
import { FileText, Upload, Search, Filter, Tag } from 'lucide-react';

interface MedicalRecord {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
  tags: string[];
}

export default function MedicalRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [records] = useState<MedicalRecord[]>([
    {
      id: '1',
      title: 'Annual Physical Exam',
      description: 'Comprehensive health checkup with blood work',
      date: '2024-09-15',
      type: 'Checkup',
      tags: ['routine', 'blood-test'],
    },
    {
      id: '2',
      title: 'Allergy Test Results',
      description: 'Complete panel for food and environmental allergies',
      date: '2024-08-20',
      type: 'Lab Results',
      tags: ['allergy', 'lab'],
    },
    {
      id: '3',
      title: 'Prescription History',
      description: 'List of all prescribed medications',
      date: '2024-07-10',
      type: 'Prescription',
      tags: ['medication', 'prescription'],
    },
  ]);

  const filteredRecords = records.filter(
    (record) =>
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Medical Records</h2>
          <p className="text-gray-600">Manage and view your medical documents</p>
        </div>
        <button className="px-6 py-3 rounded-xl gradient-blue-purple text-white font-semibold hover:scale-[1.02] transition glow-blue flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Record
        </button>
      </div>

      <div className="glass rounded-2xl p-6 glow-soft">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
            />
          </div>
          <button className="px-6 py-3 rounded-xl bg-white/50 hover:bg-white/80 transition flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filter</span>
          </button>
        </div>

        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white/50 rounded-xl p-6 hover:bg-white/80 transition cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-blue-purple flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{record.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-gray-500">{record.date}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        {record.type}
                      </span>
                      {record.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-gray-500 flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
