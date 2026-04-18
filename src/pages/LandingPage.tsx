import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bu-blue flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-text-main">
      <div className="max-w-3xl w-full bg-card-white rounded-2xl border border-border-color shadow-[0_4px_6px_rgba(0,0,0,0.02)] p-6 sm:p-10 text-center border-t-8 border-t-bu-orange">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-bu-blue mb-4 leading-tight">
          Campus Student Identity Inventory
          <br className="hidden sm:block" />
          <span className="text-bu-orange block sm:inline sm:mt-0 mt-2">and Filtering System</span>
        </h1>
        <p className="text-text-muted mb-8 sm:mb-10 text-base sm:text-lg font-medium">
          Bicol University Polangui Campus
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-xl mx-auto">
          <Link
            to="/login?role=admin"
            className="flex flex-col items-center justify-center p-6 sm:p-8 bg-card-white rounded-2xl hover:bg-bu-blue hover:text-card-white transition-colors duration-300 group border border-border-color hover:border-bu-blue shadow-[0_4px_6px_rgba(0,0,0,0.02)]"
          >
            <ShieldCheck className="w-12 h-12 sm:w-16 sm:h-16 text-bu-orange mb-3 sm:mb-4 group-hover:text-card-white transition-colors" />
            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-text-main group-hover:text-card-white transition-colors">Admin</h2>
            <p className="text-xs sm:text-sm opacity-80 font-medium text-text-muted group-hover:text-card-white/80 transition-colors">Sign in to manage records</p>
          </Link>

          <Link
            to="/login?role=student"
            className="flex flex-col items-center justify-center p-6 sm:p-8 bg-card-white rounded-2xl hover:bg-bu-orange hover:text-card-white transition-colors duration-300 group border border-border-color hover:border-bu-orange shadow-[0_4px_6px_rgba(0,0,0,0.02)]"
          >
            <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-bu-blue mb-3 sm:mb-4 group-hover:text-card-white transition-colors" />
            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-text-main group-hover:text-card-white transition-colors">Student</h2>
            <p className="text-xs sm:text-sm opacity-80 font-medium text-text-muted group-hover:text-card-white/80 transition-colors">Sign in to fill out forms</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
