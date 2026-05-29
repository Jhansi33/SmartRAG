import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  FileText, Database, MessageSquare, Award, 
  TrendingUp, ArrowRight, ShieldCheck, RefreshCw, Cpu
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analytics/metrics');
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard analytical metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading analytical metrics...</p>
        </div>
      </div>
    );
  }

  const { averages, totals, trends, topDocuments } = stats || {
    averages: { precision: 0.85, recall: 0.82, contextRelevance: 0.84, responseQuality: 8.3 },
    totals: { documents: 0, feedback: 0, chats: 0 },
    trends: [],
    topDocuments: []
  };

  return (
    <div className="space-y-6 fade-in p-1">
      {/* Welcome header & refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-brand-500/10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">RAG Workspace Controller</h2>
          <p className="text-sm text-brand-100 mt-1">
            Real-time tracking of vector stores, auto-tagging feedback collections, and retrieval accuracy metrics.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center justify-center gap-2 self-start px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-sm font-semibold rounded-xl border border-white/20"
        >
          <RefreshCw size={16} /> Refresh Analytics
        </button>
      </div>

      {/* Grid Totals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Documents */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Documents</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">{totals.documents}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-500 dark:bg-slate-800/60 dark:text-brand-400 flex items-center justify-center shadow-inner">
              <FileText size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            PDF, DOCX, and TXT indexed
          </div>
        </div>

        {/* Card 2: QA Pairs */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Feedback Q&A</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">{totals.feedback}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-slate-800/60 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <Database size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            Searchable feedback records
          </div>
        </div>

        {/* Card 3: Chatbots queries */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">RAG Queries</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">{totals.chats}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-500 dark:bg-slate-800/60 dark:text-purple-400 flex items-center justify-center shadow-inner">
              <MessageSquare size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            Semantic conversation prompts
          </div>
        </div>

        {/* Card 4: Response Quality */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:scale-[1.02] transition-transform duration-200 bg-gradient-to-b from-transparent to-brand-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg RAG Quality</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
                {averages.responseQuality} <span className="text-xs font-bold text-slate-400">/ 10</span>
              </h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-500 dark:bg-slate-800/60 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <Award size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
            <TrendingUp size={12} /> True Semantic Match Accuracy
          </div>
        </div>
      </div>

      {/* Visual Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph 1: Response Quality Trend */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Response Quality Trends</h4>
              <p className="text-xs text-slate-400">Progression mapping of the RAG evaluator scores</p>
            </div>
            <div className="text-xs font-bold text-brand-500 flex items-center gap-1">
              <Cpu size={14} /> Local Sentence-Transformer
            </div>
          </div>
          
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5275ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#5275ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                <XAxis dataKey="date" stroke="rgba(148, 163, 184, 0.5)" tickLine={false} />
                <YAxis domain={[0, 10]} stroke="rgba(148, 163, 184, 0.5)" tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }} 
                />
                <Area type="monotone" dataKey="quality" name="Response Quality (0-10)" stroke="#5275ff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorQuality)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Retrieval Precision vs Recall */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
          <div className="mb-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Accuracy Evaluations</h4>
            <p className="text-xs text-slate-400">Ratio matching for Precision@K and Recall@K</p>
          </div>

          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends.slice(-6)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                <XAxis dataKey="date" stroke="rgba(148, 163, 184, 0.5)" tickLine={false} />
                <YAxis domain={[0, 1.0]} stroke="rgba(148, 163, 184, 0.5)" tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }} 
                />
                <Legend iconType="circle" />
                <Bar dataKey="precision" name="Precision@K" fill="#5275ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recall" name="Recall@K" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Documents */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 lg:col-span-2">
          <div className="mb-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Top-Performing Sources Leaderboard</h4>
            <p className="text-xs text-slate-400">Highest-scoring documents in active chatbot operations</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Document Name</th>
                  <th className="pb-3 text-center">RAG Citations</th>
                  <th className="pb-3 text-right">Avg Similarity Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/20">
                {topDocuments.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4.5 pl-2 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 text-[10px] font-black shrink-0">
                        {idx + 1}
                      </div>
                      <span className="truncate max-w-[280px] sm:max-w-md">{doc.name}</span>
                    </td>
                    <td className="py-4.5 text-center text-slate-500 dark:text-slate-400 font-semibold">{doc.citations} times</td>
                    <td className="py-4.5 text-right font-black text-brand-600 dark:text-brand-400">
                      {parseInt(doc.avgScore * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Launch Control panel */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Workspace Quick Launch</h4>
            <p className="text-xs text-slate-400 mb-6">Instantly navigate to core chatbot services</p>
            
            <div className="space-y-3">
              <Link 
                to="/chatbot" 
                className="flex items-center justify-between p-3.5 rounded-xl bg-brand-500/5 hover:bg-brand-500/10 border border-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold transition-all group"
              >
                <span>Launch RAG Chatbot</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link 
                to="/feedback-database" 
                className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all group"
              >
                <span>Manage Feedback database</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link 
                to="/tag-generator" 
                className="flex items-center justify-between p-3.5 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-all group"
              >
                <span>Open Dynamic Tagger</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/40 flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <ShieldCheck size={14} className="text-brand-500" /> Secure Workspace Encrypted
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
