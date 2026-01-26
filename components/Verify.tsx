import React, { useEffect, useState } from 'react';
import { ShieldCheck, XCircle, CheckCircle2, Award, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Student, CertificateRecord } from '../types';
import { verifyCertificate } from '../services/certificateService';

interface VerifyProps {
  students: Student[];
}

const Verify: React.FC<VerifyProps> = ({ students }) => {
  const [status, setStatus] = useState<'loading' | 'VALID' | 'NOT_FOUND' | 'REVOKED' | 'TAMPERED'>('loading');
  const [record, setRecord] = useState<CertificateRecord | null>(null);
  const [params, setParams] = useState({ id: '', hash: '' });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const hash = urlParams.get('hash');
    
    if (!id) {
      setStatus('NOT_FOUND');
      return;
    }

    setParams({ id, hash: hash || '' });

    // Simulate network latency for security effect
    setTimeout(() => {
        const result = verifyCertificate(id, hash || undefined);
        setStatus(result.status);
        setRecord(result.record);
    }, 1500);
  }, []);

  if (status === 'loading') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B0082] mb-4"></div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Authenticating Cryptographic Signature...</p>
          </div>
      );
  }

  // Error States
  if (status === 'NOT_FOUND') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 text-center">
              <XCircle className="h-20 w-20 text-red-500 mb-6" />
              <h1 className="text-3xl font-black text-red-900 uppercase mb-2">Certificate Not Found</h1>
              <p className="text-red-700 max-w-md font-medium text-sm">
                  The document serial number <span className="font-mono bg-red-100 px-2 py-1 rounded">{params.id}</span> does not exist in the official institutional registry.
              </p>
              <div className="mt-8">
                  <a href="/" className="text-xs font-black uppercase tracking-widest text-red-800 hover:underline">Return to Home</a>
              </div>
          </div>
      );
  }

  if (status === 'REVOKED') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 text-center">
              <ShieldAlert className="h-20 w-20 text-red-600 mb-6" />
              <h1 className="text-3xl font-black text-red-900 uppercase mb-2">Certificate Revoked</h1>
              <p className="text-red-700 max-w-md font-medium text-sm">
                  This certificate ({params.id}) has been formally revoked by the institution. It is no longer valid for academic or professional use.
              </p>
              {record && (
                  <div className="mt-6 bg-white p-4 rounded border border-red-200">
                      <p className="text-xs font-bold text-gray-500">Holder: {record.studentName}</p>
                      <p className="text-xs font-bold text-gray-500">Degree: {record.degree}</p>
                  </div>
              )}
          </div>
      );
  }

  if (status === 'TAMPERED') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 p-4 text-center">
              <AlertTriangle className="h-20 w-20 text-amber-500 mb-6" />
              <h1 className="text-3xl font-black text-amber-900 uppercase mb-2">Integrity Check Failed</h1>
              <p className="text-amber-800 max-w-md font-medium text-sm">
                  The record exists, but the digital signature (hash) provided does not match the registry. The document content may have been altered.
              </p>
              <p className="mt-4 font-mono text-[10px] text-amber-600 break-all bg-amber-100 p-2">Received: {params.hash}</p>
          </div>
      );
  }

  // Valid State
  return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white shadow-2xl overflow-hidden border-t-8 border-emerald-500 animate-slide-up">
              <div className="bg-emerald-50 p-6 text-center border-b border-emerald-100">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
                      <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-emerald-900 uppercase tracking-tight">Official Record Verified</h2>
                  <p className="text-emerald-700 text-[10px] font-bold uppercase tracking-widest mt-1">BMI Institutional Registry Node</p>
              </div>
              
              <div className="p-8 space-y-6">
                  <div className="text-center">
                      <img src="https://i.ibb.co/Gv2vPdJC/BMI-PNG.png" className="h-20 mx-auto mb-4 object-contain filter drop-shadow-sm" alt="Logo"/>
                      <h1 className="text-xl font-black text-gray-900 uppercase leading-tight">{record?.studentName}</h1>
                      <p className="text-xs font-bold text-[#4B0082] uppercase tracking-widest mt-1">{record?.studentId}</p>
                  </div>

                  <div className="border-t border-gray-100 pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credential</span>
                          <span className="text-xs font-black text-gray-800 uppercase text-right max-w-[60%]">{record?.degree}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Faculty</span>
                          <span className="text-xs font-black text-gray-800 uppercase">{record?.faculty}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issue Date</span>
                          <span className="text-xs font-black text-gray-800 uppercase">{record?.issueDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Institution</span>
                          <span className="text-xs font-black text-[#4B0082] uppercase">{record?.institution}</span>
                      </div>
                  </div>

                  <div className="bg-gray-50 p-4 text-center border border-gray-100">
                      <p className="text-[9px] text-gray-400 font-mono break-all font-bold">SERIAL: {record?.serialNumber}</p>
                      <p className="text-[7px] text-gray-300 font-mono break-all mt-1">{record?.contentHash}</p>
                  </div>
              </div>
              
              <div className="bg-gray-900 px-6 py-4 text-center">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">BMI University • Office of the Registrar</p>
              </div>
          </div>
      </div>
  );
};

export default Verify;