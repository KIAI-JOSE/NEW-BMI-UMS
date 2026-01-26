
import { Student, CertificateRecord } from '../types';

const STORAGE_KEY = 'bmi_certificate_registry';

/**
 * Registry Accessor
 * Retrives the immutable ledger from storage
 */
export const getRegistry = (): CertificateRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) { 
    return []; 
  }
};

/**
 * Mock Hashing Function (SHA-256 Simulation)
 * Creates a unique signature based on certificate content.
 * In production, replace with crypto.subtle.digest('SHA-256', ...)
 */
const generateHash = (data: string): string => {
  let hash = 0;
  if (data.length === 0) return '0000000000000000';
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Convert to hex string and pad to look like a real hash
  return Math.abs(hash).toString(16).padStart(64, '0');
};

const getDegreeTitle = (student: Student) => {
    if (student.academicLevel === 'PhD') return `DOCTOR OF PHILOSOPHY IN ${student.faculty.toUpperCase()}`;
    if (student.academicLevel === 'Masters') return `MASTER OF ARTS IN ${student.faculty.toUpperCase()}`;
    if (student.academicLevel === 'Degree') return `BACHELOR OF ${student.faculty.toUpperCase()}`;
    if (student.academicLevel === 'Diploma') return `DIPLOMA IN ${student.faculty.toUpperCase()}`;
    return `CERTIFICATE IN ${student.faculty.toUpperCase()}`;
};

/**
 * Certificate Issuance (Minting)
 * Generates a unique serial, creates the hash, and saves to registry.
 */
export const issueCertificate = (student: Student): CertificateRecord => {
  const registry = getRegistry();
  
  // Idempotency: Return existing if already issued and valid
  const existing = registry.find(c => c.studentId === student.id);
  if (existing && existing.status === 'ISSUED') return existing;

  const year = new Date().getFullYear();
  // Sequence based on total registry size for unique ID
  const sequence = (registry.length + 1).toString().padStart(6, '0');
  const serialNumber = `BMI-${year}-${sequence}`;
  
  const degree = getDegreeTitle(student);
  const issueDate = new Date().toISOString().split('T')[0];
  const institution = "BMI University";
  const studentName = `${student.firstName} ${student.lastName}`;

  // Canonical Payload for Hashing - ORDER MATTERS
  const payload = `${serialNumber}|${student.id}|${studentName}|${degree}|${institution}|${issueDate}`;
  const contentHash = generateHash(payload);

  const newRecord: CertificateRecord = {
    serialNumber,
    studentId: student.id,
    studentName,
    degree,
    faculty: student.faculty,
    institution,
    issueDate,
    contentHash,
    status: 'ISSUED'
  };

  // Update or Append
  const index = registry.findIndex(c => c.studentId === student.id);
  if (index >= 0) {
      registry[index] = newRecord; // Overwrite previous record (e.g. if was revoked)
  } else {
      registry.push(newRecord);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  return newRecord;
};

/**
 * Fetch Record by Student ID
 */
export const getCertificate = (studentId: string): CertificateRecord | undefined => {
    const registry = getRegistry();
    return registry.find(c => c.studentId === studentId);
};

/**
 * Verification Logic
 * Checks existence, status, and integrity.
 */
export const verifyCertificate = (serial: string, hash?: string) => {
    const registry = getRegistry();
    const record = registry.find(c => c.serialNumber === serial);

    if (!record) return { status: 'NOT_FOUND', record: null };
    if (record.status !== 'ISSUED') return { status: 'REVOKED', record };
    
    // Hash Check - Essential for anti-tampering
    if (hash && record.contentHash !== hash) return { status: 'TAMPERED', record };

    return { status: 'VALID', record };
};

/**
 * Revoke Certificate
 */
export const revokeCertificate = (serial: string) => {
    const registry = getRegistry();
    const updated = registry.map(c => c.serialNumber === serial ? { ...c, status: 'REVOKED' as const } : c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
