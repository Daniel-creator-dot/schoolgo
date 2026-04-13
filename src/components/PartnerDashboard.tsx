import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Building2, Plus, Search, Filter, 
  CheckCircle2, Clock, XCircle, Send, MessageSquare, 
  Wallet, TrendingUp, HelpCircle, LogOut, ChevronRight
} from 'lucide-react';

interface SchoolLead {
  id: string;
  name: string;
  type: string;
  status: string;
  plan: string;
  created_at: string;
}

const PartnerDashboard: React.FC = () => {
  const [partner, setPartner] = useState<any>(null);
  const [schools, setSchools] = useState<SchoolLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('referrals');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'Private K-12',
    email: '',
    contact_number: '',
    admin_email: '',
    admin_password: '', // Hidden or auto-generated
    plan: 'Professional',
    demo_requested: false
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/partner/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPartner(data.partner);
        setSchools(data.schools);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/partner/schools', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setIsModalOpen(false);
        fetchDashboardData();
        setFormData({
            name: '', type: 'Private K-12', email: '', contact_number: '',
            admin_email: '', admin_password: '', plan: 'Professional', demo_requested: false
        });
      }
    } catch (err) {
      console.error('Error adding school:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/partner/login';
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#1e293b]/50 backdrop-blur-xl hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <img src="/assets/omni_portal_icon.png" alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight">Partner Hub</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'referrals', label: 'My Referrals', icon: <Users size={20} /> },
            { id: 'earnings', label: 'Earnings', icon: <Wallet size={20} /> },
            { id: 'chat', label: 'Support Chat', icon: <MessageSquare size={20} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="h-20 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Welcome back, {partner?.name}</h2>
            <p className="text-xs text-gray-500">Your referral code: <span className="text-indigo-400 font-mono">{partner?.referral_code}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all"
            >
              <Plus size={18} /> Add New School
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Users size={64} />
              </div>
              <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Total Schools</p>
              <h3 className="text-3xl font-bold">{schools.length}</h3>
              <div className="mt-4 flex items-center gap-2 text-green-400 text-xs">
                <TrendingUp size={14} /> <span>+{schools.filter(s => s.status === 'Active').length} Active</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Wallet size={64} />
              </div>
              <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Total Earnings</p>
              <h3 className="text-3xl font-bold">₦{partner?.total_earnings?.toLocaleString()}</h3>
              <p className="mt-4 text-gray-500 text-xs">Finalized on school activation</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Clock size={64} />
              </div>
              <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Pending Leads</p>
              <h3 className="text-3xl font-bold">{schools.filter(s => s.status === 'Pending').length}</h3>
              <p className="mt-4 text-gray-500 text-xs">Awaiting super-admin review</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 relative overflow-hidden">
               <div className="relative z-10 h-full flex flex-col justify-between">
                 <div>
                    <h4 className="text-white font-bold text-lg">Pro Benefits</h4>
                    <p className="text-indigo-100 text-xs mb-4">You're on the premium partner tier (8% comms)</p>
                 </div>
                 <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold self-start">
                    View Tier Details
                 </button>
               </div>
            </div>
          </div>

          {activeTab === 'referrals' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-bold">Referral Pipeline</h3>
                <div className="flex items-center gap-3">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search schools..." 
                        className="bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                   </div>
                   <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white">
                      <Filter size={18} />
                   </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                      <th className="px-6 py-4">School Name</th>
                      <th className="px-6 py-4">Plan Selected</th>
                      <th className="px-6 py-4">Submission Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {schools.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No referrals yet. Add your first school to get started!</p>
                            </td>
                        </tr>
                    ) : (
                        schools.map((school) => (
                        <tr key={school.id} className="group hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-white">{school.name}</span>
                                    <span className="text-xs text-gray-500">{school.type}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                    school.plan === 'Enterprise' ? 'bg-purple-500/10 text-purple-400' :
                                    school.plan === 'Professional' ? 'bg-indigo-500/10 text-indigo-400' :
                                    'bg-gray-500/10 text-gray-400'
                                }`}>
                                    {school.plan}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                                {new Date(school.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                                <div className={`flex items-center gap-2 text-xs font-semibold ${
                                    school.status === 'Active' ? 'text-green-400' :
                                    school.status === 'Pending' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                    {school.status === 'Active' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                    {school.status}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="p-2 text-gray-500 hover:text-indigo-400 transition-colors">
                                    <ChevronRight size={18} />
                                </button>
                            </td>
                        </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl h-[600px] flex flex-col overflow-hidden shadow-xl">
               <div className="p-6 border-b border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">SA</div>
                  <div>
                    <h3 className="font-bold">Super Admin Support</h3>
                    <p className="text-xs text-green-400 italic">Online - Usually replies within 1 hour</p>
                  </div>
               </div>
               <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  <div className="bg-white/5 p-4 rounded-2xl max-w-[80%] border border-white/10 text-sm">
                    Hi {partner?.name}! I'm the Super Admin. How can I assist with your referrals today?
                  </div>
                  <div className="bg-indigo-600/20 p-4 rounded-2xl max-w-[80%] self-end border border-indigo-500/20 text-sm ml-auto">
                    Hi! I just submitted a new lead for "Greenspring Schools". Could you take a look?
                  </div>
               </div>
               <div className="p-4 border-t border-white/10 flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Type your message..." 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-xl transition-all">
                    <Send size={20} />
                  </button>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal - Add School */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-[#1e293b] border border-white/10 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Refer a New Institution</h3>
                <p className="text-gray-400 text-sm">Fill in the details for your prospective school lead.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                >
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddSchool} className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">School Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    placeholder="e.g. British International School" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">School Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                  >
                    <option>Private K-12</option>
                    <option>Tertiary Institution</option>
                    <option>Technical College</option>
                    <option>International School</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Proposed Subscription</label>
                    <select 
                        value={formData.plan}
                        onChange={(e) => setFormData({...formData, plan: e.target.value})}
                        className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                    >
                        <option value="Basic">Basic (500/mo)</option>
                        <option value="Professional">Professional (1,500/mo)</option>
                        <option value="Enterprise">Enterprise (3,500/mo)</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">School Admin Email</label>
                    <input 
                        type="email" 
                        required
                        value={formData.admin_email}
                        onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                        placeholder="admin@school.com" 
                    />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl group cursor-pointer" onClick={() => setFormData({...formData, demo_requested: !formData.demo_requested})}>
                 <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${formData.demo_requested ? 'bg-indigo-600 border-indigo-600' : 'border-white/20'}`}>
                    {formData.demo_requested && <CheckCircle2 size={16} />}
                 </div>
                 <div>
                    <h5 className="font-bold text-sm">Request Demo Account</h5>
                    <p className="text-xs text-indigo-300/70">Check this to create a temporary login for the school admin to explore.</p>
                 </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  Submit Referral <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;
