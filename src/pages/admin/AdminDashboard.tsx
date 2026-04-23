import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, FileText, Trash2, UserPlus, Activity, Search, Filter, X, Eye } from "lucide-react";
import ChatbotWidget from "../../components/ChatbotWidget";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PrintableStudentRecord from "../../components/PrintableStudentRecord";

const AddressDisplay = ({ record, prefix }: { record: any, prefix: 'curr_' | 'perm_' }) => {
  if (record[`${prefix}region`]) {
    const street = record[`${prefix}street`] ? record[`${prefix}street`] + ', ' : '';
    const prov = record[`${prefix}province`] ? record[`${prefix}province`] + ', ' : '';
    return <span>{street}{record[`${prefix}barangay`]}, {record[`${prefix}municipality`]}, {prov}{record[`${prefix}region`]}</span>;
  }
  return <span>{prefix === 'curr_' ? record.current_address : record.permanent_address} || 'N/A'</span>;
};

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"students" | "forms" | "logs" | "advanced_filter">("students");
  const [students, setStudents] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Filtering and Modal States
  const [searchTerm, setSearchTerm] = useState("");
  const [maxIncomeFilter, setMaxIncomeFilter] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Advanced Filter Settings
  const [filterStep, setFilterStep] = useState<1 | 2 | 3>(1);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filterData, setFilterData] = useState<Record<string, string>>({});
  const [filteredResults, setFilteredResults] = useState<any[]>([]);

  const filterableFields = [
    { key: "gender", label: "Gender", hasOptions: true },
    { key: "religion", label: "Religion" },
    { key: "annualfam_income", label: "Family Income", hint: "Income below or exact match" },
    { key: "indigenous_group", label: "Indigenous Group", hasOptions: true },
    { key: "program", label: "Program", hasOptions: true },
    { key: "year_level", label: "Year Level", hasOptions: true },
    { key: "block_section", label: "Block/Section", hasOptions: true },
    { key: "scholarship_status", label: "Scholarship", hasOptions: true },
    { key: "curr_province", label: "Province", hasOptions: true }
  ];

  const handleAdvancedFilterSubmit = () => {
    const results = forms.filter(f => {
      let matches = true;
      for (const key of selectedFields) {
        if (!filterData[key]) continue;
        const searchVal = filterData[key].toLowerCase();
        
        if (key === "annualfam_income") {
           const maxIncome = Number(filterData[key].replace(/[^0-9]/g, ''));
           const studentIncome = Number(f[key] || 0);
           if (studentIncome > maxIncome) matches = false;
        } else if (key === "scholarship_status" || key === "indigenous_group") {
            const studentVal = String(f[key] || "None").toLowerCase();
            if(!studentVal.includes(searchVal)) matches = false;
        } else {
           const studentVal = String(f[key] || "").toLowerCase();
           if (!studentVal.includes(searchVal)) matches = false;
        }
      }
      return matches;
    });

    results.sort((a, b) => {
      if (a.year_level !== b.year_level) return String(a.year_level || '').localeCompare(String(b.year_level || ''));
      if (a.block_section !== b.block_section) return String(a.block_section || '').localeCompare(String(b.block_section || ''));
      const nameA = `${a.last_name} ${a.first_name} ${a.middle_name}`.toLowerCase();
      const nameB = `${b.last_name} ${b.first_name} ${b.middle_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setFilteredResults(results);
    setFilterStep(3);
  };
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ student_number: "", password: "" });
  const [error, setError] = useState("");

  const calculateAge = (dob?: string) => {
      if (!dob) return "";
      const diffTimestamp = Date.now() - new Date(dob).getTime();
      const ageDate = new Date(diffTimestamp);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if(!data.length) return;
    const keys = Object.keys(data[0]).filter(k => !['_id', '__v', 'password', 'avatar_id', 'user_id', 'id'].includes(k));
    const csvContent = [
      keys.join(','),
      ...data.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    // Show the printable layout specifically for print
    const element = document.getElementById("printable-record-container");
    if (element) {
        element.classList.remove('hidden');
        element.classList.add('block');
    }
    window.print();
    if (element) {
        element.classList.add('hidden');
        element.classList.remove('block');
    }
  };

  const handleDownloadPDF = async () => {
    // Find the dedicated printable container
    const element = document.getElementById("printable-record-container");
    if (!element) return;
    
    // Temporarily make it visible for html2canvas
    const originalDisplay = element.style.display;
    element.style.display = "block";
    element.style.position = "absolute";
    element.style.left = "-9999px"; // move offscreen so user doesn't see flash
    
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Student_Record_${selectedRecord?.student_number || 'export'}.pdf`);
    } catch(err) {
      console.error("PDF generation failed", err);
    } finally {
      // Revert display back to original state
      element.style.display = originalDisplay;
      element.style.position = "";
      element.style.left = "";
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/admin/students", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStudents(await res.json());
    } catch (err) {}
  };

  const fetchForms = async () => {
    try {
      const res = await fetch("/api/admin/forms", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setForms(await res.json());
    } catch (err) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setLogs(await res.json());
    } catch(err) {}
  };

  useEffect(() => {
    fetchStudents();
    fetchForms();
    fetchLogs();
  }, [activeTab]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newStudent)
      });
      if (res.ok) {
        setShowAddForm(false); setNewStudent({ student_number: "", password: "" }); fetchStudents();
      } else {
        const data = await res.json(); setError(data.error || "Failed");
      }
    } catch (err) { setError("An error occurred"); }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchStudents();
    } catch (err) {}
  };

  const handleDeleteRecord = async (e: React.MouseEvent, record: any) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/records/${record.user_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setFilteredResults(prev => prev.filter(r => r.user_id !== record.user_id));
        fetchForms();
        fetchStudents();
      }
    } catch (err) {}
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-light-bg text-text-main">
      <header className="bg-bu-blue text-white px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b-4 border-bu-orange">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bu-orange rounded-full flex items-center justify-center font-bold">BU</div>
          <div><h1 className="text-lg font-bold m-0 text-center sm:text-left">Admin Dashboard</h1></div>
        </div>
        <div className="flex flex-col items-center sm:items-end text-sm">
          <div className="mb-1">
            <span className="bg-bu-orange px-2 py-0.5 rounded font-bold uppercase text-[10px] mr-2">System Admin</span>
            <strong className="tracking-wide">{user?.username}</strong>
          </div>
          <div className="flex gap-4">
             <button onClick={handleLogout} className="flex items-center text-gray-300 hover:text-bu-orange text-xs mt-1 transition-colors"><LogOut className="w-3 h-3 mr-1" /> Sign out securely</button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1240px] w-full mx-auto">
        <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-bu-blue text-white px-4 sm:px-5 py-3 rounded-xl flex flex-wrap gap-2 sm:gap-3">
          <button onClick={() => setActiveTab("students")} className={`flex items-center px-4 py-1.5 text-sm rounded ${activeTab==="students"?"bg-white/20":""}`}><Users className="mr-2 h-4 w-4" /> Students</button>
          <button onClick={() => setActiveTab("forms")} className={`flex items-center px-4 py-1.5 text-sm rounded ${activeTab==="forms"?"bg-white/20":""}`}><FileText className="mr-2 h-4 w-4" /> Records</button>
          <button onClick={() => { setActiveTab("advanced_filter"); setFilterStep(1); setSelectedFields([]); }} className={`flex items-center px-4 py-1.5 text-sm rounded ${activeTab==="advanced_filter"?"bg-white/20":""}`}><Filter className="mr-2 h-4 w-4" /> Filter Out</button>
          <button onClick={() => setActiveTab("logs")} className={`flex items-center px-4 py-1.5 text-sm rounded ${activeTab==="logs"?"bg-white/20":""}`}><Activity className="mr-2 h-4 w-4" /> System Logs</button>
        </div>

        <div className="bg-card-white rounded-xl border border-border-color p-5 shadow-sm col-span-1">
          <div className="text-xs font-bold text-bu-blue uppercase mb-2">Total Students</div>
          <div className="text-3xl font-extrabold text-bu-orange">{students.length}</div>
        </div>

        <div className="bg-card-white rounded-xl border border-border-color p-5 shadow-sm col-span-1">
          <div className="text-xs font-bold text-bu-blue uppercase mb-2">Total Records</div>
          <div className="text-3xl font-extrabold text-bu-orange">{forms.length}</div>
        </div>

        <div className="bg-card-white rounded-xl border border-border-color p-5 shadow-sm col-span-2">
          <div className="text-xs font-bold text-bu-blue uppercase mb-3">System Information</div>
          <p className="text-sm text-text-muted mt-2">Bicol University Polangui Campus Admin Panel. Auto-backup is enabled.</p>
          <p className="text-xs text-text-muted mt-2">Students register their own accounts via the public portal.</p>
        </div>

        <div className="bg-card-white rounded-xl border border-border-color p-5 shadow-sm col-span-1 md:col-span-2 lg:col-span-4">
          {activeTab === "students" && (
            <div>
              <h2 className="text-bu-blue font-bold uppercase mb-4">Student Registry</h2>
              <div className="w-full">
                <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="border-b text-text-muted">
                        <tr>
                            <th className="py-3 font-semibold whitespace-nowrap">Student ID</th>
                            <th className="py-3 font-semibold whitespace-nowrap">Reg. Date</th>
                            <th className="py-3 font-semibold whitespace-nowrap">Status</th>
                            <th className="py-3 font-semibold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.user_id} className="border-b hover:bg-bu-blue/5">
                          <td className="py-3 font-bold text-bu-blue whitespace-nowrap">{s.student_number}</td>
                          <td className="py-3 whitespace-nowrap text-text-main">{new Date(s.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' })}</td>
                          <td className="py-3 whitespace-nowrap">
                              <span className="bg-[#C6F6D5] text-[#22543D] px-2 py-1 rounded text-[10px] sm:text-xs font-bold w-max inline-block">
                                  {s.account_status}
                              </span>
                          </td>
                          <td className="py-3 text-right">
                              <button onClick={()=>handleDeleteStudent(s.user_id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded transition-colors inline-flex justify-center items-center">
                                  <Trash2 className="w-4 h-4"/>
                              </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "forms" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <h2 className="text-bu-blue font-bold uppercase m-0">Identity Inventory Forms</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative group flex-1 sm:w-64">
                       <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
                       <input 
                          type="text" 
                          placeholder="Search student # or name..." 
                          value={searchTerm} 
                          onChange={(e)=>setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm"
                       />
                    </div>
                </div>
              </div>
              <div className="w-full space-y-6">
                {(() => {
                   const filteredForms = forms.filter(f => {
                       if(!searchTerm) return true;
                       const query = searchTerm.toLowerCase();
                       const fullName = `${f.first_name} ${f.middle_name || ''} ${f.last_name}`.toLowerCase();
                       return f.student_number.toLowerCase().includes(query) || fullName.includes(query);
                   });
                   
                   if (filteredForms.length === 0) return <div className="py-8 text-center text-text-muted font-medium">No inventory records found.</div>;

                   const grouped = filteredForms.reduce((acc, f) => {
                       const year = f.year_level || 'Unknown Year';
                       const prog = f.program || 'Unknown Program';
                       const block = f.block_section || 'Unknown Block';
                       if(!acc[year]) acc[year] = {};
                       if(!acc[year][prog]) acc[year][prog] = {};
                       if(!acc[year][prog][block]) acc[year][prog][block] = [];
                       acc[year][prog][block].push(f);
                       return acc;
                   }, {} as Record<string, Record<string, Record<string, any[]>>>);

                   const sortedYears = Object.keys(grouped).sort();

                   return sortedYears.map(year => (
                     <div key={year} className="mb-6">
                        <h3 className="text-lg font-extrabold text-bu-orange border-b-2 border-bu-orange pb-1 mb-4">{year}</h3>
                        {Object.keys(grouped[year]).sort().map(prog => (
                          <div key={prog} className="ml-4 mb-5">
                             <h4 className="text-md font-bold text-bu-blue mb-3">{prog}</h4>
                             {Object.keys(grouped[year][prog]).sort().map(block => {
                                const studentsInBlock = grouped[year][prog][block];
                                return (
                                  <div key={block} className="ml-4 mb-4 border border-border-color rounded-lg overflow-hidden flex flex-col">
                                     <div className="bg-gray-50/80 px-4 py-2 border-b border-border-color text-sm font-bold text-text-main flex justify-between items-center">
                                         <span>Block/Section: {block}</span>
                                         <span className="bg-bu-blue text-white text-[10px] px-2 py-0.5 rounded-full">{studentsInBlock.length} Students</span>
                                     </div>
                                     <table className="w-full text-xs sm:text-sm text-left">
                                        <thead className="border-b text-text-muted bg-white">
                                            <tr>
                                                <th className="py-2 px-4 font-semibold whitespace-nowrap">Student No.</th>
                                                <th className="py-2 px-4 font-semibold whitespace-nowrap text-center">Full Name</th>
                                                <th className="py-2 px-4 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {studentsInBlock.map((f: any) => (
                                              <tr key={f.user_id} className="border-b last:border-b-0 cursor-pointer hover:bg-bu-blue/5 transition" onClick={() => setSelectedRecord(f)}>
                                                <td className="py-3 px-4 font-bold text-bu-blue whitespace-nowrap">{f.student_number}</td>
                                                <td className="py-3 px-4 font-semibold text-text-main whitespace-nowrap text-center">{f.last_name}, {f.first_name} {f.middle_name ? f.middle_name.charAt(0)+'.' : ''}</td>
                                                <td className="py-3 px-4 text-right">
                                                  <button className="text-text-muted hover:text-bu-orange font-bold text-[10px] sm:text-xs inline-flex items-center tracking-wide">
                                                     <Eye className="w-4 h-4 mr-1"/> VIEW
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                        </tbody>
                                     </table>
                                  </div>
                                );
                             })}
                          </div>
                        ))}
                     </div>
                   ));
                })()}
              </div>
            </div>
          )}

          {activeTab === "advanced_filter" && (
            <div>
              <h2 className="text-bu-blue font-bold uppercase mb-4">Filter Out Student Information</h2>
              
              {filterStep === 1 && (
                <div className="space-y-6">
                   <p className="text-sm font-semibold text-text-muted">Select the specific information you need in order to proceed in filtering student information.</p>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filterableFields.map(field => (
                        <label key={field.key} className="flex items-center space-x-3 p-3 border border-border-color rounded-lg cursor-pointer hover:bg-bu-blue/5 transition">
                           <input 
                             type="checkbox" 
                             checked={selectedFields.includes(field.key)}
                             onChange={(e) => {
                                if(e.target.checked) setSelectedFields([...selectedFields, field.key]);
                                else setSelectedFields(selectedFields.filter(k => k !== field.key));
                             }}
                             className="w-4 h-4 text-bu-blue rounded focus:ring-bu-blue cursor-pointer"
                           />
                           <span className="text-sm font-bold text-text-main">{field.label}</span>
                        </label>
                      ))}
                   </div>
                   <button 
                     onClick={() => setFilterStep(2)}
                     disabled={selectedFields.length === 0}
                     className="bg-bu-blue text-white px-6 py-2 rounded font-bold text-sm disabled:opacity-50 hover:bg-[#002244] transition-colors"
                   >
                     Proceed
                   </button>
                </div>
              )}

              {filterStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <p className="text-sm font-semibold text-text-muted">Input the required constraint data for your selected filters.</p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-border-color">
                      {filterableFields.filter(f => selectedFields.includes(f.key)).map(field => (
                        <div key={field.key}>
                           <label className="block text-xs font-bold text-bu-blue uppercase mb-1">{field.label}</label>
                            {field.hasOptions ? (
                               <select
                                  value={filterData[field.key] || ""}
                                  onChange={(e) => setFilterData({...filterData, [field.key]: e.target.value})}
                                  className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white"
                               >
                                  <option value="">Any {field.label}</option>
                                  {Array.from(new Set(forms.map(f => f[field.key]).filter(v => v !== undefined && v !== null && v !== "" && v !== "None"))).sort().map(opt => (
                                      <option key={opt as string} value={opt as string}>{opt as string}</option>
                                  ))}
                               </select>
                            ) : (
                               <input 
                                  type="text"
                                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                                  value={filterData[field.key] || ""}
                                  onChange={(e) => setFilterData({...filterData, [field.key]: e.target.value})}
                                  className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm"
                               />
                            )}
                            {field.hint && <p className="text-[10px] text-text-muted mt-1">{field.hint}</p>}
                        </div>
                      ))}
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => setFilterStep(1)} className="px-6 py-2 rounded font-bold text-sm border border-border-color hover:bg-gray-100 transition-colors">Back</button>
                      <button onClick={handleAdvancedFilterSubmit} className="bg-bu-blue text-white px-6 py-2 rounded font-bold text-sm hover:bg-[#002244] transition-colors">Confirm Filter</button>
                   </div>
                </div>
              )}

              {filterStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-300">
                   <div className="flex justify-between items-center border-b border-border-color pb-4">
                      <div>
                        <h3 className="font-bold text-bu-orange">Filtered Results</h3>
                        <p className="text-xs text-text-muted font-medium">{filteredResults.length} students matched your criteria.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setFilterStep(1)} className="px-4 py-1.5 rounded font-bold text-xs border border-bu-blue text-bu-blue hover:bg-bu-blue hover:text-white transition-colors">Reset Filter</button>
                      </div>
                   </div>

                   <div className="w-full overflow-hidden border border-border-color rounded-lg">
                      <table className="w-full text-xs sm:text-sm text-left">
                          <thead className="border-b text-text-muted bg-gray-50/80">
                              <tr>
                                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Student No.</th>
                                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Name (Alphabetical)</th>
                                  <th className="py-3 px-4 font-semibold whitespace-nowrap text-center">Yr. & Block</th>
                                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white">
                              {filteredResults.map(f => (
                                <tr key={f.user_id} className="border-b last:border-b-0 cursor-pointer hover:bg-bu-blue/5 transition" onClick={() => setSelectedRecord(f)}>
                                  <td className="py-3 px-4 font-bold text-bu-blue whitespace-nowrap">{f.student_number}</td>
                                  <td className="py-3 px-4 font-semibold text-text-main whitespace-nowrap">{f.last_name}, {f.first_name} {f.middle_name}</td>
                                  <td className="py-3 px-4 whitespace-nowrap text-center font-bold text-bu-orange">{f.year_level} - {f.block_section}</td>
                                  <td className="py-3 px-4 text-right">
                                     <button className="text-text-muted hover:text-bu-orange font-bold text-[10px] sm:text-xs inline-flex items-center tracking-wide mr-3">
                                       <Eye className="w-4 h-4 mr-1"/> VIEW
                                     </button>
                                     <button onClick={(e) => handleDeleteRecord(e, f)} className="text-gray-400 hover:text-red-600 font-bold text-[10px] sm:text-xs inline-flex items-center tracking-wide">
                                       <Trash2 className="w-4 h-4 mr-1"/> DEL
                                     </button>
                                  </td>
                                </tr>
                              ))}
                              {filteredResults.length===0 && <tr><td colSpan={4} className="py-10 text-center text-text-muted text-base">No matches found with those selected qualities.</td></tr>}
                          </tbody>
                      </table>
                   </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div>
              <h2 className="text-bu-blue font-bold uppercase mb-4">Admin Transaction Logs</h2>
              <div className="w-full">
                <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="border-b text-text-muted">
                        <tr>
                            <th className="py-3 font-semibold whitespace-nowrap">Trans. ID</th>
                            <th className="py-3 font-semibold whitespace-nowrap">Admin ID</th>
                            <th className="py-3 font-semibold whitespace-nowrap">Timestamp</th>
                            <th className="py-3 font-semibold whitespace-nowrap">Action Type</th>
                            <th className="py-3 font-semibold whitespace-nowrap text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                      {logs.map(l => (
                        <tr key={l.transaction_id} className="border-b hover:bg-bu-blue/5">
                          <td className="py-3 font-bold text-bu-blue whitespace-nowrap">#{l.transaction_id}</td>
                          <td className="py-3 font-semibold whitespace-nowrap">{l.user_id}</td>
                          <td className="py-3 whitespace-nowrap text-text-muted">{new Date(l.action_timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit', hour: '2-digit', minute:'2-digit' })}</td>
                          <td className="py-3 whitespace-nowrap bg-gray-50/50 px-2 rounded-md border border-gray-100 font-medium inline-block my-2">{l.action_type}</td>
                          <td className="py-3 whitespace-nowrap text-right font-medium text-bu-orange">{l.action_status}</td>
                        </tr>
                      ))}
                      {logs.length===0 && <tr><td colSpan={5} className="py-4 text-center">No logs generated yet.</td></tr>}
                    </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal for Detailed View */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-light-bg w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative border-t-8 border-t-bu-orange animate-in fade-in zoom-in duration-200">
              
              <div className="sticky top-0 bg-light-bg pt-6 pb-4 px-8 flex justify-between items-center border-b border-border-color z-10 no-print">
                 <div>
                    <h2 className="text-2xl font-extrabold text-text-main m-0">Student Record</h2>
                    <p className="text-sm text-text-muted font-medium mt-1">Submitted on {new Date(selectedRecord.submittedAt).toLocaleDateString()}</p>
                 </div>
                 <div className="flex gap-3 items-center no-print">
                    <button onClick={handlePrint} className="px-4 py-2 bg-gray-600 text-white text-xs font-bold rounded hover:bg-gray-700 transition">Print</button>
                    <button onClick={handleDownloadPDF} className="px-4 py-2 bg-bu-orange text-white text-xs font-bold rounded hover:bg-orange-600 transition">Download PDF</button>
                    <button onClick={() => setSelectedRecord(null)} className="bg-card-white border border-border-color hover:bg-gray-100 hover:text-red-500 rounded-full p-2 transition ml-2">
                       <X className="w-5 h-5"/>
                    </button>
                 </div>
              </div>

              <div id="student-record-content" className="p-8 space-y-8 bg-light-bg rounded-b-2xl">
                 {/* Personal Info */}
                 <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm relative group">
                    <h3 className="font-extrabold tracking-wide text-bu-blue border-b pb-3 mb-5 uppercase text-sm flex items-center"><Users className="w-4 h-4 mr-2 text-bu-orange"/> Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 text-sm">
                        <div className="col-span-1 sm:col-span-2 md:col-span-3">
                            <span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Full Name</span>
                            <strong className="text-text-main text-xl">{selectedRecord.last_name}, {selectedRecord.first_name} {selectedRecord.middle_name}</strong>
                        </div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Student No.</span><strong className="text-bu-blue font-extrabold">{selectedRecord.student_number}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Sex & Age</span><strong className="text-text-main">{selectedRecord.sex || selectedRecord.gender} • {calculateAge(selectedRecord.birth_date)} yrs old</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Birth Date</span><strong className="text-text-main">{selectedRecord.birth_date ? new Date(selectedRecord.birth_date).toLocaleDateString() : 'N/A'}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Citizenship</span><strong className="text-text-main">{selectedRecord.citizenship || 'N/A'}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Religion</span><strong className="text-text-main">{selectedRecord.religion || 'N/A'}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Contact Number</span><strong className="text-text-main">{selectedRecord.contact_number}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Email Address</span><strong className="text-text-main truncate block">{selectedRecord.email_address}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Cellphone No.</span><strong className="text-text-main">{selectedRecord.cellphone_num}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Annual Income</span><strong className="text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">₱ {selectedRecord.annualfam_income || '0'}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Indigenous Group</span><strong className="text-text-main">{selectedRecord.indigenous_group || 'None'}</strong></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-6 pt-6 border-t border-gray-100">
                        <div>
                           <span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Current Address</span>
                           <strong className="text-text-main leading-relaxed block"><AddressDisplay record={selectedRecord} prefix="curr_" /></strong>
                           {selectedRecord.curr_zipcode && <span className="text-xs text-text-muted font-medium mt-1 block">ZIP: {selectedRecord.curr_zipcode}</span>}
                        </div>
                        <div>
                           <span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Permanent Address</span>
                           <strong className="text-text-main leading-relaxed block"><AddressDisplay record={selectedRecord} prefix="perm_" /></strong>
                           {selectedRecord.perm_zipcode && <span className="text-xs text-text-muted font-medium mt-1 block">ZIP: {selectedRecord.perm_zipcode}</span>}
                        </div>
                    </div>
                 </div>

                 {/* Academic Info */}
                 <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm relative group">
                    <h3 className="font-extrabold tracking-wide text-bu-blue border-b pb-3 mb-5 uppercase text-sm flex items-center"><FileText className="w-4 h-4 mr-2 text-bu-orange"/> Academic Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 text-sm">
                        <div className="col-span-1 md:col-span-2"><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Department</span><strong className="text-text-main">{selectedRecord.department}</strong></div>
                        <div className="col-span-1 md:col-span-2"><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Program</span><strong className="text-text-main">{selectedRecord.program}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Year & Block</span><strong className="text-text-main">{selectedRecord.year_level} - {selectedRecord.block_section}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Enrollment Status</span><strong className="text-green-800 bg-green-100 px-2 py-0.5 rounded text-xs">{selectedRecord.enrollment_status}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Scholarship</span><strong className="text-text-main">{selectedRecord.scholarship_status || 'None'}</strong></div>
                    </div>
                 </div>

                 {/* Physical & Health Info */}
                 <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm relative group">
                    <h3 className="font-extrabold tracking-wide text-bu-blue border-b pb-3 mb-5 uppercase text-sm flex items-center"><Activity className="w-4 h-4 mr-2 text-bu-orange"/> Physical & Health Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 text-sm">
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Height</span><strong className="text-text-main">{selectedRecord.height_cm || 'N/A'} cm</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Weight</span><strong className="text-text-main">{selectedRecord.weight_kg || 'N/A'} kg</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Blood Type</span><strong className="text-red-600 font-bold">{selectedRecord.blood_type || 'N/A'}</strong></div>
                        <div className="col-span-1 md:col-span-2"><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Disability Status</span><strong className="text-text-main">{selectedRecord.disability_status !== 'None' && selectedRecord.disability_status ? <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">{selectedRecord.disability_status}</span> : 'None'}</strong></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Hidden Container exclusively for PDF generation and Standard Window Printing */}
      <div id="printable-record-container" className="hidden print-modal no-print absolute bg-white z-[9999]">
          {selectedRecord && <PrintableStudentRecord record={selectedRecord} />}
      </div>

      <ChatbotWidget />
    </div>
  );
}
