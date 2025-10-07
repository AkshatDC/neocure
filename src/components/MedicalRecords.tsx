import { useState, useEffect } from 'react';
import { FileText, Upload, Search, Filter, Eye, Loader, X } from 'lucide-react';
import { apiClient } from '../api/client';

interface MedicalRecord {
  id: string;
  fileName?: string;
  fileUrl?: string;
  extractedText?: string;
  confidence?: number;
  ocrStatus?: string;
  patientId?: string;
  uploadedAt?: string;
  // Legacy fields
  title?: string;
  description?: string;
  date?: string;
  type?: string;
  tags?: string[];
}

export default function MedicalRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch records on mount
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<any[]>('/records');
      setRecords(data);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      event.target.value = '';
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF and image files (JPG, PNG, GIF) are allowed');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('document', file);

    try {
      setUploading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const token = localStorage.getItem('accessToken');

      if (!token) {
        alert('You must be logged in to upload documents');
        return;
      }

      console.log('Uploading to:', `${apiUrl}/records/upload`);
      console.log('File:', file.name, file.type, file.size);

      const response = await fetch(`${apiUrl}/records/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for multipart
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      // Refresh records
      await fetchRecords();
      
      alert('Document uploaded and processed successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Failed to upload document: ${error.message}`);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const viewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const filteredRecords = records.filter((record) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      record.fileName?.toLowerCase().includes(searchLower) ||
      record.extractedText?.toLowerCase().includes(searchLower) ||
      record.title?.toLowerCase().includes(searchLower) ||
      record.description?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Medical Records</h2>
          <p className="text-gray-600">Manage and view your medical documents</p>
        </div>
        <label className="px-6 py-3 rounded-xl gradient-blue-purple text-white font-semibold hover:scale-[1.02] transition glow-blue flex items-center gap-2 cursor-pointer">
          {uploading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload Record
            </>
          )}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No medical records found</p>
              <p className="text-sm mt-2">Upload your first document to get started</p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white/50 rounded-xl p-6 hover:bg-white/80 transition cursor-pointer"
                onClick={() => viewRecord(record)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl gradient-blue-purple flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">
                        {record.fileName || record.title || 'Medical Document'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {record.extractedText?.substring(0, 150) || record.description || 'No description available'}
                        {(record.extractedText || record.description || '').length > 150 && '...'}
                      </p>
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="text-xs text-gray-500">
                          {record.uploadedAt ? new Date(record.uploadedAt).toLocaleDateString() : record.date}
                        </span>
                        {record.ocrStatus && (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            record.ocrStatus === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700' 
                              : record.ocrStatus === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {record.ocrStatus}
                          </span>
                        )}
                        {record.confidence && (
                          <span className="text-xs text-gray-500">
                            Confidence: {Math.round(record.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewRecord(record);
                    }}
                    className="ml-4 p-2 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Eye className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Record Detail Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="gradient-blue-purple p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {selectedRecord.fileName || selectedRecord.title || 'Medical Record'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {selectedRecord.fileUrl && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Document Preview</h3>
                  {selectedRecord.fileUrl.endsWith('.pdf') ? (
                    <iframe
                      src={selectedRecord.fileUrl}
                      className="w-full h-96 rounded-xl border border-gray-200"
                      title="Document Preview"
                    />
                  ) : (
                    <img
                      src={selectedRecord.fileUrl}
                      alt="Document"
                      className="w-full rounded-xl border border-gray-200"
                    />
                  )}
                </div>
              )}
              {selectedRecord.extractedText && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Extracted Text (OCR)</h3>
                  <div className="bg-white/50 rounded-xl p-4 max-h-64 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedRecord.extractedText}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedRecord.uploadedAt && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Upload Date</span>
                    <p className="text-gray-800">{new Date(selectedRecord.uploadedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedRecord.confidence && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">OCR Confidence</span>
                    <p className="text-gray-800">{Math.round(selectedRecord.confidence * 100)}%</p>
                  </div>
                )}
                {selectedRecord.ocrStatus && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <p className="text-gray-800">{selectedRecord.ocrStatus}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
