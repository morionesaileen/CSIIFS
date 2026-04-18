import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") === "admin" ? "admin" : "student";
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-light-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-text-main">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center text-bu-blue hover:text-bu-orange mb-6 justify-center font-semibold transition">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text-main">
          {role === "admin" ? "Admin System Login" : "Student Login"}
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted font-medium">
          Sign in to your CSIIFS account
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
              <div className="mt-4 text-center">
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
    </div>
  );
}
