/**
 * STUDENT REGISTRY COMPONENT
 * University Certificate Verification System - BMI-UMS
 * 
 * React component for student management and graduation approval
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  UserCheck,
  GraduationCap,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  TrendingUp,
  Award
} from 'lucide-react';

import {
  StudentRegistryEngine,
  GraduationApprovalEngine,
  CertificateIssuanceIntegration,
  StudentRecord,
  GraduationApplication,
  GraduationApplicationStatus,
  StudentStatus
} from '../services/studentRegistry';

interface StudentRegistryProps {
  logo?: string;
}

const StudentRegistry: React.FC<StudentRegistryProps> = ({ logo }) => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [applications, setApplications] = useState<GraduationApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('');
  const [programFilter, setProgramFilter] = useState('');
  const [yearFilter, setYearFilter] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState<'students' | 'applications' | 'certificates'>('students');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<GraduationApplication | null>(null);

  // Load students on component mount
  useEffect(() => {
    loadStudents();
    loadApplications();
  }, []);

  // Load students
  const loadStudents = async () => {
    try {
      setLoading(true);
      const registry = StudentRegistryEngine.getInstance();
      const studentList = await registry.searchStudents({
        name: searchTerm || undefined,
        program: programFilter || undefined,
        status: statusFilter || undefined,
        graduation_year: yearFilter ? parseInt(yearFilter) : undefined
      });
      setStudents(studentList);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load applications
  const loadApplications = async () => {
    try {
      const engine = GraduationApprovalEngine.getInstance();
      const appList = await engine.getApplications();
      setApplications(appList);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  // Handle student creation
  const handleCreateStudent = async (studentData: any) => {
    try {
      const registry = StudentRegistryEngine.getInstance();
      const newStudent = await registry.createStudent(studentData);
      setStudents([...students, newStudent]);
      setShowStudentModal(false);
    } catch (error) {
      console.error('Error creating student:', error);
    }
  };

  // Handle graduation application submission
  const handleSubmitApplication = async (applicationData: any) => {
    try {
      const engine = GraduationApprovalEngine.getInstance();
      const application = await engine.submitApplication(applicationData.student_id, applicationData);
      setApplications([...applications, application]);
      setShowApplicationModal(false);
    } catch (error) {
      console.error('Error submitting application:', error);
    }
  };

  // Handle application review
  const handleReviewApplication = async (applicationId: string, reviewData: any) => {
    try {
      const engine = GraduationApprovalEngine.getInstance();
      const updatedApplication = await engine.reviewApplication(applicationId, reviewData);
      setApplications(applications.map(app => 
        app.application_id === applicationId ? updatedApplication : app
      ));
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error reviewing application:', error);
    }
  };

  // Handle certificate issuance
  const handleIssueCertificate = async (studentId: string, certificateData: any) => {
    try {
      const integration = new CertificateIssuanceIntegration();
      const result = await integration.issueCertificateForGraduate(studentId, certificateData);
      
      // Update student status
      const registry = StudentRegistryEngine.getInstance();
      const updatedStudent = await registry.updateStudent(studentId, {
        status: StudentStatus.GRADUATED,
        graduation_date: certificateData.issue_date,
        updated_by: 'system'
      });
      
      setStudents(students.map(s => 
        s.student_id === studentId ? updatedStudent : s
      ));
      
      alert('Certificate issued successfully!');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      alert('Error issuing certificate: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Get status color
  const getStatusColor = (status: StudentStatus) => {
    switch (status) {
      case StudentStatus.ACTIVE: return 'text-green-600 bg-green-50';
      case StudentStatus.GRADUATED: return 'text-blue-600 bg-blue-50';
      case StudentStatus.SUSPENDED: return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get application status color
  const getApplicationStatusColor = (status: GraduationApplicationStatus) => {
    switch (status) {
      case GraduationApplicationStatus.APPROVED: return 'text-green-600 bg-green-50';
      case GraduationApplicationStatus.REJECTED: return 'text-red-600 bg-red-50';
      case GraduationApplicationStatus.DEFERRED: return 'text-yellow-600 bg-yellow-50';
      case GraduationApplicationStatus.UNDER_REVIEW: return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={logo || "https://i.ibb.co/Gv2vPdJC/BMI-PNG.png"} 
                alt="BMI University" 
                className="w-12 h-12 object-contain rounded-lg border-2 border-[#4B0082]"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Registry</h1>
                <p className="text-gray-600">Manage students and graduation applications</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStudentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#4B0082] text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={20} />
                Add Student
              </button>
              <button
                onClick={() => setShowApplicationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-[#4B0082] rounded-lg hover:bg-yellow-400 transition-colors"
              >
                <GraduationCap size={20} />
                Apply for Graduation
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'students' 
                  ? 'border-[#4B0082] text-[#4B0082]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'applications' 
                  ? 'border-[#4B0082] text-[#4B0082]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Applications ({applications.length})
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'certificates' 
                  ? 'border-[#4B0082] text-[#4B0082]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Award className="w-4 h-4 mr-2" />
              Certificates
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B0082] focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StudentStatus | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B0082] focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value={StudentStatus.ACTIVE}>Active</option>
              <option value={StudentStatus.GRADUATED}>Graduated</option>
              <option value={StudentStatus.SUSPENDED}>Suspended</option>
            </select>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B0082] focus:border-transparent"
            >
              <option value="">All Programs</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Business Administration">Business Administration</option>
              <option value="Theology">Theology</option>
              <option value="Education">Education</option>
            </select>
            <input
              type="number"
              placeholder="Graduation Year"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value ? parseInt(e.target.value) : '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B0082] focus:border-transparent"
            />
            <button
              onClick={loadStudents}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B0082]"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Graduation Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GPA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 mr-3">
                              {student.student_id.slice(-3)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                              <div className="text-xs text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.program}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(student.status)}`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.graduation_year || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.current_gpa ? student.current_gpa.toFixed(2) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowStudentModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleIssueCertificate(student.student_id, {
                                degree: student.program,
                                faculty: student.department || 'Unknown',
                                issue_date: new Date().toISOString().split('T')[0],
                                issued_by: 'system'
                              })}
                              disabled={student.status !== StudentStatus.GRADUATED}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Award size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B0082]"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.application_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                          {application.application_id.slice(-6)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {application.student_id} - Graduation Application
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.degree_sought} • {application.faculty}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getApplicationStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Applied:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(application.application_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Expected Graduation:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(application.expected_graduation_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">GPA:</span>
                        <span className="text-sm text-gray-900">{application.gpa_at_application}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Credits:</span>
                        <span className="text-sm text-gray-900">
                          {application.credits_completed} / 120
                        </span>
                      </div>
                    </div>
                    {application.reviewer_comments && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-1">Review Comments:</div>
                        <p className="text-sm text-gray-600">{application.reviewer_comments}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye size={16} />
                      </button>
                      {application.status === GraduationApplicationStatus.PENDING && (
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowApplicationModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {application.status === GraduationApplicationStatus.APPROVED && (
                        <button
                          onClick={() => handleIssueCertificate(application.student_id, {
                            degree: application.degree_sought,
                            faculty: application.faculty,
                            issue_date: new Date().toISOString().split('T')[0],
                            issued_by: 'system'
                          })}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Award size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Certificate Management</h3>
              <p className="text-gray-500 mb-4">
                Issue certificates for eligible graduates
              </p>
              <button
                onClick={() => {
                  const integration = new CertificateIssuanceIntegration();
                  integration.getEligibleGraduates().then(graduates => {
                    alert(`Found ${graduates.length} eligible graduates for certificate issuance`);
                  });
                }}
                className="px-6 py-3 bg-[#4B0082] text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Check Eligible Graduates
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Student Details</h2>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Student ID:</span>
                  <span className="text-sm text-gray-900">{selectedStudent.student_id}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Full Name:</span>
                  <span className="text-sm text-gray-900">{selectedStudent.full_name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <span className="text-sm text-gray-900">{selectedStudent.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Phone:</span>
                  <span className="text-sm text-gray-900">{selectedStudent.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Program:</span>
                  <span className="text-sm text-gray-900">{selectedStudent.program}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedStudent.status)}`}>
                    {selectedStudent.status}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Current GPA:</span>
                  <span className="text-sm text-gray-900">
                    {selectedStudent.current_gpa ? selectedStudent.current_gpa.toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Credits:</span>
                  <span className="text-sm text-gray-900">
                    {selectedStudent.total_credits || 0} / {selectedStudent.credits_required || 120}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Graduation Year:</span>
                  <span className="text-sm text-gray-900">
                    {selectedStudent.graduation_year || 'Not Set'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Application Status:</span>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getApplicationStatusColor(selectedStudent.graduation_application_status || GraduationApplicationStatus.NOT_APPLIED)}`}>
                    {selectedStudent.graduation_application_status || 'Not Applied'}
                  </span>
                </div>
              </div>
              {selectedStudent.graduation_eligibility && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Graduation Eligibility</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {selectedStudent.graduation_eligibility.eligible ? (
                        <CheckCircle2 className="text-green-600" size={20} />
                      ) : (
                        <AlertTriangle className="text-yellow-600" size={20} />
                      )}
                      <span className="text-sm font-medium">
                        {selectedStudent.graduation_eligibility.eligible ? 'Eligible' : 'Not Eligible'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="mb-1">
                        <strong>Requirements Met:</strong>
                      </div>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        {selectedStudent.graduation_eligibility.requirements_met.map((req, index) => (
                          <li key={index} className="text-sm text-green-600">✓ {req}</li>
                        ))}
                      </ul>
                      {!selectedStudent.graduation_eligibility.eligible && (
                        <div className="mb-1">
                          <strong>Missing Requirements:</strong>
                        </div>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          {selectedStudent.graduation_eligibility.missing_requirements.map((req, index) => (
                            <li key={index} className="text-sm text-red-600">✗ {req}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Review Application</h2>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Application ID:</span>
                  <span className="text-sm text-gray-900">{selectedApplication.application_id}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Student ID:</span>
                  <span className="text-sm text-gray-900">{selectedApplication.student_id}</span>
                </div>
                <div>
                  <span className="text-degree font-medium text-gray-500">Degree Sought:</span>
                  <span className="text-sm text-gray-900">{selectedApplication.degree_sought}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Faculty:</span>
                  <span className="text-sm text-gray-900">{selectedApplication.faculty}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">GPA:</span>
                  <span className="text-sm text-gray-900">{selectedApplication.gpa_at_application}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Credits:</span>
                  <span className="text-sm text-gray-900">
                    {selectedApplication.credits_completed} / 120
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Applied:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(selectedApplication.application_date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Expected Graduation:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(selectedApplication.expected_graduation_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Decision:
                </label>
                <select
                  value={selectedApplication.status}
                  onChange={(e) => {
                    setSelectedApplication({
                      ...selectedApplication,
                      status: e.target.value as GraduationApplicationStatus
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B0082] focus:border-transparent"
                >
                  <option value={GraduationApplicationStatus.PENDING}>Pending</option>
                  <option value={GraduationApplicationStatus.UNDER_REVIEW}>Under Review</option>
                  <option value={GraduationApplicationStatus.APPROVED}>Approve</option>
                  <option value={GraduationApplicationStatus.REJECTED}>Reject</option>
                  <option value={GraduationApplicationStatus.DEFERRED}>Defer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Comments:
                </label>
                <textarea
                  value={selectedApplication.reviewer_comments || ''}
                  onChange={(e) => {
                    setSelectedApplication({
                      ...selectedApplication,
                      reviewer_comments: e.target.value
                    });
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B0082] focus:border-transparent"
                  placeholder="Enter review comments..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReviewApplication(selectedApplication.application_id, {
                    reviewer_comments: selectedApplication.reviewer_comments || '',
                    reviewed_by: 'admin',
                    decision: selectedApplication.status === GraduationApplicationStatus.APPROVED ? 'APPROVE' :
                           selectedApplication.status === GraduationApplicationStatus.REJECTED ? 'REJECT' : 'DEFER'
                  })}
                  className="px-4 py-2 bg-[#4B0082] text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistry;
