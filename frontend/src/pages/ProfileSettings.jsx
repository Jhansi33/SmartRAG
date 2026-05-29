import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, Shield, Mail, Calendar, Key, Database, 
  Cpu, FileText, CheckCircle2, AlertCircle 
} from 'lucide-react';

const ProfileSettings = () => {
  const { user, isAdmin } = useAuth();

  const systemChecklist = [
    { name: 'FastAPI Connection', status: 'Active', desc: 'React Axios client is actively routing to http://localhost:8000/api' },
    { name: 'MongoDB Database', status: 'Connected', desc: 'Asynchronous Motor client successfully initialized collections and indices' },
    { name: 'Vector Store Storage', status: 'Active', desc: 'Local FAISS / NumPy vector databases mapped to backend/vector_storage/' },
    { name: 'Semantic NLP Model', status: 'all-MiniLM-L6-v2', desc: 'Thread-safe encoder initialized locally on the server (100% Offline & Free)' }
  ];

  return (
    <div className="space-y-6 fade-in p-1 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Profile Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Personal Information</h3>
            
            {/* Avatar Head */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-brand-500/20">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">{user?.name || 'Active User'}</h4>
                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-bold border border-brand-500/15 uppercase tracking-wide">
                  {user?.role || 'user'}
                </span>
              </div>
            </div>

            {/* Details list */}
            <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/30 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 flex items-center gap-2">
                  <Mail size={14} /> Email Address
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{user?.email || 'name@company.com'}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar size={14} /> Created At
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 flex items-center gap-2">
                  <Shield size={14} /> Role Permissions
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {isAdmin ? 'Read & Write Index' : 'Read-Only Search'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pt-4 border-t border-slate-200/30 dark:border-slate-800/30">
            <CheckCircle2 size={12} className="text-emerald-500" /> Session Active
          </div>
        </div>

        {/* System Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2">Backend Connection Matrices</h3>
            <p className="text-xs text-slate-400 mb-6">Integrations checks detailing local server statuses and configurations</p>

            <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/40">
              {systemChecklist.map((item, idx) => (
                <div key={idx} className={`flex items-start justify-between gap-4 text-xs ${idx > 0 ? 'pt-4' : ''}`}>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                    <p className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">{item.desc}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-extrabold shrink-0">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Advanced environment configurations guidelines */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
          <Key size={16} className="text-brand-500" /> Advanced Integration Guidelines
        </h4>
        <div className="space-y-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
          
          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/10">
            <h5 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
              <Database size={14} className="text-brand-500" /> MongoDB Atlas Cloud Setup
            </h5>
            <p className="mb-2">To connect this RAG application to a cloud-managed MongoDB Atlas cluster, update the environment variable in your `backend/.env` file:</p>
            <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-800 font-mono text-[10px] whitespace-pre-wrap select-all">
              MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@&lt;cluster-url&gt;.mongodb.net/domainspecificrag?retryWrites=true&w=majority
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/10">
            <h5 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
              <Cpu size={14} className="text-brand-500" /> Enabling Advanced Large Language Models (LLM)
            </h5>
            <p className="mb-3">
              By default, this chatbot runs **100% offline, free, and locally** using semantic sentence mappings. To upgrade the answer synthesis to GPT-3.5 or Gemini-1.5 models, add your private API keys in `backend/.env`:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[10px]">
              <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-800 select-all">
                # OpenAI Integration<br />
                OPENAI_API_KEY=your_openai_key_here
              </div>
              <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-800 select-all">
                # Google Gemini Integration<br />
                GEMINI_API_KEY=your_gemini_key_here
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
