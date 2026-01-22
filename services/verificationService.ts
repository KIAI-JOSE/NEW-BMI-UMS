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
   * Verify certificate by serial number
   */
  async verifyCertificate(request: VerificationRequest): Promise<CertificateData> {
    try {
      const url = new URL(`${this.baseUrl}/verify/${request.serial}`);
      if (request.hash) {
        url.searchParams.append('hash', request.hash);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            valid: false,
            error: 'Certificate not found',
            code: 'CERT_NOT_FOUND'
          };
        }
        if (response.status === 410) {
          const data = await response.json();
          return {
            valid: false,
            error: 'Certificate has been revoked',
            code: 'CERT_REVOKED',
            ...data
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        ...data,
        verification: {
          ...data.verification,
          method: request.method
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
   * Verify certificate via QR code data
   */
  async verifyQRCode(request: QRVerificationRequest): Promise<CertificateData> {
    try {
      const response = await fetch(`${this.baseUrl}/verify/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({ qr_data: request.qr_data })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        ...data,
        verification: {
          ...data.verification,
          method: request.method
        }
      };

    } catch (error) {
      console.error('QR verification error:', error);
      
      // Try to parse QR data and fallback to regular verification
      const parsed = this.parseQRData(request.qr_data);
      if (parsed) {
        return this.verifyCertificate({
          serial: parsed.serial,
          hash: parsed.hash,
          method: 'qr_scan'
        });
      }

      return {
        valid: false,
        error: 'Invalid QR code format',
        code: 'INVALID_QR'
      };
    }
  }

  /**
   * Parse QR code data to extract serial and hash
   */
  parseQRData(qrContent: string): { serial: string; hash?: string } | null {
    try {
      // Handle full verification URL
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
    const baseUrl = window.location.origin;
    const url = new URL(`${baseUrl}/verify`, baseUrl);
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