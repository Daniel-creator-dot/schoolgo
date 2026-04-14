import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Building2, Plus, Search, Filter, 
  CheckCircle2, Clock, XCircle, Send, MessageSquare, 
  Wallet, TrendingUp, HelpCircle, LogOut, ChevronRight, Layers
} from 'lucide-react';
import { API_BASE_URL } from '../constants';

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
  const [systemPlans, setSystemPlans] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'Private K-12',
    email: '',
    contact_number: '',
    admin_email: '',
    admin_password: '', // Hidden or auto-generated
    plan: 'Professional',
    demo_requested: false,
    address: '',
    custom_domain: '',
    logo: '',
    signature: '',
    language: 'en',
    timezone: 'GMT'
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/partner/dashboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPartner(data.partner);
        setSchools(data.schools);
      }

      const plansRes = await fetch(`${API_BASE_URL}/plans`);
      const plansData = await plansRes.json();
      if (plansData && plansData.length > 0) {
        setSystemPlans(plansData);
        setFormData(prev => ({ ...prev, plan: prev.plan || plansData[0].name }));
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
      const response = await fetch(`${API_BASE_URL}/partner/schools`, {
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
            admin_email: '', admin_password: '', plan: 'Professional', demo_requested: false,
            address: '', custom_domain: '', logo: '', signature: '', language: 'en', timezone: 'GMT'
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hidden lg:flex flex-col transition-colors">
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
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between transition-colors">
          <div>
            <h2 className="text-xl font-bold">Welcome back, {partner?.name}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Your referral code: <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">{partner?.referral_code}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus size={18} /> Add New School
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform">
                <Users size={64} />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-2 uppercase tracking-widest font-black">Total Schools</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{schools.length}</h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <TrendingUp size={14} /> <span>+{schools.filter(s => s.status === 'Active').length} Active</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform">
                <Wallet size={64} />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-2 uppercase tracking-widest font-black">Total Earnings</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white">₦{partner?.total_earnings?.toLocaleString()}</h3>
              <p className="mt-4 text-zinc-500 dark:text-zinc-500 text-xs font-medium">Finalized on active provisioning</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform">
                <Clock size={64} />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-2 uppercase tracking-widest font-black">Pending Leads</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{schools.filter(s => s.status === 'Pending').length}</h3>
              <p className="mt-4 text-zinc-500 dark:text-zinc-500 text-xs font-medium">Awaiting super-admin review</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 dark:to-indigo-900 rounded-2xl p-6 relative overflow-hidden shadow-sm">
               <div className="relative z-10 h-full flex flex-col justify-between">
                 <div>
                    <h4 className="text-white font-black text-lg">Pro Benefits</h4>
                    <p className="text-indigo-100 text-xs mb-4">You're on the premium partner tier (8% comms)</p>
                 </div>
                 <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-bold self-start transition-colors border border-white/10">
                    View Tier Details
                 </button>
               </div>
            </div>
          </div>

          {activeTab === 'referrals' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Referral Pipeline</h3>
                <div className="flex items-center gap-3">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search schools..." 
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                      />
                   </div>
                   <button className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      <Filter size={18} />
                   </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-widest font-black border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-6 py-4">School Name</th>
                      <th className="px-6 py-4">Plan Selected</th>
                      <th className="px-6 py-4">Submission Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {schools.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-16 text-center text-zinc-500 dark:text-zinc-400">
                                <Building2 size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
                                <p className="font-medium">No referrals yet. Add your first school to get started!</p>
                            </td>
                        </tr>
                    ) : (
                        schools.map((school) => (
                        <tr key={school.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-zinc-900 dark:text-white">{school.name}</span>
                                    <span className="text-xs text-zinc-500">{school.type}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                    school.plan === 'Enterprise' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' :
                                    school.plan === 'Professional' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' :
                                    'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/10 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/20'
                                }`}>
                                    {school.plan}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                                {new Date(school.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                                <div className={`flex items-center gap-2 text-xs font-bold ${
                                    school.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' :
                                    school.status === 'Pending' ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'
                                }`}>
                                    {school.status === 'Active' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                    {school.status}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
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
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-[600px] flex flex-col overflow-hidden shadow-sm">
               <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950/50">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">SA</div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">Super Admin Support</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Online - Replies swiftly</p>
                    </div>
                  </div>
               </div>
               <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 rounded-2xl rounded-tl-sm max-w-[80%] text-sm text-zinc-900 dark:text-zinc-100">
                    Hi {partner?.name}! I'm the Super Admin. How can I assist with your referrals today?
                  </div>
                  <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] self-end text-sm ml-auto shadow-sm shadow-indigo-200 dark:shadow-none">
                    Hi! I just submitted a new lead for "Greenspring Schools". Could you take a look?
                  </div>
               </div>
               <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-3 bg-zinc-50 dark:bg-zinc-950/50">
                  <input 
                    type="text" 
                    placeholder="Type your message..." 
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-sm"
                  />
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95">
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
          <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Refer a New Institution</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 font-medium">Fill in the comprehensive details for your prospective school lead.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                >
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddSchool} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">School Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm" 
                    placeholder="e.g. British International School" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">School Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm appearance-none"
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
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">School Admin Email</label>
                    <input 
                        type="email" 
                        required
                        value={formData.admin_email}
                        onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm" 
                        placeholder="admin@school.com" 
                    />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Custom Domain</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={formData.custom_domain}
                      onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                      placeholder="school-name"
                      className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-l-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <span className="px-4 py-3 bg-zinc-100 dark:bg-zinc-700 border border-l-0 border-zinc-200 dark:border-zinc-700 rounded-r-xl text-zinc-500 text-xs font-bold">.omniportal.com</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">School Logo</label>
                  <div className="flex items-center gap-4">
                    {formData.logo && (
                      <img src={formData.logo} alt="Logo Preview" className="w-12 h-12 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                      className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Principal's Signature</label>
                  <div className="flex items-center gap-4">
                    {formData.signature && (
                      <img src={formData.signature} alt="Signature Preview" className="w-12 h-12 rounded-lg object-contain border border-zinc-200 dark:border-zinc-700" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signature')}
                      className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Contact Number</label>
                    <input 
                        type="tel" 
                        required
                        value={formData.contact_number}
                        onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm" 
                        placeholder="+1 (555) 000-0000" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Physical Address</label>
                    <textarea 
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm resize-none" 
                        placeholder="Enter full school address" 
                    ></textarea>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Subscription Plan</label>
                    <select 
                        value={formData.plan}
                        onChange={(e) => setFormData({...formData, plan: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-no-repeat bg-[position:right_1rem_center]"
                    >
                        {systemPlans.map(p => (
                          <option key={p.id} value={p.name}>{p.name} (₦{parseFloat(p.price || 0).toLocaleString()})</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm appearance-none"
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="pt">Portuguese</option>
                    <option value="sw">Swahili</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm appearance-none"
                  >
                    <option value="GMT">GMT (Accra)</option>
                    <option value="WAT">WAT (Lagos)</option>
                    <option value="CAT">CAT (Kigali)</option>
                    <option value="EAT">EAT (Nairobi)</option>
                  </select>
                </div>
              </div>

              {/* Module Preview */}
              {formData.plan && systemPlans.length > 0 && (() => {
                 const selected = systemPlans.find(p => p.name === formData.plan);
                 if (!selected) return null;
                 const modules = Array.isArray(selected.modules) ? selected.modules : JSON.parse(selected.modules || '[]');
                 return (
                    <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
                       <div className="flex items-center gap-2 mb-3">
                          <Layers size={16} className="text-zinc-400" />
                          <h6 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Modules in {selected.name}</h6>
                       </div>
                       {modules.length > 0 ? (
                         <div className="flex flex-wrap gap-2">
                            {modules.map((m: string, i: number) => (
                               <span key={i} className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                  {m}
                               </span>
                            ))}
                         </div>
                       ) : (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">No modules configured for this plan.</p>
                       )}
                    </div>
                 );
              })()}

              <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl group cursor-pointer transition-colors" onClick={() => setFormData({...formData, demo_requested: !formData.demo_requested})}>
                 <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${formData.demo_requested ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600'}`}>
                    {formData.demo_requested && <CheckCircle2 size={16} />}
                 </div>
                 <div>
                    <h5 className="font-bold text-sm text-indigo-900 dark:text-indigo-100">Request Demo Account</h5>
                    <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70 font-medium">Check this to create a temporary login for the school admin to explore.</p>
                 </div>
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-4 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-4 rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-sm"
                >
                  Submit Referral <Send size={16} />
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
