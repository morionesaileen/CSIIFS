import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, FileText, History, CheckCircle } from "lucide-react";

// Move InputField outside so it doesn't cause focus loss on re-render
const InputField = ({ label, keyName, type="text", required=false, placeholder="", formData, setFormData }: any) => (
  <div>
    <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">{label} {required && "*"}</label>
    <input 
        type={type} 
        required={required} 
        value={(formData as any)[keyName]} 
        onChange={(e) => setFormData({ ...formData, [keyName]: e.target.value })} 
        className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white" 
        placeholder={placeholder} 
    />
  </div>
);

const departmentsData: Record<string, string[]> = {
  "Computer Studies Department": [
    "BS in Information Technology",
    "BS in Information Technology, Major in Animation",
    "BS in Computer Science",
    "BS in Information System"
  ],
  "Engineering Department": [
    "BS in Computer Engineering",
    "BS in Electronics Engineering"
  ],
  "Teacher Education Department": [
    "Bachelor of Elementary Education (BEEd)",
    "BSEd Major in English",
    "BSEd Major in Mathematics",
    "BTLEd Major in Home Economics",
    "BTLEd Major in ICT"
  ],
  "Technology Department": [
    "Automotive Technology",
    "Electrical Technology",
    "Electronics Technology",
    "Mechanical Technology"
  ],
  "Nursing Department": [
    "BS in Nursing"
  ],
  "Entrepreneurship Department": [
    "BS in Entrepreneurship"
  ]
};

export default function StudentDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"fill" | "history">("fill");
  const [successMsg, setSuccessMsg] = useState("");
  const [historicalData, setHistoricalData] = useState<any>(null);

  const emptyForm = {
    first_name: "", middle_name: "", last_name: "", gender: "", birth_date: "",
    citizenship: "", religion: "", contact_number: "", email_address: "",
    current_address: "", permanent_address: "", cellphone_num: "",
    annualfam_income: "", indigenous_group: "",
    department: "", program: "", year_level: "", block_section: "",
    enrollment_status: "", scholarship_status: "None",
    height_cm: "", weight_kg: "", blood_type: "", disability_status: ""
  };
  
  const [formData, setFormData] = useState(emptyForm);

  const handleLogout = () => { logout(); navigate("/"); };

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/forms/my", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const records = await res.json();
        if (records.length > 0) {
            setHistoricalData(records[0]);
            setFormData({...emptyForm, ...records[0]});
        }
      }
    } catch (err) {}
  };

  useEffect(() => { fetchRecords(); }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({...formData, student_number: user?.student_number})
      });
      if (res.ok) {
        setSuccessMsg("Identity Inventory Record Submitted Successfully!");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch (err) {}
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-text-main bg-light-bg">
      <header className="bg-bu-blue text-white px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b-4 border-bu-orange">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bu-orange rounded-full flex items-center justify-center font-bold shrink-0">BU</div>
          <div><h1 className="text-lg font-bold text-center sm:text-left">CSIIFS Student Portal</h1></div>
        </div>
        <div className="flex items-center gap-4 text-sm w-full sm:w-auto justify-center sm:justify-end">
          <strong>No. {user?.student_number}</strong>
          <button onClick={handleLogout} className="flex items-center hover:text-bu-orange"><LogOut className="w-4 h-4 mr-1" /> Logout</button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
        <div className="bg-bu-blue text-white px-4 sm:px-5 py-3 rounded-xl flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start">
          <button onClick={() => setActiveTab("fill")} className={`px-4 py-2 text-sm rounded ${activeTab === "fill" ? "bg-white/20" : ""}`}>Fill Form</button>
          <button onClick={() => setActiveTab("history")} className={`px-4 py-2 text-sm rounded ${activeTab === "history" ? "bg-white/20" : ""}`}>My Record</button>
        </div>

        {activeTab === "fill" ? (
             <form onSubmit={handleSubmit} className="space-y-6">
                {successMsg && <div className="bg-[#C6F6D5] text-[#22543D] p-4 rounded font-bold">{successMsg}</div>}
                
                <div className="bg-card-white rounded-xl border border-border-color p-4 sm:p-6 shadow-sm">
                   <h2 className="text-bu-blue font-bold uppercase mb-4 border-b pb-2">A. Personal Information</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                       <InputField label="First Name" keyName="first_name" required placeholder="Juan" formData={formData} setFormData={setFormData} />
                       <InputField label="Middle Name" keyName="middle_name" formData={formData} setFormData={setFormData} />
                       <InputField label="Last Name" keyName="last_name" required placeholder="Dela" formData={formData} setFormData={setFormData} />
                       
                       <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">Gender *</label>
                          <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white">
                              <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                          </select>
                       </div>
                       <InputField label="Birth Date" keyName="birth_date" type="date" required formData={formData} setFormData={setFormData} />
                       <InputField label="Citizenship" keyName="citizenship" required formData={formData} setFormData={setFormData} />
                       <InputField label="Religion" keyName="religion" formData={formData} setFormData={setFormData} />
                       <InputField label="Contact Number" keyName="contact_number" required formData={formData} setFormData={setFormData} />
                       <InputField label="Email Address" keyName="email_address" type="email" required formData={formData} setFormData={setFormData} />
                       <InputField label="Active Cellphone No." keyName="cellphone_num" required formData={formData} setFormData={setFormData} />
                       <InputField label="Annual Income" keyName="annualfam_income" type="number" formData={formData} setFormData={setFormData} />
                       <InputField label="Indigenous Group" keyName="indigenous_group" formData={formData} setFormData={setFormData} />
                   </div>
                   <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div><label className="block text-xs font-bold text-text-muted mb-1">Current Address</label><textarea required value={formData.current_address} onChange={e => setFormData({...formData, current_address: e.target.value})} className="w-full border p-2 text-sm rounded focus:outline-none focus:border-bu-blue border-border-color"/></div>
                       <div><label className="block text-xs font-bold text-text-muted mb-1">Permanent Address</label><textarea required value={formData.permanent_address} onChange={e => setFormData({...formData, permanent_address: e.target.value})} className="w-full border p-2 text-sm rounded focus:outline-none focus:border-bu-blue border-border-color"/></div>
                   </div>
                </div>

                <div className="bg-card-white rounded-xl border border-border-color p-4 sm:p-6 shadow-sm">
                   <h2 className="text-bu-blue font-bold uppercase mb-4 border-b pb-2">B. Academic Information</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                       <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">Department *</label>
                          <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value, program: ""})} className="w-full px-3 py-2 border rounded text-sm bg-white border-border-color focus:outline-none focus:border-bu-blue">
                              <option value="">Select Department</option>
                              {Object.keys(departmentsData).map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                              ))}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">Program *</label>
                          <select required disabled={!formData.department} value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white border-border-color focus:outline-none focus:border-bu-blue disabled:bg-gray-100 disabled:text-gray-400">
                              <option value="">Select Program</option>
                              {formData.department && departmentsData[formData.department]?.map(prog => (
                                  <option key={prog} value={prog}>{prog}</option>
                              ))}
                          </select>
                       </div>
                       <InputField label="Year Level" keyName="year_level" type="number" required formData={formData} setFormData={setFormData} />
                       <InputField label="Block/Section" keyName="block_section" required formData={formData} setFormData={setFormData} />
                       <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">Enrollment Status *</label>
                          <select required value={formData.enrollment_status} onChange={e => setFormData({...formData, enrollment_status: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white">
                              <option value="">Select</option><option value="Enrolled">Enrolled</option><option value="Not Enrolled">Not Enrolled</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">Scholarship</label>
                          <select value={formData.scholarship_status} onChange={e => setFormData({...formData, scholarship_status: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white">
                              <option value="None">None</option><option value="Full Scholar">Full Scholar</option>
                          </select>
                       </div>
                   </div>
                </div>

                <div className="bg-card-white rounded-xl border border-border-color p-4 sm:p-6 shadow-sm">
                   <h2 className="text-bu-blue font-bold uppercase mb-4 border-b pb-2">C. Physical & Health Information</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                       <InputField label="Height (cm)" keyName="height_cm" type="number" formData={formData} setFormData={setFormData} />
                       <InputField label="Weight (kg)" keyName="weight_kg" type="number" formData={formData} setFormData={setFormData} />
                       <div><label className="block text-xs font-bold text-text-muted mb-1">Blood Type</label><input value={formData.blood_type} onChange={e=>setFormData({...formData, blood_type: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm"/></div>
                       <InputField label="Disability" keyName="disability_status" formData={formData} setFormData={setFormData} />
                   </div>
                   <div className="mt-8">
                      <button type="submit" className="bg-bu-blue text-white px-8 py-3 rounded-lg font-bold w-full hover:bg-[#002244] transition-colors shadow-sm">Save Form Record</button>
                   </div>
                </div>
             </form>
          ) : (
            <div className="bg-card-white rounded-xl border border-border-color p-4 sm:p-8 shadow-sm">
              <h2 className="text-bu-blue font-bold uppercase mb-6 border-b pb-2">My Record Profile</h2>
              {historicalData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 text-sm">
                    <div>
                       <h4 className="text-bu-orange font-bold text-xs uppercase mb-3">Identity Integrity</h4>
                       <p className="mb-2"><strong className="w-32 inline-block text-text-muted">No:</strong> {historicalData.student_number}</p>
                       <p className="mb-2"><strong className="w-32 inline-block text-text-muted">Name:</strong> {historicalData.first_name} {historicalData.last_name}</p>
                       <p className="mb-2"><strong className="w-32 inline-block text-text-muted">Email:</strong> {historicalData.email_address}</p>
                    </div>
                    <div>
                       <h4 className="text-bu-orange font-bold text-xs uppercase mb-3">Academic Status</h4>
                       <p className="mb-2"><strong className="w-32 inline-block text-text-muted">Course:</strong> {historicalData.program} ({historicalData.year_level}-{historicalData.block_section})</p>
                       <p className="mb-2"><strong className="w-32 inline-block text-text-muted">Enrollment:</strong> <span className="bg-[#C6F6D5] text-green-900 px-2 py-0.5 rounded">{historicalData.enrollment_status}</span></p>
                       <p className="mb-2"><strong className="w-32 inline-block text-text-muted">Updated:</strong> {new Date(historicalData.submittedAt).toLocaleDateString()}</p>
                    </div>
                </div>
              ) : (
                <div className="text-center py-10 text-text-muted"><p>No active records found.</p></div>
              )}
            </div>
          )}
      </main>
    </div>
  );
}
