import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Database, Plus, Trash2, Edit, CheckCircle, ShieldAlert,
  Search, X, Hash, Info, Cpu, Sparkles
} from 'lucide-react';

const FeedbackDatabase = () => {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Search inputs
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal tracking
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formTags, setFormTags] = useState('');
  const [tagGenerating, setTagGenerating] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/feedback-admin');
      setEntries(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Feedback Q&A records from MongoDB.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormQuestion('');
    setFormAnswer('');
    setFormTags('');
    setError('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry) => {
    setModalMode('edit');
    setEditingId(entry._id);
    setFormQuestion(entry.question);
    setFormAnswer(entry.answer);
    setFormTags(entry.tags);
    setError('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleAutoGenerateTags = async () => {
    if (!formQuestion.trim() || !formAnswer.trim()) {
      setError('Both Question and Answer fields are required to analyze and extract technical tags.');
      return;
    }
    
    setError('');
    setTagGenerating(true);
    try {
      const res = await api.post('/generate-tags', {
        question: formQuestion,
        answer: formAnswer
      });
      setFormTags(res.data.tags);
      setSuccessMsg('Content tags automatically generated successfully!');
    } catch (err) {
      console.error(err);
      setError('Tag generation expert service failed.');
    } finally {
      setTagGenerating(false);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formQuestion.trim() || !formAnswer.trim()) {
      setError('Question and Answer are mandatory fields.');
      return;
    }

    const payload = {
      question: formQuestion,
      answer: formAnswer,
      tags: formTags || 'auto' // Sends 'auto' to trigger backend generator if left blank
    };

    try {
      if (modalMode === 'add') {
        await api.post('/feedback-admin', payload);
        setSuccessMsg('Successfully created new Feedback Q&A entry.');
      } else {
        await api.put(`/feedback-admin/${editingId}`, payload);
        setSuccessMsg('Successfully updated Feedback Q&A entry.');
      }
      setIsModalOpen(false);
      fetchEntries();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit feedback entry.');
    }
  };

  const handleDeleteEntry = async (entryId, question) => {
    const briefQuestion = question.length > 40 ? question.substring(0, 40) + '...' : question;
    if (!window.confirm(`Are you sure you want to delete the Feedback Q&A entry: "${briefQuestion}"?`)) {
      return;
    }
    
    setError('');
    setSuccessMsg('');
    try {
      await api.delete(`/feedback-admin/${entryId}`);
      setSuccessMsg('Feedback QA entry successfully wiped from MongoDB Atlas.');
      fetchEntries();
    } catch (err) {
      console.error(err);
      setError('Failed to delete QA entry.');
    }
  };

  // Filter entries in real-time
  const filteredEntries = entries.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(query) ||
      item.tags.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 fade-in p-1 text-left">
      
      {/* Alerts */}
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

      {/* Header controls: Search & Add button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/40">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-md flex items-center">
          <input
            type="text"
            placeholder="Search feedback QA by question or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all dark:text-white"
          />
          <Search size={14} className="absolute left-3 text-slate-400" />
        </div>

        {/* Add Entry (Admin only) */}
        {isAdmin ? (
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-brand-500/10 active:scale-95 shrink-0"
          >
            <Plus size={16} /> Add Feedback QA
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-amber-500/5 px-3 py-1.5 rounded-lg border border-amber-500/10">
            <Info size={12} className="text-amber-500" /> Read-Only Mode Active
          </div>
        )}
      </div>

      {/* Database catalog panel */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
        <div className="mb-6">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">feedback_qa Database Collection</h3>
          <p className="text-xs text-slate-400">Direct query listings from MongoDB, pre-seeded with enterprise configurations</p>
        </div>

        {loading && entries.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Connecting to database...</p>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Database size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
            <p className="font-bold text-sm">No entries matched search criteria</p>
            <p className="text-[11px] mt-1">Try another search keyword or verify MongoDB is active.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((item) => (
              <div 
                key={item._id}
                className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/40 hover:scale-[1.005] transition-all flex flex-col sm:flex-row justify-between gap-4 text-left"
              >
                {/* QA Details */}
                <div className="space-y-2 flex-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-snug">
                    Q: {item.question}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    A: {item.answer}
                  </p>
                  
                  {/* Tag badges */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {item.tags.split(',').map((tag, tIdx) => (
                      <span 
                        key={tIdx} 
                        className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-brand-500/5 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 text-[10px] font-bold border border-brand-500/10"
                      >
                        <Hash size={8} /> {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions (Admin only) */}
                {isAdmin && (
                  <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/40 dark:border-slate-800/40">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                      title="Edit QA pair"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(item._id, item.question)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 transition-colors"
                      title="Delete QA pair"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CRUD Add/Edit Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800/40 mb-5">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                {modalMode === 'add' ? 'Add Feedback QA Entry' : 'Edit Feedback QA Entry'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Question */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Question</label>
                <textarea
                  rows={2}
                  required
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="How do partner referrals work?"
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white text-sm transition-all"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Answer</label>
                <textarea
                  rows={4}
                  required
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="Partners can refer leads through agencies..."
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white text-sm transition-all"
                />
              </div>

              {/* Tags with Auto-generation trigger */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Content Tags</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateTags}
                    disabled={tagGenerating || !formQuestion.trim() || !formAnswer.trim()}
                    className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 hover:bg-brand-500/20 disabled:opacity-40 text-brand-600 dark:text-brand-400 text-[10px] font-black rounded-lg transition-colors border border-brand-500/25 active:scale-95"
                  >
                    {tagGenerating ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-brand-500 border-t-transparent"></div>
                    ) : (
                      <>
                        <Sparkles size={11} /> Auto-Generate Tags
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="partner, agency, lead referral (or leave blank to auto-generate)"
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white text-sm transition-all placeholder-slate-400"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">Separate multiple tags with commas.</p>
              </div>

              {/* Submit panel */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/40 mt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-all shadow-md shadow-brand-500/10 active:scale-95"
                >
                  {modalMode === 'add' ? 'Create Entry' : 'Update Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDatabase;
