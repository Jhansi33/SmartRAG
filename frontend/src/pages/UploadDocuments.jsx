import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  UploadCloud, FileText, Trash2, FileCode, CheckCircle, 
  AlertTriangle, ShieldAlert, Cpu, Eye, Info
} from 'lucide-react';

const UploadDocuments = () => {
  const { isAdmin } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents/');
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load documents catalog from the RAG store.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleBrowseFiles = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSuccessMsg('');
    
    // Check file extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setError(`Invalid file type '.${ext}'. Only PDF, DOCX, and TXT files are accepted.`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploadProgress(true);

    try {
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMsg(`Document '${file.name}' successfully parsed, chunked, and embedded in FAISS vector database.`);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to ingest and embed file.');
    } finally {
      setUploadProgress(false);
      // Reset input value to allow uploading the same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (docId, filename) => {
    if (!window.confirm(`Are you sure you want to delete '${filename}'? This will permanently wipe all of its vector chunk representations from RAG.`)) {
      return;
    }
    
    setError('');
    setSuccessMsg('');
    
    try {
      await api.delete(`/documents/${docId}`);
      setSuccessMsg(`Successfully deleted '${filename}' and cleared corresponding embeddings from the vector store.`);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to delete the document.');
    }
  };

  // Helper to format filetype badge color
  const getFileTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'docx': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 fade-in p-1 text-left">
      {/* Dynamic Alerts */}
      {successMsg && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm animate-fade-in">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Upload Box (Admin only) vs Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Container Box */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2">Ingest New Knowledge File</h3>
            <p className="text-xs text-slate-400 mb-6">Upload corporate PDFs, technical DOCX files, or plain text procedures to seed the RAG index.</p>
            
            {true ? (
              // Active Dropzone for all users
              <div 
                onClick={handleBrowseFiles}
                className="border-2 border-dashed border-slate-200 hover:border-brand-500 dark:border-slate-800 dark:hover:border-brand-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 group bg-slate-50/50 dark:bg-slate-900/10"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                />
                
                {uploadProgress ? (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                    <p className="text-xs font-bold text-brand-500 animate-pulse">Running NLP ingestion and vector embeddings generation...</p>
                  </div>
                ) : (
                  <>
                    <div className="h-14 w-14 rounded-2xl bg-brand-50 dark:bg-slate-800 text-brand-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                      <UploadCloud size={28} />
                    </div>
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-1">
                      Drag & Drop files here, or <span className="text-brand-500 underline group-hover:text-brand-600">Browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supports PDF, DOCX, and TXT files up to 10MB in size
                    </p>
                  </>
                )}
              </div>
            ) : (
              // Blocked pane for standard User
              <div className="flex flex-col items-center justify-center p-8 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl bg-amber-500/5 text-center">
                <ShieldAlert size={36} className="text-amber-500 mb-3" />
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Administrator Privileges Required</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                  Your current account is registered under a 'user' role. Ingesting new operational files and updating the FAISS vector index requires administrator access.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Informative Side Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
              <Cpu size={16} className="text-brand-500" /> Vector Processing Specs
            </h3>
            
            <div className="space-y-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 shrink-0 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-brand-500">1</div>
                <p><strong>Text Splitting:</strong> Sentences are recursively extracted in overlaps of 800 chars (150 words) with 150 chars overlap to preserve semantic references.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 shrink-0 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-brand-500">2</div>
                <p><strong>Vector Dimensions:</strong> Sentences are processed locally into 384-dimensional dense float vectors using all-MiniLM-L6-v2.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 shrink-0 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-brand-500">3</div>
                <p><strong>Persistence:</strong> Chunks and binary indices are stored locally and loaded automatically on application start.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/40 flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <Info size={14} className="text-brand-500" /> Fully Local Ingestion Engine
          </div>
        </div>
      </div>

      {/* Uploaded Documents Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
        <div className="mb-6">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Ingested File Index Directory</h3>
          <p className="text-xs text-slate-400">Comprehensive inventory of active document context blocks in the database</p>
        </div>

        {loading && documents.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Connecting to index directory...</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="font-bold text-sm">No documents found in knowledge base</p>
            <p className="text-[11px] mt-1">Upload files or run the database seeder to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Document Filename</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-center">RAG Chunks Count</th>
                  <th className="pb-3">Upload Date</th>
                  {true && <th className="pb-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/20">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 pl-2 font-bold text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-2 max-w-[280px] sm:max-w-md">
                        <FileText size={16} className="text-brand-500 shrink-0" />
                        <span className="truncate">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getFileTypeColor(doc.filetype)}`}>
                        {doc.filetype}
                      </span>
                    </td>
                    <td className="py-4 text-center font-bold text-slate-800 dark:text-slate-100">
                      {doc.chunksCount} chunks
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    {true && (
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleDeleteDocument(doc._id, doc.filename)}
                          className="h-8 w-8 flex items-center justify-center ml-auto rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 transition-colors"
                          title="Delete file and purge embeddings"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDocuments;
