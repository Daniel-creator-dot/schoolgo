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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 selection:bg-indigo-500/30">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl relative z-10">
        
        {/* Left Side: Info/Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-r border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={onBackToLanding}>
              <img src="/assets/omni_portal_icon.png" alt="Logo" className="h-10 w-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Partner Portal
              </span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Grow your network, <br />
              <span className="text-indigo-400">Earn rewards.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-md">
              The professional ecosystem for school consultants and partners. Manage your referrals, track status, and view earnings in real-time.
            </p>

            <div className="space-y-6">
              {[
                { icon: <PieChart className="w-5 h-5" />, title: "Real-time Tracking", desc: "Monitor school approvals as they happen." },
                { icon: <ShieldCheck className="w-5 h-5" />, title: "Secure Payouts", desc: "Automated commission calculations." },
                { icon: <Building2 className="w-5 h-5" />, title: "Lead Pipeline", desc: "Add schools with pending status for review." }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-indigo-400">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{item.title}</h4>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <p className="text-gray-500 text-sm italic">
              "OmniPortal Partner Network has transformed how we engage with schools."
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center bg-white/5 relative">
          <button 
            onClick={onBackToLanding}
            className="absolute top-8 right-8 text-sm font-bold text-gray-500 hover:text-white transition-colors"
          >
            ← Back
          </button>
          
          <div className="lg:hidden flex justify-center mb-8" onClick={onBackToLanding}>
            <img src="/assets/omni_portal_full_logo.png" alt="Logo" className="h-16 cursor-pointer" />
          </div>
          
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-bold text-white mb-2">Welcome Back</h3>
            <p className="text-gray-400">Enter your partner credentials to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-gray-400 text-sm ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-gray-400 text-sm">Password</label>
                <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot Password?</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Interested in becoming a partner? <button onClick={onBackToLanding} className="text-indigo-400 font-medium hover:underline">Apply Now</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerLogin;
