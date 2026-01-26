/**
 * PRODUCTION-GRADE CERTIFICATE SCHEMA
 * University Certificate Verification System - BMI-UMS
 * 
 * This file defines the exact schema structure for Firestore collections
 * Following the production-grade specification provided
 */

// ============================================================================
// COLLECTION: certificates (CORE REGISTRY)
// Document ID: serial_number (e.g., "BMI-2026-000312")
// ============================================================================

export interface CertificateDocument {
  // Core identification
  serial_number: string;           // "BMI-2026-000312" (Document ID)
  student_id: string;              // "BMI-STU-10293"
  student_name: string;            // "John Mwangi"
  degree: string;                  // "Bachelor of Science in Computer Science"
  faculty: string;                 // "School of Computing"
  institution: string;             // "BMI University"
  
  // Academic details
  graduation_class?: string;       // "First Class Honours"
  department?: string;             // "Department of Computer Science"
  graduation_date?: string;        // "2026-01-10T00:00:00Z"
  gpa?: number;                    // 3.8
  
  // Issue information
  issue_year: number;              // 2026
  issue_date: string;              // "2026-01-10T00:00:00Z" (ISO 8601)
  
  // Cryptographic seals
  content_hash: string;            // SHA-256 hash (64 chars hex)
  qr_hash: string;                 // SHA-256 hash for QR (64 chars hex)
  
  // Status management
  status: CertificateStatus;       // "ISSUED" | "REVOKED" | "SUSPENDED"
  revocation_reason?: string;      // null if not revoked
  
  // Verification tracking
  verification_count?: number;     // Number of times verified
  
  // Metadata
  created_by: string;              // "system" | admin UID
  created_at: string;              // "2026-01-10T12:45:00Z"
  updated_at: string;              // "2026-01-10T12:45:00Z"
}

export enum CertificateStatus {
  ISSUED = 'ISSUED',
  REVOKED = 'REVOKED',
  SUSPENDED = 'SUSPENDED'
}

// ============================================================================
// COLLECTION: students
// Document ID: student_id (e.g., "BMI-STU-10293")
// ============================================================================

export interface StudentDocument {
  student_id: string;              // "BMI-STU-10293" (Document ID)
  full_name: string;               // "John Mwangi"
  national_id?: string;            // "12345678" (optional)
  program: string;                 // "BSc Computer Science"
  enrollment_year: number;         // 2022
  graduation_year?: number;        // 2026 (null if not graduated)
  status: StudentStatus;           // "ACTIVE" | "GRADUATED" | "SUSPENDED"
  created_at: string;              // "2022-09-01T00:00:00Z"
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  SUSPENDED = 'SUSPENDED'
}

// ============================================================================
// COLLECTION: certificate_audit_logs (Legal Defense Layer)
// Document ID: auto-generated UUID
// ============================================================================

export interface AuditLogDocument {
  serial_number: string;           // "BMI-2026-000312"
  action: AuditAction;             // "ISSUED" | "VERIFIED" | "REVOKED" | "REGENERATED"
  performed_by: string;            // "public" | admin UID | "system"
  ip_address?: string;             // "197.248.xxx.xxx"
  timestamp: string;               // "2026-01-26T18:41:00Z"
  details?: Record<string, any>;   // Additional context (optional)
}

export enum AuditAction {
  ISSUED = 'ISSUED',
  VERIFIED = 'VERIFIED',
  REVOKED = 'REVOKED',
  REGENERATED = 'REGENERATED'
}

// ============================================================================
// COLLECTION: verification_requests (Optional Analytics)
// Document ID: auto-generated UUID
// ============================================================================

export interface VerificationRequestDocument {
  serial_number: string;           // "BMI-2026-000312"
  hash_provided: boolean;          // true if hash was provided in request
  result: VerificationResult;      // "VALID" | "NOT_FOUND" | "TAMPERED" | "REVOKED"
  timestamp: string;               // "2026-01-26T18:41:00Z"
  client_ip?: string;              // Client IP address
  user_agent?: string;            // Browser user agent
}

export enum VerificationResult {
  VALID = 'VALID',
  NOT_FOUND = 'NOT_FOUND',
  TAMPERED = 'TAMPERED',
  REVOKED = 'REVOKED'
}

// ============================================================================
// CANONICAL CERTIFICATE DATA STRUCTURE
// This exact structure must be used for hash generation
// ============================================================================

export interface CanonicalCertificateData {
  serial_number: string;           // "BMI-2026-000312"
  student_id: string;              // "BMI-STU-10293"
  student_name: string;            // "John Mwangi"
  degree: string;                  // "Bachelor of Science in Computer Science"
  institution: string;             // "BMI University"
  issue_date: string;              // "2026-01-10" (YYYY-MM-DD format)
}

// ============================================================================
// HASH GENERATION STANDARD
// SHA-256(serial_number + student_id + degree + issue_date)
// ============================================================================

export interface HashGenerationInput {
  serial_number: string;
  student_id: string;
  degree: string;
  issue_date: string;
}

// ============================================================================
// SERIAL NUMBER GENERATION
// Format: BMI-YYYY-NNNNN (5 digits, zero-padded)
// ============================================================================

export interface SerialNumberComponents {
  prefix: string;                 // "BMI"
  year: number;                   // 2026
  sequence: number;               // 312
}

// ============================================================================
// CERTIFICATE ISSUANCE REQUEST
// Input for certificate generation process
// ============================================================================

export interface CertificateIssuanceRequest {
  student_id: string;              // "BMI-STU-10293"
  degree: string;                  // "Bachelor of Science in Computer Science"
  faculty: string;                 // "School of Computing"
  issue_date: string;              // "2026-01-10"
  issued_by: string;               // Admin UID or "system"
}

// ============================================================================
// CERTIFICATE VERIFICATION REQUEST
// Input for certificate verification process
// ============================================================================

export interface CertificateVerificationRequest {
  serial_number: string;           // "BMI-2026-000312"
  provided_hash?: string;          // Optional hash from QR code
  client_ip: string;               // Client IP for rate limiting
  user_agent: string;              // Browser user agent
}

// ============================================================================
// CERTIFICATE VERIFICATION RESPONSE
// Output for certificate verification process
// ============================================================================

export interface CertificateVerificationResponse {
  valid: boolean;
  certificate?: CertificateDocument;
  verification_metadata?: {
    timestamp: string;
    hash_verified: boolean;
    verification_count: number;
  };
  error?: string;
  error_code?: string;
}

// ============================================================================
// QR CODE DATA STRUCTURE
// Must encode verification URL with serial and hash
// ============================================================================

export interface QRCodeData {
  url: string;                     // Full verification URL
  serial_number: string;           // "BMI-2026-000312"
  hash: string;                     // Content hash
}

// ============================================================================
// DATABASE HELPERS
// ============================================================================

export class FirestorePaths {
  static certificates(serial?: string): string {
    return serial ? `certificates/${serial}` : 'certificates';
  }
  
  static students(studentId?: string): string {
    return studentId ? `students/${studentId}` : 'students';
  }
  
  static auditLogs(): string {
    return 'certificate_audit_logs';
  }
  
  static verificationRequests(): string {
    return 'verification_requests';
  }
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const SerialNumberPattern = /^BMI-\d{4}-\d{5}$/;
export const StudentIdPattern = /^BMI-STU-\d{5}$/;
export const HashPattern = /^[a-f0-9]{64}$/i;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidCertificateStatus(status: string): status is CertificateStatus {
  return Object.values(CertificateStatus).includes(status as CertificateStatus);
}

export function isValidStudentStatus(status: string): status is StudentStatus {
  return Object.values(StudentStatus).includes(status as StudentStatus);
}

export function isValidAuditAction(action: string): action is AuditAction {
  return Object.values(AuditAction).includes(action as AuditAction);
}

export function isValidSerialNumber(serial: string): boolean {
  return SerialNumberPattern.test(serial);
}

export function isValidStudentId(studentId: string): boolean {
  return StudentIdPattern.test(studentId);
}

export function isValidHash(hash: string): boolean {
  return HashPattern.test(hash);
}
