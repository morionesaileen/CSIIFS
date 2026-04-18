import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, FileText, Trash2, UserPlus, Activity, Search, Filter, X, Eye } from "lucide-react";

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"students" | "forms" | "logs">("students");
  const [students, setStudents] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Filtering and Modal States
  const [searchTerm, setSearchTerm] = useState("");
  const [maxIncomeFilter, setMaxIncomeFilter] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ student_number: "", password: "" });
  const [error, setError] = useState("");

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
    if (activeTab === "students") fetchStudents();
    else if (activeTab === "forms") fetchForms();
    else if (activeTab === "logs") fetchLogs();
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
    if (!confirm("Remove this student completely?")) return;
    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchStudents();
    } catch (err) {}
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-light-bg text-text-main">
      <header className="bg-bu-blue text-white px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b-4 border-bu-orange">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bu-orange rounded-full flex items-center justify-center font-bold">BU</div>
          <div><h1 className="text-lg font-bold m-0 text-center sm:text-left">CSIIFS Admin Dashboard</h1></div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-sm">
          <span className="bg-bu-orange px-2 py-0.5 rounded font-bold uppercase text-xs">System Admin</span>
          <strong>{user?.username}</strong>
          <button onClick={handleLogout} className="flex items-center hover:text-bu-orange"><LogOut className="w-4 h-4 mr-1" /> Logout</button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1240px] w-full mx-auto">
        <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-bu-blue text-white px-4 sm:px-5 py-3 rounded-xl flex flex-wrap gap-2 sm:gap-3">
          <button onClick={() => setActiveTab("students")} className={`flex items-center px-4 py-1.5 text-sm rounded ${activeTab==="students"?"bg-white/20":""}`}><Users className="mr-2 h-4 w-4" /> Students</button>
          <button onClick={() => setActiveTab("forms")} className={`flex items-center px-4 py-1.5 text-sm rounded ${activeTab==="forms"?"bg-white/20":""}`}><FileText className="mr-2 h-4 w-4" /> Records</button>
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
          <p className="text-sm text-text-muted mt-2">CSIIFS Polangui Campus Admin Panel. Auto-backup is enabled.</p>
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
                    <div className="relative group w-48">
                       <Filter className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
                       <input 
                          type="number" 
                          placeholder="Max Fam Income" 
                          value={maxIncomeFilter} 
                          onChange={(e)=>setMaxIncomeFilter(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm"
                       />
                    </div>
                </div>
              </div>
              <div className="w-full">
                <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="border-b text-text-muted">
                        <tr>
                            <th className="py-3 font-semibold whitespace-nowrap">Student No.</th>
                            <th className="py-3 font-semibold whitespace-nowrap">Full Name</th>
                            <th className="py-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {forms.filter(f => {
                       let matchesSearch = true;
                       if(searchTerm) {
                          const query = searchTerm.toLowerCase();
                          const fullName = `${f.first_name} ${f.middle_name || ''} ${f.last_name}`.toLowerCase();
                          matchesSearch = f.student_number.toLowerCase().includes(query) || fullName.includes(query);
                       }
                       let matchesIncome = true;
                       if(maxIncomeFilter) {
                          const income = Number(f.annualfam_income) || 0;
                          matchesIncome = income <= Number(maxIncomeFilter);
                       }
                       return matchesSearch && matchesIncome;
                    }).map(f => (
                      <tr key={f.user_id} className="border-b cursor-pointer hover:bg-bu-blue/5 transition" onClick={() => setSelectedRecord(f)}>
                        <td className="py-3 font-bold text-bu-blue whitespace-nowrap">{f.student_number}</td>
                        <td className="py-3 font-semibold text-text-main whitespace-nowrap">{f.first_name} {f.middle_name ? f.middle_name + ' ' : ''}{f.last_name}</td>
                        <td className="py-3 text-right">
                           <button className="text-text-muted hover:text-bu-orange font-bold text-xs inline-flex items-center tracking-wide">
                             <Eye className="w-4 h-4 mr-1"/> VIEW
                           </button>
                        </td>
                      </tr>
                    ))}
                    {forms.length===0 && <tr><td colSpan={3} className="py-8 text-center text-text-muted font-medium">No inventory records have been submitted yet.</td></tr>}
                  </tbody>
                </table>
              </div>
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
              
              <div className="sticky top-0 bg-light-bg pt-6 pb-4 px-8 flex justify-between items-center border-b border-border-color z-10">
                 <div>
                    <h2 className="text-2xl font-extrabold text-text-main m-0">Student Record</h2>
                    <p className="text-sm text-text-muted font-medium mt-1">Submitted on {new Date(selectedRecord.submittedAt).toLocaleDateString()}</p>
                 </div>
                 <button onClick={() => setSelectedRecord(null)} className="bg-card-white border border-border-color hover:bg-gray-100 hover:text-red-500 rounded-full p-2 transition">
                   <X className="w-5 h-5"/>
                 </button>
              </div>

              <div className="p-8 space-y-8">
                 {/* Personal Info */}
                 <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm">
                    <h3 className="font-extrabold tracking-wide text-bu-blue border-b pb-3 mb-5 uppercase text-sm flex items-center"><Users className="w-4 h-4 mr-2 text-bu-orange"/> Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 text-sm">
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Full Name</span><strong className="text-test-main text-base">{selectedRecord.first_name} {selectedRecord.middle_name} {selectedRecord.last_name}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Student No.</span><strong className="text-bu-blue font-extrabold">{selectedRecord.student_number}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Gender</span><strong className="text-text-main">{selectedRecord.gender}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Birth Date</span><strong className="text-text-main">{selectedRecord.birth_date}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Citizenship</span><strong className="text-text-main">{selectedRecord.citizenship}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Religion</span><strong className="text-text-main">{selectedRecord.religion || 'N/A'}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Contact Number</span><strong className="text-text-main">{selectedRecord.contact_number}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Email Address</span><strong className="text-text-main">{selectedRecord.email_address}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Cellphone No.</span><strong className="text-text-main">{selectedRecord.cellphone_num}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Annual Income</span><strong className="text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">₱ {selectedRecord.annualfam_income || '0'}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Indigenous Group</span><strong className="text-text-main">{selectedRecord.indigenous_group || 'None'}</strong></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-6 pt-6 border-t border-gray-100">
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Current Address</span><strong className="text-text-main leading-relaxed">{selectedRecord.current_address}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Permanent Address</span><strong className="text-text-main leading-relaxed">{selectedRecord.permanent_address}</strong></div>
                    </div>
                 </div>

                 {/* Academic Info */}
                 <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm">
                    <h3 className="font-extrabold tracking-wide text-bu-blue border-b pb-3 mb-5 uppercase text-sm flex items-center"><FileText className="w-4 h-4 mr-2 text-bu-orange"/> Academic Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 text-sm">
                        <div className="col-span-1 md:col-span-2"><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Department</span><strong className="text-text-main">{selectedRecord.department}</strong></div>
                        <div className="col-span-1 md:col-span-2"><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Program</span><strong className="text-text-main">{selectedRecord.program}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Year & Block</span><strong className="text-text-main">{selectedRecord.year_level} - {selectedRecord.block_section}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Enrollment Status</span><strong className="text-text-main">{selectedRecord.enrollment_status}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Scholarship</span><strong className="text-text-main">{selectedRecord.scholarship_status}</strong></div>
                    </div>
                 </div>

                 {/* Physical & Health Info */}
                 <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm">
                    <h3 className="font-extrabold tracking-wide text-bu-blue border-b pb-3 mb-5 uppercase text-sm flex items-center"><Activity className="w-4 h-4 mr-2 text-bu-orange"/> Physical & Health Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 text-sm">
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Height</span><strong className="text-text-main">{selectedRecord.height_cm} cm</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Weight</span><strong className="text-text-main">{selectedRecord.weight_kg} kg</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Blood Type</span><strong className="text-text-main">{selectedRecord.blood_type || 'N/A'}</strong></div>
                        <div><span className="block text-text-muted text-[0.7rem] font-bold uppercase mb-1">Disability</span><strong className="text-text-main">{selectedRecord.disability_status || 'None'}</strong></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
