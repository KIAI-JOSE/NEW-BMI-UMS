import React, { useState, useMemo } from 'react';
import { 
  FileBarChart, 
  TrendingUp, 
  Users, 
  Wallet, 
  Calendar, 
  Download, 
  Filter, 
  Target, 
  ChevronRight, 
  Award, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Activity, 
  Zap, 
  Bot, 
  Loader2, 
  ShieldCheck,
  Printer,
  Maximize2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { getGeminiResponse } from '../services/geminiService';

const Reports: React.FC = () => {
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [activeRange, setActiveRange] = useState('Fiscal Year 2024');

  const enrollmentData = [
    { name: 'Theology', val: 450, growth: 12, faculty: 15 },
    { name: 'ICT', val: 890, growth: 28, faculty: 22 },
    { name: 'Business', val: 1200, growth: 5, faculty: 30 },
    { name: 'Education', val: 1007, growth: 18, faculty: 25 },
  ];

  const financialTrend = [
    { month: 'Jan', revenue: 120000, expenses: 95000 },
    { month: 'Feb', revenue: 145000, expenses: 102000 },
    { month: 'Mar', revenue: 210000, expenses: 140000 },
    { month: 'Apr', revenue: 190000, expenses: 135000 },
    { month: 'May', revenue: 250000, expenses: 180000 },
    { month: 'Jun', revenue: 389000, expenses: 210000 },
  ];

  const departmentalAllocation = [
    { name: 'Academic Faculty', value: 45, color: '#4B0082' },
    { name: 'Infrastructure', value: 25, color: '#FFD700' },
    { name: 'Research & Dev', value: 20, color: '#6A0DAD' },
    { name: 'Student Services', value: 10, color: '#FDB931' },
  ];

  const COLORS = ['#4B0082', '#FFD700', '#6A0DAD', '#FDB931'];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async (elementId: string = 'reports-page-container') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.classList.add('pdf-export-active');

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `BMI_Strategic_Report_${activeRange.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      pagebreak: { mode: ['css', 'legacy'] },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        letterRendering: true,
        backgroundColor: '#FFFFFF',
        windowWidth: 1200
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
    };

    try {
      const html2pdfModule = await import('https://esm.sh/html2pdf.js@0.10.1?bundle');
      const html2pdf = html2pdfModule.default;
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Export error:", err);
      window.print();
    } finally {
      element.classList.remove('pdf-export-active');
    }
  };

  const generateStrategicReport = async () => {
    setIsGeneratingAiReport(true);
    const dataString = JSON.stringify({ enrollmentData, financialTrend });
    const prompt = `Based on the following institutional data, provide a high-level strategic executive summary for BMI University's Board of Directors. 
    Analyze enrollment trends, financial health (revenue vs expenses), and provide 3 actionable recommendations for Q3. 
    Data: ${dataString}. 
    Follow the formatting rules: Plain text only, headers ending with colons on their own lines. Use official signature.`;
    
    const response = await getGeminiResponse(prompt, "Board-level Strategic Advisor Mode");
    setAiReport(response);
    setIsGeneratingAiReport(false);
  };

  return (
    <div id="reports-page-container" className="p-8 space-y-8 animate-fade-in pb-20 bg-[#F8F9FA] dark:bg-gray-950 print:bg-white overflow-visible">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 dark:border-gray-800 pb-8 no-print">
        <div>
           <div className="flex items-center gap-4 mb-2">
             <div className="w-3 h-12 bg-[#FFD700] rounded-none"></div>
             <h2 className="text-3xl font-bold text-[#2E004F] dark:text-white tracking-tight uppercase">Strategic Analytics Hub</h2>
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-7 uppercase tracking-widest">Institutional KPI Monitoring • {activeRange}</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={activeRange} 
            onChange={(e) => setActiveRange(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-[#4B0082] shadow-sm"
          >
            <option>Fiscal Year 2024</option>
            <option>Academic Cycle 2023</option>
            <option>Q1 Performance</option>
          </select>
          <button 
            onClick={() => handleDownloadPdf()}
            className="flex items-center gap-2 px-6 py-3 bg-[#4B0082] text-white rounded-none shadow-xl hover:bg-black transition-all font-black text-[11px] uppercase tracking-widest border border-[#FFD700]/30"
          >
            <Download size={16} className="text-[#FFD700]" /> Export Full Report
          </button>
        </div>
      </div>

      {/* Page Break for Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pdf-section">
        {[
          { label: 'Annual Revenue', val: '$4.2M', trend: '+14.2%', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Retention Index', val: '98.4%', trend: '+0.5%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Research Grants', val: '42 Nodes', trend: '+8.0%', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Operational Efficiency', val: '92%', trend: '+3.1%', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group print:p-4 print:border">
            <div className="flex justify-between items-start mb-4 print:mb-2">
              <div className={`p-3 rounded-none ${stat.bg} dark:bg-gray-700 ${stat.color} print:p-1`}>
                <stat.icon size={20} className="print:size-4" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.trend}</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest print:text-[8px]">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1 uppercase print:text-lg">{stat.val}</p>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-50 dark:bg-gray-700 print:hidden">
               <div className={`h-full ${stat.color.replace('text', 'bg')} opacity-50`} style={{ width: '70%' }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts - Forced layout for PDF */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pdf-section">
        
        {/* Financial Flow Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm print:mb-8 print:p-4 print:border overflow-hidden">
           <div className="flex justify-between items-center mb-8 print:mb-4">
              <h3 className="font-black text-xs uppercase tracking-[0.25em] text-[#4B0082] dark:text-purple-300 flex items-center gap-2">
                 <TrendingUp size={16} /> Revenue vs Expenditure Analysis
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 no-print">
                 <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#4B0082] rounded-full"></span> Revenue</div>
                 <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#FFD700] rounded-full"></span> Expenses</div>
              </div>
           </div>
           <div className="h-80 w-full pdf-chart-fixed overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialTrend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4B0082" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4B0082" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9CA3AF'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9CA3AF'}} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '0', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    cursor={{ stroke: '#4B0082', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4B0082" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" stroke="#FFD700" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Budget Allocation Pie */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col print:p-4 print:border overflow-hidden">
           <h3 className="font-black text-xs uppercase tracking-[0.25em] text-[#4B0082] dark:text-purple-300 flex items-center gap-2 mb-8 print:mb-4">
              <PieChartIcon size={16} /> Resource Utilization
           </h3>
           <div className="flex-1 flex flex-col justify-center items-center">
              <div className="h-64 w-full relative pdf-chart-fixed overflow-hidden">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie 
                        data={departmentalAllocation} 
                        innerRadius={60} 
                        outerRadius={85} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                       >
                          {departmentalAllocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Budget</p>
                    <p className="text-xl font-black text-[#4B0082] dark:text-white print:text-black">$2.8M</p>
                 </div>
              </div>
              <div className="w-full space-y-3 mt-8 print:mt-4">
                 {departmentalAllocation.map((item, i) => (
                   <div key={i} className="flex justify-between items-center group cursor-default">
                      <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: item.color }}></div>
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-gray-900 dark:text-white print:text-black">{item.value}%</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Departmental Performance Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm print:p-4 print:border overflow-hidden">
           <div className="flex justify-between items-center mb-8 print:mb-4">
              <h3 className="font-black text-xs uppercase tracking-[0.25em] text-[#4B0082] dark:text-purple-300 flex items-center gap-2">
                 <BarChart3 size={16} /> Departmental Intake
              </h3>
              <button className="p-2 text-gray-400 hover:text-[#4B0082] transition-colors no-print"><Maximize2 size={16}/></button>
           </div>
           <div className="h-64 w-full pdf-chart-fixed overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={enrollmentData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#4B0082'}} width={80} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                    <Bar dataKey="val" radius={[0, 4, 4, 0]}>
                       {enrollmentData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700 grid grid-cols-2 gap-4 print:mt-4 print:pt-2">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 print:bg-white print:border">
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Highest Growth</p>
                 <p className="text-xs font-black text-emerald-600 uppercase">ICT Department (+28%)</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 print:bg-white print:border">
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Critical Resource</p>
                 <p className="text-xs font-black text-amber-600 uppercase">Faculty Load</p>
              </div>
           </div>
        </div>

        {/* Strategic AI Insights Panel - Forced to stack correctly in PDF */}
        <div className="lg:col-span-2 bg-[#1a0033] rounded-none border border-[#FFD700]/30 shadow-2xl overflow-hidden flex flex-col min-h-[400px] print:min-h-0 print:border print:bg-white print:shadow-none pdf-section pdf-page-break">
           <div className="p-6 bg-gray-900 border-b border-[#FFD700]/20 flex justify-between items-center no-print">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-[#4B0082] text-[#FFD700] shadow-lg">
                    <Bot size={24} />
                 </div>
                 <div>
                    <h3 className="text-white font-black text-xs uppercase tracking-[0.25em]">BMI Strategic Insight Matrix</h3>
                    <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Generative Intelligence Engine Active</p>
                 </div>
              </div>
              {!aiReport && (
                <button 
                  onClick={generateStrategicReport}
                  disabled={isGeneratingAiReport}
                  className="px-6 py-2.5 bg-[#FFD700] text-[#4B0082] font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl flex items-center gap-2"
                >
                  {isGeneratingAiReport ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  Generate Board Report
                </button>
              )}
           </div>

           <div className="flex-1 p-8 overflow-visible relative print:p-6" id="strategic-report-content">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none select-none print:hidden">
                 <Activity size={300} />
              </div>

              {aiReport ? (
                <div className="space-y-6 relative z-10 print:space-y-4 overflow-visible">
                   <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-8 no-print">
                      <div className="flex items-center gap-2">
                         <ShieldCheck size={16} className="text-emerald-500" />
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Institutional Insight</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handlePrint} className="p-2 text-gray-500 hover:text-[#FFD700] transition-colors" title="Print Matrix"><Printer size={16}/></button>
                        <button onClick={() => handleDownloadPdf('strategic-report-content')} className="p-2 text-gray-500 hover:text-[#FFD700] transition-colors" title="Download Matrix PDF"><Download size={16}/></button>
                        <button onClick={() => setAiReport('')} className="p-2 text-gray-500 hover:text-red-400 transition-colors ml-2"><ChevronRight size={16} className="rotate-90"/></button>
                      </div>
                   </div>
                   <div className="prose prose-invert prose-sm max-w-none print:prose-neutral overflow-visible">
                      <div className="p-10 bg-white/5 border border-white/10 rounded-none print:bg-white print:text-black print:p-0 print:border-none pdf-ai-text overflow-visible">
                        <h4 className="hidden print:block text-[#4B0082] font-black uppercase tracking-widest mb-6 border-b pb-4">BMI Strategic Insight Matrix - Executive Summary</h4>
                        {aiReport.split('\n').map((line, idx) => {
                          const trimmed = line.trim();
                          const isHeader = trimmed.endsWith(':') || 
                                         trimmed.startsWith('In Excellence') || 
                                         trimmed.startsWith('Office of') || 
                                         trimmed.startsWith('BMI University');
                          
                          return (
                            <div key={idx} className={`${isHeader ? 'font-black text-[#FFD700] print:text-[#4B0082] mt-6 first:mt-0 uppercase tracking-tight' : 'text-purple-100 print:text-gray-800 font-medium leading-relaxed mb-2'} text-sm`}>
                              {line || '\u00A0'}
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 no-print">
                   {isGeneratingAiReport ? (
                     <div className="space-y-4">
                        <div className="w-16 h-16 bg-[#4B0082] rounded-none mx-auto flex items-center justify-center">
                           <Loader2 size={32} className="text-[#FFD700] animate-spin" />
                        </div>
                        <p className="text-sm font-black text-white uppercase tracking-[0.2em] animate-pulse">Aggregating Institutional Metrics...</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Consulting Academic Registry & Financial Ledgers</p>
                     </div>
                   ) : (
                     <div className="max-w-md space-y-6">
                        <div className="p-6 bg-[#4B0082]/20 border border-purple-500/20">
                           <Bot size={48} className="text-purple-400 mx-auto mb-4" />
                           <h4 className="text-white font-black uppercase tracking-widest mb-2">Awaiting Analysis Protocol</h4>
                           <p className="text-xs text-gray-400 leading-relaxed font-medium">
                              Initiate the Strategic Insight engine to generate an automated executive summary for current institutional performance parameters.
                           </p>
                        </div>
                        <button 
                          onClick={generateStrategicReport}
                          className="px-10 py-4 border-2 border-dashed border-purple-500/50 text-purple-400 font-black text-xs uppercase tracking-[0.3em] hover:border-[#FFD700] hover:text-[#FFD700] transition-all"
                        >
                           Authorize Protocol Capture
                        </button>
                     </div>
                   )}
                </div>
              )}
           </div>

           {aiReport && (
             <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-center gap-4 no-print">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Global Encryption Level: BMI-SEC-9</span>
                <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Model: Gemini 3 Flash Preview</span>
             </div>
           )}
        </div>

      </div>

      {/* Institutional Resource Allocation Table - Forced new page */}
      <div className="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden print:border print:mt-10 pdf-page-break pdf-section">
         <div className="p-6 bg-gray-900 text-white flex justify-between items-center print:bg-white print:text-black print:border-b print:p-4">
            <h3 className="font-black text-xs uppercase tracking-[0.25em] flex items-center gap-2">
               <ShieldCheck size={16} className="text-[#FFD700] print:text-[#4B0082]" /> Resource Efficiency Matrix
            </h3>
            <span className="text-[9px] font-bold text-gray-400 uppercase print:text-[8px]">Registry Audit Index v8.2</span>
         </div>
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 print:bg-gray-50 print:text-gray-900">
                     <th className="px-6 py-4 print:px-2 print:py-2">Department</th>
                     <th className="px-6 py-4 text-center print:px-2 print:py-2">Density</th>
                     <th className="px-6 py-4 text-center print:px-2 print:py-2">Faculty</th>
                     <th className="px-6 py-4 text-center print:px-2 print:py-2">Delta</th>
                     <th className="px-6 py-4 text-center print:px-2 print:py-2">Growth</th>
                     <th className="px-6 py-4 text-right no-print">Audit Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 dark:divide-gray-800 print:divide-gray-100">
                  {enrollmentData.map((dept, i) => (
                    <tr key={i} className="hover:bg-purple-50/20 dark:hover:bg-gray-700/20 transition-all group print:bg-white">
                       <td className="px-6 py-4 print:px-2 print:py-2">
                          <div className="flex items-center gap-3">
                             <div className="w-1 h-8 bg-[#4B0082] print:h-4"></div>
                             <div>
                                <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight print:text-xs print:text-black">{dept.name}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest print:hidden">Academic Faculty Node</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-center print:px-2 print:py-2">
                          <p className="text-sm font-black text-gray-700 dark:text-gray-300 print:text-xs print:text-black">{dept.val}</p>
                       </td>
                       <td className="px-6 py-4 text-center print:px-2 print:py-2">
                          <p className="text-sm font-black text-gray-700 dark:text-gray-300 print:text-xs print:text-black">{dept.faculty}</p>
                       </td>
                       <td className="px-6 py-4 text-center print:px-2 print:py-2">
                          <div className="flex flex-col items-center">
                             <span className="text-[11px] font-black text-gray-900 dark:text-white print:text-xs print:text-black">{(dept.val / dept.faculty).toFixed(1)} : 1</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-center print:px-2 print:py-2">
                          <span className={`px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-widest border ${
                             dept.growth > 15 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          } print:bg-white print:text-black print:border-none`}>
                             +{dept.growth}%
                          </span>
                       </td>
                       <td className="px-6 py-4 text-right no-print">
                          <button className="p-2 text-gray-300 hover:text-[#4B0082] transition-colors"><ChevronRight size={18}/></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
      
      {/* Footer Legend */}
      <div className="bg-gray-900 p-6 text-white border-l-4 border-[#FFD700] shadow-2xl flex items-center gap-6 print:bg-gray-50 print:text-black print:border print:mt-10 pdf-section">
         <div className="p-2 bg-[#FFD700] text-black no-print">
            <ShieldCheck size={20} />
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed max-w-4xl print:text-[8px] print:tracking-normal">
            This analytics dashboard is synchronized with the BMI Global ERP Network. Data latency is restricted to &lt; 300ms. All charts are dynamically generated based on verified institutional registry nodes. Authorized by BMI Institutional Registrar.
         </p>
      </div>

      <style>{`
        @media print, .pdf-export-active {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; color: black !important; overflow: visible !important; }
          #reports-page-container { background: white !important; padding: 15mm !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; display: block !important; overflow: visible !important; }
          
          /* Force standard document flow to prevent overlaps */
          .grid, .pdf-section { display: block !important; width: 100% !important; position: static !important; clear: both !important; margin-bottom: 40px !important; }
          
          /* Ensure all grid children take full width in print mode to stack vertically */
          .pdf-section > div { width: 100% !important; display: block !important; margin-bottom: 40px !important; max-width: 100% !important; page-break-inside: avoid !important; }
          
          /* Specific reset for grid classes to avoid specificity issues */
          .lg\\:col-span-2, .lg\\:col-span-3, .md\\:grid-cols-4, .lg\\:grid-cols-3 { width: 100% !important; display: block !important; margin-bottom: 20px !important; }
          
          /* Prevent items from breaking mid-content */
          .bg-white, .pdf-ai-panel { page-break-inside: avoid !important; break-inside: avoid !important; position: relative !important; }
          
          .bg-white, .bg-gray-50, .bg-[#F8F9FA], .dark\\:bg-gray-950, .dark\\:bg-gray-800, .dark\\:bg-gray-900, .bg-gray-900 { 
            background-color: white !important; 
            border: 0.5pt solid #ddd !important;
            color: black !important;
            box-shadow: none !important;
          }
          
          /* Specialized AI Text Styling for PDF */
          .pdf-ai-panel { background: white !important; border: 1.5pt solid #4B0082 !important; min-height: auto !important; height: auto !important; overflow: visible !important; }
          .pdf-ai-text { background: transparent !important; border: none !important; padding: 20px !important; height: auto !important; overflow: visible !important; display: block !important; }
          .text-purple-100, .text-white, .text-gray-400, .text-gray-500 { color: #222 !important; }
          .text-[#FFD700] { color: #4B0082 !important; font-weight: 900 !important; border-bottom: 1pt solid #eee; margin-bottom: 10pt; display: block; }
          
          /* Constant height for charts during render */
          .pdf-chart-fixed { height: 420px !important; width: 100% !important; min-height: 420px !important; position: relative !important; margin: 10px 0 !important; overflow: hidden !important; }
          .recharts-responsive-container { width: 100% !important; height: 420px !important; min-width: 100% !important; }
          .recharts-wrapper { width: 100% !important; height: 420px !important; }
          svg { width: 100% !important; height: 420px !important; }
          
          /* Section Breaks */
          .pdf-page-break { page-break-before: always !important; break-before: page !important; margin-top: 50px !important; }
          
          .animate-fade-in { animation: none !important; }
          .shadow-2xl, .shadow-xl, .shadow-sm { box-shadow: none !important; }
          
          /* Remove floating elements and overlays */
          .absolute, .fixed { position: static !important; }
          .opacity-\\[0\\.03\\], .opacity-50 { opacity: 1 !important; visibility: visible !important; }
          
          /* Ensure text colors are dark for readability */
          .text-[#4B0082], .text-[#2E004F] { color: #4B0082 !important; }
        }
      `}</style>
    </div>
  );
};

export default Reports;