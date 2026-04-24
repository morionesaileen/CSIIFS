import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, FileText, History, CheckCircle, Settings, User as UserIcon, X } from "lucide-react";
import AddressSelector from "../../components/AddressSelector";
import { nationalities } from "../../data/nationalities";
import { religions } from "../../data/religions";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Jocelyn",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robert",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Jack",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Mia"
];

const AddressDisplay = ({ record, prefix }: { record: any, prefix: 'curr_' | 'perm_' }) => {
  if (record[`${prefix}region`]) {
    const street = record[`${prefix}street`] ? record[`${prefix}street`] + ', ' : '';
    const prov = record[`${prefix}province`] ? record[`${prefix}province`] + ', ' : '';
    return <span>{street}{record[`${prefix}barangay`]}, {record[`${prefix}municipality`]}, {prov}{record[`${prefix}region`]}</span>;
  }
  return <span>{prefix === 'curr_' ? record.current_address : record.permanent_address} || 'N/A'</span>;
};

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
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"fill" | "history">("fill");
  const [successMsg, setSuccessMsg] = useState("");
  const [historicalData, setHistoricalData] = useState<any>(null);

  const [profileModal, setProfileModal] = useState<"profile" | "settings" | null>(null);
  const [settingsTab, setSettingsTab] = useState<"menu" | "privacy" | "password">("menu");
  const [showDropdown, setShowDropdown] = useState(false);
  const [forgotPwMsg, setForgotPwMsg] = useState("");
  
  const [emailFocus, setEmailFocus] = useState(user?.email || "");
  const [avatarFocus, setAvatarFocus] = useState(user?.avatar_id || AVATARS[0]);
  const [nameFocus, setNameFocus] = useState(user?.display_name || "");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const handleInternalForgotPassword = async () => {
    setForgotPwMsg("Verifying...");
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email || emailFocus })
      });
      const data = await res.json();
      setForgotPwMsg(data.message);
    } catch(err) {
      setForgotPwMsg("An error occurred");
    }
  };

  const emptyForm = {
    first_name: "", middle_name: "", last_name: "", sex: "", birth_date: "",
    citizenship: "", religion: "", contact_number: "", email_address: "",
    current_address: "", permanent_address: "", cellphone_num: "",
    curr_region: "", curr_region_code: "", curr_province: "", curr_province_code: "", curr_municipality: "", curr_municipality_code: "", curr_barangay: "", curr_barangay_code: "", curr_street: "", curr_zipcode: "",
    perm_region: "", perm_region_code: "", perm_province: "", perm_province_code: "", perm_municipality: "", perm_municipality_code: "", perm_barangay: "", perm_barangay_code: "", perm_street: "", perm_zipcode: "",
    annualfam_income: "", indigenous_group: "",
    department: "", program: "", year_level: "", block_section: "",
    enrollment_status: "", has_scholarship: "No", scholarship_status: "",
    height_cm: "", weight_kg: "", blood_type: "", disability_status: "", has_disability: "No"
  };
  
  const [formData, setFormData] = useState(emptyForm);
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  useEffect(() => {
    if (sameAsCurrent) {
        setFormData(prev => ({
            ...prev,
            perm_region: prev.curr_region,
            perm_region_code: prev.curr_region_code,
            perm_province: prev.curr_province,
            perm_province_code: prev.curr_province_code,
            perm_municipality: prev.curr_municipality,
            perm_municipality_code: prev.curr_municipality_code,
            perm_barangay: prev.curr_barangay,
            perm_barangay_code: prev.curr_barangay_code,
            perm_street: prev.curr_street,
            perm_zipcode: prev.curr_zipcode
        }));
    }
  }, [
    sameAsCurrent,
    formData.curr_region, formData.curr_region_code,
    formData.curr_province, formData.curr_province_code,
    formData.curr_municipality, formData.curr_municipality_code,
    formData.curr_barangay, formData.curr_barangay_code,
    formData.curr_street, formData.curr_zipcode
  ]);

  const calculateAge = (dob: string) => {
      if (!dob) return "";
      const diffTimestamp = Date.now() - new Date(dob).getTime();
      const ageDate = new Date(diffTimestamp);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    if(!emailFocus.includes('@')) return setProfileError("Enter a valid student email");
    
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: emailFocus, avatar_id: avatarFocus, display_name: nameFocus })
      });
      if (res.ok) {
         updateUser({ email: emailFocus, avatar_id: avatarFocus, display_name: nameFocus });
         setProfileModal(null);
      } else {
         setProfileError("Failed to update profile");
      }
    } catch(err) { setProfileError("Error connecting to server") }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    if (newPw !== confirmPw) return setPwError("Passwords do not match");
    if (newPw.length < 8) return setPwError("Password must be at least 8 characters");

    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      });
      if (res.ok) {
        setPwSuccess("Password successfully updated");
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } else {
        const data = await res.json();
        setPwError(data.error || "Failed to update password");
      }
    } catch(err) { setPwError("An error occurred") }
  };

  const fetchRecords = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/forms/my", {
          headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
          const records = await res.json();
          if (records && records.length > 0) {
             setHistoricalData(records[0]);
             setFormData({...emptyForm, ...records[0]});
             // Only change to history tab if we were not already in 'fill' to edit explicitly
             if (activeTab !== "fill") {
                setActiveTab("history");
             }
          } else {
             setActiveTab("fill");
          }
      }
    } catch (err) {
      console.error("Failed to fetch records:", err);
    }
  };

  useEffect(() => { fetchRecords(); }, [activeTab, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      const recordPayload = {
         ...formData,
         user_id: user.id.toString(),
         student_number: user.student_number || "",
      };
      
      const res = await fetch("/api/forms", {
          method: "POST",
          headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(recordPayload)
      });
      
      if (res.ok) {
          setSuccessMsg("Identity Inventory Record Submitted Successfully!");
          await fetchRecords();
          setActiveTab("history");
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => setSuccessMsg(""), 5000);
      } else {
          console.error("Failed to submit form API");
      }
    } catch (err) {
      console.error("Failed to submit form:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-text-main bg-light-bg">
      <header className="bg-bu-blue text-white px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b-4 border-bu-orange relative z-40">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button onClick={() => setShowDropdown(!showDropdown)} className="flex flex-col items-center focus:outline-none">
              <img src={user?.avatar_id || AVATARS[0]} alt="Avatar" className="w-10 h-10 rounded-full bg-white border-2 border-bu-orange object-cover shadow-sm hover:opacity-90 transition"/>
              <span className="text-[10px] font-bold mt-1 uppercase tracking-wider text-gray-200">Profile</span>
            </button>
            
            {showDropdown && (
              <>
                 <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                 <div className="absolute top-14 left-0 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden text-text-main animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                       <p className="font-bold text-sm truncate">{user?.display_name || "Student"}</p>
                       <p className="text-[10px] text-text-muted truncate">{user?.email || "No email set"}</p>
                    </div>
                    <div className="p-1">
                      <button onClick={() => { setProfileModal("profile"); setShowDropdown(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-bu-blue/5 rounded flex items-center font-medium"><UserIcon className="w-4 h-4 mr-2 text-bu-blue"/> View Profile</button>
                      <button onClick={() => { setProfileModal("settings"); setSettingsTab("menu"); setShowDropdown(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-bu-blue/5 rounded flex items-center font-medium"><Settings className="w-4 h-4 mr-2 text-bu-blue"/> Settings</button>
                    </div>
                    <div className="p-1 border-t border-gray-100">
                      <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center font-medium"><LogOut className="w-4 h-4 mr-2"/> Sign Out</button>
                    </div>
                 </div>
              </>
            )}
          </div>
          <div className="hidden sm:block">
            <span className="font-semibold px-3 py-1 bg-white/10 rounded-full">Student No: {user?.student_number}</span>
          </div>
        </div>
        <div className="flex flex-col items-center sm:items-end text-sm w-full sm:w-auto mt-2 sm:mt-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-center sm:text-right">Student Portal</h1>
            <img src="/images/bu-logo.png" alt="Bicol University Logo" className="w-10 h-10 object-contain bg-transparent hidden sm:block" />
          </div>
          <div className="sm:hidden mt-2">
            <span className="font-semibold px-3 py-1 bg-white/10 rounded-full flex items-center gap-2">
              <img src="/images/bu-logo.png" alt="Bicol University Logo" className="w-5 h-5 object-contain bg-transparent" />
              Student No: {user?.student_number}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
        <div className="bg-bu-blue text-white px-4 sm:px-5 py-3 rounded-xl flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start">
          {!historicalData && <button onClick={() => setActiveTab("fill")} className={`px-4 py-2 text-sm rounded ${activeTab === "fill" ? "bg-white/20" : ""}`}>Fill Form</button>}
          {historicalData && <button onClick={() => setActiveTab("history")} className={`px-4 py-2 text-sm rounded ${activeTab === "history" ? "bg-white/20" : ""}`}>My Record</button>}
        </div>

        {activeTab === "fill" || (activeTab === "edit") ? (
             <form onSubmit={handleSubmit} className="space-y-6">
                {successMsg && <div className="bg-[#C6F6D5] text-[#22543D] p-4 rounded font-bold">{successMsg}</div>}
                
                <div className="bg-card-white rounded-xl border border-border-color p-4 sm:p-6 shadow-sm">
                   <h2 className="text-bu-blue font-bold uppercase mb-4 border-b pb-2">A. Personal Information</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                       <InputField label="First Name" keyName="first_name" required placeholder="Juan" formData={formData} setFormData={setFormData} />
                       <InputField label="Middle Name" keyName="middle_name" formData={formData} setFormData={setFormData} />
                       <InputField label="Last Name" keyName="last_name" required placeholder="Dela" formData={formData} setFormData={setFormData} />
                       
                       <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">Sex *</label>
                          <select required value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white">
                              <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                          </select>
                       </div>
                       <div>
                          <InputField label="Birth Date" keyName="birth_date" type="date" required formData={formData} setFormData={setFormData} />
                          {formData.birth_date && (
                             <p className="text-[11px] font-semibold text-bu-blue mt-1">Age: {calculateAge(formData.birth_date)} years old</p>
                          )}
                       </div>
                       
                       <div>
                          <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">Citizenship</label>
                          <select 
                              value={formData.citizenship} 
                              onChange={e => setFormData({...formData, citizenship: e.target.value})} 
                              className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white"
                          >
                              <option value="">Select Citizenship...</option>
                              {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                       </div>
                       
                       <div>
                         <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">Religion</label>
                         <select 
                             value={formData.religion} 
                             onChange={e => setFormData({...formData, religion: e.target.value})} 
                             className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white"
                         >
                             <option value="">Select Religion...</option>
                             {religions.map(r => <option key={r} value={r}>{r}</option>)}
                         </select>
                       </div>

                       <InputField label="Contact Number" keyName="contact_number" required formData={formData} setFormData={setFormData} />
                       <InputField label="Email Address" keyName="email_address" type="email" required formData={formData} setFormData={setFormData} />
                       <InputField label="Active Cellphone No." keyName="cellphone_num" required formData={formData} setFormData={setFormData} />
                       
                       <div>
                         <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">Annual Income</label>
                         <select 
                             value={formData.annualfam_income} 
                             onChange={(e) => setFormData({ ...formData, annualfam_income: e.target.value })} 
                             className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white" 
                             required
                         >
                             <option value="" disabled>Select Income Range</option>
                             <option value="₱0 – ₱150,000">₱0 – ₱150,000</option>
                             <option value="₱150,001 – ₱300,000">₱150,001 – ₱300,000</option>
                             <option value="₱300,001 – ₱600,000">₱300,001 – ₱600,000</option>
                             <option value="₱600,001 – ₱1,200,000">₱600,001 – ₱1,200,000</option>
                             <option value="₱1,200,001 and above">₱1,200,001 and above</option>
                         </select>
                       </div>
                       
                       <div>
                          <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">Indigenous Group</label>
                          <input 
                              type="text" 
                              list="indigenous-options"
                              value={formData.indigenous_group} 
                              onChange={e => setFormData({...formData, indigenous_group: e.target.value})} 
                              className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white" 
                              placeholder="If applicable, specify..." 
                          />
                          <datalist id="indigenous-options">
                              <option value="None" />
                              <option value="Igorot" />
                              <option value="Mangyan" />
                              <option value="Badjao" />
                              <option value="Ati" />
                              <option value="Lumad" />
                              <option value="Aeta" />
                          </datalist>
                       </div>
                   </div>
                   
                   <div className="mt-8">
                     <h3 className="font-bold text-sm mb-3 text-bu-orange uppercase tracking-wide">Current Address</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-start">
                        <AddressSelector prefix="curr" formData={formData} setFormData={setFormData} />
                     </div>
                   </div>

                   <div className="mt-8">
                     <div className="flex items-center justify-between mb-3 border-b border-border-color pb-2">
                       <h3 className="font-bold text-sm text-bu-orange uppercase tracking-wide">Permanent Address</h3>
                       <label className="flex items-center text-xs font-semibold cursor-pointer text-bu-blue hover:text-bu-orange transition">
                         <input type="checkbox" className="mr-2 cursor-pointer" checked={sameAsCurrent} onChange={(e) => setSameAsCurrent(e.target.checked)}/>
                         Same as Current
                       </label>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-start">
                        <AddressSelector prefix="perm" formData={formData} setFormData={setFormData} disabled={sameAsCurrent} />
                     </div>
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
                        <div>
                           <label className="block text-xs font-bold text-text-muted mb-1">Year Level *</label>
                           <select required value={formData.year_level} onChange={e=>setFormData({...formData, year_level: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white">
                             <option value="">Select Year Level</option>
                             <option value="1st Year">1st Year</option>
                             <option value="2nd Year">2nd Year</option>
                             <option value="3rd Year">3rd Year</option>
                             <option value="4th Year">4th Year</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-text-muted mb-1">Block / Section *</label>
                           <select required value={formData.block_section} onChange={e=>setFormData({...formData, block_section: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white">
                             <option value="">Select Block</option>
                             <option value="A">A</option>
                             <option value="B">B</option>
                             <option value="C">C</option>
                             <option value="D">D</option>
                             <option value="E">E</option>
                           </select>
                        </div>
                       <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">Enrollment Status *</label>
                          <select required value={formData.enrollment_status} onChange={e => setFormData({...formData, enrollment_status: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white">
                              <option value="">Select</option><option value="Regular">Regular</option><option value="Irregular">Irregular</option>
                          </select>
                       </div>
                       <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-text-muted mb-2">Do you have a scholarship?</label>
                          <div className="flex items-center gap-4 mb-2">
                             <label className="flex items-center text-sm font-semibold cursor-pointer">
                               <input type="radio" name="scholarship" value="Yes" checked={formData.has_scholarship === "Yes"} onChange={e => setFormData({...formData, has_scholarship: "Yes"})} className="mr-2" />
                               Yes
                             </label>
                             <label className="flex items-center text-sm font-semibold cursor-pointer">
                               <input type="radio" name="scholarship" value="No" checked={formData.has_scholarship === "No"} onChange={e => setFormData({...formData, has_scholarship: "No", scholarship_status: ""})} className="mr-2" />
                               No
                             </label>
                          </div>
                          {formData.has_scholarship === "Yes" && (
                            <input type="text" required value={formData.scholarship_status} onChange={e => setFormData({...formData, scholarship_status: e.target.value})} placeholder="Specify Scholarship..." className="w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:border-bu-blue" />
                          )}
                       </div>
                   </div>
                </div>

                <div className="bg-card-white rounded-xl border border-border-color p-4 sm:p-6 shadow-sm">
                   <h2 className="text-bu-blue font-bold uppercase mb-4 border-b pb-2">C. Physical & Health Information</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                       <InputField label="Height (cm)" keyName="height_cm" type="number" formData={formData} setFormData={setFormData} />
                       <InputField label="Weight (kg)" keyName="weight_kg" type="number" formData={formData} setFormData={setFormData} />
                       <div>
                          <label className="block text-xs font-bold text-text-muted mb-1">Blood Type</label>
                          <select value={formData.blood_type} onChange={e=>setFormData({...formData, blood_type: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white">
                             <option value="">Select Blood Type</option>
                             {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                          </select>
                       </div>
                       
                       <div>
                          <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">Disability</label>
                          <input 
                              type="text" 
                              list="disability-options"
                              value={formData.disability_status} 
                              onChange={e => setFormData({...formData, disability_status: e.target.value})} 
                              className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white" 
                          />
                          <datalist id="disability-options">
                              <option value="None" />
                              <option value="Visual Impairment" />
                              <option value="Hearing Impairment" />
                              <option value="Physical Disability" />
                              <option value="Learning Disability" />
                              <option value="Psychosocial Disability" />
                          </datalist>
                          <p className="text-[10px] text-text-muted mt-1 leading-tight">If there is, pls specify</p>
                       </div>
                   </div>
                   
                   <div className="mt-8">
                      <button type="submit" className="bg-bu-blue text-white px-8 py-3 rounded-lg font-bold w-full hover:bg-[#002244] transition-colors shadow-sm">Save Form Record</button>
                   </div>
                </div>
             </form>
          ) : (
            <div className="bg-card-white rounded-xl border border-border-color p-4 sm:p-8 shadow-sm">
              {successMsg && <div className="bg-[#C6F6D5] text-[#22543D] p-4 rounded font-bold mb-6">{successMsg}</div>}
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                 <h2 className="text-bu-blue font-bold uppercase m-0">My Record Profile</h2>
                 {historicalData && (
                   <button onClick={() => setActiveTab("fill")} className="bg-bu-orange text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-orange-600 transition-colors">Edit / Update Record</button>
                 )}
              </div>
              {historicalData ? (
                <div className="space-y-8 text-sm">
                    {/* Personal Setup */}
                    <div>
                       <h4 className="text-bu-orange font-bold text-xs uppercase mb-3 bg-orange-50 px-3 py-1 rounded inline-block">Personal Identity</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-3 px-2">
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Full Name</dt>
                             <dd className="font-semibold">{historicalData.last_name}, {historicalData.first_name} {historicalData.middle_name}</dd>
                           </dl>
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Sex & Age</dt>
                             <dd className="font-semibold">{historicalData.sex || historicalData.gender} • {calculateAge(historicalData.birth_date)} yrs old</dd>
                           </dl>
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Birth Date</dt>
                             <dd className="font-semibold">{historicalData.birth_date ? new Date(historicalData.birth_date).toLocaleDateString() : 'N/A'}</dd>
                           </dl>
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Citizenship</dt>
                             <dd className="font-semibold">{historicalData.citizenship || 'N/A'}</dd>
                           </dl>
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Religion</dt>
                             <dd className="font-semibold">{historicalData.religion || 'N/A'}</dd>
                           </dl>
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Indigenous Group</dt>
                             <dd className="font-semibold">{historicalData.indigenous_group || 'None'}</dd>
                           </dl>
                       </div>
                    </div>

                    <div className="border-t border-border-color pt-6">
                       <h4 className="text-bu-orange font-bold text-xs uppercase mb-3 bg-orange-50 px-3 py-1 rounded inline-block">Contact & Addressing</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3 px-2">
                           <div>
                              <dl className="mb-4">
                                <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider mb-1">Current Address</dt>
                                <dd className="font-semibold"><AddressDisplay record={historicalData} prefix="curr_" /></dd>
                                {historicalData.curr_zipcode && <span className="text-xs text-text-muted">ZIP: {historicalData.curr_zipcode}</span>}
                              </dl>
                              <dl>
                                <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider mb-1">Permanent Address</dt>
                                <dd className="font-semibold"><AddressDisplay record={historicalData} prefix="perm_" /></dd>
                                {historicalData.perm_zipcode && <span className="text-xs text-text-muted">ZIP: {historicalData.perm_zipcode}</span>}
                              </dl>
                           </div>
                           <div className="space-y-4">
                              <dl>
                                <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Email Address</dt>
                                <dd className="font-semibold">{historicalData.email_address}</dd>
                              </dl>
                              <dl>
                                <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Contact Numbers</dt>
                                <dd className="font-semibold">{historicalData.contact_number} / {historicalData.cellphone_num}</dd>
                              </dl>
                              <dl>
                                <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Family Income</dt>
                                <dd className="font-semibold">{historicalData.annualfam_income || 'N/A'}</dd>
                              </dl>
                           </div>
                       </div>
                    </div>

                    <div className="border-t border-border-color pt-6">
                       <h4 className="text-bu-orange font-bold text-xs uppercase mb-3 bg-orange-50 px-3 py-1 rounded inline-block">Academic Information</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-3 px-2">
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Student Number</dt>
                             <dd className="font-semibold text-bu-blue">{historicalData.student_number}</dd>
                           </dl>
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Course / Program</dt>
                             <dd className="font-semibold">{historicalData.program || 'N/A'} ({historicalData.department})</dd>
                           </dl>
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Year & Block</dt>
                             <dd className="font-semibold">{historicalData.year_level} - {historicalData.block_section}</dd>
                           </dl>
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Enrollment Status</dt>
                             <dd className="font-semibold"><span className="bg-[#C6F6D5] text-[#22543D] px-2 py-0.5 rounded text-xs">{historicalData.enrollment_status}</span></dd>
                           </dl>
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Scholarship</dt>
                             <dd className="font-semibold">
                               {historicalData.has_scholarship === 'Yes' 
                                  ? `Yes (${historicalData.scholarship_status || 'Specified'})` 
                                  : 'None'}
                             </dd>
                           </dl>
                       </div>
                    </div>

                    <div className="border-t border-border-color pt-6">
                       <h4 className="text-bu-orange font-bold text-xs uppercase mb-3 bg-orange-50 px-3 py-1 rounded inline-block">Physical & Health</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-3 px-2">
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Height / Weight</dt>
                             <dd className="font-semibold">{historicalData.height_cm || 'N/A'} cm / {historicalData.weight_kg || 'N/A'} kg</dd>
                           </dl>
                           <dl>
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Blood Type</dt>
                             <dd className="font-semibold text-red-600">{historicalData.blood_type || 'Unknown'}</dd>
                           </dl>
                           <dl className="col-span-1 md:col-span-2">
                             <dt className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Disability Status</dt>
                             <dd className="font-semibold">
                                {historicalData.disability_status !== 'None' && historicalData.disability_status 
                                   ? <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">{historicalData.disability_status}</span>
                                   : 'None'}
                             </dd>
                           </dl>
                       </div>
                    </div>
                </div>
              ) : (
                <div className="text-center py-10 text-text-muted">
                    <p className="mb-4">No active records found.</p>
                    <button onClick={() => setActiveTab("fill")} className="bg-bu-blue text-white px-6 py-2 rounded font-bold hover:bg-[#002244] transition-colors">Fill Out Form Now</button>
                </div>
              )}
            </div>
          )}
      </main>

      {profileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                 <h2 className="font-bold text-bu-blue uppercase tracking-wide">
                    {profileModal === "profile" ? "Complete Your Profile" : "Account Settings"}
                 </h2>
                 <button onClick={() => setProfileModal(null)} className="text-gray-400 hover:text-gray-700 font-bold flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300">
                   <X className="w-5 h-5"/>
                 </button>
              </div>
              
              <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                 {profileModal === "profile" ? (
                   <form onSubmit={handleUpdateProfile} className="space-y-6">
                      {profileError && <div className="bg-red-50 text-red-600 text-xs p-3 rounded font-bold">{profileError}</div>}
                      
                      <div>
                         <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Choose Avatar</label>
                         <div className="grid grid-cols-3 gap-3">
                            {AVATARS.map((url, i) => (
                               <button type="button" key={i} onClick={() => setAvatarFocus(url)} className={`relative rounded-lg p-2 border-2 transition-all ${avatarFocus === url ? "border-bu-orange bg-orange-50" : "border-transparent bg-gray-50 hover:bg-gray-100"}`}>
                                  <img src={url} alt={`Avatar option ${i+1}`} className="w-12 h-12 mx-auto" />
                                  {avatarFocus === url && <div className="absolute -top-2 -right-2 bg-bu-orange text-white rounded-full p-0.5"><CheckCircle className="w-3 h-3"/></div>}
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div>
                            <label className="block text-xs font-bold text-text-muted mb-1 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                            <input type="text" required value={nameFocus} onChange={e=>setNameFocus(e.target.value)} placeholder="e.g., Juan De La Cruz" className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-text-muted mb-1 uppercase tracking-wider">Student or School Email <span className="text-red-500">*</span></label>
                            <input type="email" required value={emailFocus} onChange={e=>setEmailFocus(e.target.value)} placeholder="student@bicol-u.edu.ph" className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm" />
                         </div>
                      </div>
                      
                      <button type="submit" className="w-full bg-bu-blue text-white py-2.5 rounded font-bold hover:bg-[#002244] shadow-sm transition-colors">Save Profile</button>
                   </form>
                 ) : (
                   <div className="space-y-5">
                      {settingsTab === "menu" && (
                         <div>
                            <h3 className="font-bold text-sm border-b border-gray-100 pb-2 mb-4 text-bu-blue">General Account Settings</h3>
                            <button onClick={() => setSettingsTab("privacy")} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium border border-gray-200 transition-colors">Privacy and Security Settings</button>
                         </div>
                      )}
                      
                      {settingsTab === "privacy" && (
                         <div>
                            <button onClick={() => setSettingsTab("menu")} className="text-xs text-bu-blue font-bold mb-4 hover:underline">&larr; Back to Settings Menu</button>
                            <h3 className="font-bold text-sm border-b border-gray-100 pb-2 mb-4 text-bu-blue">Privacy and Security</h3>
                            <div className="space-y-3">
                               <button onClick={() => setSettingsTab("password")} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium border border-gray-200 transition-colors">Change Password</button>
                            </div>
                         </div>
                      )}

                      {settingsTab === "password" && (
                         <form onSubmit={handleChangePassword}>
                            <button type="button" onClick={() => setSettingsTab("privacy")} className="text-xs text-bu-blue font-bold mb-4 hover:underline">&larr; Back to Privacy</button>
                            <h3 className="font-bold text-sm border-b border-gray-100 pb-2 mb-4 text-bu-blue">Update Password</h3>
                            
                            {pwError && <div className="bg-red-50 text-red-600 text-xs p-3 rounded font-bold mb-4">{pwError}</div>}
                            {pwSuccess && <div className="bg-green-50 text-green-700 text-xs p-3 rounded font-bold mb-4">{pwSuccess}</div>}
                            
                            <div className="space-y-4">
                               <div>
                                  <label className="block text-xs font-bold text-text-muted mb-1 uppercase tracking-wider">Current Password</label>
                                  <input type="password" required value={currentPw} onChange={e=>setCurrentPw(e.target.value)} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm" />
                               </div>
                               <div>
                                  <label className="block text-xs font-bold text-text-muted mb-1 uppercase tracking-wider">New Password</label>
                                  <input type="password" required value={newPw} onChange={e=>setNewPw(e.target.value)} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm" />
                               </div>
                               <div>
                                  <label className="block text-xs font-bold text-text-muted mb-1 uppercase tracking-wider">Confirm New Password</label>
                                  <input type="password" required value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm" />
                               </div>
                               
                               <div className="pt-2">
                                  <button type="submit" className="w-full bg-bu-blue text-white py-2.5 rounded font-bold hover:bg-[#002244] shadow-sm transition-colors">Save New Password</button>
                               </div>

                               <div className="text-center pt-4 border-t border-gray-100 mt-4">
                                  <button type="button" onClick={handleInternalForgotPassword} className="text-xs font-bold text-text-muted hover:text-bu-orange transition-colors">Forgot Password?</button>
                                  {forgotPwMsg && <div className="mt-2 text-xs text-bu-blue font-semibold">{forgotPwMsg}</div>}
                               </div>
                            </div>
                         </form>
                      )}
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
