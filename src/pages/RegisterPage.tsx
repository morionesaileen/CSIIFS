import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_number: identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/login?role=student");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
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
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted font-medium">
          Student Portal Registration
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
            {success && (
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-md text-sm text-center font-medium">
                Account created securely. Redirecting to login...
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-text-muted mb-2">
                Student Number
              </label>
              <div>
                <input
                  type="text"
                  required
                  disabled={success}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-border-color rounded-lg focus:outline-none focus:border-bu-blue focus:ring-1 focus:ring-bu-blue/50 sm:text-sm font-medium"
                  placeholder="Ex: 2024-01-00123"
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
                  disabled={success}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-border-color rounded-lg focus:outline-none focus:border-bu-blue focus:ring-1 focus:ring-bu-blue/50 sm:text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-muted mb-2">
                Confirm Password
              </label>
              <div>
                <input
                  type="password"
                  required
                  disabled={success}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-border-color rounded-lg focus:outline-none focus:border-bu-blue focus:ring-1 focus:ring-bu-blue/50 sm:text-sm font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-bu-blue hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bu-blue disabled:opacity-50 transition"
              >
                {loading || success ? "Processing..." : "Create Account"}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-text-muted">
                Already registered?{" "}
                <Link to="/login?role=student" className="font-semibold text-bu-blue hover:text-bu-orange transition">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
