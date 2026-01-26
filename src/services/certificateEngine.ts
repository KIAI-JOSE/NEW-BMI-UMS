/**
 * PRODUCTION-GRADE CERTIFICATE ENGINE
 * University Certificate Verification System - BMI-UMS
 * 
 * This service handles the complete certificate issuance flow:
 * 1. Serial number generation
 * 2. Canonical data structure creation
 * 3. Cryptographic hash generation
 * 4. Database storage
 * 5. QR code generation
 * 6. Audit logging
 */

import crypto from 'crypto';
import QRCode from 'qrcode';
import {
  CertificateDocument,
  StudentDocument,
  CanonicalCertificateData,
  CertificateIssuanceRequest,
  CertificateVerificationRequest,
  CertificateVerificationResponse,
  QRCodeData,
  SerialNumberComponents,
  CertificateStatus,
  AuditAction,
  VerificationResult,
  FirestorePaths,
  SerialNumberPattern,
  StudentIdPattern,
  HashPattern,
  isValidCertificateStatus,
  isValidStudentStatus,
  isValidAuditAction,
  isValidSerialNumber,
  isValidStudentId,
  isValidHash
} from '../types/certificateSchema';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CERTIFICATE_CONFIG = {
  institution: 'BMI University',
  serialPrefix: 'BMI',
  sequenceDigits: 5,
  hashAlgorithm: 'sha256' as const,
  verificationBaseUrl: process.env.VERIFICATION_BASE_URL || 'https://bmi-university-management.web.app/verify'
};

// ============================================================================
// SERIAL NUMBER GENERATION
// Format: BMI-YYYY-NNNNN (5 digits, zero-padded)
// ============================================================================

export class SerialNumberGenerator {
  /**
   * Generate next serial number for given year
   */
  static async generateNextSerial(year: number): Promise<string> {
    // In production, this would query Firestore for the last sequence number
    // For now, we'll use a simple increment
    const lastSequence = await this.getLastSequenceForYear(year);
    const nextSequence = lastSequence + 1;
    
    const paddedSequence = nextSequence.toString().padStart(CERTIFICATE_CONFIG.sequenceDigits, '0');
    return `${CERTIFICATE_CONFIG.serialPrefix}-${year}-${paddedSequence}`;
  }

  /**
   * Parse serial number into components
   */
  static parseSerial(serial: string): SerialNumberComponents | null {
    const match = serial.match(/^BMI-(\d{4})-(\d{5})$/);
    if (!match) return null;

    return {
      prefix: 'BMI',
      year: parseInt(match[1]),
      sequence: parseInt(match[2])
    };
  }

  /**
   * Get last sequence number for year (mock implementation)
   */
  private static async getLastSequenceForYear(year: number): Promise<number> {
    // In production, query Firestore:
    // const certificates = await db.collection('certificates')
    //   .where('serial_number', '>=', `BMI-${year}-00000`)
    //   .where('serial_number', '<=', `BMI-${year}-99999`)
    //   .orderBy('serial_number', 'desc')
    //   .limit(1)
    //   .get();
    
    // Mock: return 311 for 2026 (so next will be 312)
    return year === 2026 ? 311 : 0;
  }
}

// ============================================================================
// CANONICAL DATA STRUCTURE
// Must be exact order and format for hash generation
// ============================================================================

export class CanonicalDataBuilder {
  /**
   * Build canonical certificate data structure
   * This exact structure must be used for hash generation
   */
  static buildCanonicalData(request: CertificateIssuanceRequest, serialNumber: string): CanonicalCertificateData {
    return {
      serial_number: serialNumber,
      student_id: request.student_id,
      student_name: request.student_name || '', // Will be populated from student record
      degree: request.degree,
      institution: CERTIFICATE_CONFIG.institution,
      issue_date: request.issue_date
    };
  }

  /**
   * Convert canonical data to hash input string
   * Format: serial_number|student_id|student_name|degree|institution|issue_date
   */
  static toHashInput(canonical: CanonicalCertificateData): string {
    return [
      canonical.serial_number,
      canonical.student_id,
      canonical.student_name,
      canonical.degree,
      canonical.institution,
      canonical.issue_date
    ].join('|');
  }
}

// ============================================================================
// CRYPTOGRAPHIC HASH GENERATION
// SHA-256(serial_number + student_id + degree + issue_date)
// ============================================================================

export class CertificateHashGenerator {
  /**
   * Generate SHA-256 hash for certificate
   * Uses canonical data structure for consistency
   */
  static generateContentHash(canonical: CanonicalCertificateData): string {
    const hashInput = CanonicalDataBuilder.toHashInput(canonical);
    
    return crypto
      .createHash(CERTIFICATE_CONFIG.hashAlgorithm)
      .update(hashInput, 'utf8')
      .digest('hex')
      .toLowerCase();
  }

  /**
   * Generate QR code hash (can be same as content hash or different)
   */
  static generateQRHash(contentHash: string): string {
    // For now, use the same hash. In production, could add QR-specific salt
    return contentHash;
  }

  /**
   * Verify hash against canonical data
   */
  static verifyHash(canonical: CanonicalCertificateData, providedHash: string): boolean {
    const expectedHash = this.generateContentHash(canonical);
    return expectedHash.toLowerCase() === providedHash.toLowerCase();
  }
}

// ============================================================================
// CERTIFICATE DOCUMENT BUILDER
// Builds the complete Firestore document
// ============================================================================

export class CertificateDocumentBuilder {
  /**
   * Build complete certificate document for Firestore
   */
  static async buildDocument(
    request: CertificateIssuanceRequest,
    student: StudentDocument
  ): Promise<CertificateDocument> {
    // 1. Generate serial number
    const serialNumber = await SerialNumberGenerator.generateNextSerial(
      new Date(request.issue_date).getFullYear()
    );

    // 2. Build canonical data
    const canonical = CanonicalDataBuilder.buildCanonicalData(request, serialNumber);
    canonical.student_name = student.full_name;

    // 3. Generate cryptographic hashes
    const contentHash = CertificateHashGenerator.generateContentHash(canonical);
    const qrHash = CertificateHashGenerator.generateQRHash(contentHash);

    // 4. Build document
    const now = new Date().toISOString();
    const document: CertificateDocument = {
      serial_number: serialNumber,
      student_id: request.student_id,
      student_name: student.full_name,
      degree: request.degree,
      faculty: request.faculty,
      institution: CERTIFICATE_CONFIG.institution,
      issue_year: new Date(request.issue_date).getFullYear(),
      issue_date: new Date(request.issue_date).toISOString(),
      content_hash: contentHash,
      qr_hash: qrHash,
      status: CertificateStatus.ISSUED,
      revocation_reason: null,
      created_by: request.issued_by,
      created_at: now,
      updated_at: now
    };

    return document;
  }
}

// ============================================================================
// QR CODE GENERATION
// Encodes verification URL with serial and hash
// ============================================================================

export class CertificateQRGenerator {
  /**
   * Generate QR code data for certificate
   */
  static generateQRData(certificate: CertificateDocument): QRCodeData {
    const url = new URL(CERTIFICATE_CONFIG.verificationBaseUrl);
    url.searchParams.append('serial', certificate.serial_number);
    url.searchParams.append('hash', certificate.content_hash);

    return {
      url: url.toString(),
      serial_number: certificate.serial_number,
      hash: certificate.content_hash
    };
  }

  /**
   * Generate QR code image (base64)
   */
  static async generateQRImage(certificate: CertificateDocument): Promise<string> {
    const qrData = this.generateQRData(certificate);
    
    return await QRCode.toDataURL(qrData.url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 200
    });
  }

  /**
   * Parse QR code data from URL
   */
  static parseQRUrl(url: string): QRCodeData | null {
    try {
      const parsedUrl = new URL(url);
      const serial = parsedUrl.searchParams.get('serial');
      const hash = parsedUrl.searchParams.get('hash');

      if (!serial || !hash) return null;
      if (!isValidSerialNumber(serial)) return null;
      if (!isValidHash(hash)) return null;

      return {
        url: url,
        serial_number: serial,
        hash: hash
      };
    } catch (error) {
      return null;
    }
  }
}

// ============================================================================
// CERTIFICATE ISSUANCE ENGINE
// Orchestrates the complete issuance flow
// ============================================================================

export class CertificateIssuanceEngine {
  /**
   * Issue certificate (complete flow)
   * This is the main entry point for certificate issuance
   */
  static async issueCertificate(request: CertificateIssuanceRequest): Promise<{
    certificate: CertificateDocument;
    qrCode: string;
    auditLog: any;
  }> {
    // 1. Validate request
    this.validateIssuanceRequest(request);

    // 2. Get student record (in production, query Firestore)
    const student = await this.getStudentRecord(request.student_id);

    // 3. Build certificate document
    const certificate = await CertificateDocumentBuilder.buildDocument(request, student);

    // 4. Save to database (in production, use Firestore transaction)
    await this.saveCertificate(certificate);

    // 5. Generate QR code
    const qrCode = await CertificateQRGenerator.generateQRImage(certificate);

    // 6. Create audit log
    const auditLog = await this.createAuditLog({
      serial_number: certificate.serial_number,
      action: AuditAction.ISSUED,
      performed_by: request.issued_by,
      timestamp: new Date().toISOString()
    });

    // 7. Return results
    return {
      certificate,
      qrCode,
      auditLog
    };
  }

  /**
   * Validate issuance request
   */
  private static validateIssuanceRequest(request: CertificateIssuanceRequest): void {
    if (!isValidStudentId(request.student_id)) {
      throw new Error(`Invalid student ID format: ${request.student_id}`);
    }

    if (!request.degree || request.degree.trim().length === 0) {
      throw new Error('Degree is required');
    }

    if (!request.faculty || request.faculty.trim().length === 0) {
      throw new Error('Faculty is required');
    }

    if (!request.issue_date || !Date.parse(request.issue_date)) {
      throw new Error('Valid issue date is required');
    }

    if (!request.issued_by || request.issued_by.trim().length === 0) {
      throw new Error('Issued by is required');
    }
  }

  /**
   * Get student record (mock implementation)
   */
  private static async getStudentRecord(studentId: string): Promise<StudentDocument> {
    // In production, query Firestore:
    // const studentDoc = await db.collection('students').doc(studentId).get();
    // if (!studentDoc.exists) throw new Error('Student not found');
    // return studentDoc.data() as StudentDocument;

    // Mock implementation
    return {
      student_id: studentId,
      full_name: 'John Mwangi',
      national_id: '12345678',
      program: 'BSc Computer Science',
      enrollment_year: 2022,
      graduation_year: 2026,
      status: 'GRADUATED' as any,
      created_at: '2022-09-01T00:00:00Z'
    };
  }

  /**
   * Save certificate to database (mock implementation)
   */
  private static async saveCertificate(certificate: CertificateDocument): Promise<void> {
    // In production, use Firestore transaction:
    // const batch = db.batch();
    // const certRef = db.collection('certificates').doc(certificate.serial_number);
    // batch.set(certRef, certificate);
    // await batch.commit();

    console.log('Certificate saved:', certificate.serial_number);
  }

  /**
   * Create audit log entry
   */
  private static async createAuditLog(logData: {
    serial_number: string;
    action: AuditAction;
    performed_by: string;
    timestamp: string;
  }): Promise<any> {
    // In production, save to Firestore:
    // const auditRef = db.collection('certificate_audit_logs').doc();
    // await auditRef.set(logData);
    // return logData;

    console.log('Audit log created:', logData);
    return logData;
  }
}

// ============================================================================
// CERTIFICATE VERIFICATION ENGINE
// Production-grade verification using the new schema
// ============================================================================

export class CertificateVerificationEngine {
  /**
   * Verify certificate (production implementation)
   */
  static async verifyCertificate(request: CertificateVerificationRequest): Promise<CertificateVerificationResponse> {
    try {
      // 1. Validate request
      if (!isValidSerialNumber(request.serial_number)) {
        return {
          valid: false,
          error: 'Invalid certificate serial number format',
          error_code: 'INVALID_FORMAT'
        };
      }

      // 2. Get certificate from database
      const certificate = await this.getCertificate(request.serial_number);
      if (!certificate) {
        return {
          valid: false,
          error: 'Certificate not found in registry',
          error_code: 'NOT_FOUND'
        };
      }

      // 3. Check status
      if (certificate.status === CertificateStatus.REVOKED) {
        return {
          valid: false,
          error: 'Certificate has been revoked',
          error_code: 'REVOKED',
          certificate
        };
      }

      if (certificate.status === CertificateStatus.SUSPENDED) {
        return {
          valid: false,
          error: 'Certificate is temporarily suspended',
          error_code: 'SUSPENDED'
        };
      }

      // 4. Verify hash if provided
      let hashVerified = true;
      if (request.provided_hash) {
        const canonical = this.buildCanonicalFromCertificate(certificate);
        hashVerified = CertificateHashGenerator.verifyHash(canonical, request.provided_hash);

        if (!hashVerified) {
          return {
            valid: false,
            error: 'Certificate content has been tampered with',
            error_code: 'TAMPERED'
          };
        }
      }

      // 5. Create verification audit log
      await this.createVerificationLog(request, VerificationResult.VALID);

      // 6. Update verification count
      await this.incrementVerificationCount(request.serial_number);

      // 7. Return success
      return {
        valid: true,
        certificate,
        verification_metadata: {
          timestamp: new Date().toISOString(),
          hash_verified: hashVerified,
          verification_count: (certificate.verification_count || 0) + 1
        }
      };

    } catch (error) {
      console.error('Certificate verification error:', error);
      return {
        valid: false,
        error: 'Verification service temporarily unavailable',
        error_code: 'SERVICE_ERROR'
      };
    }
  }

  /**
   * Build canonical data from certificate document
   */
  private static buildCanonicalFromCertificate(certificate: CertificateDocument): CanonicalCertificateData {
    return {
      serial_number: certificate.serial_number,
      student_id: certificate.student_id,
      student_name: certificate.student_name,
      degree: certificate.degree,
      institution: certificate.institution,
      issue_date: certificate.issue_date.split('T')[0] // Extract date part
    };
  }

  /**
   * Get certificate from database (mock implementation)
   */
  private static async getCertificate(serialNumber: string): Promise<CertificateDocument | null> {
    // In production, query Firestore:
    // const certDoc = await db.collection('certificates').doc(serialNumber).get();
    // if (!certDoc.exists) return null;
    // return certDoc.data() as CertificateDocument;

    // Mock implementation - return test certificate
    if (serialNumber === 'BMI-2026-00312') {
      return {
        serial_number: 'BMI-2026-00312',
        student_id: 'BMI-STU-10293',
        student_name: 'John Mwangi',
        degree: 'Bachelor of Science in Computer Science',
        faculty: 'School of Computing',
        institution: 'BMI University',
        issue_year: 2026,
        issue_date: '2026-01-10T00:00:00Z',
        content_hash: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
        qr_hash: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
        status: CertificateStatus.ISSUED,
        revocation_reason: null,
        created_by: 'system',
        created_at: '2026-01-10T12:45:00Z',
        updated_at: '2026-01-10T12:45:00Z'
      };
    }

    return null;
  }

  /**
   * Create verification audit log
   */
  private static async createVerificationLog(request: CertificateVerificationRequest, result: VerificationResult): Promise<void> {
    const logData = {
      serial_number: request.serial_number,
      action: AuditAction.VERIFIED,
      performed_by: 'public',
      ip_address: request.client_ip,
      timestamp: new Date().toISOString(),
      details: {
        hash_provided: !!request.provided_hash,
        result: result
      }
    };

    // In production, save to Firestore
    console.log('Verification log created:', logData);
  }

  /**
   * Increment verification count
   */
  private static async incrementVerificationCount(serialNumber: string): Promise<void> {
    // In production, update Firestore document
    console.log('Verification count incremented for:', serialNumber);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  CERTIFICATE_CONFIG,
  SerialNumberGenerator,
  CanonicalDataBuilder,
  CertificateHashGenerator,
  CertificateDocumentBuilder,
  CertificateQRGenerator,
  CertificateIssuanceEngine,
  CertificateVerificationEngine
};
