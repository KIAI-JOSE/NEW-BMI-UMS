
import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Layers, 
  GraduationCap, 
  BookMarked, 
  Hash, 
  Edit, 
  Trash2, 
  Info,
  LayoutGrid,
  List,
  Award,
  Library
} from 'lucide-react';
import { Course } from '../types';
import CourseModal from './CourseModal';

interface CoursesProps {
  theme: string;
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
}

const Courses: React.FC<CoursesProps> = ({ theme, courses, setCourses }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLevel, setActiveLevel] = useState('All Levels');
  const [facultyFilter, setFacultyFilter] = useState('All Faculty');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = (course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             course.code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFaculty = facultyFilter === 'All Faculty' || course.faculty === facultyFilter;
      
      let matchesLevel = true;
      if (activeLevel !== 'All Levels') {
          // Map tabs to data levels or names
          if (activeLevel === 'Undergraduate') matchesLevel = course.level === 'Undergraduate';
          else if (activeLevel === 'Postgraduate') matchesLevel = course.level === 'Postgraduate';
          else if (activeLevel === 'Diploma') matchesLevel = course.level === 'Diploma';
          else if (activeLevel === 'Certificate') matchesLevel = course.level === 'Certificate';
          else if (activeLevel === 'Masters') matchesLevel = course.name.includes('Master') || course.name.includes('MA') || course.name.includes('MDiv');
          else if (activeLevel === 'PhD') matchesLevel = course.name.includes('Doctor') || course.name.includes('PhD') || course.code.startsWith('D');
      }
      
      return matchesSearch && matchesFaculty && matchesLevel;
    });
  }, [courses, searchTerm, facultyFilter, activeLevel]);

  const handleSave = (courseData: Partial<Course>) => {
    if (editingCourse) {
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, ...courseData } as Course : c));
    } else {
      const newCourse: Course = {
        ...courseData as Course,
        id: `CRS-${Math.floor(Math.random() * 9000) + 1000}`,
      };
      setCourses(prev => [newCourse, ...prev]);
    }
    setEditingCourse(null);
  };

  const deleteCourse = (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      setCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  const openModal = (course?: Course) => {
    setEditingCourse(course || null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 dark:border-gray-800 pb-8">
        <div>
           <div className="flex items-center gap-4 mb-2">
             <div className="w-3 h-12 bg-[#FFD700] rounded-none"></div>
             <h2 className="text-3xl font-bold text-[#2E004F] dark:text-white tracking-tight uppercase">Curriculum Management</h2>
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-7 uppercase tracking-widest">BMI Institutional Course Catalog & Syllabus Repository</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white dark:bg-gray-800 p-1 rounded-none shadow-sm border border-gray-100 dark:border-gray-700">
             <button onClick={() => setViewMode('grid')} className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-[#4B0082] text-white' : 'text-gray-400 hover:text-[#4B0082]'}`}><LayoutGrid size={20} /></button>
             <button onClick={() => setViewMode('list')} className={`p-2 transition-all ${viewMode === 'list' ? 'bg-[#4B0082] text-white' : 'text-gray-400 hover:text-[#4B0082]'}`}><List size={20} /></button>
          </div>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-8 py-4 bg-[#4B0082] text-white rounded-none shadow-xl hover:bg-black transition-all font-black text-xs uppercase tracking-widest border border-[#FFD700]/30"
          >
            <Plus size={18} className="text-[#FFD700]" /> New Course
          </button>
        </div>
      </div>

      {/* Level Tabs */}
      <div className="flex flex-wrap gap-4 mb-8 px-1">
         {[
           { id: 'All Levels', label: 'All Programs', color: 'bg-gray-600', icon: Layers },
           { id: 'Diploma', label: 'Diploma Courses', color: 'bg-blue-600', icon: BookMarked },
           { id: 'Undergraduate', label: 'Degree Programs', color: 'bg-[#6D28D9]', icon: GraduationCap },
           { id: 'Masters', label: 'Masters Programs', color: 'bg-[#EA580C]', icon: Award },
           { id: 'PhD', label: 'Doctoral Programs', color: 'bg-[#059669]', icon: Library },
           { id: 'Certificate', label: 'Certificates', color: 'bg-[#0891B2]', icon: Hash }
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveLevel(tab.id)}
             className={`flex-1 min-w-[160px] px-6 py-4 rounded-lg text-white shadow-md transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 ${
               tab.color
             } ${activeLevel === tab.id ? 'ring-4 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900 ring-gray-300 dark:ring-gray-600 scale-[1.02] font-black shadow-xl' : 'opacity-85 hover:opacity-100 font-bold'}`}
           >
             <tab.icon size={20} className="text-white/90" />
             <span className="text-xs uppercase tracking-widest">{tab.label}</span>
           </button>
         ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 flex flex-col md:flex-row gap-4 items-center shadow-sm">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Course Name, Code or Description..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-none outline-none font-bold text-sm dark:text-white focus:ring-1 focus:ring-[#4B0082]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <select 
           value={facultyFilter}
           onChange={(e) => setFacultyFilter(e.target.value)}
           className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-black uppercase outline-none cursor-pointer dark:text-white"
         >
           {['All Faculty', 'Theology', 'ICT', 'Business', 'Education', 'General'].map(f => <option key={f} value={f}>{f}</option>)}
         </select>
      </div>

      {/* Grid or List */}
      {viewMode === 'grid' ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 flex flex-col group hover:shadow-2xl transition-all relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-[#4B0082] group-hover:w-2 transition-all"></div>
             
             <div className="flex justify-between items-start mb-4 pl-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{course.code}</span>
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
                   course.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                   course.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                   'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                   {course.status}
                </span>
             </div>

             <div className="pl-4 mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none group-hover:text-[#4B0082] transition-colors line-clamp-2">{course.name}</h3>
                <p className="text-[10px] font-bold text-[#4B0082] dark:text-purple-300 uppercase tracking-widest mt-2">{course.faculty} • {course.department}</p>
                <div className="mt-4 text-xs font-medium text-gray-500 dark:text-gray-400 line-clamp-3">
                   {course.description}
                </div>
             </div>

             <div className="mt-auto pl-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500"><Info size={12} /></div>
                   <span className="text-[10px] font-bold text-gray-500">{course.credits} Credits</span>
                </div>
                <div className="flex gap-1">
                   <button onClick={() => openModal(course)} className="p-2 text-gray-300 hover:text-[#4B0082] transition-colors"><Edit size={16} /></button>
                   <button onClick={() => deleteCourse(course.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
             </div>
          </div>
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
             <Layers size={48} className="mb-4 opacity-20" />
             <p className="font-black uppercase tracking-widest text-sm">No curriculum modules found</p>
          </div>
        )}
      </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-none shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-gray-900 text-gray-400 uppercase text-[9px] font-black tracking-[0.2em]">
                       <th className="px-6 py-5">Code</th>
                       <th className="px-6 py-5">Course Title</th>
                       <th className="px-6 py-5">Department</th>
                       <th className="px-6 py-5 text-center">Credits</th>
                       <th className="px-6 py-5 text-center">Status</th>
                       <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filteredCourses.map((course) => (
                       <tr key={course.id} className="hover:bg-purple-50/20 dark:hover:bg-gray-700/20 transition-all group">
                          <td className="px-6 py-5 font-mono text-xs font-bold text-[#4B0082] dark:text-purple-300">{course.code}</td>
                          <td className="px-6 py-5">
                             <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{course.name}</p>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{course.level}</p>
                          </td>
                          <td className="px-6 py-5">
                             <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">{course.department}</p>
                             <p className="text-[9px] font-black text-[#4B0082] dark:text-purple-300 uppercase tracking-widest mt-0.5">{course.faculty}</p>
                          </td>
                          <td className="px-6 py-5 text-center font-bold text-gray-600 dark:text-gray-400 text-xs">{course.credits}</td>
                          <td className="px-6 py-5 text-center">
                             <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
                                course.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                course.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-gray-50 text-gray-500 border-gray-200'
                             }`}>
                                {course.status}
                             </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openModal(course)} className="p-2 text-gray-400 hover:text-[#4B0082]"><Edit size={16} /></button>
                                <button onClick={() => deleteCourse(course.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           {filteredCourses.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                 <Layers size={48} className="mb-4 opacity-20" />
                 <p className="font-black uppercase tracking-widest text-sm">No curriculum modules found</p>
              </div>
           )}
        </div>
      )}

      <CourseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        editData={editingCourse} 
      />
    </div>
  );
};

export default Courses;
