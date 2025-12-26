
import React, { useState } from 'react';
import { Lock, User, AlertCircle, Check } from 'lucide-react';
import { Person } from '../types';

interface LoginViewProps {
  onLogin: (email: string) => boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
        setError('Please enter both email and password.');
        return;
    }

    const success = onLogin(email);
    if (!success) {
        setError('Invalid credentials or user not found.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-8 text-center bg-white border-b border-slate-50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border-4 border-slate-100 shadow-inner">
            <img src="/logo.png" alt="Kora GRC Logo" className="max-h-12" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-slate-900">Kora</span><span className="text-emerald-600"> GRC</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Governance, Risk, and Compliance Platform</p>
        </div>

        <div className="p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-600/30 transition-all transform hover:scale-[1.02] active:scale-95"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
             <p className="text-xs text-slate-400">
                 Authorized Personnel Only. <br/> Access is monitored and logged.
             </p>
          </div>
        </div>
        
        {/* Demo Hint */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
            <span className="font-bold">Demo Accounts:</span>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
                <span className="bg-white border px-2 py-1 rounded cursor-pointer hover:border-emerald-300" onClick={() => {setEmail('john.doe@company.com'); setPassword('password');}}>Admin (John)</span>
                <span className="bg-white border px-2 py-1 rounded cursor-pointer hover:border-emerald-300" onClick={() => {setEmail('jane.smith@company.com'); setPassword('password');}}>Vendor Mgr (Jane)</span>
                <span className="bg-white border px-2 py-1 rounded cursor-pointer hover:border-emerald-300" onClick={() => {setEmail('mike@auditors.com'); setPassword('password');}}>Read Only (Mike)</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
