import React, { useState } from 'react';
import api from '../services/api';
import { 
  Hash, Sparkles, Copy, Check, RefreshCw, 
  HelpCircle, ClipboardCopy, Info, ArrowRight
} from 'lucide-react';

const TagGenerator = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const samplePairs = [
    {
      q: "How do partner referrals work?",
      a: "Partners can refer leads through agencies and external contractors."
    },
    {
      q: "How are staging environment builds triggered in Jenkins?",
      a: "Jenkins build pipelines launch automatic deployment scripts upon receiving webhooks on merging code to the release branch."
    },
    {
      q: "What is our policy for database credentials protection?",
      a: "Database passwords, secret certificates, and keys must be securely encrypted and locked in HashiCorp Vault. Vault tokens are rotated every 30 days."
    }
  ];

  const handleLoadSample = (idx) => {
    setQuestion(samplePairs[idx].q);
    setAnswer(samplePairs[idx].a);
    setTags([]);
    setError('');
  };

  const handleGenerateTags = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError('Both Question and Answer text fields are required to extract content tags.');
      return;
    }

    setError('');
    setLoading(true);
    setTags([]);
    try {
      const res = await api.post('/generate-tags', { question, answer });
      const tagsStr = res.data.tags;
      if (tagsStr) {
        // Split by comma and strip whitespaces
        const tagsArr = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
        setTags(tagsArr);
      } else {
        setTags(["faq", "document", "RAG"]);
      }
    } catch (err) {
      console.error(err);
      setError('Technical tag extraction expert service failed. Please confirm the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTags = () => {
    if (tags.length === 0) return;
    navigator.clipboard.writeText(tags.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 fade-in p-1 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Sandbox Box */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Tagging Sandbox Console</h3>
                <p className="text-xs text-slate-400">Sandbox to test automatic semantic keyword extraction</p>
              </div>
              
              {/* Load Sample Chips */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadSample(0)}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
                >
                  Sample 1
                </button>
                <button
                  onClick={() => handleLoadSample(1)}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
                >
                  Sample 2
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 text-xs flex items-center gap-2">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGenerateTags} className="space-y-4">
              {/* Question Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Question Input</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type in a hypothetical question..."
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white text-sm transition-all placeholder-slate-400"
                />
              </div>

              {/* Answer Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Answer Description</label>
                <textarea
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Provide an answer detailing technical keywords..."
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white text-sm transition-all placeholder-slate-400"
                />
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-brand-500/10 active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Sparkles size={16} /> Analyze & Extract Content Tags <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Dynamic Tag Display Box */}
        <div className="space-y-4">
          
          {/* Result panel */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 h-full flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                <Hash size={16} className="text-brand-500" /> Dynamic Tag Extractor
              </h3>
              <p className="text-xs text-slate-400 mb-6">Generated technical tag bubbles will display here dynamically.</p>

              {tags.length > 0 ? (
                // Output Bubble display
                <div className="flex flex-wrap gap-2.5">
                  {tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-3.5 py-1.5 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold border border-brand-500/10 fade-in flex items-center gap-1.5 shadow-sm"
                      style={{ animationDelay: `${idx * 0.08}s` }}
                    >
                      <Hash size={10} /> {tag}
                    </span>
                  ))}
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400 animate-pulse">
                  <RefreshCw size={24} className="animate-spin text-brand-500" />
                  <p className="text-xs font-semibold">Running heuristic word matrices...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center">
                  <HelpCircle size={40} className="text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="font-bold text-xs">Waiting for prompt submissions</p>
                  <p className="text-[10px] max-w-[200px] mt-1">Submit the input sandboxes or click a sample to see AI taggers in action.</p>
                </div>
              )}
            </div>

            {/* Copy button */}
            {tags.length > 0 && (
              <button
                onClick={handleCopyTags}
                className="w-full flex items-center justify-center gap-2 py-2.5 mt-6 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-500" /> Copied Tags to Clipboard!
                  </>
                ) : (
                  <>
                    <ClipboardCopy size={14} className="text-brand-500" /> Copy Comma-Separated List
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tagger Info explanation card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
          <Info size={16} className="text-brand-500" /> Heuristic Tag Extraction Guidelines
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/10">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">Stopword Filtering</h5>
            <p>Common articles, prepositions, and conversational filler words (e.g. 'how', 'what', 'the', 'under') are automatically purged from the parsing array.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/10">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">Compound Bi-Grams</h5>
            <p>Consecutive non-stopwords are paired to discover specific multi-word technical concepts like 'partner referral', 'database indexing', or 'credentials vault'.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/10">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">Count Constraints</h5>
            <p>Output lists are filtered of duplicates, formatted to clean lowercase structures, and strictly constrained to return between 4 and 8 highly focused tags.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagGenerator;
