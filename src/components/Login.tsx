import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { UserRole } from '../types';
import { login } from '../lib/api';

interface LoginProps {
  onLogin: (role: UserRole, user: any) => void;
  onBack: () => void;
}

export default function Login({ onLogin, onBack }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user.role, data.user);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 mx-auto mb-6 group transition-all border-none outline-none focus:outline-none focus:ring-0"
          >
            <img 
              src="/assets/omni_portal_full_logo.png" 
              alt="OmniPortal" 
              className="h-16 md:h-24 w-auto object-contain group-hover:scale-105 transition-transform border-0" 
            />
          </button>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Enter your credentials to access your portal</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4 mb-1 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  placeholder="admin@school.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-4 mr-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Password</label>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <input type="checkbox" id="remember" className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="remember" className="text-xs text-zinc-500 font-medium">Remember for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-900/30 mb-4">
              <Shield className="w-3 h-3 text-emerald-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Secure Authentication</span>
            </div>
            <p className="text-xs text-zinc-500">
              Don't have an account? <button onClick={onBack} className="text-indigo-600 font-bold hover:underline">Contact Sales</button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
