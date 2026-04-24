import React from "react";

const calculateAge = (dob: string) => {
    if (!dob) return "";
    const diffTimestamp = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diffTimestamp);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const formatAddress = (record: any, prefix: string) => {
  if (record[`${prefix}region`]) {
      const parts = [
          record[`${prefix}street`],
          record[`${prefix}barangay`],
          record[`${prefix}municipality`],
          record[`${prefix}province`],
          record[`${prefix}region`]
      ].filter(Boolean);
      let addr = parts.join(", ");
      if (record[`${prefix}zipcode`]) {
          addr += ` (${record[`${prefix}zipcode`]})`;
      }
      return addr;
  }
  return record[`${prefix === 'curr_' ? 'current' : 'permanent'}_address`] || "N/A";
}

interface PrintableStudentRecordProps {
  record: any;
  id?: string;
}

export default function PrintableStudentRecord({ record, id }: PrintableStudentRecordProps) {
  if (!record) return null;

  return (
    <div id={id} className="bg-white text-black p-[1in] w-[210mm] min-h-[297mm] mx-auto box-border font-sans relative">
      {/* Header */}
      <div className="flex items-center justify-center mb-6 border-b-2 border-black pb-4">
        {/* Placeholder for BU Logo. */}
        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center mr-4">
          <img src="/images/bu-logo.png" alt="Bicol University Logo" className="w-full h-full object-contain" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold uppercase tracking-wide m-0">Bicol University Polangui Campus</h2>
          <h3 className="text-base font-semibold m-0">Office of Student Affairs</h3>
          <h1 className="text-xl font-extrabold uppercase mt-2 m-0 bg-gray-100 inline-block px-4 py-1 border border-black tracking-widest">Student Identity Inventory</h1>
        </div>
      </div>

      <div className="text-xs text-right mb-2">
         <strong>Submitted on:</strong> {new Date(record.submittedAt).toLocaleDateString()}
      </div>

      {/* Personal Information */}
      <table className="w-full border-collapse border border-black text-[#111] mb-6 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={4} className="bg-gray-200 border border-black p-2 text-left text-sm font-bold uppercase tracking-wider">
              I. Personal Information
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2 font-bold w-1/4 bg-gray-50">Full Name</td>
            <td className="border border-black p-2 font-semibold w-1/4 uppercase">{record.last_name}, {record.first_name} {record.middle_name}</td>
            <td className="border border-black p-2 font-bold w-1/4 bg-gray-50">Student No.</td>
            <td className="border border-black p-2 font-semibold w-1/4">{record.student_number}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50">Sex</td>
            <td className="border border-black p-2">{record.sex || record.gender}</td>
            <td className="border border-black p-2 font-bold bg-gray-50">Age</td>
            <td className="border border-black p-2">{calculateAge(record.birth_date)}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50">Birth Date</td>
            <td className="border border-black p-2">{record.birth_date ? new Date(record.birth_date).toLocaleDateString() : 'N/A'}</td>
            <td className="border border-black p-2 font-bold bg-gray-50">Citizenship</td>
            <td className="border border-black p-2">{record.citizenship || 'N/A'}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50">Religion</td>
            <td className="border border-black p-2">{record.religion || 'N/A'}</td>
            <td className="border border-black p-2 font-bold bg-gray-50">Contact Number</td>
            <td className="border border-black p-2">{record.contact_number}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50">Email Address</td>
            <td className="border border-black p-2">{record.email_address}</td>
            <td className="border border-black p-2 font-bold bg-gray-50">Cellphone No.</td>
            <td className="border border-black p-2">{record.cellphone_num || 'N/A'}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50">Annual Income</td>
            <td className="border border-black p-2">{record.annualfam_income || 'N/A'}</td>
            <td className="border border-black p-2 font-bold bg-gray-50">Indigenous Group</td>
            <td className="border border-black p-2">{record.indigenous_group || 'None'}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50">Current Address</td>
            <td colSpan={3} className="border border-black p-2">
                {formatAddress(record, "curr_")}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50">Permanent Address</td>
            <td colSpan={3} className="border border-black p-2">
                {formatAddress(record, "perm_")}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Academic Information */}
      <table className="w-full border-collapse border border-black text-[#111] mb-6 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={4} className="bg-gray-200 border border-black p-2 text-left text-sm font-bold uppercase tracking-wider">
              II. Academic Information
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2 font-bold w-1/4 bg-gray-50">Department</td>
            <td colSpan={3} className="border border-black p-2">{record.department}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50">Program</td>
            <td colSpan={3} className="border border-black p-2">{record.program}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Year & Block</td>
            <td className="border border-black p-2 w-1/4">{record.year_level} - {record.block_section}</td>
            <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Enrollment Status</td>
            <td className="border border-black p-2 w-1/4">{record.enrollment_status}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50">Scholarship Status</td>
            <td colSpan={3} className="border border-black p-2">{record.scholarship_status || 'None'}</td>
          </tr>
        </tbody>
      </table>

      {/* Physical & Health Information */}
      <table className="w-full border-collapse border border-black text-[#111] mb-6 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={4} className="bg-gray-200 border border-black p-2 text-left text-sm font-bold uppercase tracking-wider">
              III. Physical & Health Information
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2 font-bold w-1/4 bg-gray-50">Height (cm)</td>
            <td className="border border-black p-2 w-1/4">{record.height_cm || 'N/A'}</td>
            <td className="border border-black p-2 font-bold w-1/4 bg-gray-50">Weight (kg)</td>
            <td className="border border-black p-2 w-1/4">{record.weight_kg || 'N/A'}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-50">Blood Type</td>
            <td className="border border-black p-2">{record.blood_type || 'N/A'}</td>
            <td className="border border-black p-2 font-bold bg-gray-50">Disability Status</td>
            <td className="border border-black p-2 text-red-700 font-bold">{record.disability_status !== 'None' && record.disability_status ? record.disability_status : 'None'}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-12 pt-8 flex justify-between">
          <div className="w-64 text-center">
             <div className="border-b border-black mb-2"></div>
             <div className="text-[10pt] uppercase font-bold text-gray-700">Student Signature</div>
          </div>
          <div className="w-64 text-center">
             <div className="border-b border-black mb-2"></div>
             <div className="text-[10pt] uppercase font-bold text-gray-700">Date Signed</div>
          </div>
      </div>
    </div>
  );
}
