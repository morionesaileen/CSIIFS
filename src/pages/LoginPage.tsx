import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") === "admin" ? "admin" : "student";
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotPwModal, setForgotPwModal] = useState(false);
  const [mockEmail, setMockEmail] = useState("");
  const [forgotPwMsg, setForgotPwMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = role === "admin" ? "/api/login/admin" : "/api/login/student";
    const payload = role === "admin" 
      ? { username: identifier, password } 
      : { student_number: identifier, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data.user, data.token);
      navigate(`/${role}-dashboard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPwMsg("Verifying...");
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mockEmail })
      });
      const data = await res.json();
      setForgotPwMsg(data.message);
    } catch(err) {
      setForgotPwMsg("An error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-light-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-text-main">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link to="/" className="flex items-center text-bu-blue hover:text-bu-orange mb-6 justify-center font-semibold transition">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <div className="w-16 h-16 bg-bu-orange rounded-full flex items-center justify-center font-bold text-white shadow-lg mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-text-main">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted font-medium">
          {role === "admin" ? "Admin System Login" : "Student Portal Login"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card-white py-8 px-4 border border-border-color shadow-[0_4px_6px_rgba(0,0,0,0.02)] sm:rounded-2xl sm:px-10 border-t-8 border-t-bu-orange">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center font-medium">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-text-muted mb-2">
                {role === "admin" ? "Username" : "Student Number"}
              </label>
              <div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-border-color rounded-lg focus:outline-none focus:border-bu-blue focus:ring-1 focus:ring-bu-blue/50 sm:text-sm font-medium"
                  placeholder={role === "admin" ? "admin01" : "2024-01-00123"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-muted mb-2">
                Password
              </label>
              <div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-border-color rounded-lg focus:outline-none focus:border-bu-blue focus:ring-1 focus:ring-bu-blue/50 sm:text-sm font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-bu-blue hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bu-blue disabled:opacity-50 transition"
              >
                {loading ? "Authenticating..." : "Sign in"}
              </button>
            </div>
            
            {role === "student" && (
              <div className="mt-4 text-center space-y-2">
                <button type="button" onClick={() => setForgotPwModal(true)} className="text-sm font-semibold text-text-muted hover:text-bu-orange transition">
                   Forgot Password?
                </button>
                <p className="text-sm text-text-muted">
                  Don't have an account?{" "}
                  <Link to="/register" className="font-semibold text-bu-blue hover:text-bu-orange transition">
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      {forgotPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                 <h2 className="font-bold text-bu-blue uppercase tracking-wide">Reset Password</h2>
                 <button onClick={() => { setForgotPwModal(false); setForgotPwMsg(""); setMockEmail(""); }} className="text-gray-400 hover:text-gray-700 font-bold">&times;</button>
              </div>
              <div className="p-6">
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {forgotPwMsg && <div className="bg-blue-50 text-bu-blue p-3 rounded text-sm font-semibold">{forgotPwMsg}</div>}
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Student Email</label>
                    <input type="email" required value={mockEmail} onChange={e=>setMockEmail(e.target.value)} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm" placeholder="user@student.bicol-u.edu.ph" />
                  </div>
                  <button type="submit" className="w-full bg-bu-blue text-white py-2 rounded font-bold hover:bg-[#002244] shadow-sm transition-colors">Send Reset Link</button>
                </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
