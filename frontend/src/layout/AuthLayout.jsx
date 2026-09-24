import React, { useState, useEffect } from 'react';
import bgLogin from '../assets/bg-login.jpg';

export default function AuthLayout() {
    const [selectedRole, setSelectedRole] = useState(null);

    useEffect(() => {
    const handlePopState = () => {
        if (window.location.hash !== '#login') {
        setSelectedRole(null);
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleRoleSelect = (role) => {
    window.location.hash = 'login';
    setSelectedRole(role);
};

    const handleBackToRoles = () => {
    window.history.back();
};

    return (
        <div className="h-screen overflow-hidden flex font-sans text-slate-800 bg-white">
            <div className="w-full lg:w-[40%] xl:w-[35%] h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none flex flex-col justify-between p-6 sm:p-8 lg:p-12 relative">
        
        {selectedRole && (
            <div className="absolute top-6 right-6 lg:top-8 lg:right-8">
            <button className="px-3 py-1.5 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition">
                ID
            </button>
        </div>
        )}

        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto mt-8 lg:mt-0">
        {!selectedRole ? (
            
            <div className="animate-fade-in w-full">
                <div className="flex justify-center mb-4">
                <img 
                    src="/LOGO-KREATIVA-EDUCATION-NETWORK-01.png" 
                    alt="Logo Kreativa" 
                    className="h-20 sm:h-24 w-auto object-contain" 
                />
            </div>

            <div className="text-center mb-8 block">
                <h1 
                    className="text-2xl sm:text-3xl font-bold leading-none" 
                    style={{ margin: 0, padding: 0 }}
                >
                <span className="text-black font-bold">Welcome to </span>
                <span className="text-purple-700 font-bold">Sistem Surat</span>
                </h1>
                
                <p 
                    className="text-slate-500 text-[13px]" 
                    style={{ margin: 0, padding: 0, marginTop: '4px' }}
                >
                    Choose an account type to proceed
                </p>
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => handleRoleSelect('Admin')}
                    className="w-full flex items-center py-2 px-4 border border-slate-200 rounded-xl bg-white text-left group transition-all duration-300 ease-out hover:border-transparent hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-pink-500/20 active:scale-[0.98]"
                >
                <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 mr-4 transition-colors duration-300 group-hover:bg-pink-600 group-hover:text-white">
                    A
                </div>
                    <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-xs">Admin Account</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">For system administrators</p>
                </div>
                    <span className="text-slate-300 text-sm ml-2 transition-all duration-300 group-hover:text-slate-700 group-hover:translate-x-1">→</span>
                </button>

                <button
                    onClick={() => handleRoleSelect('Staff')}
                    className="w-full flex items-center py-2 px-4 border border-slate-200 rounded-xl bg-white text-left group transition-all duration-300 ease-out hover:border-transparent hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 active:scale-[0.98]"
                >
                <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 mr-4 transition-colors duration-300 group-hover:bg-orange-500 group-hover:text-white">
                    S
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-xs">Staff Account</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">For educators and staff</p>
                </div>
                    <span className="text-slate-300 text-sm ml-2 transition-all duration-300 group-hover:text-slate-700 group-hover:translate-x-1">→</span>
                </button>
            </div>

            <div className="mt-8 text-[11px] font-medium text-slate-400 leading-relaxed text-center sm:text-left">
                By signing in, you agree to our <a href="https://one.kreativaglobal.sch.id/privacy-policy" className="underline hover:text-slate-600">Privacy Policy</a>, <a href="https://one.kreativaglobal.sch.id/terms-of-service" className="underline hover:text-slate-600">Terms of Service</a>, <a href="https://one.kreativaglobal.sch.id/terms-of-use" className="underline hover:text-slate-600">Terms of Use</a> and <a href="https://one.kreativaglobal.sch.id/cookie-policy" className="underline hover:text-slate-600">Cookie Policy</a>.
            </div>
        </div>

        ) : selectedRole === 'Admin' ? (

            <div className="animate-fade-in w-full max-w-[320px] mx-auto">
                <div className="flex justify-center mb-6">
                <img 
                    src="/LOGO-KREATIVA-EDUCATION-NETWORK-01.png" 
                    alt="Logo Kreativa" 
                    className="h-14 sm:h-16 w-auto object-contain" 
                />
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                <p className="text-[10px] font-bold text-blue-700 tracking-wider mb-1.5 text-left uppercase">
                    WELCOME BACK
                </p>
                <h1 
                    className="text-[16px] sm:text-[18px] font-bold mb-5 text-left leading-snug"
                    style={{ color: '#0f172a' }} 
                >
                    Welcome to Admin Portal
                </h1>

                <button className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-slate-300 rounded-full hover:bg-slate-50 transition mb-5 bg-white">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="font-medium text-slate-700 text-[13px]">Sign in with Google</span>
                </button>

                <div className="border-t border-slate-100 pt-4 text-left">
                    <p className="text-[9px] font-bold text-slate-400 mb-1 tracking-wider uppercase">IMPORTANT</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                    This app is only accessible with a registered email.
                    </p>
                </div>
            </div>
        </div>

        ) : (
            
            <div className="animate-fade-in w-full">
                <p className="text-[11px] font-bold text-blue-600 tracking-wider mb-2 text-center sm:text-left uppercase">
                WELCOME BACK
                </p>
                <h1 className="text-2xl font-bold text-blue-950 mb-8 text-center sm:text-left">
                Welcome to {selectedRole} Portal
                </h1>

            <button className="w-full flex items-center justify-center gap-2.5 py-3 px-4 border border-slate-300 rounded-full hover:bg-slate-50 transition mb-8 bg-white">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-medium text-slate-700 text-sm">Sign in with Google</span>
            </button>

            <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">IMPORTANT</p>
                <p className="text-[11px] text-slate-500">
                    This app is only accessible with a registered email.
                </p>
            </div>

            <div className="mt-6 text-center sm:text-left">
                <button
                    onClick={handleBackToRoles}
                    className="text-[11px] text-blue-600 hover:underline"
                >
                ← Ganti Tipe Akun
                </button>
            </div>
        </div>
    )}
        </div>

        <div className="text-[10px] text-slate-400 mt-6 text-center">
        © 2026 Copyright Kreativa Education Network. All rights reserved.
        </div>
    </div>

    <div className="hidden lg:block lg:w-[60%] xl:w-[65%] relative bg-slate-900 h-full">
        <div className="absolute inset-0 bg-linear-to-t from-blue-950/90 via-blue-900/20 to-transparent z-10"></div>
        
        <img
            src={bgLogin}
            alt="Gedung Kreativa"
            className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="absolute bottom-16 left-16 right-16 z-20 text-white">
            <h2 className="text-2xl lg:text-3xl font-medium mb-4 max-w-xl leading-snug">
            Collaborative learning platform for students, teachers, and families.
            </h2>
        </div>
    </div>
    </div>
);
}