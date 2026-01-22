
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Book, 
  Search, 
  Filter, 
  Plus, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  RotateCcw, 
  Download, 
  Trash2, 
  Edit, 
  X, 
  FileText, 
  Globe, 
  ShieldCheck, 
  Info, 
  LayoutGrid, 
  List,
  ExternalLink,
  Bot,
  ChevronRight,
  Maximize2,
  Printer,
  ZoomIn,
  ZoomOut,
  Navigation,
  BookMarked,
  Eye,
  AlertCircle,
  Lock,
  Upload,
  FileUp,
  FileCheck,
  Loader2,
  Sparkles,
  Check
} from 'lucide-react';
import { LibraryItem, Course } from '../types';
import { getGeminiResponse, extractMetadataFromDoc } from '../services/geminiService';

interface LibraryProps {
  library: LibraryItem[];
  setLibrary: React.Dispatch<React.SetStateAction<LibraryItem[]>>;
  courses: Course[];
}

const Library: React.FC<LibraryProps> = ({ library, setLibrary, courses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [viewingResource, setViewingResource] = useState<LibraryItem | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  
  // Persistence & Feedback
  const [isCommitting, setIsCommitting] = useState(false);
  const [toast, setToast] = useState<{show: boolean, msg: string}>({ show: false, msg: '' });
  
  // File Upload & AI Scan State
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Create/Edit
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<LibraryItem>>({
    title: '',
    author: '',
    category: 'Theology',
    type: 'PDF',
    status: 'Digital',
    year: new Date().getFullYear().toString(),
    description: '',
    downloadUrl: ''
  });

  const categories = ['All', 'Theology', 'ICT', 'Business', 'Education', 'General'];
  const types = ['All', 'PDF', 'E-Book', 'Hardcopy', 'Journal', 'Video'];

  const filteredLibrary = useMemo(() => {
    return library.filter(item => {
      const matchesSearch = `${item.title} ${item.author} ${item.isbn || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [library, searchTerm, categoryFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: library.length,
    digital: library.filter(i => i.status === 'Digital').length,
    available: library.filter(i => i.status === 'Available').length,
    borrowed: library.filter(i => i.status === 'Borrowed').length,
  }), [library]);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 4000);
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      setNewItem(prev => ({ ...prev, downloadUrl: base64String, status: 'Digital', type: 'PDF' }));
      setIsProcessingFile(false);
      
      // Auto-trigger AI Analysis
      setIsAiScanning(true);
      const metadata = await extractMetadataFromDoc(base64String, file.name);
      if (metadata) {
        setNewItem(prev => ({
          ...prev,
          title: metadata.title || prev.title,
          author: metadata.author || prev.author,
          year: metadata.year || prev.year,
          category: (categories.includes(metadata.category) ? metadata.category : prev.category) as any,
          description: metadata.description || prev.description
        }));
      }
      setIsAiScanning(false);
    };
    reader.onerror = () => {
      alert("Error reading file protocol. Please try a standard PDF or Document.");
      setIsProcessingFile(false);
      setUploadedFileName(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCommitting(true);

    // Artificial delay for institutional "validation"
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (editingItemId) {
      const updatedItem = { ...newItem, id: editingItemId } as LibraryItem;
      setLibrary(prev => prev.map(i => i.id === editingItemId ? updatedItem : i));
      showToast(`Registry node ${editingItemId} successfully updated.`);
    } else {
      const refId = `LIB-${Math.floor(Math.random() * 9000) + 1000}`;
      const item: LibraryItem = {
        ...newItem as LibraryItem,
        id: refId,
        location: newItem.status === 'Digital' ? 'Cloud Repository' : 'Main Library Stack'
      };
      setLibrary(prev => [item, ...prev]);
      showToast(`New material committed to Master Ledger. Ref: ${refId}`);
    }

    setIsCommitting(false);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItemId(null);
    setUploadedFileName(null);
    setNewItem({ 
      title: '', author: '', category: 'Theology', 
      type: 'PDF', status: 'Digital', 
      year: new Date().getFullYear().toString(), 
      description: '', downloadUrl: '' 
    });
  };

  const openEditModal = (item: LibraryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItemId(item.id);
    setNewItem(item);
    if (item.downloadUrl?.startsWith('data:')) {
      setUploadedFileName('Stored Local Binary');
    }
    setIsModalOpen(true);
  };

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Decommission this asset from the registry? This action is immutable.')) {
      setLibrary(prev => prev.filter(i => i.id !== id));
      showToast(`Asset node ${id} purged from registry.`);
    }
  };

  const generateSummary = async (item: LibraryItem) => {
    setIsGeneratingSummary(true);
    setAiSummary('');
    const prompt = `Provide a concise institutional summary of the academic resource "${item.title}" by ${item.author}. Explain its relevance to the BMI University ${item.category} curriculum and list 3 key learning objectives.`;
    const response = await getGeminiResponse(prompt, `Analyzing library resource for ${item.category} department.`);
    setAiSummary(response);
    setIsGeneratingSummary(false);
  };

  // Fixed helper to ensure correct document rendering without external proxy dependencies
  const getSafeViewerUrl = (url: string) => {
    if (!url) return '';
    // Data URLs (local uploads) are used directly for native embedding
    // Web URLs are used directly to avoid Google GView proxy failures on private/restricted links
    return url;
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 dark:border-gray-800 pb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-3 h-12 bg-[#FFD700] rounded-none"></div>
            <h2 className="text-3xl font-bold text-[#2E004F] dark:text-white tracking-tight uppercase">Knowledge Depository</h2>
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-7 uppercase tracking-widest">BMI University Online Library & Document Registry</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white dark:bg-gray-800 p-1 border border-gray-100 dark:border-gray-700 shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-[#4B0082] text-white' : 'text-gray-400 hover:text-[#4B0082]'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 transition-all ${viewMode === 'list' ? 'bg-[#4B0082] text-white' : 'text-gray-400 hover:text-[#4B0082]'}`}><List size={20} /></button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-8 py-4 bg-[#4B0082] text-white rounded-none shadow-xl hover:bg-black transition-all font-black text-xs uppercase tracking-widest border border-[#FFD700]/30">
            <Plus size={18} className="text-[#FFD700]" /> Catalog New Asset
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-purple-500">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Volumes</h4>
          <p className="text-3xl font-black text-[#4B0082] dark:text-white">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-emerald-500">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Digital Nodes</h4>
          <p className="text-3xl font-black text-emerald-600">{stats.digital.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-blue-500">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">On-Stack Availability</h4>
          <p className="text-3xl font-black text-blue-600">{stats.available.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-amber-500">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Loans</h4>
          <p className="text-3xl font-black text-amber-500">{stats.borrowed.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Query Registry by Title, Author, or ISBN Code..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-none outline-none font-bold text-sm dark:text-white focus:ring-1 focus:ring-[#4B0082]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="flex-1 md:flex-none px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-black uppercase outline-none cursor-pointer dark:text-white"
          >
            {categories.map(c => <option key={c} value={c}>{c} Departments</option>)}
          </select>
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="flex-1 md:flex-none px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-black uppercase outline-none cursor-pointer dark:text-white"
          >
            {types.map(t => <option key={t} value={t}>{t} Formats</option>)}
          </select>
        </div>
      </div>

      {/* Main Listing View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredLibrary.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group hover:border-[#4B0082] transition-all cursor-pointer shadow-sm hover:shadow-2xl relative flex flex-col"
            >
              <div className="h-48 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => openEditModal(item, e)} className="p-2 bg-white/80 dark:bg-gray-800/80 rounded shadow-sm text-[#4B0082] hover:bg-[#4B0082] hover:text-white transition-colors"><Edit size={14}/></button>
                   <button onClick={(e) => deleteItem(item.id, e)} className="p-2 bg-white/80 dark:bg-gray-800/80 rounded shadow-sm text-red-500 hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={14}/></button>
                </div>
                <div className="w-24 h-32 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center transform group-hover:scale-110 transition-transform relative">
                   <BookOpen size={40} className="text-[#4B0082] opacity-20" />
                   <span className="absolute bottom-2 left-0 right-0 text-[8px] font-black text-center text-gray-400 uppercase tracking-tighter truncate px-2">{item.title}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gray-900/10 backdrop-blur-sm text-center">
                   <span className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">{item.category}</span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
                    item.status === 'Digital' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                    item.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400">{item.type}</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1 group-hover:text-[#4B0082] transition-colors line-clamp-2">{item.title}</h3>
                <p className="text-xs font-bold text-gray-400 mb-4">{item.author} • {item.year}</p>
                <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                   <span className="text-[10px] font-bold text-gray-400 italic">{item.location}</span>
                   <div className="flex gap-2">
                     {(item.status === 'Digital' || item.downloadUrl) && (
                       <button 
                        onClick={(e) => { e.stopPropagation(); setViewingResource(item); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4B0082] text-white text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm"
                       >
                          <Eye size={12} className="text-[#FFD700]" /> READ
                       </button>
                     )}
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-gray-900 text-gray-400 uppercase text-[9px] font-black tracking-[0.25em] border-b border-gray-800">
                    <th className="px-6 py-5">Asset Ref</th>
                    <th className="px-6 py-5">Title & Author</th>
                    <th className="px-6 py-5">Department</th>
                    <th className="px-6 py-5 text-center">Format</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5 text-right">Commit Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                 {filteredLibrary.map((item) => (
                   <tr key={item.id} onClick={() => setSelectedItem(item)} className="hover:bg-purple-50/20 dark:hover:bg-gray-700/20 transition-all cursor-pointer group">
                      <td className="px-6 py-5 font-mono text-xs font-bold text-[#4B0082] dark:text-purple-300">{item.id}</td>
                      <td className="px-6 py-5">
                         <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">{item.title}</p>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{item.author} • {item.year}</p>
                      </td>
                      <td className="px-6 py-5">
                         <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">{item.category}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                         <span className="text-[10px] font-bold text-gray-400">{item.type}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                         <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${
                            item.status === 'Digital' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                            item.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {item.status}
                          </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(item.status === 'Digital' || item.downloadUrl) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setViewingResource(item); }}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded" title="Read Digital Copy"
                              >
                                <Eye size={16}/>
                              </button>
                            )}
                            <button onClick={(e) => openEditModal(item, e)} className="p-2 text-gray-300 hover:text-[#4B0082] transition-colors"><Edit size={16}/></button>
                            <button onClick={(e) => deleteItem(item.id, e)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                         </div>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Asset Detail Overlay */}
      {selectedItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1a0033]/95 backdrop-blur-3xl p-4 md:p-8">
           <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[90vh] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] border-t-[8px] border-[#4B0082] overflow-hidden flex flex-col animate-slide-up">
              <div className="p-10 md:p-16 flex flex-col md:flex-row gap-16 relative overflow-hidden bg-[#FAFAFA] dark:bg-gray-950 flex-1 overflow-y-auto no-scrollbar">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-[#4B0082]/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                 
                 <div className="flex-shrink-0 w-full md:w-80 space-y-8 relative z-10">
                    <div className="aspect-[3/4] bg-white dark:bg-gray-800 shadow-2xl border-4 border-white dark:border-gray-700 flex flex-col items-center justify-center relative group overflow-hidden">
                       <BookOpen size={100} className="text-[#4B0082] opacity-10" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                       <div className="absolute bottom-6 left-6 right-6">
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-80">{selectedItem.category} Depository</span>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                          <p className="text-xs font-black uppercase text-[#4B0082] dark:text-[#FFD700]">{selectedItem.status}</p>
                       </div>
                       <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Format</p>
                          <p className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">{selectedItem.type}</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                       {selectedItem.status === 'Digital' || selectedItem.downloadUrl ? (
                         <button 
                           onClick={() => setViewingResource(selectedItem)}
                           className="w-full py-5 bg-[#4B0082] text-white text-[11px] font-black uppercase tracking-[0.25em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 border-2 border-[#FFD700]/30"
                         >
                            <BookOpen size={18} className="text-[#FFD700]" /> READ DIGITAL COPY
                         </button>
                       ) : (
                         <button className="w-full py-5 bg-[#4B0082] text-white text-[11px] font-black uppercase tracking-[0.25em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                            <Clock size={18} className="text-[#FFD700]" /> Reserve Hardcopy
                         </button>
                       )}
                       <button 
                        onClick={() => window.open(selectedItem.downloadUrl || '#', '_blank')}
                        className="w-full py-5 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white text-[11px] font-black uppercase tracking-[0.25em] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-3"
                       >
                          <Globe size={18} /> Direct Archive Access
                       </button>
                    </div>
                 </div>

                 <div className="flex-1 space-y-12 relative z-10">
                    <div className="flex justify-between items-start">
                       <div>
                          <div className="flex items-center gap-3 mb-2">
                             <span className="text-[10px] font-black text-[#4B0082] dark:text-[#FFD700] uppercase tracking-[0.4em]">Official Institutional Asset</span>
                             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          </div>
                          <h2 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">{selectedItem.title}</h2>
                          <p className="text-xl font-bold text-[#4B0082] dark:text-purple-300 mt-2 uppercase tracking-tight">{selectedItem.author}</p>
                       </div>
                       <button onClick={() => setSelectedItem(null)} className="p-4 bg-white dark:bg-gray-800 hover:bg-red-500 hover:text-white transition-all text-gray-400 shadow-sm"><X size={32} /></button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-gray-200 dark:border-gray-800">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Serial / ISBN</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white font-mono">{selectedItem.isbn || selectedItem.id}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pub. Year</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{selectedItem.year}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registry Node</p>
                          <p className="text-sm font-black text-[#4B0082] dark:text-[#FFD700] uppercase">{selectedItem.location}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Security Audit</p>
                          <div className="flex items-center gap-2">
                             <ShieldCheck size={16} className="text-emerald-500" />
                             <span className="text-xs font-bold text-emerald-600">VERIFIED</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Institutional Context:</h4>
                       <div className="bg-white dark:bg-gray-800 p-8 border-l-8 border-gray-900 dark:border-gray-700 shadow-sm">
                          <p className="text-lg font-bold text-gray-700 dark:text-gray-200 leading-relaxed italic">
                             {selectedItem.description || "Historical summary unavailable for this curriculum node."}
                          </p>
                       </div>
                    </div>

                    <div className="pt-10 border-t border-gray-100 dark:border-gray-800">
                       <div className="bg-gradient-to-r from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 p-8 border border-purple-100 dark:border-gray-700 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                             <Bot size={80} className="text-[#4B0082]" />
                          </div>
                          <div className="flex items-center gap-4 mb-6">
                             <div className="p-3 bg-[#4B0082] text-white shadow-lg"><Bot size={24} /></div>
                             <div>
                                <h5 className="text-sm font-black uppercase text-[#4B0082] dark:text-[#FFD700] tracking-widest">BMI AI Assistant Insights</h5>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Curriculum Relevance Analysis Engine</p>
                             </div>
                          </div>
                          {aiSummary ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 font-medium leading-relaxed bg-white/50 dark:bg-black/20 p-6 border-l-2 border-[#4B0082]">
                               {aiSummary}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                               <button 
                                 onClick={() => generateSummary(selectedItem)}
                                 disabled={isGeneratingSummary}
                                 className="px-10 py-4 bg-white dark:bg-gray-900 border-2 border-[#4B0082] text-[#4B0082] dark:text-[#FFD700] text-[10px] font-black uppercase tracking-[0.25em] hover:bg-[#4B0082] hover:text-white transition-all flex items-center gap-3 shadow-xl disabled:opacity-50"
                               >
                                  {isGeneratingSummary ? <Loader2 className="animate-spin" size={16} /> : <Bot size={16} />}
                                  Generate Academic Summary
                               </button>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="p-10 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center no-print flex-shrink-0">
                 <div className="flex items-center gap-4">
                    <Info size={16} className="text-gray-400" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Institutional Access Level: Full Administrative Control</p>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => { const item = selectedItem; setSelectedItem(null); openEditModal(item); }}
                      className="flex items-center gap-2 px-8 py-4 bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-all border border-gray-200 dark:border-gray-700"
                    >
                       <Edit size={16} /> Modify Record
                    </button>
                    <button onClick={() => setSelectedItem(null)} className="flex items-center gap-2 px-10 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-[#4B0082] transition-all">
                       <CheckCircle size={16} className="text-[#FFD700]" /> Confirm and Exit
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Real Resource Viewer Modal */}
      {viewingResource && (
        <div className="fixed inset-0 z-[150] flex flex-col bg-[#05000a] text-white animate-fade-in">
           <div className="h-20 bg-[#1a0033] border-b border-white/10 flex items-center justify-between px-8 relative shadow-2xl flex-shrink-0">
              <div className="flex items-center gap-6">
                 <div className="p-3 bg-[#4B0082] text-[#FFD700] rounded-none border border-[#FFD700]/30 shadow-lg"><BookMarked size={24} /></div>
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-tight truncate max-w-[400px]">{viewingResource.title}</h3>
                    <p className="text-[10px] font-bold text-purple-300 uppercase tracking-[0.3em]">BMI Knowledge Node Reader v2.0</p>
                 </div>
              </div>
              <div className="flex items-center gap-2 bg-black/40 p-1 rounded-none border border-white/5">
                 <button onClick={() => window.print()} className="p-3 hover:bg-[#4B0082] transition-all text-gray-400 hover:text-white" title="Print Selection"><Printer size={20}/></button>
                 <button onClick={() => window.open(viewingResource.downloadUrl, '_blank')} className="p-3 hover:bg-[#4B0082] transition-all text-gray-400 hover:text-white" title="Download Source"><Download size={20}/></button>
                 <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
                 <button className="p-3 hover:bg-[#4B0082] transition-all text-gray-400 hover:text-white" title="Zoom Out"><ZoomOut size={20}/></button>
                 <span className="px-4 text-[10px] font-black uppercase tracking-widest text-purple-400">100%</span>
                 <button className="p-3 hover:bg-[#4B0082] transition-all text-gray-400 hover:text-white" title="Zoom In"><ZoomIn size={20}/></button>
                 <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
                 <button onClick={() => document.documentElement.requestFullscreen()} className="p-3 hover:bg-[#4B0082] transition-all text-gray-400 hover:text-white" title="Fullscreen"><Maximize2 size={20}/></button>
              </div>
              <button onClick={() => setViewingResource(null)} className="flex items-center gap-3 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl"><X size={20} /> Close Terminal</button>
           </div>
           <div className="flex-1 flex overflow-hidden">
              <div className="w-80 bg-[#0a0015] border-r border-white/5 flex flex-col hidden lg:flex">
                 <div className="p-8 border-b border-white/5 space-y-6">
                    <div>
                       <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Resource Context</span>
                       <p className="text-xs font-bold text-purple-200 mt-2 leading-relaxed">This institutional asset is digitally locked for academic use within BMI University parameters.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-3 bg-white/5 text-center"><p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Format</p><p className="text-[10px] font-black uppercase text-purple-300">{viewingResource.type}</p></div>
                       <div className="p-3 bg-white/5 text-center"><p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Registry</p><p className="text-[10px] font-black uppercase text-emerald-400">Verified</p></div>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                    <div>
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD700] mb-4">Verification Actions</h4>
                       <div className="space-y-1">
                          <button onClick={() => window.open(viewingResource.downloadUrl, '_blank')} className="w-full text-left p-3 hover:bg-white/5 transition-all group flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <Globe size={14} className="text-[#FFD700]" /><span className="text-xs font-bold text-gray-300 group-hover:text-white uppercase tracking-tight">Open in New Tab</span>
                               </div>
                               <ExternalLink size={12} className="text-gray-600 group-hover:text-purple-400" />
                          </button>
                          {['Academic Abstract', 'Verification Data', 'Institutional Audit', 'Dean Approval Ledger'].map((chapter, i) => (
                            <button key={i} className="w-full text-left p-3 hover:bg-white/5 transition-all group flex items-center justify-between opacity-50 cursor-not-allowed">
                               <div className="flex items-center gap-3"><span className="text-[10px] font-black text-gray-600">0{i+1}</span><span className="text-xs font-bold text-gray-300 uppercase tracking-tight">{chapter}</span></div>
                               <Lock size={12} className="text-gray-600" />
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="p-6 bg-purple-900/20 border border-purple-500/20">
                       <div className="flex items-center gap-3 mb-3"><ShieldCheck size={16} className="text-[#FFD700]" /><span className="text-[9px] font-black uppercase tracking-widest text-[#FFD700]">Legal Disclosure</span></div>
                       <p className="text-[10px] text-gray-400 leading-relaxed font-medium">Native browser preview active. If the document matrix is not visible, utilize external access protocols or verify that the source archive is reachable.</p>
                    </div>
                 </div>
              </div>
              <div className="flex-1 bg-[#11001a] relative overflow-y-auto p-4 md:p-8 flex justify-center no-scrollbar">
                 <div className="w-full h-full max-w-5xl bg-white shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
                    {viewingResource.downloadUrl ? (
                      <div className="w-full h-full relative group">
                        {/* Fixed: Replacing unstable Google Viewer iframe with high-compatibility native object/embed element */}
                        <embed 
                          src={getSafeViewerUrl(viewingResource.downloadUrl)} 
                          type="application/pdf"
                          className="w-full h-full border-none bg-white" 
                          title="BMI Knowledge Node"
                        />
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                           <div className="bg-black/80 backdrop-blur-md px-6 py-3 border border-white/20 flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest">Document not loading?</span>
                              <button onClick={() => window.open(viewingResource.downloadUrl, '_blank')} className="px-4 py-1.5 bg-[#FFD700] text-black text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all">Force External Open</button>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 p-20 flex flex-col items-center justify-center text-center">
                         <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8"><AlertCircle size={48} className="text-[#4B0082] animate-pulse" /></div>
                         <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">Resource Unavailable</h2>
                         <p className="text-xl text-gray-500 max-w-lg mx-auto font-medium">The cloud node for <span className="text-[#4B0082] font-black">"{viewingResource.title}"</span> is undergoing re-validation.</p>
                      </div>
                    )}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-[0.02] flex items-center justify-center -rotate-45 z-10"><h1 className="text-[120px] font-black uppercase text-black whitespace-nowrap">BMI UNIVERSITY SECURE RECORD</h1></div>
                 </div>
              </div>
              <div className="w-20 bg-[#1a0033] border-l border-white/5 flex flex-col items-center py-8 gap-4 hidden md:flex">
                 <div className="p-2 bg-white/5 border border-white/10 text-[#FFD700] mb-4"><LayoutGrid size={24} /></div>
                 {Array.from({length: 8}).map((_, i) => (
                   <div key={i} className="w-12 h-16 bg-white/5 hover:bg-[#4B0082] transition-all cursor-pointer relative group flex items-center justify-center text-[9px] font-black text-gray-700 hover:text-white border border-transparent hover:border-white/10">
                      SEC {i + 1}<div className="absolute left-full ml-4 px-2 py-1 bg-black text-white rounded text-[8px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity uppercase tracking-widest z-50">Validation Node {i+1}</div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="h-14 bg-black border-t border-white/10 flex items-center justify-between px-8 text-[10px] font-black uppercase tracking-widest text-gray-500 flex-shrink-0">
              <div className="flex items-center gap-6"><span>Status: Resource Authenticated</span><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div><span>Sync Mode: High-Fidelity Binary</span></div>
              <div className="flex items-center gap-6"><span className="text-[#FFD700]">Institutional Verification Matrix v4.2.0</span><div className="flex items-center gap-3"><ShieldCheck size={14} className="text-emerald-500" /><span className="text-gray-300">Secure Admin Session Active</span></div></div>
           </div>
        </div>
      )}

      {/* Catalog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1a0033]/90 backdrop-blur-3xl p-4">
          <div className="bg-white dark:bg-gray-900 shadow-2xl w-full max-w-3xl max-h-[95vh] border border-[#FFD700]/30 animate-slide-up overflow-hidden flex flex-col">
            <div className="bg-gray-900 p-6 md:p-8 border-b-2 border-[#FFD700] flex justify-between items-center text-white flex-shrink-0">
               <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#FFD700] rounded-none"><BookMarked size={20} className="text-black" /></div>
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">{editingItemId ? 'Modify Registry Node' : 'Institutional Catalog Entry'}</h3>
                    <p className="text-[10px] font-bold text-[#FFD700] uppercase tracking-widest mt-1">BMI Knowledge Gateway Node</p>
                  </div>
               </div>
               <button onClick={handleCloseModal} className="p-2 hover:bg-red-500 transition-all text-white"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-gray-900">
              <form id="catalog-form" onSubmit={handleAddItem} className="p-6 md:p-10 space-y-8">
                 <div className="space-y-2">
                    <div className="flex justify-between items-end">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Academic Source Material (PDF / E-Book)</label>
                       {isAiScanning && (
                         <div className="flex items-center gap-2 text-[#4B0082] animate-pulse"><Sparkles size={12} /><span className="text-[9px] font-black uppercase tracking-widest">AI Detection Active...</span></div>
                       )}
                    </div>
                    <div onClick={() => fileInputRef.current?.click()} className={`relative w-full p-8 border-2 border-dashed rounded-none flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${uploadedFileName ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-[#4B0082]'}`}>
                       <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.epub,.doc,.docx" onChange={handleFileSelection} />
                       {isProcessingFile ? (
                         <div className="flex flex-col items-center gap-3"><Loader2 size={32} className="text-[#4B0082] animate-spin" /><span className="text-[10px] font-black uppercase text-gray-400 animate-pulse tracking-widest">Encoding Protocol Data...</span></div>
                       ) : uploadedFileName ? (
                         <div className="flex flex-col items-center gap-3 text-emerald-600">
                            <div className="p-4 bg-emerald-100 rounded-none shadow-sm relative"><FileCheck size={32} />{isAiScanning && <Sparkles size={16} className="absolute -top-1 -right-1 text-purple-600 animate-bounce" />}</div>
                            <div className="text-center"><p className="text-[10px] font-black uppercase tracking-widest">Asset Authenticated</p><p className="text-xs font-bold truncate max-w-[350px]">{uploadedFileName}</p></div>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setUploadedFileName(null); setNewItem(prev => ({ ...prev, downloadUrl: '' })); }} className="text-[9px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors">Remove Protocol</button>
                         </div>
                       ) : (
                         <><div className="p-4 bg-white dark:bg-gray-700 rounded-none shadow-sm text-gray-400 group-hover:text-[#4B0082] transition-colors"><FileUp size={32} /></div><div className="text-center"><p className="text-[10px] font-black uppercase text-gray-900 dark:text-white tracking-widest">Initialize Local Source Upload</p><p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Smart Detection & Metadata Extraction Enabled</p></div></>
                       )}
                    </div>
                 </div>

                 <div className="space-y-6">
                   <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Resource Title</label><input required value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className={`w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border rounded-none font-bold text-sm dark:text-white transition-all ${isAiScanning ? 'border-purple-300 animate-pulse' : 'border-gray-200 dark:border-gray-600 focus:border-[#4B0082]'}`} placeholder="Document Formal Title" /></div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Author / Principal</label><input required value={newItem.author} onChange={e => setNewItem({...newItem, author: e.target.value})} className={`w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border rounded-none font-bold text-sm dark:text-white transition-all ${isAiScanning ? 'border-purple-300 animate-pulse' : 'border-gray-200 dark:border-gray-600 focus:border-[#4B0082]'}`} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Academic Department</label><select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as any})} className={`w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border rounded-none text-xs font-black uppercase cursor-pointer ${isAiScanning ? 'border-purple-300 animate-pulse' : 'border-gray-200 dark:border-gray-600 focus:border-[#4B0082]'}`}>{categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Asset Type</label><select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as any})} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-none text-xs font-black uppercase cursor-pointer">{types.slice(1).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Registry Status</label><select value={newItem.status} onChange={e => setNewItem({...newItem, status: e.target.value as any})} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-none text-xs font-black uppercase cursor-pointer"><option value="Digital">Digital / Online</option><option value="Available">Available (Hardcopy)</option><option value="Reserved">Reserved Access</option></select></div>
                      <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Pub. Year</label><input value={newItem.year} onChange={e => setNewItem({...newItem, year: e.target.value})} className={`w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border rounded-none font-bold text-sm dark:text-white transition-all ${isAiScanning ? 'border-purple-300 animate-pulse' : 'border-gray-200 dark:border-gray-600 focus:border-[#4B0082]'}`} /></div>
                   </div>
                   <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">External Reference Link (Optional)</label><input value={newItem.downloadUrl && !newItem.downloadUrl.startsWith('data:') ? newItem.downloadUrl : ''} onChange={e => setNewItem({...newItem, downloadUrl: e.target.value})} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-none font-bold text-sm dark:text-white focus:border-[#4B0082] outline-none" placeholder="https://university-storage.edu/resource.pdf" /></div>
                   <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Summary / Narrative</label><textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} rows={3} className={`w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border rounded-none text-sm outline-none resize-none dark:text-white transition-all ${isAiScanning ? 'border-purple-300 animate-pulse' : 'border-gray-200 dark:border-gray-600 focus:border-[#4B0082]'}`} placeholder="Institutional relevance summary..."></textarea></div>
                 </div>
              </form>
            </div>

            <div className="p-6 md:p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center flex-shrink-0">
               <button type="button" onClick={handleCloseModal} className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">Discard Protocol</button>
               <button form="catalog-form" type="submit" disabled={isProcessingFile || isAiScanning || isCommitting} className="px-10 py-4 bg-[#4B0082] text-white rounded-none shadow-2xl font-black uppercase tracking-[0.2em] text-xs border border-[#FFD700]/30 hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2">
                  {isAiScanning || isCommitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} className="text-[#FFD700]" />}
                  {editingItemId ? 'Authorize Record Update' : 'Authorize Catalog Commit'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {toast.show && (
          <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-[150] animate-fade-in">
             <div className="bg-gray-900 text-[#FFD700] px-10 py-5 rounded-none shadow-2xl flex items-center gap-4 border-2 border-[#FFD700] backdrop-blur-xl">
               <Check size={24} className="animate-pulse" />
               <span className="font-black text-xs uppercase tracking-[0.15em]">{toast.msg}</span>
             </div>
          </div>
      )}

      {/* Security Protocol Enforcement */}
      <div className="bg-gray-900 border-l-4 border-[#FFD700] p-6 text-white flex items-start gap-5 shadow-2xl">
         <div className="p-2 bg-[#FFD700] text-black shadow-lg"><Globe size={20}/></div>
         <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFD700]">Global Registry Protocol Enforcement</p>
            <p className="text-xs text-gray-300 mt-1">Document lifecycle and digital rights are monitored for institutional transparency. Unauthorized reproduction of sensitive theological or technical assets is prohibited.</p>
         </div>
      </div>
    </div>
  );
};

export default Library;
