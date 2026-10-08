import React, { useState } from 'react';
import { 
  LayoutDashboard, Upload, Search, Sparkles, TrendingUp, AlertTriangle, 
  MessageSquare, FileText, Database, Bot, Bell, RefreshCw, Calendar, ChevronDown,
  DollarSign, Wallet, Users, Percent, AlertCircle, CheckCircle2, Lightbulb, Send,
  CloudUpload, Menu
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// --- MOCK DATA FOR CHARTS ---
const chartData = [
  { name: 'Jan', actual: 4000, forecast: 4000 },
  { name: 'Feb', actual: 5000, forecast: 5000 },
  { name: 'Mar', actual: 6000, forecast: 6000 },
  { name: 'Apr', actual: 7500, forecast: 7500 },
  { name: 'May', actual: 8200, forecast: 8200 },
  { name: 'Jun', actual: 9500, forecast: 9500 },
  { name: 'Jul', actual: 11000, forecast: 11000 },
  { name: 'Aug', actual: 11500, forecast: 11500 },
  { name: 'Sep', actual: 12840, forecast: 12840 },
  { name: 'Oct', actual: null, forecast: 13500 },
  { name: 'Nov', actual: null, forecast: 14200 },
  { name: 'Dec', actual: null, forecast: 15100 },
];

const sparklineData = [
  { value: 10 }, { value: 12 }, { value: 11 }, { value: 15 }, 
  { value: 14 }, { value: 18 }, { value: 17 }, { value: 20 }
];

export default function App() {
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [uploadedStats, setUploadedStats] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [anomaliesData, setAnomaliesData] = useState<any>(null);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [docUploadState, setDocUploadState] = useState(0);
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your BizInsight AI. Ask me any question about your uploaded business data.' }
  ]);

  React.useEffect(() => {
    // Fetch live dashboard metrics and chart data from the Python backend
    fetch('http://localhost:8000/dashboard')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setDashboardData(data);
      })
      .catch(err => console.error("Failed to fetch live dashboard data:", err));

    fetch('http://localhost:8000/anomalies')
      .then(res => res.json())
      .then(data => setAnomaliesData(data))
      .catch(err => console.error("Failed to fetch anomalies:", err));
      
    fetch('http://localhost:8000/insights')
      .then(res => res.json())
      .then(data => {
        if (data.insights) setInsightsData(data.insights);
      })
      .catch(err => console.error("Failed to fetch insights:", err));
  }, [uploadedStats]); // Re-fetch whenever a new file is uploaded

  const handleDocUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Simulate RAG pipeline animation sequence
    setDocUploadState(1); // File uploaded
    await new Promise(r => setTimeout(r, 800));
    setDocUploadState(2); // Text extracted
    await new Promise(r => setTimeout(r, 1200));
    setDocUploadState(3); // Chunks embedded
    await new Promise(r => setTimeout(r, 1500));
    
    // Call the actual backend API
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setUploadedStats(data); 
    } catch (err) {
      console.error(err);
    }
    
    setDocUploadState(4); // Ready
    
    // Reset after some time
    setTimeout(() => setDocUploadState(0), 4000);
  };

  const handleAsk = async (textOverride?: string) => {
    const textToAsk = typeof textOverride === 'string' ? textOverride : query;
    if (!textToAsk) return;
    
    const newHistory = [...chatHistory, { role: 'user', content: textToAsk }];
    setChatHistory(newHistory);
    setQuery('');
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:8000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToAsk })
      });
      const data = await res.json();
      setAiResponse(data.recommendation); // Keep for Overview widget
      setChatHistory([...newHistory, { role: 'assistant', content: data.recommendation }]);
    } catch (err) {
      setAiResponse("Failed to connect to ML service.");
      setChatHistory([...newHistory, { role: 'assistant', content: "Failed to connect to ML service." }]);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setUploadedStats(data);
      setActiveTab('Data Explorer');
    } catch (err) {
      console.error(err);
      alert("Failed to upload file to the ML service.");
    }
    setUploading(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100">
            <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">BizInsight AI</span>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
            <NavItem icon={<Upload size={18} />} label="Data Upload" active={activeTab === 'Data Upload'} onClick={() => setActiveTab('Data Upload')} />
            <NavItem icon={<Search size={18} />} label="Data Explorer" active={activeTab === 'Data Explorer'} onClick={() => setActiveTab('Data Explorer')} />
            <NavItem icon={<Sparkles size={18} />} label="AI Insights" active={activeTab === 'AI Insights'} onClick={() => setActiveTab('AI Insights')} />
            <NavItem icon={<TrendingUp size={18} />} label="Forecasting" active={activeTab === 'Forecasting'} onClick={() => setActiveTab('Forecasting')} />
            <NavItem icon={<AlertTriangle size={18} />} label="Anomalies" active={activeTab === 'Anomalies'} onClick={() => setActiveTab('Anomalies')} />
            
            <div className="pt-5 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Knowledge
            </div>
            <NavItem icon={<FileText size={18} />} label="Documents" active={activeTab === 'Documents'} onClick={() => setActiveTab('Documents')} />
            <NavItem icon={<Database size={18} />} label="RAG Knowledge Base" active={activeTab === 'RAG Knowledge Base'} onClick={() => setActiveTab('RAG Knowledge Base')} />
            <NavItem icon={<Bot size={18} />} label="AI Assistant" active={activeTab === 'AI Assistant'} onClick={() => setActiveTab('AI Assistant')} />
          </nav>
        </div>

        {/* Profile Section */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              PD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-700 truncate">Pranay Dighe</p>
              <p className="text-xs text-slate-500 truncate">Acme Retail Online</p>
            </div>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ask Lovable..." 
              className="w-full pl-3 pr-10 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            <Sparkles className="absolute right-3 top-2.5 text-slate-400" size={16} />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="h-20 bg-white/50 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {activeTab !== 'Overview' && (
              <button className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Menu size={24} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {activeTab === 'Overview' ? 'Business Overview' : activeTab === 'Data Upload' ? 'Upload Data' : activeTab}
              </h1>
              {activeTab === 'Overview' && (
                <p className="text-sm text-slate-500">AI-powered intelligence from your business data</p>
              )}
              {activeTab === 'Data Explorer' && (
                <p className="text-sm text-slate-500">Inspect schema, quality and structure of your dataset</p>
              )}
              {activeTab === 'AI Insights' && (
                <p className="text-sm text-slate-500">What the models found in your data</p>
              )}
              {activeTab === 'Forecasting' && (
                <p className="text-sm text-slate-500">Machine-learning forecasts with confidence ranges</p>
              )}
              {activeTab === 'Anomalies' && (
                <p className="text-sm text-slate-500">Unusual movements flagged across your business</p>
              )}
              {(activeTab === 'Documents' || activeTab === 'RAG Knowledge Base') && (
                <p className="text-sm text-slate-500">Documents powering retrieval-augmented AI answers</p>
              )}
              {activeTab === 'AI Assistant' && (
                <p className="text-sm text-slate-500">Ask questions about your business data</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50">
              <Calendar size={16} />
              <span>{dashboardData?.dateRange || "Live Data"}</span>
            </div>
            <button className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 shadow-sm transition-colors">
              <RefreshCw size={18} />
            </button>
            <button className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 shadow-sm transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-sm cursor-pointer hover:bg-primary/90 transition-colors">
              PD
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 max-w-7xl mx-auto space-y-6">
          
          {activeTab === 'Overview' ? (
            <>
              {/* Greeting */}
              <div className="mb-2">
                <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  Good morning, Pranay <span className="text-3xl">👋</span>
                </h2>
                <p className="text-slate-500 text-base">Business performance is looking strong this month.</p>
              </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard title="TOTAL REVENUE" value={dashboardData?.metrics?.total_revenue || "₹12.84M"} growth="+14.8%" icon={<DollarSign size={18} />} />
            <MetricCard title="TOTAL PROFIT" value={dashboardData?.metrics?.total_profit || "₹3.42M"} growth="+9.6%" icon={<Wallet size={18} />} />
            <MetricCard title="CUSTOMERS" value={dashboardData?.metrics?.customers || "48,291"} growth="+6.4%" icon={<Users size={18} />} />
            <MetricCard title="CONVERSION RATE" value={dashboardData?.metrics?.conversion_rate || "8.42%"} growth="+1.8%" icon={<Percent size={18} />} />
          </div>

          {/* AI Insight Banner */}
          <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-primary text-white p-3 rounded-xl shadow-md">
                <Sparkles size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-800">AI Business Insight</h2>
                  <span className="bg-purple-100 text-purple-700 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles size={10} /> AI Generated
                  </span>
                </div>
                <p className="text-slate-600">
                  Revenue increased <span className="font-bold text-green-600">14.8%</span> this month, primarily driven by stronger performance in the <span className="font-bold">West region</span> and <span className="font-bold">Product A</span>.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                View Analysis
              </button>
              <button className="px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-md hover:bg-primary/90 transition-colors">
                Ask AI
              </button>
            </div>
          </div>

          {/* Chart & Forecast Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Revenue Performance</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><div className="w-3 h-1 bg-primary rounded"></div> Actual</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-1 bg-primary/50 border border-primary border-dashed rounded"></div> Forecast</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-100 rounded-full"></div> Confidence range</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex bg-slate-100 p-1 rounded-lg text-sm mr-2">
                    <button className="px-3 py-1 bg-white shadow-sm rounded-md font-medium text-slate-800">Revenue</button>
                    <button className="px-3 py-1 text-slate-500 font-medium hover:text-slate-700">Profit</button>
                    <button className="px-3 py-1 text-slate-500 font-medium hover:text-slate-700">Customers</button>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-lg text-sm">
                    <button className="px-2 py-1 text-slate-500 font-medium hover:text-slate-700">7D</button>
                    <button className="px-2 py-1 bg-white shadow-sm rounded-md font-medium text-slate-800">30D</button>
                    <button className="px-2 py-1 text-slate-500 font-medium hover:text-slate-700">90D</button>
                    <button className="px-2 py-1 text-slate-500 font-medium hover:text-slate-700">1Y</button>
                  </div>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData?.chartData || chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}M`} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="forecast" stroke="#818cf8" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Forecast Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight">AI Sales Forecast</h3>
                      <p className="text-xs text-slate-500">Next 30 days</p>
                    </div>
                  </div>
                  <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-md">XGBoost</span>
                </div>
                
                <p className="text-sm text-slate-500 mb-1">Expected revenue</p>
                <h2 className="text-4xl font-bold text-slate-800 mb-6">
                  ₹{dashboardData?.chartData?.slice(-1)[0]?.forecast ? (dashboardData.chartData.slice(-1)[0].forecast / 1000000).toFixed(2) : "0.00"}M
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-xs text-green-700 mb-1 font-medium">Expected growth</p>
                    <p className="text-xl font-bold text-green-600">+8.2%</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs text-blue-700 mb-1 font-medium">Confidence</p>
                    <p className="text-xl font-bold text-blue-600">94%</p>
                  </div>
                </div>
              </div>
              <button className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-slate-700 border-t border-slate-100 hover:bg-slate-50 transition-colors mt-2">
                View Forecast Details <ChevronDown size={16} className="-rotate-90" />
              </button>
            </div>
          </div>

          {/* Regional Performance */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Regional Performance</h3>
            <p className="text-sm text-slate-500 mb-6">Revenue by region this month</p>
            
            <div className="space-y-6">
              {dashboardData?.regional_performance ? dashboardData.regional_performance.map((reg: any, i: number) => (
                <RegionBar key={i} region={reg.region} value={reg.value} growth={reg.growth || "+0%"} width={reg.width} profit={reg.profit} customers="12K" isNegative={reg.isNegative} />
              )) : (
                <div className="text-center text-slate-400 py-4">No regional data.</div>
              )}
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Top Products</h3>
                <p className="text-sm text-slate-500">Ranked by revenue</p>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Growth</th>
                  <th className="px-6 py-4">Profit</th>
                  <th className="px-6 py-4">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardData?.top_products ? dashboardData.top_products.map((prod: any, i: number) => (
                  <ProductRow key={i} {...prod} />
                )) : (
                  <tr><td colSpan={5} className="text-center text-slate-400 py-8">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Anomaly Detection */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Anomaly Detection</h3>
                <p className="text-sm text-slate-500">Isolation Forest · last 30 days</p>
              </div>
              <button className="text-sm font-bold text-primary hover:text-primary/80">View all</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                  <AlertCircle size={16} />
                </div>
                <div className="text-2xl font-bold text-slate-800">{anomaliesData?.critical?.length || 0}</div>
                <div className="text-sm text-slate-500">Critical</div>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-2">
                  <AlertTriangle size={16} />
                </div>
                <div className="text-2xl font-bold text-slate-800">{anomaliesData?.warnings?.length || 0}</div>
                <div className="text-sm text-slate-500">Warnings</div>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
                <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-2">
                  <CheckCircle2 size={16} />
                </div>
                <div className="text-2xl font-bold text-slate-800">OK</div>
                <div className="text-sm text-slate-500">Status</div>
              </div>
            </div>

            {anomaliesData?.critical?.length > 0 ? (
              <AnomalyAlert {...anomaliesData.critical[0]} />
            ) : anomaliesData?.warnings?.length > 0 ? (
              <AnomalyAlert {...anomaliesData.warnings[0]} isWarning />
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center text-slate-500">
                No recent anomalies detected.
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-6">
              <div className="bg-orange-50 p-2 rounded-lg text-orange-500">
                <Lightbulb size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">AI Recommendations</h3>
                <p className="text-sm text-slate-500">Prioritised by expected impact</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-lg">Increase West Region Inventory</h4>
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">87% confidence</span>
                </div>
                <p className="text-sm text-slate-500 mb-4">West region demand has increased 21% over the last 30 days.</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-green-600">+₹420K est. revenue</span>
                  <div className="flex gap-3">
                    <button className="text-sm font-medium text-slate-600 hover:text-slate-800">View Evidence</button>
                    <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-colors">Apply</button>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-lg">Investigate Product C Decline</h4>
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">81% confidence</span>
                </div>
                <p className="text-sm text-slate-500 mb-4">Product C revenue has declined for three consecutive periods.</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-green-600">Protect ₹2.9M line</span>
                  <div className="flex gap-3">
                    <button className="text-sm font-medium text-slate-600 hover:text-slate-800">View Evidence</button>
                    <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-colors">Apply</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BizInsight AI Assistant (RAG Chat) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-10 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-white p-2 rounded-lg">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">BizInsight AI Assistant</h3>
                  <p className="text-xs text-slate-500">Ask questions about your business data.</p>
                </div>
              </div>
              <span className="bg-purple-50 text-purple-600 text-xs font-bold px-3 py-1 rounded-full">RAG · 128 documents</span>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto space-y-6 mb-4 pr-2">
              {chatHistory.map((msg: any, i: number) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Sparkles size={14} />
                    </div>
                  )}
                  <div className={`${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'} px-5 py-4 rounded-2xl shadow-sm max-w-[85%]`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.sources && (
                      <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-400 font-medium">Sources:</span>
                        {msg.sources.map((src: string, j: number) => (
                          <span key={j} className="flex items-center gap-1 text-[11px] font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                            <FileText size={10} /> {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <Users size={16} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Sparkles size={14} />
                  </div>
                  <div className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-sm text-slate-400 italic">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Prompts */}
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              <button className="whitespace-nowrap px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full hover:bg-slate-50 hover:text-slate-800 transition-colors">Why did revenue fall?</button>
              <button className="whitespace-nowrap px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full hover:bg-slate-50 hover:text-slate-800 transition-colors">What should we improve?</button>
              <button className="whitespace-nowrap px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full hover:bg-slate-50 hover:text-slate-800 transition-colors">Forecast next month</button>
              <button className="whitespace-nowrap px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full hover:bg-slate-50 hover:text-slate-800 transition-colors">Which product is growing fastest?</button>
            </div>

            {/* Chat Input */}
            <div className="relative mt-2">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Bot className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="Ask anything about your business..." 
                className="w-full pl-12 pr-14 py-4 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-0 outline-none transition-colors shadow-sm"
              />
              <button 
                onClick={handleAsk}
                disabled={loading || !query}
                className="absolute inset-y-2 right-2 px-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          </>
          ) : activeTab === 'Data Upload' ? (
            <div className="max-w-4xl mx-auto space-y-6 pt-4">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Upload Business Data</h2>
                <p className="text-slate-500 text-base">Upload CSV or Excel files and let BizInsight AI analyze your business.</p>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-3xl p-3 shadow-sm">
                <div className="border-2 border-dashed border-indigo-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center py-20 px-4 transition-colors hover:bg-indigo-50/50 cursor-pointer">
                  
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-8 transform hover:scale-105 transition-transform">
                    <CloudUpload size={40} strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Drag & drop your file here</h3>
                  <p className="text-slate-400 mb-6 text-sm">or</p>
                  
                  <label className="px-8 py-3 bg-[#4f46e5] text-white font-semibold rounded-xl shadow-md hover:bg-[#4338ca] transition-colors mb-10 text-sm cursor-pointer">
                    {uploading ? "Uploading & Profiling Data..." : "Browse Files"}
                    <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  
                  <div className="flex gap-3 mb-8">
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-4 py-1.5 rounded-full">CSV</span>
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-4 py-1.5 rounded-full">XLSX</span>
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-4 py-1.5 rounded-full">XLS</span>
                  </div>
                  
                  <p className="text-slate-400 text-sm">Maximum file size: 200 MB</p>
                  
                </div>
              </div>
            </div>
          ) : activeTab === 'Data Explorer' ? (
            <div className="max-w-7xl mx-auto space-y-6 pt-2">
              
              {/* Top Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2 block">ROWS</span>
                  <div className="text-3xl font-bold text-slate-800">{uploadedStats?.rows?.toLocaleString() || "124,806"}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2 block">COLUMNS</span>
                  <div className="text-3xl font-bold text-slate-800">{uploadedStats?.columns || "8"}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2 block">MISSING VALUES</span>
                  <div className="text-3xl font-bold text-slate-800">{uploadedStats?.missing_pct || "0.6"}%</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2 block">DUPLICATES</span>
                  <div className="text-3xl font-bold text-slate-800">{uploadedStats?.duplicates?.toLocaleString() || "212"}</div>
                </div>
              </div>

              {/* Data Quality Score (full width or col-span-2) */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50/20 border border-slate-200 rounded-2xl p-5 shadow-sm md:w-1/2">
                <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2 block">DATA QUALITY SCORE</span>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold text-[#059669]">
                    {uploadedStats ? (100 - uploadedStats.missing_pct).toFixed(0) : "96"}
                  </span>
                  <span className="text-sm text-slate-500 font-bold">/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-[#059669] h-1.5 rounded-full" style={{ width: `${uploadedStats ? (100 - uploadedStats.missing_pct) : 96}%` }}></div>
                </div>
              </div>

              {/* Schema Table Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Schema</h3>
                  <p className="text-sm text-slate-500">uploaded_dataset · detected automatically</p>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input type="text" placeholder="Search columns..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary shadow-sm" />
                  </div>
                  <div className="flex gap-1 text-sm bg-slate-50 p-1 rounded-xl">
                    <button className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg font-bold shadow-sm text-slate-800">All</button>
                    <button className="px-4 py-1.5 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors">Numeric</button>
                    <button className="px-4 py-1.5 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors">Categorical</button>
                    <button className="px-4 py-1.5 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors">Date</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="border-b border-slate-100">
                      <tr className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-4 pr-6">COLUMN</th>
                        <th className="py-4 px-6">TYPE</th>
                        <th className="py-4 px-6">UNIQUE VALUES</th>
                        <th className="py-4 px-6">MISSING</th>
                        <th className="py-4 px-6 text-right">ROLE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {uploadedStats ? (
                        uploadedStats.schema.map((col: any, i: number) => (
                          <SchemaRow key={i} {...col} />
                        ))
                      ) : (
                        <>
                          <SchemaRow col="OrderDate" type="Date" unique="730" missing="0%" role="Date" roleColor="purple" />
                          <SchemaRow col="Revenue" type="Numeric" unique="12,492" missing="0%" role="Target" roleColor="blue" />
                          <SchemaRow col="Profit" type="Numeric" unique="11,870" missing="0.2%" isMissingWarning role="Feature" roleColor="gray" />
                          <SchemaRow col="Region" type="Categorical" unique="4" missing="0%" role="Feature" roleColor="gray" />
                          <SchemaRow col="Product" type="Categorical" unique="38" missing="0%" role="Feature" roleColor="gray" />
                          <SchemaRow col="CustomerID" type="Identifier" unique="48,291" missing="0%" role="ID" roleColor="yellow" />
                          <SchemaRow col="Channel" type="Categorical" unique="3" missing="1.4%" isMissingWarning role="Feature" roleColor="gray" />
                          <SchemaRow col="Discount" type="Numeric" unique="41" missing="3.1%" isMissingWarning role="Feature" roleColor="gray" />
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'AI Insights' ? (
            <div className="max-w-7xl mx-auto space-y-6 pt-2">
              
              {/* Executive Summary */}
              <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={20} className="text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-800">Executive Summary</h3>
                  <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ml-1">
                    AI Generated
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {insightsData?.executive_summary || "Upload a dataset to generate AI insights."}
                </p>
              </div>

              {/* Insights Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Key Drivers */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800">Key Drivers</h3>
                      <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">{insightsData?.key_drivers?.length || 0} insights</span>
                    </div>
                    <div className="space-y-4">
                      {insightsData?.key_drivers?.length > 0 ? (
                        insightsData.key_drivers.map((insight: any, i: number) => (
                          <InsightCard 
                            key={i}
                            title={insight.title} 
                            evidence={insight.evidence} 
                            impact={insight.impact} impactColor="red" confidence={`${insight.score}%`} 
                          />
                        ))
                      ) : (
                        <div className="text-sm text-slate-400 py-4 text-center">No key drivers detected.</div>
                      )}
                    </div>
                  </div>

                  {/* Negative Trends */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800">Negative Trends</h3>
                      <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">{insightsData?.negative_trends?.length || 0} insights</span>
                    </div>
                    <div className="space-y-4">
                      {insightsData?.negative_trends?.length > 0 ? (
                        insightsData.negative_trends.map((insight: any, i: number) => (
                          <InsightCard 
                            key={i}
                            title={insight.title} 
                            evidence={insight.evidence} 
                            impact={insight.impact} impactColor="yellow" confidence={`${insight.score}%`} 
                          />
                        ))
                      ) : (
                        <div className="text-sm text-slate-400 py-4 text-center">No negative trends detected.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Positive Trends */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800">Positive Trends</h3>
                      <span className="bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full">{insightsData?.positive_trends?.length || 0} insights</span>
                    </div>
                    <div className="space-y-4">
                      {insightsData?.positive_trends?.length > 0 ? (
                        insightsData.positive_trends.map((insight: any, i: number) => (
                          <InsightCard 
                            key={i}
                            title={insight.title} 
                            evidence={insight.evidence} 
                            impact={insight.impact} impactColor="green" confidence={`${insight.score}%`} 
                          />
                        ))
                      ) : (
                        <div className="text-sm text-slate-400 py-4 text-center">No positive trends detected.</div>
                      )}
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800">Opportunities</h3>
                      <span className="bg-purple-50 text-purple-600 text-xs font-bold px-2.5 py-1 rounded-full">{insightsData?.opportunities?.length || 0} insights</span>
                    </div>
                    <div className="space-y-4">
                      {insightsData?.opportunities?.length > 0 ? (
                        insightsData.opportunities.map((insight: any, i: number) => (
                          <InsightCard 
                            key={i}
                            title={insight.title} 
                            evidence={insight.evidence} 
                            impact={insight.impact} impactColor="purple" confidence={`${insight.score}%`} 
                          />
                        ))
                      ) : (
                        <div className="text-sm text-slate-400 py-4 text-center">No opportunities detected.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'Forecasting' ? (
            <div className="max-w-7xl mx-auto space-y-6 pt-2">
              
              {/* Controls */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-wrap gap-8 items-center justify-between">
                <div className="flex flex-wrap gap-12">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2 block">DATASET</span>
                    <span className="font-medium text-slate-800">{dashboardData?.documents?.[0]?.name || "Dataset"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2 block">TARGET</span>
                    <div className="flex bg-slate-50 p-1 rounded-xl text-sm border border-slate-100">
                      <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg font-bold text-slate-800">Revenue</button>
                      <button className="px-4 py-1.5 text-slate-500 font-medium hover:text-slate-700">Profit</button>
                      <button className="px-4 py-1.5 text-slate-500 font-medium hover:text-slate-700">Customers</button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2 block">HORIZON</span>
                    <div className="flex bg-slate-50 p-1 rounded-xl text-sm border border-slate-100">
                      <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg font-bold text-slate-800">7 days</button>
                      <button className="px-4 py-1.5 text-slate-500 font-medium hover:text-slate-700">30 days</button>
                      <button className="px-4 py-1.5 text-slate-500 font-medium hover:text-slate-700">90 days</button>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2 block md:text-right">BEST MODEL</span>
                  <span className="bg-purple-50 text-purple-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-purple-100">XGBoost · MAPE 4.2%</span>
                </div>
              </div>

              {/* Big Chart */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold text-slate-800">Revenue forecast · next 7 days</h3>
                  <div className="flex items-center gap-6 text-sm text-slate-500">
                    <span className="flex items-center gap-2"><div className="w-4 h-1 bg-primary rounded"></div> Actual</span>
                    <span className="flex items-center gap-2"><div className="w-4 h-1 bg-primary/50 border border-primary border-dashed rounded"></div> Forecast</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-100 rounded-full"></div> Confidence range</span>
                  </div>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData?.chartData || chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}M`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="forecast" stroke="#818cf8" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Model Comparison Table */}
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-8">
                <div className="p-8 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Model comparison</h3>
                  <p className="text-sm text-slate-500">Trained on 24 months, validated on last 3</p>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-8 py-4">MODEL</th>
                      <th className="px-8 py-4">MAPE</th>
                      <th className="px-8 py-4">RMSE</th>
                      <th className="px-8 py-4">R²</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {dashboardData?.models ? dashboardData.models.map((model: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-8 py-5 font-bold text-slate-800 flex items-center gap-2">
                          {model.name} {model.best && <span className="bg-green-50 text-green-600 text-[10px] px-2 py-0.5 rounded">Best</span>}
                        </td>
                        <td className="px-8 py-5 text-slate-600 font-medium">{model.mape}</td>
                        <td className="px-8 py-5 text-slate-600 font-medium">{model.rmse}</td>
                        <td className="px-8 py-5 text-slate-600 font-medium">{model.r2}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-8 py-5 text-slate-500 text-center">No models trained yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'Anomalies' ? (
            <div className="max-w-7xl mx-auto pt-2 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Critical Column */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h3 className="font-bold text-slate-800 text-xl mb-1">Critical</h3>
                <p className="text-sm text-slate-500 mb-8">Detected with Isolation Forest + seasonal baseline</p>
                
                <div className="space-y-4">
                  {anomaliesData?.critical?.length > 0 ? (
                    anomaliesData.critical.map((anomaly: any, i: number) => (
                      <AnomalyAlert key={i} {...anomaly} />
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400">No critical anomalies detected.</div>
                  )}
                </div>
              </div>

              {/* Warnings Column */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h3 className="font-bold text-slate-800 text-xl mb-1">Warnings</h3>
                <p className="text-sm text-slate-500 mb-8">Detected with Isolation Forest + seasonal baseline</p>
                
                <div className="space-y-4">
                  {anomaliesData?.warnings?.length > 0 ? (
                    anomaliesData.warnings.map((anomaly: any, i: number) => (
                      <AnomalyAlert key={i} {...anomaly} isWarning />
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400">No warnings detected.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (activeTab === 'Documents' || activeTab === 'RAG Knowledge Base') ? (
            <div className="max-w-7xl mx-auto space-y-6 pt-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-50 text-purple-600 p-2.5 rounded-2xl shadow-sm border border-purple-100">
                  <Database size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Company Knowledge</h2>
                  <p className="text-sm text-slate-500">Documents indexed for retrieval-augmented AI answers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Upload Column */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-lg mb-1">Upload documents</h3>
                  <p className="text-sm text-slate-500 mb-6">PDF, DOCX or TXT · max 25 MB</p>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center py-12 px-4 transition-colors hover:bg-indigo-50/50 cursor-pointer mb-8 relative">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                      <CloudUpload size={28} />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2">Drag & drop your file here</h4>
                    <p className="text-slate-400 text-sm mb-4">or</p>
                    <label className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-sm cursor-pointer">
                      {docUploadState > 0 ? "Processing..." : "Browse files"}
                      <input type="file" className="hidden" accept=".pdf,.txt,.csv" onChange={handleDocUpload} disabled={docUploadState > 0} />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className={`flex items-center gap-3 text-sm transition-opacity duration-500 ${docUploadState >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                      <CheckCircle2 size={18} className={docUploadState >= 1 ? "text-green-500" : "text-slate-400"} />
                      <span className={docUploadState >= 1 ? "text-slate-600 font-bold" : "text-slate-500 font-medium"}>File uploaded</span>
                    </div>
                    <div className={`flex items-center gap-3 text-sm transition-opacity duration-500 ${docUploadState >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                      <CheckCircle2 size={18} className={docUploadState >= 2 ? "text-green-500" : "text-slate-400"} />
                      <span className={docUploadState >= 2 ? "text-slate-600 font-bold" : "text-slate-500 font-medium"}>Text extracted</span>
                    </div>
                    <div className={`flex items-center gap-3 text-sm transition-opacity duration-500 ${docUploadState >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                      <CheckCircle2 size={18} className={docUploadState >= 3 ? "text-green-500" : "text-slate-400"} />
                      <span className={docUploadState >= 3 ? "text-slate-600 font-bold" : "text-slate-500 font-medium"}>Chunks embedded</span>
                    </div>
                    <div className={`flex items-center gap-3 text-sm transition-opacity duration-500 ${docUploadState >= 4 ? 'opacity-100' : 'opacity-30'}`}>
                      <CheckCircle2 size={18} className={docUploadState >= 4 ? "text-green-500" : "text-slate-400"} />
                      <span className={docUploadState >= 4 ? "text-slate-600 font-bold" : "text-slate-500 font-medium"}>Ready for RAG</span>
                    </div>
                  </div>
                </div>

                {/* Table Column */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm lg:col-span-2 overflow-hidden">
                  <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-1">Indexed documents</h3>
                      <p className="text-sm text-slate-500">5 documents · 368 chunks</p>
                    </div>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input type="text" placeholder="Search knowledge base..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary shadow-sm" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="px-6 py-4">DOCUMENT</th>
                          <th className="px-6 py-4">TYPE</th>
                          <th className="px-6 py-4">UPLOADED</th>
                          <th className="px-6 py-4">CHUNKS</th>
                          <th className="px-6 py-4">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {dashboardData?.documents ? dashboardData.documents.map((doc: any, i: number) => (
                          <DocumentRow key={i} {...doc} />
                        )) : (
                          <tr><td colSpan={5} className="py-8 text-center text-slate-500">No documents indexed yet. Upload a dataset to begin.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'AI Assistant' ? (
            <div className="max-w-5xl mx-auto pt-2">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col h-[calc(100vh-12rem)]">
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xl mb-1">BizInsight AI Assistant</h3>
                    <p className="text-sm text-slate-500">Ask questions about your business data.</p>
                  </div>
                  <span className="bg-purple-50 text-purple-600 text-xs font-bold px-4 py-1.5 rounded-full border border-purple-100">RAG enabled</span>
                </div>
    
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto space-y-8 mb-6 pr-4">
                  {chatHistory.map((msg: any, i: number) => (
                    msg.role === 'user' ? (
                      <div key={i} className="flex justify-end items-start gap-4">
                        <div className="bg-[#4f46e5] text-white px-6 py-4 rounded-3xl rounded-tr-sm shadow-sm max-w-[80%] text-sm font-medium">
                          {msg.content}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Users size={18} />
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="flex justify-start items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#4f46e5] text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                          <Sparkles size={18} />
                        </div>
                        <div className="bg-white border border-slate-200 px-6 py-5 rounded-3xl rounded-tl-sm shadow-sm max-w-[85%] text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    )
                  ))}
    
                  {loading && (
                    <div className="flex justify-start items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#4f46e5] text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                        <Sparkles size={18} />
                      </div>
                      <div className="bg-slate-50 border border-slate-100 px-6 py-5 rounded-3xl rounded-tl-sm text-slate-400 italic text-sm">
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>
    
                {/* Suggested Prompts */}
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-2">
                  <button onClick={() => handleAsk("Why did revenue fall?")} className="whitespace-nowrap px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-colors shadow-sm">Why did revenue fall?</button>
                  <button onClick={() => handleAsk("What should we improve?")} className="whitespace-nowrap px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-colors shadow-sm">What should we improve?</button>
                  <button onClick={() => handleAsk("Forecast next month")} className="whitespace-nowrap px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-colors shadow-sm">Forecast next month</button>
                  <button onClick={() => handleAsk("Which product is growing fastest?")} className="whitespace-nowrap px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-colors shadow-sm">Which product is growing fastest?</button>
                </div>

                {/* Chat Input */}
                <div className="relative mt-auto">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Bot className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder="Ask anything about your business..." 
                    className="w-full pl-12 pr-14 py-4 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-0 outline-none transition-colors shadow-sm"
                  />
                  <button 
                    onClick={handleAsk}
                    disabled={loading || !query}
                    className="absolute inset-y-2 right-2 px-3 bg-[#4f46e5] text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <LayoutDashboard size={40} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">The {activeTab} section is empty</h2>
              <p className="text-slate-500 max-w-sm text-center">
                This section has not been populated with data yet. Select "Overview" to see the full dashboard.
              </p>
              <button 
                onClick={() => setActiveTab('Overview')}
                className="mt-6 px-6 py-2 bg-primary text-white font-medium rounded-lg shadow-md hover:bg-primary/90 transition-colors"
              >
                Return to Overview
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function MetricCard({ title, value, growth, icon }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">{title}</span>
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-3xl font-bold text-slate-800 mb-2">{value}</h3>
        <div className="flex items-center gap-2">
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
            ↗ {growth}
          </span>
          <span className="text-xs text-slate-400">vs previous month</span>
        </div>
      </div>
      <div className="h-10 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, badge, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        active 
          ? 'bg-blue-50/70 text-[#3b82f6] font-medium' 
          : 'text-[#475569] hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {badge && (
        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider">
          {badge}
        </span>
      )}
    </div>
  );
}

function RegionBar({ region, value, growth, width, profit, customers, isNegative = false }: any) {
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="font-bold text-slate-800 text-sm">{region}</span>
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800">₹{value}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${isNegative ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {isNegative ? '↘' : '↗'} {growth}
          </span>
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex mb-1">
        <div className={`h-full rounded-full ${isNegative ? 'bg-red-500' : 'bg-primary'}`} style={{ width }}></div>
      </div>
      <div className="flex gap-4 text-[11px] text-slate-500">
        <span>Profit ₹{profit}</span>
        <span>Customers {customers}</span>
      </div>
    </div>
  );
}

function ProductRow({ name, category, revenue, growth, profit, isNegative = false }: any) {
  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
      <td className="px-6 py-4">
        <p className="font-bold text-slate-800 text-sm">{name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{category}</p>
      </td>
      <td className="px-6 py-4 font-bold text-slate-800">₹{revenue}</td>
      <td className="px-6 py-4">
        <span className={`text-xs font-bold px-2 py-1 rounded ${isNegative ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {isNegative ? '↘' : '↗'} {growth}
        </span>
      </td>
      <td className="px-6 py-4 text-slate-600 font-medium">₹{profit}</td>
      <td className="px-6 py-4">
        <div className="h-6 w-16 opacity-70">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={sparklineData}>
               <Line type="monotone" dataKey="value" stroke={isNegative ? '#ef4444' : '#22c55e'} strokeWidth={2} dot={false} />
             </LineChart>
           </ResponsiveContainer>
        </div>
      </td>
    </tr>
  );
}

function SchemaRow({ col, type, unique, missing, isMissingWarning, role, roleColor }: any) {
  const getRoleStyle = (color: string) => {
    switch(color) {
      case 'purple': return 'bg-purple-50 text-purple-600';
      case 'blue': return 'bg-blue-50 text-blue-600';
      case 'yellow': return 'bg-yellow-50 text-yellow-600';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
      <td className="py-4 pr-6 font-bold text-slate-800">{col}</td>
      <td className="py-4 px-6 text-slate-600">{type}</td>
      <td className="py-4 px-6 font-medium text-slate-800">{unique}</td>
      <td className={`py-4 px-6 font-bold ${isMissingWarning ? 'text-orange-500' : 'text-slate-800'}`}>{missing}</td>
      <td className="py-4 px-6 text-right">
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${getRoleStyle(roleColor)}`}>
          {role}
        </span>
      </td>
    </tr>
  );
}

function InsightCard({ title, evidence, impact, impactColor, confidence }: any) {
  const getImpactStyle = (color: string) => {
    switch(color) {
      case 'red': return 'bg-red-50 text-red-500';
      case 'yellow': return 'bg-yellow-50 text-yellow-600';
      case 'green': return 'bg-green-50 text-green-600';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <div className="border border-slate-100 rounded-2xl p-5 hover:border-indigo-100 transition-colors shadow-sm bg-white">
      <h4 className="font-bold text-slate-800 mb-1 leading-snug">{title}</h4>
      <p className="text-sm text-slate-500 mb-4"><span className="font-medium text-slate-600">Evidence:</span> {evidence}</p>
      
      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getImpactStyle(impactColor)}`}>
          Impact: {impact}
        </span>
        <div className="flex-1 bg-slate-100 rounded-full h-1.5 flex items-center">
          <div className="bg-[#4f46e5] h-1.5 rounded-full" style={{ width: confidence }}></div>
        </div>
        <span className="text-xs font-bold text-slate-600 w-8 text-right">{confidence}</span>
      </div>
    </div>
  );
}

function AnomalyAlert({ title, subtitle, actual, expected, deviation, isWarning = false }: any) {
  return (
    <div className={`${isWarning ? 'bg-orange-50 border-orange-100' : 'bg-red-50 border-red-100'} border rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4`}>
      <div className="flex gap-4 items-start w-full md:w-auto">
        <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border mt-0.5 ${isWarning ? 'text-orange-500 border-orange-100' : 'text-red-500 border-red-100'}`}>
          {isWarning ? <AlertTriangle size={16} /> : <AlertCircle size={16} />}
        </div>
        <div>
          <h4 className="font-bold text-slate-800">{title}</h4>
          <p className="text-sm text-slate-500 mb-4">{subtitle}</p>
          <div className="flex gap-12">
            <div>
              <p className="text-xs text-slate-500 mb-1">Actual</p>
              <p className="font-bold text-slate-800">{actual}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Expected</p>
              <p className="font-bold text-slate-800">{expected}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Deviation</p>
              <p className={`font-bold ${isWarning ? 'text-orange-500' : 'text-red-500'}`}>{deviation}</p>
            </div>
          </div>
        </div>
      </div>
      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-colors shrink-0">
        Investigate
      </button>
    </div>
  );
}

function DocumentRow({ name, type, uploaded, chunks, status }: any) {
  const getStatusStyle = (s: string) => {
    if (s.includes('Processed')) return 'bg-green-100 text-green-700';
    if (s.includes('Indexing')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-0">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
            <FileText size={16} />
          </div>
          <span className="font-bold text-slate-800 text-sm">{name}</span>
        </div>
      </td>
      <td className="px-6 py-5 text-slate-500 text-sm font-medium">{type}</td>
      <td className="px-6 py-5 text-slate-500 text-sm">{uploaded}</td>
      <td className="px-6 py-5 font-bold text-slate-800 text-sm">{chunks}</td>
      <td className="px-6 py-5">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${getStatusStyle(status)}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}
