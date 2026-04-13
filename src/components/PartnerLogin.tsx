import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, PieChart, Users, Building2 } from 'lucide-react';

interface PartnerLoginProps {
  onLoginSuccess?: (data: any) => void;
  onBackToLanding?: () => void;
}

const PartnerLogin: React.FC<PartnerLoginProps> = ({ onLoginSuccess, onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/partner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess?.(data);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />

      <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl relative z-10 transition-colors">
        
        {/* Left Side: Info/Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-colors">
          <div>
            <div className="flex items-center gap-3 mb-8 cursor-pointer group" onClick={onBackToLanding}>
              <img src="/assets/omni_portal_icon.png" alt="Logo" className="h-10 w-10 group-hover:scale-105 transition-transform" />
              <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                Partner Portal
              </span>
            </div>
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
              Grow your network, <br />
              <span className="text-indigo-600 dark:text-indigo-400">Earn rewards.</span>
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-10 max-w-md">
              The professional ecosystem for school consultants and partners. Manage your referrals, track status, and view earnings in real-time.
            </p>

            <div className="space-y-6">
              {[
                { icon: <PieChart className="w-5 h-5" />, title: "Real-time Tracking", desc: "Monitor school approvals as they happen." },
                { icon: <ShieldCheck className="w-5 h-5" />, title: "Secure Payouts", desc: "Automated commission calculations." },
                { icon: <Building2 className="w-5 h-5" />, title: "Lead Pipeline", desc: "Add schools with pending status for review." }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-zinc-900 dark:text-white font-bold">{item.title}</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 mt-8">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium italic">
              "OmniPortal Partner Network has transformed how we engage with schools."
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center relative">
          <button 
            onClick={onBackToLanding}
            className="absolute top-8 right-8 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition-colors"
          >
            ← Back
          </button>
          
          <div className="lg:hidden flex justify-center mb-8" onClick={onBackToLanding}>
            <img src="/assets/omni_portal_full_logo.png" alt="Logo" className="h-16 cursor-pointer hover:scale-105 transition-transform" />
          </div>
          
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">Welcome Back</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Enter your partner credentials to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4 mb-1 block">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-zinc-900 dark:text-white placeholder-zinc-400"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-4 mr-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Password</label>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500">Forgot?</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-zinc-900 dark:text-white placeholder-zinc-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            Interested in becoming a partner? <button onClick={onBackToLanding} className="text-indigo-600 font-bold hover:underline">Apply Now</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerLogin;
