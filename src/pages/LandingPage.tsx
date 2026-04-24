import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ShieldCheck, BookOpen } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bu-blue flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-text-main">
      <div className="max-w-4xl w-full bg-card-white rounded-2xl border border-border-color shadow-xl p-6 sm:p-10 text-center border-t-8 border-t-bu-orange">
        
        {/* Logo Container - Unaltered maintaining aspect ratio */}
        <div className="flex justify-center mb-6">
          <img 
            src="/images/bu-logo.png" 
            alt="Bicol University Logo" 
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain bg-transparent"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-bu-blue mb-2 leading-tight">
          Campus Student Identity Inventory
          <br className="hidden sm:block" />
          <span className="text-bu-orange block sm:inline mt-1">and Filtering System</span>
        </h1>
        <p className="text-text-muted text-sm sm:text-base mb-8 sm:mb-12 font-medium">
          Bicol University Polangui Campus
        </p>

        {/* Roles Selection */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 max-w-2xl mx-auto">
          {/* Admin Role */}
          <Link
            to="/login?role=admin"
            className="flex flex-col items-center justify-center p-6 sm:p-8 bg-card-white rounded-2xl hover:bg-bu-blue hover:text-card-white transition-all duration-300 group border border-border-color hover:border-bu-blue shadow-sm hover:shadow-md w-full sm:w-1/2"
          >
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-bu-orange mb-3 sm:mb-4 group-hover:text-card-white transition-colors" />
            <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-text-main group-hover:text-card-white transition-colors">Admin</h2>
            <p className="text-xs sm:text-sm opacity-80 text-text-muted group-hover:text-card-white/80 transition-colors">Sign in to manage records</p>
          </Link>

          {/* Student Role */}
          <Link
            to="/login?role=student"
            className="flex flex-col items-center justify-center p-6 sm:p-8 bg-card-white rounded-2xl hover:bg-bu-orange hover:text-card-white transition-all duration-300 group border border-border-color hover:border-bu-orange shadow-sm hover:shadow-md w-full sm:w-1/2"
          >
            <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-bu-blue mb-3 sm:mb-4 group-hover:text-card-white transition-colors" />
            <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-text-main group-hover:text-card-white transition-colors">Student</h2>
            <p className="text-xs sm:text-sm opacity-80 text-text-muted group-hover:text-card-white/80 transition-colors">Sign in to fill out forms</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
