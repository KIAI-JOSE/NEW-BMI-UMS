import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, 
  Briefcase, 
  GraduationCap, 
  Mail, 
  MapPin, 
  Search, 
  Filter, 
  Share2, 
  Plus, 
  X, 
  CheckCircle2, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Star, 
  ExternalLink, 
  Bot, 
  Loader2, 
  Globe, 
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { getGeminiResponse } from '../services/geminiService';
import { Student } from '../types';

interface AlumniMember {
  id: string;
  name: string;
  classYear: string;
  course: string;
  occupation: string;
  location: string;
  achievements: string;
  email: string;
  linkedIn?: string;
  isHallOfFame: boolean;
}

interface AlumniProps {
  students?: Student[];
}

const Alumni: React.FC<AlumniProps> = ({ students = [] }) => {
  const [alumni, setAlumni] = useState<AlumniMember[]>(() => {
    const saved = localStorage.getItem('bmi_data_alumni');
    return saved ? JSON.parse(saved) : [
      { id: 'ALM-101', name: 'Dr. Jane Okumu', classYear: '2018', course: 'B.Ed. Educational Leadership', occupation: 'High School Principal', location: 'Nairobi, Kenya', achievements: 'National Best Teacher Award 2022 winner for ICT integration.', email: 'j.okumu@alumni.bmi.edu', isHallOfFame: true },
      { id: 'ALM-102', name: 'Eng. Kevin Omondi', classYear: '2019', course: 'Diploma in ICT Architecture', occupation: 'Senior Architect at Safaricom', location: 'London, UK', achievements: 'Pioneered regional cloud infrastructure for fintech applications.', email: 'k.omondi@alumni.bmi.edu', isHallOfFame: false },
      { id: 'ALM-103', name: 'Rev. Peter Kamau', classYear: '2015', course: 'B.A. Systematic Theology', occupation: 'Senior Pastor', location: 'Houston, USA', achievements: 'Published "Modern Faith" - a best-selling theological critique.', email: 'p.kamau@alumni.bmi.edu', isHallOfFame: true },
      { id: 'ALM-104', name: 'Sarah Wilson', classYear: '2021', course: 'B.A. Business Administration', occupation: 'Strategic Consultant', location: 'Cape Town, SA', achievements: 'Founded "Youth in Tech" NGO reaching 5,000+ students.', email: 's.wilson@alumni.bmi.edu', isHallOfFame: false },
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('All Years');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [editingAlumnus, setEditingAlumnus] = useState<AlumniMember | null>(null);
  const [toast, setToast] = useState<{show: boolean, msg: string}>({ show: false, msg: '' });
  
  const [formData, setFormData] = useState<Partial<AlumniMember>>({
    name: '', classYear: '2023', course: '', occupation: '', location: '', achievements: '', email: '', isHallOfFame: false
  });

  // Sync Logic: Integrate students marked as 'Graduated' into the Alumni database
  useEffect(() => {
    const graduatedStudents = students.filter(s => s.status === 'Graduated');
    const newAlumniFromSync: AlumniMember[] = [];

    graduatedStudents.forEach(s => {
      // Check if student is already in the alumni registry (by ID)
      if (!alumni.some(a => a.id === s.id)) {
        newAlumniFromSync.push({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          classYear: (parseInt(s.admissionYear) + 4).toString(), // Projected completion year
          course: s.department || s.faculty,
          occupation: 'Awaiting Alumni Record Update',
          location: 'Seeking Placement',
          achievements: 'Successfully completed institutional requirements for graduation from BMI University.',
          email: s.email,
          isHallOfFame: false
        });
      }
    });

    if (newAlumniFromSync.length > 0) {
      setAlumni(prev => [...prev, ...newAlumniFromSync]);
      showToast(`${newAlumniFromSync.length} graduated records synced to registry.`);
    }
  }, [students]);

  useEffect(() => {
    localStorage.setItem('bmi_data_alumni', JSON.stringify(alumni));
  }, [alumni]);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const filteredAlumni = useMemo(() => {
    return alumni.filter(a => {
      const matchesSearch = `${a.name} ${a.course} ${a.occupation} ${a.id}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = yearFilter === 'All Years' || a.classYear === yearFilter;
      return matchesSearch && matchesYear;
    }).sort((a, b) => (a.isHallOfFame === b.isHallOfFame ? 0 : a.isHallOfFame ? -1 : 1));
  }, [alumni, searchTerm, yearFilter]);

  const stats = useMemo(() => ({
    total: alumni.length,
    hallOfFame: alumni.filter(a => a.isHallOfFame).length,
    globalReach: new Set(alumni.map(a => a.location.split(', ').pop())).size,
  }), [alumni]);

  const handleOpenModal = (member?: AlumniMember) => {
    if (member) {
      setEditingAlumnus(member);
      setFormData(member);
    } else {
      setEditingAlumnus(null);
      setFormData({ name: '', classYear: '2023', course: '', occupation: '', location: '', achievements: '', email: '', isHallOfFame: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAlumnus) {
      setAlumni(prev => prev.map(a => a.id === editingAlumnus.id ? { ...a, ...formData } as AlumniMember : a));
      showToast(`Registry node ${editingAlumnus.id} successfully updated.`);
    } else {
      const newId = `ALM-${Math.floor(Math.random() * 9000) + 1000}`;
      setAlumni(prev => [{ ...formData, id: newId } as AlumniMember, ...prev]);
      showToast(`New alumnus committed to Master Registry. Ref: ${newId}`);
    }
    setIsModalOpen(false);
  };

  const generateNarrative = async (member: AlumniMember) => {
    setIsGeneratingStory(true);
    const prompt = `Write a professional 2-sentence institutional achievement narrative for BMI University alumnus ${member.name}. They graduated in ${member.classYear} with a degree in ${member.course}. Their current role is ${member.occupation} in ${member.location}. Highlight their achievement: ${member.achievements}`;
    const narrative = await getGeminiResponse(prompt, "Generating alumni success narrative for institutional archive.");
    
    setAlumni(prev => prev.map(a => a.id === member.id ? { ...a, achievements: narrative } : a));
    setIsGeneratingStory(false);
    showToast("Achievement narrative enhanced by AI.");
  };

  const toggleHallOfFame = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlumni(prev => prev.map(a => a.id === id ? { ...a, isHallOfFame: !a.isHallOfFame } : a));
    showToast("Institutional Hall of Fame updated.");
  };

  const deleteMember = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Permanent Archive Deletion: Confirm removal of this record?')) {
      setAlumni(prev => prev.filter(a => a.id !== id));
      showToast("Alumnus record purged from registry.");
    }
  };

  const years = ['All Years', ...Array.from(new Set(alumni.map(a => a.classYear))).sort().reverse()];

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 dark:border-gray-800 pb-8">
        <div>
           <div className="flex items-center gap-4 mb-2">
             <div className="w-3 h-12 bg-[#FFD700] rounded-none"></div>
             <h2 className="text-3xl font-bold text-[#2E004F] dark:text-white tracking-tight uppercase">Global Alumni Registry</h2>
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-7 uppercase tracking-widest">BMI Institutional Success Network • Post-Graduation Lifecycle Node</p>
        </div>
        <div className="flex items-center gap-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-[#4B0082] dark:text-[#FFD700] rounded-none font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
             <Share2 size={16} /> Export Network
           </button>
           <button 
             onClick={() => handleOpenModal()}
             className="flex items-center gap-2 px-8 py-4 bg-[#4B0082] text-white rounded-none shadow-xl hover:bg-black transition-all font-black text-xs uppercase tracking-widest border border-[#FFD700]/30"
           >
            <Plus size={18} className="text-[#FFD700]" /> Digitise Graduate Record
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-none border border-gray-100 dark:border-gray-700 border-l-4 border-l-purple-500 shadow-sm group hover:shadow-xl transition-all">
           <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alumni Global Pool</p>
                <p className="text-4xl font-black text-[#4B0082] dark:text-white mt-1">{stats.total.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-gray-700 rounded-none text-purple-600"><GraduationCap size={24} /></div>
           </div>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Verified Institutional Graduates</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-none border border-gray-100 dark:border-gray-700 border-l-4 border-l-amber-500 shadow-sm group hover:shadow-xl transition-all">
           <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hall of Fame Nodes</p>
                <p className="text-4xl font-black text-amber-600 mt-1">{stats.hallOfFame}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-gray-700 rounded-none text-amber-600"><Star size={24} /></div>
           </div>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Elite Achievement Recognition</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-none border border-gray-100 dark:border-gray-700 border-l-4 border-l-emerald-500 shadow-sm group hover:shadow-xl transition-all">
           <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">International Footprint</p>
                <p className="text-4xl font-black text-emerald-600 mt-1">{stats.globalReach} Nations</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-gray-700 rounded-none text-emerald-600"><Globe size={24} /></div>
           </div>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Global Career Displacement Index</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 flex flex-col md:flex-row gap-4 items-center shadow-sm">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Registry by Name, Course, Employer or Location..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-none outline-none font-bold text-sm dark:text-white focus:ring-1 focus:ring-[#4B0082]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
               <Filter size={14} className="text-gray-400" />
               <select 
                 value={yearFilter}
                 onChange={e => setYearFilter(e.target.value)}
                 className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer dark:text-white"
               >
                 {years.map(y => <option key={y} value={y}>{y === 'All Years' ? 'All Cohorts' : `Class of ${y}`}</option>)}
               </select>
            </div>
         </div>
      </div>

      {/* Alumni Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAlumni.map((member) => (
          <div key={member.id} className={`bg-white dark:bg-gray-800 border rounded-none p-8 flex flex-col group hover:shadow-2xl transition-all relative overflow-hidden ${member.isHallOfFame ? 'border-[#FFD700] ring-1 ring-[#FFD700]/20' : 'border-gray-100 dark:border-gray-700'}`}>
             
             {member.isHallOfFame && (
               <div className="absolute top-0 right-0 p-4">
                  <div className="bg-[#FFD700] text-black p-1 shadow-lg border border-white dark:border-gray-900 animate-pulse">
                     <Award size={16} />
                  </div>
               </div>
             )}

             <div className="flex justify-between items-start mb-8">
                <div className={`w-20 h-20 rounded-none ${member.isHallOfFame ? 'bg-gradient-to-br from-[#4B0082] to-[#1a0033]' : 'bg-gray-100 dark:bg-gray-700'} flex items-center justify-center text-white font-black text-3xl shadow-xl border-2 border-white dark:border-gray-700 relative`}>
                   {(member.name || '?').charAt(0)}
                   {member.isHallOfFame && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full"></div>}
                </div>
                <div className="flex flex-col items-end gap-2">
                   <span className="px-3 py-1 bg-gray-900 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">Class of {member.classYear}</span>
                   <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">{member.id}</span>
                </div>
             </div>
             
             <div className="flex-1 space-y-2 mb-8">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none group-hover:text-[#4B0082] transition-colors">{member.name}</h3>
                <p className="text-xs text-[#4B0082] dark:text-[#FFD700] font-black uppercase tracking-widest">{member.course}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">
                   <Briefcase size={12} className="text-amber-500" /> {member.occupation}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                   <MapPin size={12} className="text-blue-500" /> {member.location}
                </div>
             </div>

             <div className="bg-gray-50 dark:bg-gray-950 p-6 border-l-4 border-gray-900 dark:border-[#FFD700] italic mb-8 relative group/note">
                <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed font-bold">
                   "{member.achievements || "Academic record verified. Graduate outcome currently undergoing longitudinal tracking."}"
                </p>
                <button 
                  onClick={() => generateNarrative(member)}
                  className="absolute bottom-2 right-2 p-2 bg-white dark:bg-gray-800 shadow-md opacity-0 group-hover/note:opacity-100 transition-all text-[#4B0082] hover:bg-[#4B0082] hover:text-white"
                  title="Enhance Narrative with AI"
                >
                  {isGeneratingStory ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                </button>
             </div>

             <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-1">
                   <button onClick={(e) => toggleHallOfFame(member.id, e)} className={`p-2 transition-all ${member.isHallOfFame ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'}`} title="Institutional Hall of Fame"><Star size={18} fill={member.isHallOfFame ? 'currentColor' : 'none'} /></button>
                   <button onClick={(e) => handleOpenModal(member)} className="p-2 text-gray-300 hover:text-[#4B0082]" title="Modify Record"><Edit size={18} /></button>
                   <button onClick={(e) => deleteMember(member.id, e)} className="p-2 text-gray-300 hover:text-red-500" title="Purge Record"><Trash2 size={18} /></button>
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#4B0082] transition-all shadow-lg">
                   Connect <ChevronRight size={14} className="text-[#FFD700]" />
                </button>
             </div>
          </div>
        ))}
        {filteredAlumni.length === 0 && (
          <div className="col-span-full py-32 text-center text-gray-400 font-black uppercase tracking-[0.4em] text-sm italic">
            Zero (0) Alumni Records Identified in Post-Graduation Search
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1a0033]/95 backdrop-blur-3xl p-4">
           <div className="bg-white dark:bg-gray-900 w-full max-w-xl shadow-2xl border-t-[8px] border-[#4B0082] overflow-hidden flex flex-col animate-slide-up">
              <div className="bg-gray-900 p-8 border-b-2 border-[#FFD700] flex justify-between items-center text-white">
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#FFD700] rounded-none"><GraduationCap size={20} className="text-black" /></div>
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-tight">{editingAlumnus ? 'Update Registry Node' : 'Graduate Record Digitization'}</h3>
                      <p className="text-[10px] font-bold text-[#FFD700] uppercase tracking-widest mt-1">BMI Post-Graduation Lifecycle Node</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-500 transition-all text-white"><X size={24}/></button>
              </div>

              <form onSubmit={handleSave} className="p-10 space-y-8 bg-[#FAFAFA] dark:bg-gray-950 max-h-[70vh] overflow-y-auto no-scrollbar">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Graduate Legal Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Official Identification Name"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none outline-none font-bold text-sm uppercase tracking-tight focus:border-[#4B0082]"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Completion Cohort</label>
                       <select 
                         value={formData.classYear}
                         onChange={e => setFormData({...formData, classYear: e.target.value})}
                         className="w-full px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-xs font-black uppercase cursor-pointer outline-none focus:border-[#4B0082]"
                       >
                          {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map(y => <option key={y} value={y.toString()}>Class of {y}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Academic Degree awarded</label>
                       <input 
                        required
                        type="text" 
                        placeholder="e.g. B.A. Theology"
                        value={formData.course}
                        onChange={e => setFormData({...formData, course: e.target.value})}
                        className="w-full px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none outline-none font-black text-xs uppercase tracking-widest focus:border-[#4B0082]"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Current Occupation</label>
                       <input 
                         required
                         type="text" 
                         value={formData.occupation}
                         onChange={e => setFormData({...formData, occupation: e.target.value})}
                         className="w-full px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none outline-none font-bold text-xs uppercase focus:border-[#4B0082]"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Geographic Displacement</label>
                       <input 
                         required
                         type="text" 
                         placeholder="City, Nation"
                         value={formData.location}
                         onChange={e => setFormData({...formData, location: e.target.value})}
                         className="w-full px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none outline-none font-bold text-xs uppercase focus:border-[#4B0082]"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Communication Gateway (Email)</label>
                    <div className="relative">
                       <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                         required
                         type="email" 
                         value={formData.email}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                         className="w-full pl-12 pr-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none outline-none font-bold text-sm focus:border-[#4B0082]"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Achievement Registry Note</label>
                    <textarea 
                      rows={3}
                      value={formData.achievements}
                      onChange={e => setFormData({...formData, achievements: e.target.value})}
                      placeholder="Document primary post-graduation achievement..."
                      className="w-full px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none outline-none font-medium text-sm focus:border-[#4B0082] resize-none"
                    ></textarea>
                 </div>

                 <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                    <input 
                      type="checkbox" 
                      id="fame" 
                      checked={formData.isHallOfFame} 
                      onChange={e => setFormData({...formData, isHallOfFame: e.target.checked})}
                      className="w-4 h-4 accent-amber-500" 
                    />
                    <label htmlFor="fame" className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-200 tracking-widest cursor-pointer select-none">
                       Nominate for Institutional Hall of Fame
                    </label>
                 </div>

                 <div className="flex flex-col gap-5 pt-4">
                    <button 
                      type="submit"
                      className="w-full py-5 bg-[#4B0082] text-white rounded-none shadow-2xl font-black uppercase tracking-[0.2em] text-xs border border-[#FFD700]/30 hover:bg-black transition-all flex items-center justify-center gap-4"
                    >
                      <ShieldCheck size={18} className="text-[#FFD700]" /> {editingAlumnus ? 'Authorize Record Update' : 'Authorize Alumni Registry'}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">Discard Protocol</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Persistence Feedback */}
      {toast.show && (
          <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-[150] animate-fade-in">
             <div className="bg-gray-900 text-[#FFD700] px-10 py-5 rounded-none shadow-2xl flex items-center gap-4 border-2 border-[#FFD700] backdrop-blur-xl">
               <Check size={24} className="animate-pulse" />
               <span className="font-black text-xs uppercase tracking-[0.15em]">{toast.msg}</span>
             </div>
          </div>
      )}

      {/* Security Statement */}
      <div className="bg-gray-900 border-l-4 border-[#FFD700] p-6 text-white flex items-start gap-5 shadow-2xl">
         <div className="p-2 bg-[#FFD700] text-black shadow-lg"><ShieldCheck size={20}/></div>
         <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFD700]">Institutional Privacy & Alumni Protection Protocol</p>
            <p className="text-xs text-gray-300 mt-1">
              Graduate records are maintained for institutional benchmarking and global networking purposes. Data sharing protocols are subject to the BMI University Information Management Policy.
            </p>
         </div>
      </div>
    </div>
  );
};

export default Alumni;