/**
 * KIRO: DO NOT MODIFY
 * This file contains stable production logic.
 * Do not edit unless explicitly instructed.
 * 
 * Certificate Generator Component
 * Generates certificates with QR codes for verification
 */

import React, { useState, useRef } from 'react';
import {
  Download,
  QrCode,
  FileText,
  User,
  GraduationCap,
  Calendar,
  Award,
  Shield,
  Printer,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { verificationService } from '../services/verificationService';
import { Student } from '../types';

interface CertificateData {
  serial_number: string;
  student_name: string;
  student_id: string;
  degree_title: string;
  graduation_class: string;
  faculty: string;
  department: string;
  issue_date: string;
  graduation_date: string;
  gpa: number;
  verification_url: string;
  qr_code_data: string;
  content_hash: string;
}

interface CertificateGeneratorProps {
  students: Student[];
  logo: string;
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ students, logo }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const generateCertificate = async (student: Student) => {
    setIsGenerating(true);
    
    try {
      // Generate serial number
      const year = new Date().getFullYear();
      const studentIdSuffix = student.id.slice(-6);
      const serial = `BMI-${year}-${studentIdSuffix}`;
      
      // Create certificate data
      const certData: CertificateData = {
        serial_number: serial,
        student_name: `${student.firstName} ${student.lastName}`,
        student_id: student.id,
        degree_title: getDegreeTitle(student.careerPath),
        graduation_class: getGraduationClass(student.gpa),
        faculty: student.faculty,
        department: student.department,
        issue_date: new Date().toISOString().split('T')[0],
        graduation_date: new Date().toISOString().split('T')[0],
        gpa: student.gpa,
        verification_url: '',
        qr_code_data: '',
        content_hash: ''
      };

      // Generate content hash
      certData.content_hash = verificationService.generateContentHash({
        serial: certData.serial_number,
        name: certData.student_name,
        degree: certData.degree_title
      });

      // Generate verification URL
      certData.verification_url = verificationService.generateVerificationUrl(
        certData.serial_number,
        certData.content_hash
      );
      
      certData.qr_code_data = certData.verification_url;

      setCertificateData(certData);
      setShowPreview(true);
      
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDegreeTitle = (careerPath: string): string => {
    const degreeMap: Record<string, string> = {
      'Diploma in Theology': 'DIPLOMA IN CHRISTIAN MINISTRY AND THEOLOGY',
      'Degree in Theology': 'BACHELOR OF THEOLOGY',
      'Masters in Theology': 'MASTER OF DIVINITY',
      'PhD in Theology': 'DOCTOR OF MINISTRY',
      'Diploma in ICT': 'DIPLOMA IN INFORMATION TECHNOLOGY',
      'Degree in ICT': 'BACHELOR OF COMPUTER SCIENCE',
      'Masters in ICT': 'MASTER OF INFORMATION TECHNOLOGY',
      'PhD in ICT': 'DOCTOR OF PHILOSOPHY IN COMPUTER SCIENCE',
      'Diploma in Business': 'DIPLOMA IN BUSINESS ADMINISTRATION',
      'Degree in Business': 'BACHELOR OF BUSINESS ADMINISTRATION',
      'Masters in Business': 'MASTER OF BUSINESS ADMINISTRATION',
      'PhD in Business': 'DOCTOR OF PHILOSOPHY IN BUSINESS',
      'Diploma in Education': 'DIPLOMA IN EDUCATION',
      'Degree in Education': 'BACHELOR OF EDUCATION',
      'Masters in Education': 'MASTER OF EDUCATION',
      'PhD in Education': 'DOCTOR OF PHILOSOPHY IN EDUCATION'
    };
    
    return degreeMap[careerPath] || 'BACHELOR OF ARTS';
  };

  const getGraduationClass = (gpa: number): string => {
    if (gpa >= 3.6) return 'First Class Honours';
    if (gpa >= 3.0) return 'Second Class Honours (Upper Division)';
    if (gpa >= 2.5) return 'Second Class Honours (Lower Division)';
    return 'Pass';
  };

  const downloadCertificate = () => {
    if (!certificateRef.current) return;

    // In a real implementation, you would use a library like html2canvas or jsPDF
    // For demo purposes, we'll simulate the download
    const link = document.createElement('a');
    link.download = `${certificateData?.student_name.replace(/\s+/g, '_')}_Certificate.pdf`;
    link.href = '#'; // Would be the actual PDF blob URL
    link.click();
    
    alert('Certificate download would start here. In production, this would generate a PDF.');
  };

  const printCertificate = () => {
    if (!certificateRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Certificate - ${certificateData?.student_name}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: 'Times New Roman', serif; }
              .certificate { width: 100%; max-width: 800px; margin: 0 auto; }
              @media print { body { margin: 0; padding: 0; } }
            </style>
          </head>
          <body>
            ${certificateRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const graduatedStudents = students.filter(s => s.status === 'Graduated');

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Generator</h1>
          <p className="text-gray-600">Generate official certificates with QR codes for graduated students</p>
        </div>

        {!showPreview ? (
          /* Student Selection */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Graduate</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {graduatedStudents.map((student) => (
                <div
                  key={student.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#4B0082] hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full ${student.avatarColor} flex items-center justify-center text-white font-semibold`}>
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.firstName} {student.lastName}</h3>
                      <p className="text-sm text-gray-600">{student.id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={14} className="text-[#4B0082]" />
                      <span>{student.careerPath}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-[#FFD700]" />
                      <span>GPA: {student.gpa}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-500" />
                      <span>{student.faculty}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateCertificate(student);
                    }}
                    disabled={isGenerating}
                    className="w-full mt-4 px-4 py-2 bg-[#4B0082] text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText size={16} />
                        Generate Certificate
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {graduatedStudents.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No graduated students found</p>
                <p className="text-sm text-gray-400 mt-2">Students must have 'Graduated' status to generate certificates</p>
              </div>
            )}
          </div>
        ) : (
          /* Certificate Preview */
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-all"
              >
                ← Back to Selection
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={printCertificate}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <Printer size={16} />
                  Print
                </button>
                <button
                  onClick={downloadCertificate}
                  className="px-4 py-2 bg-[#4B0082] text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2"
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
            </div>
            {/* Certificate */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
              <div 
                ref={certificateRef}
                className="certificate-container bg-gradient-to-br from-white via-gray-50 to-white border-8 border-[#4B0082] rounded-lg p-12 relative overflow-hidden"
                style={{ 
                  minHeight: '600px',
                  backgroundImage: `
                    radial-gradient(circle at 20% 20%, rgba(75, 0, 130, 0.05) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.05) 0%, transparent 50%),
                    linear-gradient(45deg, transparent 49%, rgba(75, 0, 130, 0.02) 50%, transparent 51%)
                  `
                }}
              >
                {/* Decorative corners */}
                <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-[#FFD700] rounded-tl-lg"></div>
                <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-[#FFD700] rounded-tr-lg"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-[#FFD700] rounded-bl-lg"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-[#FFD700] rounded-br-lg"></div>

                {/* Header */}
                <div className="text-center mb-8">
                  <img 
                    src={logo} 
                    alt="BMI University" 
                    className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-[#FFD700]"
                  />
                  <h1 className="text-4xl font-bold text-[#4B0082] mb-2">BMI UNIVERSITY</h1>
                  <p className="text-lg text-gray-600 italic">"Excellence in Faith and Knowledge"</p>
                  <div className="w-32 h-1 bg-gradient-to-r from-[#4B0082] to-[#FFD700] mx-auto mt-4"></div>
                </div>

                {/* Certificate Title */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">CERTIFICATE OF GRADUATION</h2>
                  <p className="text-lg text-gray-600">This is to certify that</p>
                </div>

                {/* Student Name */}
                <div className="text-center mb-8">
                  <h3 className="text-4xl font-bold text-[#4B0082] border-b-2 border-[#FFD700] pb-2 inline-block">
                    {certificateData?.student_name.toUpperCase()}
                  </h3>
                </div>

                {/* Degree Information */}
                <div className="text-center mb-8">
                  <p className="text-lg text-gray-700 mb-2">has successfully completed the requirements for the degree of</p>
                  <h4 className="text-2xl font-bold text-[#4B0082] mb-4">
                    {certificateData?.degree_title}
                  </h4>
                  <p className="text-lg text-gray-700 mb-2">in the Faculty of</p>
                  <p className="text-xl font-semibold text-[#4B0082]">{certificateData?.faculty}</p>
                </div>

                {/* Graduation Class */}
                <div className="text-center mb-8">
                  <div className="inline-block bg-[#FFD700] text-[#4B0082] px-6 py-2 rounded-full font-bold text-lg">
                    {certificateData?.graduation_class}
                  </div>
                </div>

                {/* Footer Information */}
                <div className="flex justify-between items-end mt-12">
                  {/* Left side - Date and Serial */}
                  <div className="text-left">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Date of Graduation</p>
                      <p className="font-semibold text-gray-800">
                        {certificateData && new Date(certificateData.graduation_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Certificate Serial</p>
                      <p className="font-mono font-semibold text-gray-800">{certificateData?.serial_number}</p>
                    </div>
                  </div>

                  {/* Center - QR Code */}
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center mb-2">
                      <QrCode size={48} className="text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">Scan to verify</p>
                  </div>

                  {/* Right side - Signatures */}
                  <div className="text-right">
                    <div className="mb-6">
                      <div className="w-32 border-b border-gray-400 mb-1"></div>
                      <p className="text-sm font-semibold">Prof. Isaac Sigei</p>
                      <p className="text-xs text-gray-600">Vice Chancellor</p>
                    </div>
                    <div>
                      <div className="w-32 border-b border-gray-400 mb-1"></div>
                      <p className="text-sm font-semibold">Dr. Samuel Kiptoo</p>
                      <p className="text-xs text-gray-600">Registrar</p>
                    </div>
                  </div>
                </div>

                {/* Security Features Notice */}
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Shield size={12} />
                      <span>Security Features: QR Code Verification</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>Hash: {certificateData?.content_hash}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                    <p className="font-mono text-gray-900">{certificateData?.serial_number}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                    <p className="text-gray-900">{certificateData?.student_id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                    <p className="text-gray-900">{certificateData?.gpa}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                    <p className="text-gray-900">
                      {certificateData && new Date(certificateData.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content Hash</label>
                    <p className="font-mono text-gray-900 break-all">{certificateData?.content_hash}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verification URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={certificateData?.verification_url || ''}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(certificateData?.verification_url || '')}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">QR Code Data</label>
                    <p className="text-gray-900 text-sm break-all">{certificateData?.qr_code_data}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateGenerator;