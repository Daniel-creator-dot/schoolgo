import React from 'react';
import { 
  Brain, 
  Search, 
  Bot, 
  Users, 
  Settings, 
  Zap,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DataTable } from '../DataTable';

export const AIModules = {
  PerformancePrediction: ({ 
    organization, 
    results, 
    students,
    onSave, 
    onDelete 
  }: { 
    organization?: any,
    results?: any[],
    students?: any[],
    onSave?: (data: any) => void, 
    onDelete?: (item: any) => void 
  }) => {
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [aiInsights, setAiInsights] = React.useState<any[]>([]);

    const handleAnalysis = async () => {
      setIsAnalyzing(true);
      try {
        const dataSummary = {
          studentCount: students?.length || 0,
          resultsCount: results?.length || 0,
          averageScore: results && results.length > 0 
            ? results.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / results.length 
            : 0,
        };

        const prompt = `Analyze this school performance data and provide 3 key insights. 
        Data Summary: ${JSON.stringify(dataSummary)}.
        Format your response as a JSON array of objects with 'title', 'value', 'trend', 'status', and 'icon_name' (choice of: TrendingUp, Users, AlertCircle).
        Example: [{"title": "Academic Growth", "value": "+12%", "trend": "up", "status": "success", "icon_name": "TrendingUp"}]`;

        const token = localStorage.getItem('token');
        const response = await fetch(`${(window as any).API_BASE_URL || '/api'}/ai/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prompt, systemPrompt: "You are a data analyst for a school management system. Respond only with valid JSON." })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'AI service unavailable');
        }

        const data = await response.json();
        const text = data.text || "[]";
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const insights = JSON.parse(jsonStr);
        setAiInsights(insights);
        (window as any).showToast?.('AI Analysis complete!', 'success');
      } catch (err: any) {
        console.error('AI Analysis Error:', err);
        (window as any).showToast?.(err.message || 'Failed to run AI analysis.', 'error');
      } finally {
        setIsAnalyzing(false);
      }
    };

    const displayInsights = aiInsights.length > 0 ? aiInsights : [
      { title: 'Predicted Pass Rate', value: '88.4%', trend: 'up', status: 'success', icon_name: 'TrendingUp' },
      { title: 'At-Risk Students', value: '12', trend: 'down', status: 'warning', icon_name: 'AlertCircle' },
      { title: 'Teacher Workload', value: 'Optimal', trend: 'stable', status: 'info', icon_name: 'Users' },
    ];

    const getIcon = (name: string) => {
      switch(name) {
        case 'TrendingUp': return TrendingUp;
        case 'AlertCircle': return AlertCircle;
        case 'Users': return Users;
        default: return Info;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Performance Insights</h2>
            <p className="text-sm text-zinc-500">AI-driven academic predictions and student performance tracking</p>
          </div>
          <button 
            onClick={handleAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Run AI Analysis
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayInsights.map((stat, i) => {
            const Icon = getIcon(stat.icon_name);
            return (
              <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    stat.status === 'success' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                    stat.status === 'warning' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" :
                    "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                    stat.trend === 'up' ? "bg-emerald-50 text-emerald-600" :
                    stat.trend === 'down' ? "bg-amber-50 text-amber-600" :
                    "bg-zinc-100 text-zinc-600"
                  )}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : stat.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                    {stat.trend.toUpperCase()}
                  </div>
                </div>
                <h3 className="text-zinc-500 text-sm font-medium">{stat.title}</h3>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-white">Student Academic Rankings</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Updated: Today</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
          <DataTable 
            title="Student Academic Rankings"
            data={students || []}
            columns={[
              { header: 'Student Name', accessor: (item: any) => <span className="font-bold">{item.name}</span> },
              { header: 'ID Number', accessor: (item: any) => item.student_id },
              { header: 'Class/Grade', accessor: (item: any) => item.class },
              { header: 'Current GPA', accessor: (item: any) => <span className="text-indigo-600 font-bold">{item.gpa || 'N/A'}</span> },
              { header: 'Attendance', accessor: (item: any) => (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: item.attendance }} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500">{item.attendance}</span>
                </div>
              )},
            ]}
          />
        </div>
      </div>
    );
  },
  PatternDetection: () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Pattern Detection</h2>
          <p className="text-zinc-500">Automated identification of attendance and behavioral anomalies.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold">Refresh</button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">Configure Alerts</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            Detected Anomalies
          </h3>
          <div className="space-y-4">
            {[
              { title: 'Friday Slump', desc: '15% drop in attendance every Friday in Grade 10.', severity: 'Medium' },
              { title: 'Grade Inflation', desc: 'Unusual spike in English scores for Section B.', severity: 'High' },
              { title: 'Late Arrivals', desc: 'Bus Route 4 consistently arriving 10 mins late.', severity: 'Low' },
            ].map((a, i) => (
              <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{a.title}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    a.severity === 'High' ? "bg-red-50 text-red-600" : 
                    a.severity === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  )}>{a.severity}</span>
                </div>
                <p className="text-xs text-zinc-500">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4" />
          <h3 className="font-bold">Real-time Scanning</h3>
          <p className="text-sm text-zinc-500 mt-2">AI is currently analyzing the last 24 hours of system activity for new patterns.</p>
        </div>
      </div>
    </div>
  ),
  AIChatbot: ({ organization }: { organization?: any }) => {
    const [messages, setMessages] = React.useState<any[]>([
      {
        role: 'ai',
        content: "Hello! I'm your OmniPortal AI assistant. How can I help you today? I can help with student records, financial reports, or system configurations.",
        timestamp: new Date()
      }
    ]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages]);

    const handleSend = async () => {
      const prompt = input.trim();
      if (!prompt || isLoading) return;

      setMessages(prev => [...prev, { role: 'user', content: prompt }]);
      setInput('');
      setIsLoading(true);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${(window as any).API_BASE_URL || '/api'}/ai/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            prompt, 
            systemPrompt: "You are OmniAI, a helpful assistant for OmniPortal school management system. Keep responses concise." 
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'AI service unavailable');
        }

        const data = await response.json();

        const aiMessage = {
          role: 'ai',
          content: data.text || "I'm sorry, I couldn't process that request.",
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error: any) {
        console.error("AI Error:", error);
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: `Sorry, I encountered an error (Error: ${error?.message || 'Unknown'}). Please try again later.`, 
          timestamp: new Date() 
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="h-[600px] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">OmniAI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Always Online</span>
              </div>
            </div>
          </div>
          <button className="p-2 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-200">
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3 max-w-[80%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                msg.role === 'ai' ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              )}>
                {msg.role === 'ai' ? <Bot className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm shadow-sm",
                msg.role === 'ai' ? "bg-zinc-100 dark:bg-zinc-800 rounded-tl-none text-zinc-800 dark:text-zinc-200" : "bg-indigo-600 text-white rounded-tr-none"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none flex gap-1">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..." 
              className="w-full pl-4 pr-12 py-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white outline-none"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  },
};
