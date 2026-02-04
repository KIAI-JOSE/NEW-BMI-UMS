
/**
 * KIRO: DO NOT MODIFY
 * This file contains stable production logic.
 * Do not edit unless explicitly instructed.
 * 
 * Certificate Layout - Redesigned with CSS Grid
 * Fixed overlapping components issue with proper spacing
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Download, 
  Award, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Share2, 
  Lock, 
  Layout,
  QrCode,
  Scroll,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Student, CertificateRecord } from '../types';
import { issueCertificate, getCertificate, revokeCertificate } from '../services/certificateService';

interface CertificatesProps {
  students: Student[];
  logo: string;
}

const Certificates: React.FC<CertificatesProps> = ({ students, logo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeRecord, setActiveRecord] = useState<CertificateRecord | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isProcessing, setIsProcessing] = useState(false);

  // OFFICIAL PRODUCTION DOMAIN
  // This ensures certificates printed from localhost or preview sites 
  // still point to the live public verification portal.
  const PRODUCTION_DOMAIN = 'https://bmi-university-management.web.app';

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = `${s.firstName} ${s.lastName} ${s.id}`.toLowerCase().includes(q);
      return matchesSearch; 
    });
  }, [students, searchTerm]);

  // Update active record when student changes
  useMemo(() => {
    if (selectedStudent) {
      const record = getCertificate(selectedStudent.id);
      setActiveRecord(record || null);
    }
  }, [selectedStudent, showCertificate]); // Dependency on showCertificate ensures refresh after issuing

  const handleIssue = async () => {
    if (!selectedStudent) return;
    setIsProcessing(true);
    // Simulate network delay for "Minting" effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    const record = issueCertificate(selectedStudent);
    setActiveRecord(record);
    setIsProcessing(false);
  };

  const handleRevoke = () => {
    if (!activeRecord) return;
    if (window.confirm("CRITICAL ACTION: Are you sure you want to REVOKE this certificate? This action will be logged in the permanent audit trail.")) {
        revokeCertificate(activeRecord.serialNumber);
        setActiveRecord(prev => prev ? { ...prev, status: 'REVOKED' } : null);
    }
  };

  const openCertificatePrintWindow = (element: HTMLElement, title: string) => {
    const win = window.open('', '_blank');
    if (!win) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((n) => (n as HTMLElement).outerHTML)
      .join('\n');

    const pageWidth = orientation === 'landscape' ? '297mm' : '210mm';
    const pageHeight = orientation === 'landscape' ? '210mm' : '297mm';

    win.document.open();
    win.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${styles}
    <style>
      @media print {
        @page { size: A4 ${orientation}; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
        body * { visibility: hidden !important; }
        #official-certificate-root {
          visibility: visible !important;
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: ${pageWidth} !important;
          height: ${pageHeight} !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          background: white !important;
          overflow: hidden !important;
          z-index: 9999 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #official-certificate-root .absolute { position: absolute !important; }
        #official-certificate-root .fixed { position: fixed !important; }
        #official-certificate-root * { visibility: visible !important; }
      }
    </style>
  </head>
  <body>
    ${element.outerHTML}
    <script>
      (function () {
        const finalize = () => {
          try { window.focus(); } catch (e) {}
          window.print();
          setTimeout(() => window.close(), 300);
        };
        const imgs = Array.from(document.images || []);
        let pending = imgs.length;
        if (pending === 0) {
          setTimeout(finalize, 100);
          return;
        }
        const done = () => {
          pending -= 1;
          if (pending <= 0) setTimeout(finalize, 100);
        };
        imgs.forEach((img) => {
          if (img.complete) return done();
          img.addEventListener('load', done);
          img.addEventListener('error', done);
        });
        setTimeout(finalize, 1500);
      })();
    </script>
  </body>
</html>`);
    win.document.close();
  };

  const handlePrint = async () => {
    if (!activeRecord) return;
    const element = document.getElementById('official-certificate-root');
    if (!element) return;

    const title = `CERTIFICATE_${activeRecord.serialNumber}`.toUpperCase();
    openCertificatePrintWindow(element, title);
  };

  const handleDownloadPdf = async () => {
    if (!activeRecord) return;
    const element = document.getElementById('official-certificate-root');
    if (!element) return;

    setIsProcessing(true);
    const fileName = `CERTIFICATE_${activeRecord.serialNumber}`.toUpperCase();

    openCertificatePrintWindow(element, `${fileName}.PDF`);
    setTimeout(() => setIsProcessing(false), 1000);
  };

  const getOrdinalDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate();
    const suffix = ["th", "st", "nd", "rd"];
    const v = day % 100;
    const ord = day + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
    return `${ord} day of ${d.toLocaleString('default', { month: 'long' })}, ${d.getFullYear()}`;
  };

  // Secure URL Generation - FIXED FOR PRODUCTION
  const getVerificationUrl = (record: CertificateRecord) => {
     // We construct the URL manually to ensure it points to the LIVE site, 
     // not the temporary preview URL.
     return `${PRODUCTION_DOMAIN}/?id=${record.serialNumber}&hash=${record.contentHash}`;
  };

  const GuillochePattern = () => (
    <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.05] overflow-hidden">
      <img src="https://i.ibb.co/QGHsbXy/alluoche-1.jpg" className="w-full h-full object-cover" alt="Security Pattern" />
    </div>
  );

  const MicroTextBorder = () => (
    <div className="absolute inset-[10mm] border-[1px] border-transparent z-10 pointer-events-none overflow-hidden select-none">
       <div className="w-full h-full border-[0.5px] border-[#4B0082] relative">
          <div className="absolute top-0 left-0 w-full text-[4px] leading-none whitespace-nowrap text-[#4B0082] opacity-60">
             {Array(150).fill("BMI UNIVERSITY OFFICIAL SECURE CERTIFICATE ").join("")}
          </div>
          <div className="absolute bottom-0 left-0 w-full text-[4px] leading-none whitespace-nowrap text-[#4B0082] opacity-60">
             {Array(150).fill("VERIFY AUTHENTICITY AT BMIUNIVERSITY.ORG/VERIFY ").join("")}
          </div>
          <div className="absolute top-0 left-0 h-full w-[4px] text-[4px] leading-none whitespace-nowrap text-[#4B0082] opacity-60 writing-vertical-lr" style={{ writingMode: 'vertical-lr' }}>
             {Array(100).fill("SECURE DOCUMENT ").join("")}
          </div>
          <div className="absolute top-0 right-0 h-full w-[4px] text-[4px] leading-none whitespace-nowrap text-[#4B0082] opacity-60 writing-vertical-lr" style={{ writingMode: 'vertical-lr' }}>
             {Array(100).fill("ANTI-TAMPER LAYER ").join("")}
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-fade-in relative">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex flex-col md:flex-row justify-between items-center gap-2 shadow-sm min-h-[60px]">
        <div className="flex items-center gap-3 pl-14 w-full md:w-auto">
           <div className="w-1 h-5 bg-[#FFD700] rounded-none"></div>
           <div className="flex flex-col">
              <h2 className="text-base md:text-lg font-bold text-[#2E004F] dark:text-white tracking-tight uppercase leading-none">Degree & Certificate Issuance</h2>
              <p className="text-[8px] md:text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">BMI Institutional Registrar • Graduation & Awards Node</p>
           </div>
        </div>
      </div>

      {/* Sticky Top Tab Bar */}
      <div className="sticky top-[60px] z-30 bg-[#F8F9FA]/95 dark:bg-[#0a0015]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar shadow-sm">
         <div className="flex items-center gap-2 mr-4 text-gray-400">
            <Layout size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Preview Mode</span>
         </div>
         <button
            onClick={() => setOrientation('landscape')}
            className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              orientation === 'landscape' 
                ? 'bg-[#4B0082] text-white shadow-lg shadow-purple-500/20 scale-105 border border-purple-500/50' 
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#4B0082]'
            }`}
          >
            Landscape
          </button>
          <button
            onClick={() => setOrientation('portrait')}
            className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              orientation === 'portrait' 
                ? 'bg-[#4B0082] text-white shadow-lg shadow-purple-500/20 scale-105 border border-purple-500/50' 
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#4B0082]'
            }`}
          >
            Portrait
          </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-8 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-[600px]">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Candidate Registry</h3>
             <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search Candidate..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-none text-xs font-bold uppercase tracking-tight outline-none focus:ring-1 focus:ring-[#4B0082]"
                />
             </div>
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                {filteredStudents.map(student => {
                  const hasCert = getCertificate(student.id)?.status === 'ISSUED';
                  return (
                    <button 
                      key={student.id}
                      onClick={() => { setSelectedStudent(student); setShowCertificate(false); }}
                      className={`w-full text-left p-3 rounded-none transition-all flex items-center justify-between group ${selectedStudent?.id === student.id ? 'bg-[#4B0082] text-white shadow-lg' : 'hover:bg-purple-50 dark:hover:bg-gray-700'}`}
                    >
                       <div>
                          <p className="text-[11px] font-black uppercase tracking-tight leading-none flex items-center gap-2">
                             {student.firstName} {student.lastName}
                             {hasCert && <CheckCircle2 size={12} className={selectedStudent?.id === student.id ? "text-[#FFD700]" : "text-emerald-500"} />}
                          </p>
                          <p className={`text-[9px] font-bold uppercase mt-1 ${selectedStudent?.id === student.id ? 'text-purple-200' : 'text-gray-400'}`}>{student.id}</p>
                       </div>
                       <ChevronRight size={14} className={selectedStudent?.id === student.id ? 'text-[#FFD700]' : 'text-gray-300'} />
                    </button>
                  );
                })}
             </div>
          </div>

          <div className="lg:col-span-3">
             {selectedStudent ? (
               <div className="space-y-6 animate-slide-up">
                  <div className="bg-white dark:bg-gray-800 rounded-none shadow-xl border border-gray-100 dark:border-gray-700 p-8 flex justify-between items-center relative overflow-hidden">
                     <div className={`absolute top-0 left-0 w-2 h-full ${activeRecord?.status === 'ISSUED' ? 'bg-emerald-500' : activeRecord?.status === 'REVOKED' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                     <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                        <div className="flex items-center gap-3 mt-2">
                           <span className="text-xs font-bold text-[#4B0082] dark:text-[#FFD700] uppercase tracking-widest">{selectedStudent.academicLevel}</span>
                           {activeRecord?.status === 'ISSUED' && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                 <CheckCircle2 size={10} /> Certified
                              </span>
                           )}
                           {activeRecord?.status === 'REVOKED' && (
                              <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                 <ShieldAlert size={10} /> Revoked
                              </span>
                           )}
                        </div>
                     </div>
                     
                     <div className="flex gap-3">
                        {activeRecord?.status === 'ISSUED' ? (
                           <>
                              <button 
                                 onClick={handleRevoke}
                                 className="px-6 py-3 border border-red-200 text-red-600 rounded-none font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2"
                              >
                                 <ShieldAlert size={14} /> Revoke
                              </button>
                              <button 
                                 onClick={() => setShowCertificate(true)}
                                 className="px-8 py-3 bg-[#FFD700] text-[#4B0082] rounded-none font-black text-xs uppercase tracking-widest shadow-xl hover:bg-white transition-all flex items-center gap-2"
                              >
                                 <Award size={16} /> View Certificate
                              </button>
                           </>
                        ) : (
                           <button 
                              onClick={handleIssue}
                              disabled={isProcessing}
                              className="px-10 py-4 bg-[#4B0082] text-white rounded-none font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-3 border border-[#FFD700]/30 disabled:opacity-50"
                           >
                              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Award size={18} className="text-[#FFD700]" />}
                              {activeRecord?.status === 'REVOKED' ? 'Re-Issue Certificate' : 'Authorize & Issue'}
                           </button>
                        )}
                     </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                     <ShieldCheck size={64} className="text-gray-300 mb-6" />
                     <h4 className="text-lg font-black text-gray-400 uppercase tracking-widest mb-2">Secure Verification Registry</h4>
                     <p className="text-xs text-gray-500 max-w-md">
                        {activeRecord 
                           ? `Certificate Serial: ${activeRecord.serialNumber} | Hash: ${activeRecord.contentHash.substring(0, 16)}...`
                           : "Certificate generation is restricted to authorized registrars. Issuing creates an immutable record."}
                     </p>
                  </div>
               </div>
             ) : (
               <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-none border-2 border-dashed border-gray-100 dark:border-gray-700 text-gray-400">
                  <Award size={80} className="mb-6 opacity-20" />
                  <h3 className="text-xl font-black uppercase tracking-[0.3em] opacity-40">Select Candidate for Certification</h3>
               </div>
             )}
          </div>
        </div>

      {showCertificate && activeRecord && (() => {
        const verifyUrl = getVerificationUrl(activeRecord);

        return (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[130] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 overflow-y-auto">
           <div className="flex flex-col items-center">
              
              <div 
                id="official-certificate-root" 
                className={`bg-[#FFFAF0] relative flex flex-col items-center shadow-2xl text-gray-900 border-[12px] border-double border-[#4B0082] print:shadow-none print:m-0 print:border-none print:w-full print:h-full overflow-hidden transition-all duration-300 ${
                  orientation === 'landscape' ? 'w-[297mm] h-[210mm] p-12' : 'w-[210mm] h-[297mm] p-10'
                }`}
              >
                 {/* ... Security Patterns ... */}
                 <GuillochePattern />
                 <MicroTextBorder />
                 <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center z-0">
                    <img src={logo || "https://i.ibb.co/Gv2vPdJC/BMI-PNG.png"} className="w-[500px] h-[500px] object-contain grayscale" />
                 </div>
                 <div className="absolute bottom-16 left-16 w-16 h-16 border-b-4 border-l-4 border-[#FFD700] z-20 pointer-events-none"></div>
                 <div className="absolute bottom-16 right-16 w-16 h-16 border-b-4 border-r-4 border-[#FFD700] z-20 pointer-events-none"></div>

                 <div className="relative z-10 text-center w-full h-full flex flex-col">
                    <div className="absolute top-0 right-0 text-right">
                       <p className="text-[10px] font-mono font-bold text-gray-400">SERIAL: <span className="text-red-700">{activeRecord.serialNumber}</span></p>
                       <p className="text-[6px] font-mono text-gray-300 mt-0.5 max-w-[150px] break-all">{activeRecord.contentHash}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center w-full space-y-6">
                        <img src={logo || "https://i.ibb.co/Gv2vPdJC/BMI-PNG.png"} className="h-20 md:h-24 object-contain filter drop-shadow-sm" />
                        
                        <div className="space-y-2">
                           <h1 className="text-4xl md:text-5xl font-serif font-black uppercase tracking-widest text-[#4B0082]">BMI University</h1>
                           <p className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-[0.6em]">Excellence in Faith and Knowledge</p>
                        </div>

                        <p className="text-lg md:text-xl font-serif italic text-gray-600 mb-2">By the authority of the University Senate, be it hereby known that</p>
                        
                        <div className="py-2 border-b-2 border-gray-900 px-8 md:px-12 inline-block">
                           <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wide text-gray-900 leading-tight">
                              {activeRecord.studentName},
                           </h2>
                        </div>

                        <p className="text-lg md:text-xl font-serif italic text-gray-600 max-w-3xl mt-4">having satisfactorily fulfilled all the requirements prescribed by the University, has been duly awarded the</p>

                        <div className="flex flex-col items-center gap-2 mt-4">
                           <h3 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-[#4B0082] max-w-4xl leading-tight">
                              {activeRecord.degree}
                           </h3>
                        </div>

                        <p className="text-base md:text-lg font-serif italic text-gray-600 max-w-3xl mt-4">
                           with all the rights, privileges, and honors thereunto appertaining.
                           <br/>
                           <span className="block mt-4">
                             Given at Nairobi, Kenya, this {getOrdinalDate(activeRecord.issueDate)}.
                           </span>
                        </p>
                    </div>

                    {/* REDESIGNED FOOTER SECTION - CSS GRID LAYOUT */}
                    <div className="certificate-footer w-full mt-8 flex-shrink-0 relative z-30">
                       {/* Left Column - Vice Chancellor */}
                       <div className="certificate-footer-left">
                          <div className="mb-4">
                             <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Date of Graduation</p>
                             <p className="text-[10px] md:text-xs font-bold text-gray-800">
                                {getOrdinalDate(activeRecord.issueDate)}
                             </p>
                          </div>
                          <div className="signature-section">
                             <div className="signature-line">
                                <div className="font-[cursive] text-xl md:text-2xl text-[#000080] opacity-80 -rotate-6 mb-2">Prof. I. Sigei</div>
                             </div>
                             <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">VICE CHANCELLOR</p>
                          </div>
                       </div>

                       {/* Center Column - QR Code and Verification */}
                       <div className="certificate-footer-center">
                          <div className="verification-section">
                             <div className="qr-container">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(verifyUrl)}`} 
                                  className="qr-code" 
                                  alt="Verification QR"
                                />
                             </div>
                             <div className="shield-container">
                                <img 
                                  src="https://i.ibb.co/LXbLfm1K/shield.png" 
                                  alt="Official Seal"
                                  className="shield-icon"
                                />
                             </div>
                             <p className="verification-text">VERIFY: {activeRecord.serialNumber}</p>
                          </div>
                       </div>

                       {/* Right Column - Academic Registrar */}
                       <div className="certificate-footer-right">
                          <div className="mb-4">
                             <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Certificate Serial</p>
                             <p className="text-[10px] md:text-xs font-mono font-bold text-gray-800 break-all">
                                {activeRecord.serialNumber}
                             </p>
                          </div>
                          <div className="signature-section">
                             <div className="signature-line">
                                <div className="font-[cursive] text-xl md:text-2xl text-[#000080] opacity-80 -rotate-3 mb-2">Dr. S. Kiptoo</div>
                             </div>
                             <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">ACADEMIC REGISTRAR</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="w-[297mm] max-w-full mt-6 flex justify-between items-center bg-gray-900 p-6 text-white no-print shadow-2xl border-t border-white/10">
                 <div className="flex items-center gap-4">
                    <ShieldCheck size={24} className="text-[#FFD700]" />
                    <div>
                       <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Official Document Preview Mode</span>
                       <span className="block text-[9px] text-[#FFD700] uppercase tracking-wider">SECURE SERIAL: {activeRecord.serialNumber}</span>
                    </div>
                 </div>
                 <div className="flex gap-4 items-center">
                    <div className="flex bg-gray-800 p-1 border border-white/10 rounded-none mr-2">
                       <button onClick={() => setOrientation('landscape')} className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${orientation === 'landscape' ? 'bg-[#FFD700] text-[#4B0082]' : 'text-gray-400 hover:text-white'}`}>
                         <Layout size={14} className="rotate-90" /> Landscape
                       </button>
                       <button onClick={() => setOrientation('portrait')} className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${orientation === 'portrait' ? 'bg-[#FFD700] text-[#4B0082]' : 'text-gray-400 hover:text-white'}`}>
                         <Layout size={14} /> Portrait
                       </button>
                    </div>
                    <button onClick={handleDownloadPdf} disabled={isProcessing} className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                       <Download size={16} /> {isProcessing ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-8 py-3 bg-[#4B0082] text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-[#4B0082] transition-all">
                       <Printer size={16} /> Print Certificate
                    </button>
                    <button onClick={() => setShowCertificate(false)} className="p-3 bg-red-600 hover:bg-red-700 text-white transition-all">
                       <X size={20} />
                    </button>
                 </div>
              </div>

           </div>
        </div>
        );
      })()}

      <style>{`
        /* Certificate Layout CSS Grid System */
        .certificate-footer {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: end;
          gap: 40px;
          padding: 20px 40px;
          min-height: 120px;
        }

        .certificate-footer-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }

        .certificate-footer-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 120px;
        }

        .certificate-footer-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
        }

        .signature-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 120px;
        }

        .signature-line {
          width: 120px;
          border-bottom: 2px solid #374151;
          height: 40px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
        }

        .verification-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .qr-container {
          padding: 4px;
          background: white;
          border: 2px solid #D1D5DB;
          border-radius: 8px;
        }

        .qr-code {
          width: 64px;
          height: 64px;
          display: block;
        }

        .shield-container {
          margin-top: 8px;
        }

        .shield-icon {
          width: 48px;
          height: 48px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .verification-text {
          font-size: 6px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9CA3AF;
          text-align: center;
          margin-top: 4px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .certificate-footer {
            grid-template-columns: 1fr;
            gap: 24px;
            text-align: center;
          }
          
          .certificate-footer-left,
          .certificate-footer-right {
            align-items: center;
          }
          
          .signature-line {
            margin: 0 auto;
          }
        }

        @media print {
          @page { size: A4 ${orientation}; margin: 0; }
          html, body { background: white; margin: 0; padding: 0; }
          body * { visibility: hidden !important; }
          #official-certificate-root {
            visibility: visible !important; 
            display: block !important;
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: ${orientation === 'landscape' ? '297mm' : '210mm'} !important; 
            height: ${orientation === 'landscape' ? '210mm' : '297mm'} !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            border: none !important;
            background: white !important;
            overflow: hidden !important;
            z-index: 9999;
            transform: scale(1);
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Override global institutional print reset for official documents */
          #official-certificate-root .absolute { position: absolute !important; }
          #official-certificate-root .fixed { position: fixed !important; }
          #official-certificate-root * { visibility: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      </div>
    </div>
  );
};

export default Certificates;
