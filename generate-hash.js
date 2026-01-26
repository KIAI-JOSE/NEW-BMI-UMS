// Generate the correct hash for the test certificate
import crypto from 'crypto';

function generateSecureHash(data) {
  const hashInput = `${data.serial}|${data.student_id}|${data.student_name}|${data.degree}|${data.issue_date}|BMI-UNIVERSITY-SECURE-SALT-2024`;
  
  return crypto
    .createHash('sha256')
    .update(hashInput, 'utf8')
    .digest('hex')
    .toUpperCase();
}

const hash = generateSecureHash({
  serial: 'BMI-2026-202310',
  student_id: 'BMI-2025-104',
  student_name: 'James Wilson',
  degree: 'DIPLOMA IN THEOLOGY',
  issue_date: '2026-01-26'
});

console.log('Correct hash for BMI-2026-202310:', hash);
console.log('Use this hash in the verification form:');
