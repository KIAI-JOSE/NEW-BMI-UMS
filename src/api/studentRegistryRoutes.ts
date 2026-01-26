/**
 * STUDENT REGISTRY API ENDPOINTS
 * University Certificate Verification System - BMI-UMS
 * 
 * REST API for student management and graduation approval
 */

import express from 'express';
import {
  StudentRegistryEngine,
  GraduationApprovalEngine,
  CertificateIssuanceIntegration
} from '../services/studentRegistry';

import {
  StudentRecord,
  GraduationApplication,
  GraduationApplicationStatus,
  StudentStatus
} from '../services/studentRegistry';

const router = express.Router();

// ============================================================================
// STUDENT REGISTRY ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/students
 * Get students with optional filtering
 */
router.get('/api/v1/students', async (req, res) => {
  try {
    const {
      name,
      program,
      status,
      graduation_year,
      page = 1,
      limit = 50
    } = req.query;

    const studentRegistry = StudentRegistryEngine.getInstance();
    const students = await studentRegistry.searchStudents({
      name: name as string,
      program: program as string,
      status: status as StudentStatus,
      graduation_year: graduation_year ? parseInt(graduation_year as string) : undefined
    });

    // Pagination
    const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedStudents = students.slice(startIndex, endIndex);

    res.json({
      students: paginatedStudents,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: students.length,
        pages: Math.ceil(students.length / parseInt(limit as string))
      },
      filters: {
        name,
        program,
        status,
        graduation_year
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * GET /api/v1/students/:studentId
 * Get student by ID
 */
router.get('/api/v1/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const studentRegistry = StudentRegistryEngine.getInstance();
    const student = await studentRegistry.getStudent(studentId);
    
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    res.json(student);

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * POST /api/v1/students
 * Create new student
 */
router.post('/api/v1/students', async (req, res) => {
  try {
    const studentData = req.body;
    
    // Validation
    if (!studentData.full_name || !studentData.full_name.trim()) {
      return res.status(400).json({
        error: 'Student name is required',
        code: 'MISSING_NAME'
      });
    }

    if (!studentData.program || !studentData.program.trim()) {
      return res.status(400).json({
        error: 'Program is required',
        code: 'MISSING_PROGRAM'
      });
    }

    if (!studentData.enrollment_year) {
      return res.status(400).json({
        error: 'Enrollment year is required',
        code: 'MISSING_ENROLLMENT_YEAR'
      });
    }

    const studentRegistry = StudentRegistryEngine.getInstance();
    const student = await studentRegistry.createStudent(studentData);

    res.status(201).json({
      message: 'Student created successfully',
      student
    });

  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * PUT /api/v1/students/:studentId
 * Update student record
 */
router.put('/api/v1/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const updates = req.body;
    
    // Set updated_by from request context
    updates.updated_by = 'api-user-' + (req.ip || '127.0.0.1').substring(0, 8);

    const studentRegistry = StudentRegistryEngine.getInstance();
    const student = await studentRegistry.updateStudent(studentId, updates);

    res.json({
      message: 'Student updated successfully',
      student
    });

  } catch (error) {
    console.error('Update student error:', error);
    if (error instanceof Error && error.message === 'Student not found') {
      return res.status(404).json({
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

// ============================================================================
// GRADUATION APPROVAL ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/graduation/applications
 * Get graduation applications
 */
router.get('/api/v1/graduation/applications', async (req, res) => {
  try {
    const {
      status,
      student_id,
      reviewer,
      page = 1,
      limit = 50
    } = req.query;

    const graduationEngine = GraduationApprovalEngine.getInstance();
    const applications = await graduationEngine.getApplications({
      status: status as GraduationApplicationStatus,
      student_id: student_id as string,
      reviewer: reviewer as string
    });

    // Pagination
    const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedApplications = applications.slice(startIndex, endIndex);

    res.json({
      applications: paginatedApplications,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: applications.length,
        pages: Math.ceil(applications.length / parseInt(limit as string))
      },
      filters: {
        status,
        student_id,
        reviewer
      }
    });

  } catch (error) {
    console.error('Get graduation applications error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * POST /api/v1/graduation/applications
 * Submit graduation application
 */
router.post('/api/v1/graduation/applications', async (req, res) => {
  try {
    const { student_id, ...applicationData } = req.body;
    
    // Validation
    if (!student_id) {
      return res.status(400).json({
        error: 'Student ID is required',
        code: 'MISSING_STUDENT_ID'
      });
    }

    if (!applicationData.degree_sought || !applicationData.degree_sought.trim()) {
      return res.status(400).json({
        error: 'Degree sought is required',
        code: 'MISSING_DEGREE'
      });
    }

    if (!applicationData.faculty || !applicationData.faculty.trim()) {
      return res.status(400).json({
        error: 'Faculty is required',
        code: 'MISSING_FACULTY'
      });
    }

    const graduationEngine = GraduationApprovalEngine.getInstance();
    const application = await graduationEngine.submitApplication(student_id, applicationData);

    res.status(201).json({
      message: 'Graduation application submitted successfully',
      application
    });

  } catch (error) {
    console.error('Submit graduation application error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * PUT /api/v1/graduation/applications/:applicationId/review
 * Review graduation application
 */
router.put('/api/v1/graduation/applications/:applicationId/review', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reviewer_comments, reviewed_by, decision } = req.body;
    
    // Validation
    if (!reviewer_comments || !reviewer_comments.trim()) {
      return res.status(400).json({
        error: 'Reviewer comments are required',
        code: 'MISSING_COMMENTS'
      });
    }

    if (!reviewed_by || !reviewed_by.trim()) {
      return res.status(400).json({
        error: 'Reviewer ID is required',
        code: 'MISSING_REVIEWER'
      });
    }

    if (!decision || !['APPROVE', 'REJECT', 'DEFER'].includes(decision)) {
      return res.status(400).json({
        error: 'Valid decision is required (APPROVE, REJECT, or DEFER)',
        code: 'INVALID_DECISION'
      });
    }

    const graduationEngine = GraduationApprovalEngine.getInstance();
    const application = await graduationEngine.reviewApplication(applicationId, {
      reviewer_comments,
      reviewed_by,
      decision
    });

    res.json({
      message: 'Application reviewed successfully',
      application
    });

  } catch (error) {
    console.error('Review graduation application error:', error);
    if (error instanceof Error && error.message === 'Application not found') {
      return res.status(404).json({
        error: 'Application not found',
        code: 'APPLICATION_NOT_FOUND'
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * GET /api/v1/graduation/eligibility/:studentId
 * Check graduation eligibility
 */
router.get('/api/v1/graduation/eligibility/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const graduationEngine = GraduationApprovalEngine.getInstance();
    const eligibility = await graduationEngine.checkGraduationEligibility(studentId);

    res.json(eligibility);

  } catch (error) {
    console.error('Check graduation eligibility error:', error);
    if (error instanceof Error && error.message === 'Student not found') {
      return res.status(404).json({
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

// ============================================================================
// CERTIFICATE ISSUANCE INTEGRATION ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/certificates/eligible-graduates
 * Get eligible graduates for certificate issuance
 */
router.get('/api/v1/certificates/eligible-graduates', async (req, res) => {
  try {
    const integration = new CertificateIssuanceIntegration();
    const eligibleGraduates = await integration.getEligibleGraduates();

    res.json({
      eligible_graduates: eligibleGraduates,
      total: eligibleGraduates.length
    });

  } catch (error) {
    console.error('Get eligible graduates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * POST /api/v1/certificates/issue/:studentId
 * Issue certificate for specific graduate
 */
router.post('/api/v1/certificates/issue/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { degree, faculty, issue_date, issued_by } = req.body;
    
    // Validation
    if (!degree || !degree.trim()) {
      return res.status(400).json({
        error: 'Degree is required',
        code: 'MISSING_DEGREE'
      });
    }

    if (!faculty || !faculty.trim()) {
      return res.status(400).json({
        error: 'Faculty is required',
        code: 'MISSING_FACULTY'
      });
    }

    if (!issue_date || !Date.parse(issue_date)) {
      return res.status(400).json({
        error: 'Valid issue date is required',
        code: 'INVALID_DATE'
      });
    }

    if (!issued_by || !issued_by.trim()) {
      return res.status(400).json({
        error: 'Issued by is required',
        code: 'MISSING_ISSUED_BY'
      });
    }

    const integration = new CertificateIssuanceIntegration();
    const result = await integration.issueCertificateForGraduate(studentId, {
      degree,
      faculty,
      issue_date,
      issued_by
    });

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificate: result.certificate,
      qr_code: result.qrCode,
      verification_url: `https://bmi-university-management.web.app/verify?serial=${result.certificate.serial_number}&hash=${result.certificate.content_hash}`
    });

  } catch (error) {
    console.error('Issue certificate error:', error);
    if (error instanceof Error) {
      if (error.message === 'Student not found') {
        return res.status(404).json({
          error: 'Student not found',
          code: 'STUDENT_NOT_FOUND'
        });
      }
      if (error.message === 'Student must be graduated to issue certificate') {
        return res.status(400).json({
          error: 'Student must be graduated to issue certificate',
          code: 'STUDENT_NOT_GRADUATED'
        });
      }
      if (error.message === 'Student graduation application must be approved') {
        return res.status(400).json({
          error: 'Student graduation application must be approved',
          code: 'APPLICATION_NOT_APPROVED'
        });
      }
    }
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * POST /api/v1/certificates/bulk-issue
 * Bulk issue certificates for eligible graduates
 */
router.post('/api/v1/certificates/bulk-issue', async (req, res) => {
  try {
    const { degree, faculty, issue_date, issued_by } = req.body;
    
    // Validation
    if (!degree || !degree.trim()) {
      return res.status(400).json({
        error: 'Degree is required',
        code: 'MISSING_DEGREE'
      });
    }

    if (!faculty || !faculty.trim()) {
      return res.status(400).json({
        error: 'Faculty is required',
        code: 'MISSING_FACULTY'
      });
    }

    if (!issue_date || !Date.parse(issue_date)) {
      return res.status(400).json({
        error: 'Valid issue date is required',
        code: 'INVALID_DATE'
      });
    }

    if (!issued_by || !issued_by.trim()) {
      return res.status(400).json({
        error: 'Issued by is required',
        code: 'MISSING_ISSUED_BY'
      });
    }

    const integration = new CertificateIssuanceIntegration();
    const results = await integration.bulkIssueCertificates({
      degree,
      faculty,
      issue_date,
      issued_by
    });

    res.json({
      message: 'Bulk certificate issuance completed',
      summary: {
        total_processed: results.issued.length + results.failed.length,
        issued: results.issued.length,
        failed: results.failed.length
      },
      issued_certificates: results.issued,
      failed_issuances: results.failed
    });

  } catch (error) {
    console.error('Bulk issue certificates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

// ============================================================================
// STATISTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/students/statistics
 * Get student statistics
 */
router.get('/api/v1/students/statistics', async (req, res) => {
  try {
    const studentRegistry = StudentRegistryEngine.getInstance();
    const allStudents = await studentRegistry.searchStudents({});
    
    const statistics = {
      total_students: allStudents.length,
      by_status: {
        active: allStudents.filter(s => s.status === StudentStatus.ACTIVE).length,
        graduated: allStudents.filter(s => s.status === StudentStatus.GRADUATED).length,
        suspended: allStudents.filter(s => s.status === StudentStatus.SUSPENDED).length
      },
      by_program: {} as Record<string, number>,
      by_graduation_year: {} as Record<number, number>,
      graduation_applications: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        deferred: 0
      }
    };

    // Count by program
    allStudents.forEach(student => {
      const program = student.program || 'Unknown';
      statistics.by_program[program] = (statistics.by_program[program] || 0) + 1;
    });

    // Count by graduation year
    allStudents.forEach(student => {
      const year = student.graduation_year;
      if (year) {
        statistics.by_graduation_year[year] = (statistics.by_graduation_year[year] || 0) + 1;
      }
    });

    res.json(statistics);

  } catch (error) {
    console.error('Get student statistics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

export default router;
