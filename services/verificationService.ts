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
   * Verify certificate by serial number using JSON database
   */
  async verifyCertificate(request: VerificationRequest): Promise<CertificateData> {
    try {
      let certificate = null;

      // First check real-time generated certificates
      const realTimeCerts = JSON.parse(localStorage.getItem('realtime_certificates') || '[]');
      certificate = realTimeCerts.find((cert: any) => cert.serial_number === request.serial);

      // If not found in real-time, check the static JSON database
      if (!certificate) {
        const response = await fetch('/certificates.json');
        if (!response.ok) {
          throw new Error('Certificate database unavailable');
        }

        const data = await response.json();
        certificate = data.certificates.find((cert: any) => 
          cert.serial_number === request.serial
        );
      }

      if (!certificate) {
        return {
          valid: false,
          error: 'Certificate not found',
          code: 'CERT_NOT_FOUND'
        };
      }

      if (certificate.status === 'revoked') {
        return {
          valid: false,
          error: 'Certificate has been revoked',
          code: 'CERT_REVOKED',
          certificate: {
            serial_number: certificate.serial_number,
            student_name: certificate.student_name,
            degree_title: certificate.degree_title,
            graduation_class: certificate.graduation_class,
            faculty: certificate.faculty,
            department: certificate.department,
            issue_date: certificate.issue_date,
            graduation_date: certificate.graduation_date,
            gpa: certificate.gpa,
            status: certificate.status
          }
        };
      }

      if (certificate.status === 'suspended') {
        return {
          valid: false,
          error: 'Certificate is temporarily suspended',
          code: 'CERT_SUSPENDED'
        };
      }

      // Verify hash if provided
      const hashVerified = !request.hash || request.hash === certificate.content_hash;

      // Update verification count
      certificate.verification_count = (certificate.verification_count || 0) + 1;
      certificate.last_verified = new Date().toISOString();

      // Update the real-time storage if this was a real-time certificate
      if (realTimeCerts.some((cert: any) => cert.serial_number === request.serial)) {
        localStorage.setItem('realtime_certificates', JSON.stringify(realTimeCerts));
      }

      return {
        valid: true,
        certificate: {
          serial_number: certificate.serial_number,
          student_name: certificate.student_name,
          degree_title: certificate.degree_title,
          graduation_class: certificate.graduation_class,
          faculty: certificate.faculty,
          department: certificate.department,
          issue_date: certificate.issue_date,
          graduation_date: certificate.graduation_date,
          gpa: certificate.gpa,
          status: certificate.status
        },
        verification: {
          timestamp: new Date().toISOString(),
          method: request.method,
          hash_verified: hashVerified,
          verification_count: certificate.verification_count
        }
      };

    } catch (error) {
      console.error('Certificate verification error:', error);
      
      // Fallback to offline verification with mock data
      if (request.method === 'offline' || !navigator.onLine) {
        return this.offlineVerification(request);
      }

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
   * Offline verification using local mock database
   */
  private offlineVerification(request: VerificationRequest): CertificateData {
    // Mock certificate database for offline verification
    const mockCertificates = [
      {
        serial_number: 'BMI-2024-000101',
        student_name: 'James Smith',
        degree_title: 'BACHELOR OF THEOLOGY',
        graduation_class: 'First Class Honours',
        faculty: 'Theology',
        department: 'Department of Theology',
        issue_date: '2024-12-21',
        graduation_date: '2024-12-15',
        gpa: 3.8,
        status: 'active' as const,
        expected_hash: 'a1b2c3d4'
      },
      {
        serial_number: 'BMI-2024-000102',
        student_name: 'Mary Johnson',
        degree_title: 'BACHELOR OF COMPUTER SCIENCE',
        graduation_class: 'Second Class Honours (Upper Division)',
        faculty: 'ICT',
        department: 'Department of ICT',
        issue_date: '2024-12-21',
        graduation_date: '2024-12-15',
        gpa: 3.2,
        status: 'active' as const,
        expected_hash: 'b2c3d4e5'
      },
      {
        serial_number: 'BMI-2024-000103',
        student_name: 'John Williams',
        degree_title: 'BACHELOR OF BUSINESS ADMINISTRATION',
        graduation_class: 'Second Class Honours (Lower Division)',
        faculty: 'Business',
        department: 'Department of Business',
        issue_date: '2024-12-21',
        graduation_date: '2024-12-15',
        gpa: 2.7,
        status: 'active' as const,
        expected_hash: 'c3d4e5f6'
      },
      {
        serial_number: 'BMI-2023-000201',
        student_name: 'Patricia Jones',
        degree_title: 'BACHELOR OF EDUCATION',
        graduation_class: 'First Class Honours',
        faculty: 'Education',
        department: 'Department of Education',
        issue_date: '2023-12-21',
        graduation_date: '2023-12-15',
        gpa: 3.9,
        status: 'active' as const,
        expected_hash: 'd4e5f6g7'
      },
      {
        serial_number: 'BMI-2024-000999',
        student_name: 'Test Revoked',
        degree_title: 'BACHELOR OF THEOLOGY',
        graduation_class: 'Pass',
        faculty: 'Theology',
        department: 'Department of Theology',
        issue_date: '2024-06-21',
        graduation_date: '2024-06-15',
        gpa: 2.1,
        status: 'revoked' as const,
        expected_hash: 'revoked01'
      }
    ];

    const certificate = mockCertificates.find(cert => 
      cert.serial_number === request.serial
    );

    if (!certificate) {
      return {
        valid: false,
        error: 'Certificate not found in offline database',
        code: 'CERT_NOT_FOUND'
      };
    }

    if (certificate.status === 'revoked') {
      return {
        valid: false,
        error: 'Certificate has been revoked',
        code: 'CERT_REVOKED'
      };
    }

    // Verify hash if provided
    const hashVerified = !request.hash || request.hash === certificate.expected_hash;

    return {
      valid: true,
      certificate: {
        serial_number: certificate.serial_number,
        student_name: certificate.student_name,
        degree_title: certificate.degree_title,
        graduation_class: certificate.graduation_class,
        faculty: certificate.faculty,
        department: certificate.department,
        issue_date: certificate.issue_date,
        graduation_date: certificate.graduation_date,
        gpa: certificate.gpa,
        status: certificate.status
      },
      verification: {
        timestamp: new Date().toISOString(),
        method: request.method,
        hash_verified: hashVerified,
        verification_count: Math.floor(Math.random() * 50) + 1
      }
    };
  }
  /**
   * Get detailed certificate information (admin endpoint)
   */
  async getCertificateDetails(serial: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/certificate/${serial}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Certificate details error:', error);
      throw error;
    }
  }

  /**
   * Bulk verification (admin endpoint)
   */
  async bulkVerification(serials: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/verify/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ certificates: serials })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Bulk verification error:', error);
      throw error;
    }
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
   * Generate content hash for certificate (simplified version)
   */
  generateContentHash(certificateData: any): string {
    const content = `${certificateData.serial}${certificateData.name}${certificateData.degree}BMI-KEY`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  }
}

// Export singleton instance
export const verificationService = new VerificationService();

// Export class for custom instances
export { VerificationService };

// Export types
export type { CertificateData, VerificationRequest, QRVerificationRequest };