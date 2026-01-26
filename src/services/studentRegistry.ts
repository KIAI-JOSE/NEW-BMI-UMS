/**
 * STUDENT REGISTRY AND GRADUATION APPROVAL SYSTEM
 * University Certificate Verification System - BMI-UMS
 * 
 * Production-grade student management with graduation workflows
 */

import {
  StudentDocument,
  StudentStatus,
  CertificateIssuanceRequest,
  CertificateDocument,
  AuditAction
} from '../types/certificateSchema';

// ============================================================================
// STUDENT REGISTRY SCHEMA EXTENSIONS
// ============================================================================

export interface StudentRecord extends StudentDocument {
  // Academic Information
  current_gpa?: number;              // Current GPA
  total_credits?: number;           // Total credits earned
  credits_required?: number;        // Credits required for graduation
  
  // Program Information
  program_code?: string;            // Program code (e.g., BSC-CS)
  department?: string;              // Academic department
  advisor_id?: string;              // Academic advisor ID
  
  // Graduation Information
  expected_graduation_year?: number; // Expected graduation year
  graduation_application_status?: GraduationApplicationStatus;
  graduation_eligibility?: GraduationEligibility;
  graduation_date?: string;         // Actual graduation date
  
  // Contact Information
  email?: string;                   // Student email
  phone?: string;                   // Student phone
  address?: string;                 // Student address
  
  // Administrative
  admission_date?: string;          // Date of admission
  last_active_date?: string;        // Last active date
  academic_standing?: string;       // Good standing, probation, etc.
  
  // Metadata
  updated_by?: string;              // Who last updated the record
  updated_at?: string;              // Last update timestamp
}

export enum GraduationApplicationStatus {
  NOT_APPLIED = 'NOT_APPLIED',
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DEFERRED = 'DEFERRED'
}

export interface GraduationEligibility {
  eligible: boolean;
  credits_completed: number;
  credits_required: number;
  gpa_met: boolean;
  standing_met: boolean;
  requirements_met: string[];
  missing_requirements: string[];
  last_review_date: string;
  reviewed_by: string;
}

export interface GraduationApplication {
  application_id: string;
  student_id: string;
  application_date: string;
  expected_graduation_date: string;
  degree_sought: string;
  faculty: string;
  department: string;
  gpa_at_application: number;
  credits_completed: number;
  status: GraduationApplicationStatus;
  reviewer_comments?: string;
  reviewed_by?: string;
  reviewed_date?: string;
  final_decision_date?: string;
  supporting_documents: string[];
}

export interface AcademicRecord {
  record_id: string;
  student_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  grade: string;
  grade_points: number;
  semester: string;
  academic_year: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'WITHDRAWN' | 'FAILED';
}

export interface GraduationRequirement {
  requirement_id: string;
  program_code: string;
  requirement_type: 'COURSE' | 'CREDIT' | 'GPA' | 'STANDING' | 'ELECTIVE';
  description: string;
  required_value: number | string;
  comparison_operator: '>=' | '<=' | '=' | 'CONTAINS';
  is_met: boolean;
  student_achievements: any;
}

// ============================================================================
// STUDENT REGISTRY ENGINE
// ============================================================================

export class StudentRegistryEngine {
  private static instance: StudentRegistryEngine;

  static getInstance(): StudentRegistryEngine {
    if (!StudentRegistryEngine.instance) {
      StudentRegistryEngine.instance = new StudentRegistryEngine();
    }
    return StudentRegistryEngine.instance;
  }

  /**
   * Create new student record
   */
  async createStudent(studentData: Omit<StudentRecord, 'student_id' | 'created_at'>): Promise<StudentRecord> {
    const studentId = this.generateStudentId(studentData);
    const now = new Date().toISOString();
    
    const student: StudentRecord = {
      ...studentData,
      student_id: studentId,
      status: StudentStatus.ACTIVE,
      graduation_application_status: GraduationApplicationStatus.NOT_APPLIED,
      created_at: now,
      updated_at: now,
      updated_by: studentData.updated_by || 'system'
    };

    // In production, save to Firestore
    console.log('Student created:', studentId);
    return student;
  }

  /**
   * Get student by ID
   */
  async getStudent(studentId: string): Promise<StudentRecord | null> {
    // In production, query Firestore
    // const studentDoc = await db.collection('students').doc(studentId).get();
    // return studentDoc.exists ? studentDoc.data() as StudentRecord : null;

    // Mock implementation
    return this.getMockStudent(studentId);
  }

  /**
   * Update student record
   */
  async updateStudent(studentId: string, updates: Partial<StudentRecord>): Promise<StudentRecord> {
    const existingStudent = await this.getStudent(studentId);
    if (!existingStudent) {
      throw new Error('Student not found');
    }

    const updatedStudent: StudentRecord = {
      ...existingStudent,
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: updates.updated_by || 'system'
    };

    // In production, update Firestore
    console.log('Student updated:', studentId);
    return updatedStudent;
  }

  /**
   * Generate student ID (BMI-STU-NNNNN)
   */
  private generateStudentId(student: Omit<StudentRecord, 'student_id' | 'created_at'>): string {
    // In production, query for last student ID and increment
    // For now, generate based on admission year and sequence
    const year = student.admission_date ? new Date(student.admission_date).getFullYear() : new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 99999) + 1;
    return `BMI-STU-${year.toString().slice(-2)}${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Mock student data for testing
   */
  private getMockStudent(studentId: string): StudentRecord | null {
    const mockStudents: Record<string, StudentRecord> = {
      'BMI-STU-22102': {
        student_id: 'BMI-STU-22102',
        full_name: 'John Mwangi',
        national_id: '12345678',
        program: 'Bachelor of Science in Computer Science',
        program_code: 'BSC-CS',
        department: 'School of Computing',
        enrollment_year: 2022,
        graduation_year: 2026,
        expected_graduation_year: 2026,
        status: StudentStatus.GRADUATED,
        current_gpa: 3.8,
        total_credits: 120,
        credits_required: 120,
        advisor_id: 'ADV-001',
        email: 'john.mwangi@bmi.edu',
        phone: '+254-712-345-678',
        admission_date: '2022-09-01T00:00:00Z',
        last_active_date: '2026-01-15T00:00:00Z',
        academic_standing: 'Good Standing',
        graduation_application_status: GraduationApplicationStatus.APPROVED,
        graduation_eligibility: {
          eligible: true,
          credits_completed: 120,
          credits_required: 120,
          gpa_met: true,
          standing_met: true,
          requirements_met: ['Core Courses', 'Electives', 'GPA Requirement'],
          missing_requirements: [],
          last_review_date: '2025-12-01T00:00:00Z',
          reviewed_by: 'advisor-001'
        },
        created_at: '2022-09-01T00:00:00Z',
        updated_at: '2026-01-15T00:00:00Z',
        updated_by: 'system'
      },
      'BMI-STU-23105': {
        student_id: 'BMI-STU-23105',
        full_name: 'Mary Johnson',
        national_id: '87654321',
        program: 'Bachelor of Business Administration',
        program_code: 'BBA',
        department: 'School of Business',
        enrollment_year: 2023,
        graduation_year: 2027,
        expected_graduation_year: 2027,
        status: StudentStatus.ACTIVE,
        current_gpa: 3.5,
        total_credits: 90,
        credits_required: 120,
        advisor_id: 'ADV-002',
        email: 'mary.johnson@bmi.edu',
        phone: '+254-712-345-679',
        admission_date: '2023-09-01T00:00:00Z',
        last_active_date: '2025-12-20T00:00:00Z',
        academic_standing: 'Good Standing',
        graduation_application_status: GraduationApplicationStatus.NOT_APPLIED,
        graduation_eligibility: {
          eligible: false,
          credits_completed: 90,
          credits_required: 120,
          gpa_met: true,
          standing_met: true,
          requirements_met: ['Core Courses'],
          missing_requirements: ['Electives', 'Final Year Project'],
          last_review_date: '2025-12-01T00:00:00Z',
          reviewed_by: 'advisor-002'
        },
        created_at: '2023-09-01T00:00:00Z',
        updated_at: '2025-12-20T00:00:00Z',
        updated_by: 'system'
      }
    };

    return mockStudents[studentId] || null;
  }

  /**
   * Search students by criteria
   */
  async searchStudents(criteria: {
    name?: string;
    program?: string;
    status?: StudentStatus;
    graduation_year?: number;
  }): Promise<StudentRecord[]> {
    // In production, query Firestore with filters
    // For now, return mock data
    const allStudents = Object.values({
      'BMI-STU-22102': this.getMockStudent('BMI-STU-22102'),
      'BMI-STU-23105': this.getMockStudent('BMI-STU-23105')
    }).filter(Boolean) as StudentRecord[];

    return allStudents.filter(student => {
      if (criteria.name && !student.full_name.toLowerCase().includes(criteria.name.toLowerCase())) {
        return false;
      }
      if (criteria.program && !student.program.toLowerCase().includes(criteria.program.toLowerCase())) {
        return false;
      }
      if (criteria.status && student.status !== criteria.status) {
        return false;
      }
      if (criteria.graduation_year && student.graduation_year !== criteria.graduation_year) {
        return false;
      }
      return true;
    });
  }
}

// ============================================================================
// GRADUATION APPROVAL ENGINE
// ============================================================================

export class GraduationApprovalEngine {
  private static instance: GraduationApprovalEngine;

  static getInstance(): GraduationApprovalEngine {
    if (!GraduationApprovalEngine.instance) {
      GraduationApprovalEngine.instance = new GraduationApprovalEngine();
    }
    return GraduationApprovalEngine.instance;
  }

  /**
   * Submit graduation application
   */
  async submitApplication(studentId: string, applicationData: Omit<GraduationApplication, 'application_id' | 'application_date' | 'status'>): Promise<GraduationApplication> {
    const applicationId = this.generateApplicationId();
    const now = new Date().toISOString();
    
    const application: GraduationApplication = {
      ...applicationData,
      application_id: applicationId,
      student_id: studentId,
      application_date: now,
      status: GraduationApplicationStatus.PENDING
    };

    // Update student status
    const studentRegistry = StudentRegistryEngine.getInstance();
    await studentRegistry.updateStudent(studentId, {
      graduation_application_status: GraduationApplicationStatus.PENDING,
      updated_by: 'student-' + studentId
    });

    // In production, save to Firestore
    console.log('Graduation application submitted:', applicationId);
    return application;
  }

  /**
   * Review graduation application
   */
  async reviewApplication(applicationId: string, reviewData: {
    reviewer_comments: string;
    reviewed_by: string;
    decision: 'APPROVE' | 'REJECT' | 'DEFER'
  }): Promise<GraduationApplication> {
    // In production, get application from Firestore
    const application = await this.getApplication(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    const updatedApplication: GraduationApplication = {
      ...application,
      reviewer_comments: reviewData.reviewer_comments,
      reviewed_by: reviewData.reviewed_by,
      reviewed_date: new Date().toISOString(),
      status: reviewData.decision === 'APPROVE' ? GraduationApplicationStatus.APPROVED :
               reviewData.decision === 'REJECT' ? GraduationApplicationStatus.REJECTED :
               GraduationApplicationStatus.DEFERRED,
      final_decision_date: new Date().toISOString()
    };

    // Update student status
    const studentRegistry = StudentRegistryEngine.getInstance();
    await studentRegistry.updateStudent(application.student_id, {
      graduation_application_status: updatedApplication.status,
      updated_by: reviewData.reviewed_by
    });

    // If approved, mark as eligible for graduation
    if (reviewData.decision === 'APPROVE') {
      await this.markAsGraduationEligible(application.student_id, reviewData.reviewed_by);
    }

    console.log('Application reviewed:', applicationId, 'Decision:', reviewData.decision);
    return updatedApplication;
  }

  /**
   * Check graduation eligibility
   */
  async checkGraduationEligibility(studentId: string): Promise<GraduationEligibility> {
    const studentRegistry = StudentRegistryEngine.getInstance();
    const student = await studentRegistry.getStudent(studentId);
    
    if (!student) {
      throw new Error('Student not found');
    }

    const eligibility: GraduationEligibility = {
      eligible: false,
      credits_completed: student.total_credits || 0,
      credits_required: student.credits_required || 120,
      gpa_met: (student.current_gpa || 0) >= 2.5,
      standing_met: student.academic_standing === 'Good Standing',
      requirements_met: [],
      missing_requirements: [],
      last_review_date: new Date().toISOString(),
      reviewed_by: 'system'
    };

    // Check credit requirement
    if (eligibility.credits_completed >= eligibility.credits_required) {
      eligibility.requirements_met.push('Credit Requirement');
    } else {
      eligibility.missing_requirements.push(`Credits: ${eligibility.credits_completed}/${eligibility.credits_required}`);
    }

    // Check GPA requirement
    if (eligibility.gpa_met) {
      eligibility.requirements_met.push('GPA Requirement');
    } else {
      eligibility.missing_requirements.push(`GPA: ${student.current_gpa} (minimum: 2.5)`);
    }

    // Check academic standing
    if (eligibility.standing_met) {
      eligibility.requirements_met.push('Academic Standing');
    } else {
      eligibility.missing_requirements.push('Academic Standing: ' + student.academic_standing);
    }

    // Overall eligibility
    eligibility.eligible = eligibility.missing_requirements.length === 0;

    // Update student record
    await studentRegistry.updateStudent(studentId, {
      graduation_eligibility: eligibility,
      updated_by: 'system'
    });

    return eligibility;
  }

  /**
   * Get graduation applications
   */
  async getApplications(filters?: {
    status?: GraduationApplicationStatus;
    student_id?: string;
    reviewer?: string;
  }): Promise<GraduationApplication[]> {
    // In production, query Firestore with filters
    // For now, return mock data
    return this.getMockApplications(filters);
  }

  /**
   * Mark student as graduation eligible
   */
  private async markAsGraduationEligible(studentId: string, reviewedBy: string): Promise<void> {
    const studentRegistry = StudentRegistryEngine.getInstance();
    await studentRegistry.updateStudent(studentId, {
      graduation_eligibility: {
        eligible: true,
        credits_completed: 120,
        credits_required: 120,
        gpa_met: true,
        standing_met: true,
        requirements_met: ['Credit Requirement', 'GPA Requirement', 'Academic Standing'],
        missing_requirements: [],
        last_review_date: new Date().toISOString(),
        reviewed_by: reviewedBy
      },
      updated_by: reviewedBy
    });
  }

  /**
   * Generate application ID
   */
  private generateApplicationId(): string {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 999999) + 1;
    return `GRAD-${year}-${sequence.toString().padStart(6, '0')}`;
  }

  /**
   * Get application by ID
   */
  private async getApplication(applicationId: string): Promise<GraduationApplication | null> {
    const applications = this.getMockApplications();
    return applications.find(app => app.application_id === applicationId) || null;
  }

  /**
   * Mock applications for testing
   */
  private getMockApplications(filters?: {
    status?: GraduationApplicationStatus;
    student_id?: string;
    reviewer?: string;
  }): GraduationApplication[] {
    const mockApplications: GraduationApplication[] = [
      {
        application_id: 'GRAD-2026-123456',
        student_id: 'BMI-STU-22102',
        application_date: '2025-11-15T00:00:00Z',
        expected_graduation_date: '2026-01-15T00:00:00Z',
        degree_sought: 'Bachelor of Science in Computer Science',
        faculty: 'School of Computing',
        department: 'Department of Computer Science',
        gpa_at_application: 3.8,
        credits_completed: 120,
        status: GraduationApplicationStatus.APPROVED,
        reviewer_comments: 'All requirements met. Student eligible for graduation.',
        reviewed_by: 'advisor-001',
        reviewed_date: '2025-12-01T00:00:00Z',
        final_decision_date: '2025-12-01T00:00:00Z',
        supporting_documents: ['transcript.pdf', 'clearance_form.pdf']
      },
      {
        application_id: 'GRAD-2026-789012',
        student_id: 'BMI-STU-23105',
        application_date: '2025-12-01T00:00:00Z',
        expected_graduation_date: '2027-05-15T00:00:00Z',
        degree_sought: 'Bachelor of Business Administration',
        faculty: 'School of Business',
        department: 'Department of Business',
        gpa_at_application: 3.5,
        credits_completed: 90,
        status: GraduationApplicationStatus.PENDING,
        supporting_documents: ['transcript.pdf']
      }
    ];

    let filtered = mockApplications;

    if (filters?.status) {
      filtered = filtered.filter(app => app.status === filters.status);
    }
    if (filters?.student_id) {
      filtered = filtered.filter(app => app.student_id === filters.student_id);
    }
    if (filters?.reviewer) {
      filtered = filtered.filter(app => app.reviewed_by === filters.reviewer);
    }

    return filtered;
  }
}

// ============================================================================
// INTEGRATION WITH CERTIFICATE SYSTEM
// ============================================================================

export class CertificateIssuanceIntegration {
  /**
   * Issue certificate for approved graduate
   */
  async issueCertificateForGraduate(studentId: string, issuanceData: {
    degree: string;
    faculty: string;
    issue_date: string;
    issued_by: string;
  }): Promise<{
    certificate: CertificateDocument;
    qrCode: string;
    auditLog: any;
  }> {
    const studentRegistry = StudentRegistryEngine.getInstance();
    const student = await studentRegistry.getStudent(studentId);
    
    if (!student) {
      throw new Error('Student not found');
    }

    if (student.status !== StudentStatus.GRADUATED) {
      throw new Error('Student must be graduated to issue certificate');
    }

    if (student.graduation_application_status !== GraduationApplicationStatus.APPROVED) {
      throw new Error('Student graduation application must be approved');
    }

    // Import and use the certificate issuance engine
    const { CertificateIssuanceEngine } = await import('./certificateEngine');
    
    const issuanceRequest: CertificateIssuanceRequest = {
      student_id: studentId,
      student_name: student.full_name,
      degree: issuanceData.degree,
      faculty: issuanceData.faculty,
      issue_date: issuanceData.issue_date,
      issued_by: issuanceData.issued_by
    };

    return await CertificateIssuanceEngine.issueCertificate(issuanceRequest);
  }

  /**
   * Get eligible graduates for certificate issuance
   */
  async getEligibleGraduates(): Promise<StudentRecord[]> {
    const studentRegistry = StudentRegistryEngine.getInstance();
    const allStudents = await studentRegistry.searchStudents({
      status: StudentStatus.GRADUATED
    });

    return allStudents.filter(student => 
      student.graduation_application_status === GraduationApplicationStatus.APPROVED &&
      student.graduation_eligibility?.eligible
    );
  }

  /**
   * Bulk issue certificates for eligible graduates
   */
  async bulkIssueCertificates(issuanceData: {
    degree: string;
    faculty: string;
    issue_date: string;
    issued_by: string;
  }): Promise<{
    issued: Array<{
      certificate: CertificateDocument;
      qrCode: string;
      auditLog: any;
    }>;
    failed: Array<{
      student_id: string;
      error: string;
    }>;
  }> {
    const eligibleGraduates = await this.getEligibleGraduates();
    const results = {
      issued: [] as any[],
      failed: [] as any[]
    };

    for (const graduate of eligibleGraduates) {
      try {
        const result = await this.issueCertificateForGraduate(
          graduate.student_id,
          issuanceData
        );
        results.issued.push(result);
      } catch (error) {
        results.failed.push({
          student_id: graduate.student_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  StudentRegistryEngine,
  GraduationApprovalEngine,
  CertificateIssuanceIntegration
};

// Export types for use in other modules
export type {
  StudentRecord,
  GraduationApplication,
  GraduationEligibility,
  AcademicRecord,
  GraduationRequirement
};

export {
  StudentStatus,
  GraduationApplicationStatus
};
