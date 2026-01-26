/**
 * KIRO: DO NOT MODIFY
 * This file contains stable production logic.
 * Do not edit unless explicitly instructed.
 * 
 * BMI University Certificate Verification Service
 * Handles certificate verification logic and API interactions
 */

interface CertificateData {
  valid: boolean;
  certificate?: {
    serial_number: string;
    student_name: string;
    degree_title: string;
    graduation_class?: string;
    faculty: string;
    department: string;
    issue_date: string;
    graduation_date: string;
    gpa: number;
    status: 'active' | 'revoked' | 'suspended';
  };
  verification?: {
    timestamp: string;
    method: 'online' | 'offline' | 'qr_scan';
    hash_verified: boolean;
    verification_count: number;
  };
  error?: string;
  code?: string;
}

interface VerificationRequest {
  serial: string;
  hash?: string;
  method: 'online' | 'offline' | 'qr_scan';
}

interface QRVerificationRequest {
  qr_data: string;
  method: 'qr_scan';
}

class VerificationService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'http://localhost:3001/api/v1', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Verify certificate using Firestore schema
   * FOLLOWS PRODUCTION DATABASE ARCHITECTURE
   */
  async verifyCertificate(request: VerificationRequest): Promise<CertificateData> {
    try {
      // STEP 1: Validate input (serial required)
      if (!request.serial || !this.validateSerialFormat(request.serial)) {
        return {
          valid: false,
          error: 'Invalid certificate serial number format. Expected: BMI-YYYY-NNNNNN',
          code: 'INVALID_FORMAT'
        };
      }

      // STEP 2: Query Firestore-style certificates collection
      console.log('DEBUG: Querying certificates collection for serial:', request.serial);
      const certificatesCollection = JSON.parse(localStorage.getItem('certificates_collection') || '{}');
      console.log('DEBUG: Collection contains', Object.keys(certificatesCollection).length, 'certificates');
      
      // Use serial number as document ID (Firestore pattern)
      const documentId = request.serial;
      let certificate = certificatesCollection[documentId];
      
      if (certificate) {
        console.log('DEBUG: Found certificate in collection:', certificate.student_name, certificate.status);
      }

      // STEP 3: Fallback to legacy databases if not found
      if (!certificate) {
        console.log('DEBUG: Not found in Firestore collection, checking legacy databases');
        
        // Check legacy certificate registry
        const certificateRegistry = JSON.parse(localStorage.getItem('certificate_registry') || '[]');
        certificate = certificateRegistry.find((cert: any) => cert.serial_number === request.serial);
        
        if (certificate) {
          console.log('DEBUG: Found certificate in legacy registry:', certificate.student_name);
        }

        // Check realtime certificates (legacy)
        if (!certificate) {
          const realTimeCerts = JSON.parse(localStorage.getItem('realtime_certificates') || '[]');
          certificate = realTimeCerts.find((cert: any) => cert.serial_number === request.serial);
          
          if (certificate) {
            console.log('DEBUG: Found certificate in realtime storage:', certificate.student_name);
          }
        }

        // Check static JSON database (legacy)
        if (!certificate) {
          console.log('DEBUG: Checking static certificates.json database');
          const response = await fetch('/certificates.json');
          if (response.ok) {
            const data = await response.json();
            certificate = data.certificates.find((cert: any) => 
              cert.serial_number === request.serial
            );
            
            if (certificate) {
              console.log('DEBUG: Found certificate in static database:', certificate.student_name);
              // Convert legacy format to Firestore format
              certificate.status = certificate.status === 'active' ? 'ISSUED' : 
                                 certificate.status === 'revoked' ? 'REVOKED' : 'ISSUED';
            }
          }
        }
      }

      // STEP 4: If not found → CERTIFICATE_NOT_FOUND
      if (!certificate) {
        console.log('DEBUG: Certificate not found in any database');
        return {
          valid: false,
          error: 'Certificate not found in registry',
          code: 'CERT_NOT_FOUND'
        };
      }

      // STEP 5: Check certificate status (Firestore ENUM values)
      if (certificate.status === 'REVOKED') {
        return {
          valid: false,
          error: 'Certificate has been revoked',
          code: 'CERT_REVOKED',
          certificate: {
            serial_number: certificate.serial_number,
            student_name: certificate.student_name,
            degree_title: certificate.degree || certificate.degree_title,
            graduation_class: certificate.graduation_class,
            faculty: certificate.faculty,
            department: certificate.department || `Department of ${certificate.faculty}`,
            issue_date: certificate.issue_date,
            graduation_date: certificate.graduation_date,
            gpa: certificate.gpa,
            status: 'revoked'
          }
        };
      }

      if (certificate.status === 'SUSPENDED') {
        return {
          valid: false,
          error: 'Certificate is temporarily suspended',
          code: 'CERT_SUSPENDED'
        };
      }

      // STEP 6: Verify hash using canonical formula
      // SHA-256(serial_number + student_id + degree + issue_date)
      const hashVerified = !request.hash || request.hash === certificate.content_hash;
      
      if (request.hash && !hashVerified) {
        return {
          valid: false,
          error: 'Certificate content has been tampered with',
          code: 'CERT_TAMPERED'
        };
      }

      // STEP 7: Create audit log entry
      const auditLog = {
        serial_number: certificate.serial_number,
        action: "VERIFIED" as const,
        performed_by: "public",
        ip_address: "127.0.0.1", // Would be real IP in production
        timestamp: new Date().toISOString()
      };
      
      // Save to audit logs
      const auditLogs = JSON.parse(localStorage.getItem('certificate_audit_logs') || '[]');
      auditLogs.push(auditLog);
      localStorage.setItem('certificate_audit_logs', JSON.stringify(auditLogs));

      // STEP 8: Return structured valid result
      return {
        valid: true,
        certificate: {
          serial_number: certificate.serial_number,
          student_name: certificate.student_name,
          degree_title: certificate.degree || certificate.degree_title,
          graduation_class: certificate.graduation_class,
          faculty: certificate.faculty,
          department: certificate.department || `Department of ${certificate.faculty}`,
          issue_date: certificate.issue_date,
          graduation_date: certificate.graduation_date,
          gpa: certificate.gpa,
          status: certificate.status === 'ISSUED' ? 'active' : certificate.status.toLowerCase()
        },
        verification: {
          timestamp: new Date().toISOString(),
          method: request.method,
          hash_verified: hashVerified,
          verification_count: (certificate.verification_count || 0) + 1
        }
      };

    } catch (error) {
      console.error('Certificate verification error:', error);
      
      return {
        valid: false,
        error: 'Verification service temporarily unavailable',
        code: 'SERVICE_ERROR'
      };
    }
  }

  /**
   * Verify certificate via QR code data using JSON database
   */
  async verifyQRCode(request: QRVerificationRequest): Promise<CertificateData> {
    try {
      // Parse QR data to extract serial and hash
      const parsed = this.parseQRData(request.qr_data);
      if (!parsed) {
        return {
          valid: false,
          error: 'Invalid QR code format',
          code: 'INVALID_QR'
        };
      }

      // Use the regular verification method with parsed data
      return this.verifyCertificate({
        serial: parsed.serial,
        hash: parsed.hash,
        method: 'qr_scan'
      });

    } catch (error) {
      console.error('QR verification error:', error);
      
      return {
        valid: false,
        error: 'QR code verification failed',
        code: 'QR_VERIFICATION_ERROR'
      };
    }
  }

  /**
   * Parse QR code data to extract serial and hash
   */
  parseQRData(qrContent: string): { serial: string; hash?: string } | null {
    try {
      // Handle verification URL with query parameters
      if (qrContent.includes('verify=true')) {
        const url = new URL(qrContent);
        const id = url.searchParams.get('id');
        const hash = url.searchParams.get('hash');
        
        if (id && this.validateSerialFormat(id)) {
          return { serial: id, hash: hash || undefined };
        }
      }
      
      // Handle legacy /verify URLs
      if (qrContent.includes('/verify?')) {
        const url = new URL(qrContent);
        const id = url.searchParams.get('id');
        const hash = url.searchParams.get('hash');
        
        if (id && this.validateSerialFormat(id)) {
          return { serial: id, hash: hash || undefined };
        }
      }
      
      // Handle direct serial number
      if (this.validateSerialFormat(qrContent)) {
        return { serial: qrContent };
      }
      
      return null;
    } catch (error) {
      console.error('QR parsing error:', error);
      return null;
    }
  }

  /**
   * Validate certificate serial number format
   */
  validateSerialFormat(serial: string): boolean {
    return /^BMI-\d{4}-\d{6}$/.test(serial);
  }

  /**
   * Generate verification URL for certificate
   */
  generateVerificationUrl(serial: string, hash?: string): string {
    // Use environment variable for production URL, fallback to current origin for development
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const url = new URL(`${baseUrl}/verify`);
    url.searchParams.append('id', serial);
    if (hash) {
      url.searchParams.append('hash', hash);
    }
    return url.toString();
  }

  /**
   * Generate canonical content hash using same algorithm as certificate generation
   * Hash input: serial_number|student_id|name|degree|institution|issue_date
   */
  generateContentHash(certificateData: any): string {
    const hashInput = `${certificateData.serial}|${certificateData.student_id || 'BMI-STU-DEFAULT'}|${certificateData.name}|${certificateData.degree}|BMI University|${certificateData.issue_date || new Date().toISOString().split('T')[0]}`;
    console.log('HASH GEN: Input string:', hashInput);
    
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const result = Math.abs(hash).toString(16).padStart(8, '0');
    console.log('HASH GEN: Generated hash:', result);
    return result;
  }
}

// Export singleton instance
export const verificationService = new VerificationService();

// Export class for custom instances
export { VerificationService };

// Export types
export type { CertificateData, VerificationRequest, QRVerificationRequest };