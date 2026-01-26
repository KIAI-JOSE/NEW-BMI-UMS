/**
 * PRODUCTION-GRADE CERTIFICATE TEST
 * Generate a test certificate using the new production schema
 */

import {
  CertificateIssuanceEngine,
  CertificateHashGenerator,
  CanonicalDataBuilder,
  SerialNumberGenerator
} from './src/services/certificateEngine';

import {
  CertificateIssuanceRequest,
  CanonicalCertificateData,
  CertificateDocument
} from './src/types/certificateSchema';

// ============================================================================
// TEST CERTIFICATE DATA
// ============================================================================

const testIssuanceRequest: CertificateIssuanceRequest = {
  student_id: 'BMI-STU-10293',
  student_name: 'John Mwangi',
  degree: 'Bachelor of Science in Computer Science',
  faculty: 'School of Computing',
  issue_date: '2026-01-10',
  issued_by: 'registrar-001'
};

// ============================================================================
// GENERATE TEST CERTIFICATE
// ============================================================================

async function generateTestCertificate() {
  console.log('🎓 Generating Production-Grade Test Certificate\n');
  
  try {
    // 1. Generate serial number
    const serialNumber = await SerialNumberGenerator.generateNextSerial(2026);
    console.log(`📝 Serial Number: ${serialNumber}`);
    
    // 2. Build canonical data
    const canonical: CanonicalCertificateData = {
      serial_number: serialNumber,
      student_id: testIssuanceRequest.student_id,
      student_name: testIssuanceRequest.student_name || '',
      degree: testIssuanceRequest.degree,
      institution: 'BMI University',
      issue_date: testIssuanceRequest.issue_date
    };
    
    console.log('📋 Canonical Data:', JSON.stringify(canonical, null, 2));
    
    // 3. Generate hash
    const hashInput = CanonicalDataBuilder.toHashInput(canonical);
    console.log(`🔐 Hash Input: ${hashInput}`);
    
    const contentHash = CertificateHashGenerator.generateContentHash(canonical);
    console.log(`🔑 Content Hash: ${contentHash}`);
    
    // 4. Issue certificate (mock)
    console.log('\n🚀 Issuing Certificate...');
    const result = await CertificateIssuanceEngine.issueCertificate(testIssuanceRequest);
    
    console.log('\n✅ Certificate Issued Successfully!');
    console.log('\n📄 Certificate Details:');
    console.log(JSON.stringify(result.certificate, null, 2));
    
    // 5. Generate verification URL
    const verificationUrl = `https://bmi-university-management.web.app/verify?serial=${serialNumber}&hash=${contentHash}`;
    console.log(`\n🔗 Verification URL: ${verificationUrl}`);
    
    // 6. Test verification
    console.log('\n🔍 Testing Verification...');
    const { CertificateVerificationEngine } = await import('./src/services/certificateEngine');
    
    const verificationResult = await CertificateVerificationEngine.verifyCertificate({
      serial_number: serialNumber,
      provided_hash: contentHash,
      client_ip: '127.0.0.1',
      user_agent: 'test-client'
    });
    
    console.log('\n📊 Verification Result:');
    console.log(JSON.stringify(verificationResult, null, 2));
    
    // 7. Summary
    console.log('\n🎉 PRODUCTION-GRADE CERTIFICATE SYSTEM TEST COMPLETE');
    console.log('\n📋 Test Summary:');
    console.log(`✅ Serial Number: ${serialNumber}`);
    console.log(`✅ Student: ${testIssuanceRequest.student_name}`);
    console.log(`✅ Degree: ${testIssuanceRequest.degree}`);
    console.log(`✅ Hash: ${contentHash}`);
    console.log(`✅ Verification: ${verificationResult.valid ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ URL: ${verificationUrl}`);
    
    return {
      serialNumber,
      contentHash,
      verificationUrl,
      verificationResult: verificationResult.valid
    };
    
  } catch (error) {
    console.error('❌ Test Failed:', error);
    throw error;
  }
}

// ============================================================================
// RUN TEST
// ============================================================================

generateTestCertificate()
  .then((result) => {
    console.log('\n🎯 Test Certificate Ready for Use:');
    console.log(`Serial: ${result.serialNumber}`);
    console.log(`Hash: ${result.contentHash}`);
    console.log(`URL: ${result.verificationUrl}`);
    console.log(`Status: ${result.verificationResult ? '✅ VERIFIED' : '❌ FAILED'}`);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });

export { generateTestCertificate };
