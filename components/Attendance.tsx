import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Users, 
  BookOpen,
  Search,
  Save,
  Check,
  Loader2,
  X,
  History,
  Timer
} from 'lucide-react';
import { Student } from '../types';

interface AttendanceProps {
  theme: string;
  students: Student[];
}

interface AttendanceState {
  [studentId: string]: 'present' | 'absent' | 'late';
}

const Attendance: React.FC<AttendanceProps> = ({ theme, students }) => {
  const [selectedCourse, setSelectedCourse] = useState('School of Theology');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastMarkedAt, setLastMarkedAt] = useState<string | null>(null);
  
  // Explicit session timing state
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState(new Date().toTimeString().slice(0, 5));

  const courses = [
    { name: 'School of Theology', faculty: 'Theology' },
    { name: 'Dept. of ICT', faculty: 'ICT' },
    { name: 'School of Business', faculty: 'Business' },
    { name: 'Education Dept.', faculty: 'Education' }
  ];

  const currentFaculty = useMemo(() => {
    return courses.find(c => c.name === selectedCourse)?.faculty || 'Theology';
  }, [selectedCourse]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesFaculty = s.faculty === currentFaculty;
      const matchesSearch = `${s.firstName} ${s.lastName} ${s.id} ${s.department}`.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFaculty && matchesSearch;
    });
  }, [students, currentFaculty, searchTerm]);

  const handleMark = (id: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [id]: prev[id] === status ? 'absent' : status // Toggling back defaults to absent
    }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      const now = new Date();
      setLastMarkedAt(now.toLocaleString('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      }));
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  const stats = useMemo(() => {
    let p = 0, l = 0, a = 0;
    filteredStudents.forEach(s => {
      const status = attendance[s.id] || 'absent';
      if (status === 'present') p++;
      else if (status === 'late') l++;
      else a++;
    });
    return { present: p, late: l, absent: a };
  }, [attendance, filteredStudents]);

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#2E004F] dark:text-white uppercase tracking-tight">Institutional Attendance</h2>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">BMI University Registry • Live Session Monitoring</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 border border-gray-100 dark:border-gray-700 shadow-sm">
             <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700">
                <Calendar size={14} className="text-[#4B0082] dark:text-[#FFD700]" />
                <input 
                  type="date" 
                  value={sessionDate} 
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase outline-none dark:text-white"
                />
             </div>
             <div className="flex items-center gap-2 px-3 py-1">
                <Timer size={14} className="text-[#4B0082] dark:text-[#FFD700]" />
                <input 
                  type="time" 
                  value={sessionTime} 
                  onChange={(e) => setSessionTime(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase outline-none dark:text-white"
                />
             </div>
          </div>
          
          {lastMarkedAt && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-sm">
               <History size={14} /> Last Commited: {lastMarkedAt}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Ongoing Academic Modules */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Active Modules</h3>
            <div className="space-y-1">
              {courses.map((course) => (
                <button 
                  key={course.name}
                  onClick={() => { setSelectedCourse(course.name); setAttendance({}); }}
                  className={`w-full text-left px-4 py-3 rounded-none transition-all flex items-center gap-3 border ${
                    selectedCourse === course.name 
                      ? 'bg-[#4B0082] text-white border-[#4B0082] shadow-lg' 
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:border-[#4B0082]'
                  }`}
                >
                  <BookOpen size={16} className={selectedCourse === course.name ? 'text-[#FFD700]' : 'text-gray-400'} />
                  <span className="text-xs font-bold uppercase tracking-tight truncate">{course.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gray-900 text-white rounded-none border border-[#FFD700]/20 space-y-4 shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFD700]">Session Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Present</p>
                <p className="text-xl font-bold text-emerald-400">{stats.present}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Late</p>
                <p className="text-xl font-bold text-amber-400">{stats.late}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Absent</p>
                <p className="text-xl font-bold text-red-400">{stats.absent}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Total Count</p>
                <p className="text-xl font-bold text-white">{filteredStudents.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Marking Node */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-none shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center bg-gray-900 text-white">
             <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#4B0082] rounded-none border border-[#FFD700]/30">
                  <Users size={20} className="text-[#FFD700]" />
                </div>
                <div>
                   <h3 className="font-bold uppercase tracking-tight">{selectedCourse}</h3>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filteredStudents.length} Students • Faculty of {currentFaculty}</p>
                </div>
             </div>
             <button 
               onClick={handleSubmit}
               disabled={isSubmitting || filteredStudents.length === 0}
               className="px-6 py-2.5 bg-[#FFD700] text-[#4B0082] rounded-none text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-white transition-all disabled:opacity-50"
             >
               {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
               Commit Registry
             </button>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search registry by ID, Name or Department..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none outline-none text-sm dark:text-white font-semibold focus:ring-1 focus:ring-[#4B0082] shadow-inner" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] no-scrollbar">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => {
                const currentStatus = attendance[student.id] || 'absent';
                return (
                  <div key={student.id} className="flex items-center justify-between p-5 hover:bg-purple-50/30 dark:hover:bg-gray-700/30 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-none ${student.avatarColor} flex items-center justify-center font-bold text-white shadow-sm overflow-hidden`}>
                          {student.photo ? <img src={student.photo} className="w-full h-full object-cover" alt="S" /> : student.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-tight">{student.firstName} {student.lastName}</p>
                          <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">{student.id} • {student.department}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-none border border-gray-200 dark:border-gray-700">
                        <button 
                          onClick={() => handleMark(student.id, 'present')}
                          className={`px-4 py-2 rounded-none text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${currentStatus === 'present' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-400 hover:text-emerald-500'}`}
                        >
                          <CheckCircle2 size={14} /> Present
                        </button>
                        <button 
                          onClick={() => handleMark(student.id, 'late')}
                          className={`px-4 py-2 rounded-none text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${currentStatus === 'late' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400 hover:text-amber-500'}`}
                        >
                          <Clock size={14} /> Late
                        </button>
                        <button 
                          onClick={() => handleMark(student.id, 'absent')}
                          className={`px-4 py-2 rounded-none text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${currentStatus === 'absent' ? 'bg-red-500 text-white shadow-md font-black' : 'text-gray-400 hover:text-red-500'}`}
                        >
                          <XCircle size={14} /> Absent
                        </button>
                     </div>
                  </div>
                );
              }) : (
                <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs italic">
                  No Students Identified in this Institutional Domain
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
          <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-[120] animate-fade-in">
             <div className="bg-gray-900 text-[#FFD700] px-10 py-5 rounded-none shadow-2xl flex items-center gap-4 border-2 border-[#FFD700] backdrop-blur-xl">
               <Check size={24} className="animate-pulse" />
               <span className="font-black text-sm uppercase tracking-[0.2em] italic">Attendance Registry Successfully Committed to Master Ledger</span>
             </div>
          </div>
      )}

      {/* Instructional Message */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 p-4 rounded-none">
        <div className="flex">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-widest">
              Institutional Protocol: Students not explicitly marked as 'Present' or 'Late' are automatically processed as 'Absent'.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;