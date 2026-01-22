# BMI University Certificate Verification API

## Overview
This document outlines the API endpoints required for the BMI University Certificate Verification System.

## Base URL
```
Production: https://verify.bmi.edu/api/v1
Development: http://localhost:3001/api/v1
```

## Authentication
- Public verification endpoints require no authentication
- Administrative endpoints require API key authentication
- Rate limiting: 60 requests per minute per IP

## Endpoints

### 1. Verify Certificate by Serial Number
```http
GET /verify/{serial}?hash={optional_hash}
```

**Parameters:**
- `serial` (path): Certificate serial number (format: BMI-YYYY-XXXXXX)
- `hash` (query, optional): Content hash for additional verification

**Response 200 - Valid Certificate:**
```json
{
  "valid": true,
  "certificate": {
    "serial_number": "BMI-2024-123456",
    "student_name": "John Doe",
    "degree_title": "BACHELOR OF THEOLOGY",
    "graduation_class": "First Class Honours",
    "faculty": "Theology",
    "department": "Department of Theology",
    "issue_date": "2024-12-21",
    "graduation_date": "2024-12-15",
    "gpa": 3.8,
    "status": "active"
  },
  "verification": {
    "timestamp": "2024-12-21T10:30:00Z",
    "method": "online",
    "hash_verified": true,
    "verification_count": 15
  }
}
```

**Response 404 - Certificate Not Found:**
```json
{
  "valid": false,
  "error": "Certificate not found",
  "code": "CERT_NOT_FOUND"
}
```

**Response 410 - Certificate Revoked:**
```json
{
  "valid": false,
  "error": "Certificate has been revoked",
  "code": "CERT_REVOKED",
  "revocation_date": "2024-11-15T09:00:00Z",
  "reason": "Academic misconduct"
}
```

### 2. Verify Certificate via QR Code
```http
POST /verify/qr
```

**Request Body:**
```json
{
  "qr_data": "https://verify.bmi.edu/verify?id=BMI-2024-123456&hash=a1b2c3d4"
}
```

**Response:** Same as GET /verify/{serial}

### 3. Get Certificate Details (Extended)
```http
GET /certificate/{serial}/details
```

**Response 200:**
```json
{
  "certificate": {
    "serial_number": "BMI-2024-123456",
    "student_name": "John Doe",
    "student_id": "BMI-2023-101",
    "degree_title": "BACHELOR OF THEOLOGY",
    "graduation_class": "First Class Honours",
    "faculty": "Theology",
    "department": "Department of Theology",
    "program_duration": "4 years",
    "credits_completed": 120,
    "issue_date": "2024-12-21",
    "graduation_date": "2024-12-15",
    "ceremony_date": "2024-12-20",
    "gpa": 3.8,
    "status": "active",
    "issued_by": "Office of the Registrar",
    "signed_by": {
      "vice_chancellor": "Prof. Isaac Sigei",
      "registrar": "Dr. Samuel Kiptoo"
    }
  },
  "student": {
    "admission_year": "2021",
    "enrollment_term": "Fall 2021",
    "nationality": "Kenyan",
    "honors": ["Dean's List 2023", "Academic Excellence Award"]
  },
  "program": {
    "code": "BATS-300",
    "name": "Bachelor of Theological Studies",
    "accreditation": "Commission for University Education (CUE)",
    "level": "Undergraduate"
  },
  "verification_history": {
    "total_verifications": 15,
    "first_verified": "2024-12-21T08:00:00Z",
    "last_verified": "2024-12-21T10:30:00Z",
    "recent_verifications": [
      {
        "timestamp": "2024-12-21T10:30:00Z",
        "method": "online",
        "ip_address": "192.168.1.100",
        "location": "Nairobi, Kenya"
      }
    ]
  }
}
```

### 4. Bulk Verification (Admin Only)
```http
POST /verify/bulk
Authorization: Bearer {api_key}
```

**Request Body:**
```json
{
  "certificates": [
    "BMI-2024-123456",
    "BMI-2024-123457",
    "BMI-2024-123458"
  ]
}
```

**Response 200:**
```json
{
  "results": [
    {
      "serial": "BMI-2024-123456",
      "valid": true,
      "status": "active"
    },
    {
      "serial": "BMI-2024-123457",
      "valid": false,
      "error": "Certificate not found"
    }
  ],
  "summary": {
    "total": 3,
    "valid": 1,
    "invalid": 2
  }
}
```

### 5. Certificate Statistics (Admin Only)
```http
GET /admin/statistics
Authorization: Bearer {api_key}
```

**Response 200:**
```json
{
  "certificates": {
    "total_issued": 1250,
    "active": 1200,
    "revoked": 45,
    "suspended": 5
  },
  "verifications": {
    "total_verifications": 15420,
    "today": 45,
    "this_month": 1200,
    "unique_verifiers": 890
  },
  "by_faculty": {
    "Theology": 650,
    "ICT": 300,
    "Business": 200,
    "Education": 100
  },
  "by_year": {
    "2024": 400,
    "2023": 350,
    "2022": 300,
    "2021": 200
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `CERT_NOT_FOUND` | Certificate serial number not found |
| `CERT_REVOKED` | Certificate has been revoked |
| `CERT_SUSPENDED` | Certificate is temporarily suspended |
| `INVALID_FORMAT` | Serial number format is invalid |
| `HASH_MISMATCH` | Content hash does not match |
| `RATE_LIMITED` | Too many requests |
| `SERVICE_ERROR` | Internal server error |
| `INVALID_QR` | QR code format is invalid |
| `AUTH_REQUIRED` | Authentication required for this endpoint |
| `INVALID_API_KEY` | API key is invalid or expired |

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Public verification | 60 requests/minute |
| QR verification | 30 requests/minute |
| Bulk verification | 10 requests/minute |
| Admin endpoints | 100 requests/minute |

## Security Headers

All responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## CORS Policy

Allowed origins:
- https://bmi.edu
- https://verify.bmi.edu
- https://portal.bmi.edu
- Development: http://localhost:3000

## Webhook Notifications (Optional)

For real-time verification alerts:

```http
POST /admin/webhooks
Authorization: Bearer {api_key}
```

**Request Body:**
```json
{
  "url": "https://your-system.com/webhook",
  "events": ["verification", "suspicious_activity"],
  "secret": "webhook_secret_key"
}
```

## Implementation Notes

1. **Database Schema**: Use PostgreSQL with proper indexing on serial numbers
2. **Caching**: Implement Redis caching for frequently verified certificates
3. **Logging**: Log all verification attempts with IP, timestamp, and result
4. **Monitoring**: Set up alerts for unusual verification patterns
5. **Backup**: Daily backups of certificate database
6. **SSL**: Enforce HTTPS for all endpoints
7. **API Versioning**: Use URL versioning (/api/v1/, /api/v2/)

## Testing

### Test Certificates
For development and testing:

```
Valid: BMI-2024-000001 (hash: a1b2c3d4)
Revoked: BMI-2024-000002 (hash: b2c3d4e5)
Suspended: BMI-2024-000003 (hash: c3d4e5f6)
Invalid: BMI-2024-999999
```

### Sample cURL Commands

```bash
# Verify certificate
curl -X GET "https://verify.bmi.edu/api/v1/verify/BMI-2024-123456?hash=a1b2c3d4"

# QR verification
curl -X POST "https://verify.bmi.edu/api/v1/verify/qr" \
  -H "Content-Type: application/json" \
  -d '{"qr_data": "https://verify.bmi.edu/verify?id=BMI-2024-123456&hash=a1b2c3d4"}'

# Admin statistics
curl -X GET "https://verify.bmi.edu/api/v1/admin/statistics" \
  -H "Authorization: Bearer your_api_key"
```