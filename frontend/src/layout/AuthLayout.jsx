import React, { useState, useEffect } from 'react';
import bgLogin from '../assets/bg-login.jpg';
import { useGoogleLogin } from '@react-oauth/google';

export default function AuthLayout() {
    const [selectedRole, setSelectedRole] = useState(null);
    const [loginError, setLoginError] = useState(null);

    useEffect(() => {
        const handlePopState = () => {
            if (window.location.hash !== '#login') {
                setSelectedRole(null);
                setLoginError(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleRoleSelect = (role) => {
        window.location.hash = 'login';
        setSelectedRole(role);
        setLoginError(null);
    };



    const getApiBase = () => {
        const configuredUrl = import.meta.env.VITE_API_URL?.trim();
        const isBrowser = typeof window !== "undefined";
        const isLocalPage = isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);
        const pointsToLocalhost = configuredUrl && /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(configuredUrl);
      
        if (configuredUrl && (!pointsToLocalhost || isLocalPage)) {
          const normalizedUrl = configuredUrl.startsWith("/") || /^https?:\/\//i.test(configuredUrl)
            ? configuredUrl
            : `https://${configuredUrl}`;
      
          return normalizedUrl.replace(/\/$/, "");
        }
        return "/api";
    };
    
    const API_BASE = getApiBase();

    const sendTokenToBackend = async (accessToken) => {
        try {
            console.log("Mengirim token ke backend...");
            const response = await fetch(`${API_BASE}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: accessToken }),
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log("Login Berhasil di Backend:", data);
                
                localStorage.setItem('user', JSON.stringify(data.user));
                
                window.location.href = '/'; 
            } else {
                console.error("Backend menolak login:", data.message);
                setLoginError(data.message || "Something went wrong while signing in. Please try again.");
            }
        } catch (error) {
            console.error("Error jaringan saat menghubungi backend:", error);
            setLoginError("Something went wrong while signing in. Please try again.");
        }
    };

    const login = useGoogleLogin({
        onSuccess: tokenResponse => {
            console.log("Sukses dapat Token dari Google:", tokenResponse);
            setLoginError(null);
            sendTokenToBackend(tokenResponse.access_token);
        },
        onError: () => {
            console.log('Login Google Dibatalkan/Gagal');
            setLoginError("Something went wrong while signing in. Please try again.");
        },
    });

    return (
        <div className="h-screen overflow-hidden flex font-sans text-slate-800 bg-white">
            <div className="w-full lg:w-[40%] xl:w-[35%] h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                <div className="min-h-[110vh] flex flex-col p-6 sm:p-8 lg:p-12 relative overflow-hidden">
                    {selectedRole && (
                        <>
                            <div className="absolute top-16 left-8 w-24 h-24 rounded-full opacity-5 pointer-events-none transition-opacity duration-500" style={{ backgroundColor: '#5001b2' }}></div>
                            <div className="absolute bottom-24 right-6 w-36 h-36 rounded-full opacity-5 pointer-events-none transition-opacity duration-500" style={{ backgroundColor: '#5001b2' }}></div>
                        </>
                    )}

                    <div className="w-full max-w-sm mx-auto my-auto py-12 relative z-10">
                        {!selectedRole ? (
                            <div className="animate-fade-in w-full -translate-y-10">
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
                                        style={{ margin: 0, padding: 0 }}>
                                        <span className="text-black font-bold">Welcome to </span>
                                        <span className="text-purple-700 font-bold">Sistem Surat</span>
                                    </h1>
                                    <p 
                                        className="text-slate-500 text-[13px]" 
                                        style={{ margin: 0, padding: 0, marginTop: '4px' }}>
                                        Choose an account type to proceed
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleRoleSelect('Admin')}
                                        className="w-full flex items-center py-2 px-4 border border-slate-200 rounded-xl bg-white text-left group transition-all duration-300 ease-out hover:border-transparent hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-pink-500/20 active:scale-[0.98]">
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
                                        className="w-full flex items-center py-2 px-4 border border-slate-200 rounded-xl bg-white text-left group transition-all duration-300 ease-out hover:border-transparent hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 active:scale-[0.98]">
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
                            </div>

                        ) : selectedRole === 'Admin' ? (

                            <div className="animate-fade-in w-full max-w-sm mx-auto origin-top -translate-y-2">
                                <div className="flex justify-center mb-4">
                                    <img 
                                        src="/LOGO-KREATIVA-EDUCATION-NETWORK-01.png" 
                                        alt="Logo Kreativa" 
                                        className="h-20 sm:h-24 w-auto object-contain" 
                                    />
                                </div>

                                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 px-8 py-5 w-full max-w-sm relative z-10">
                                    
                                    <div className="mb-4">
                                        <p className="text-[10px] font-semibold tracking-wider uppercase mb-0.5" style={{ color: '#5001b2' }}>WELCOME BACK</p>
                                        <h2 className="font-bold text-slate-900" style={{ fontSize: '17px' }}>
                                            
                                            <span className="text-[#0F172A] font-bold">Welcome to </span>
                                            <span className="text-[#EAB308] font-bold">Admin</span>
                                            <span className="text-[#0F172A] font-bold"> Portal</span>
                                        </h2>
                                    </div>

                                    {loginError && (
                                        <div className="mb-4 py-3 px-4 bg-red-50 border border-red-200 rounded-xl text-center flex items-center justify-center">
                                            <p className="text-[11px] text-red-500 font-medium leading-relaxed">{loginError}</p>
                                        </div>
                                    )}

                                    <button onClick={() => login()} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-full hover:bg-[#F8FAFC] transition-colors disabled:opacity-70 disabled:cursor-not-allowed bg-white shadow-xs mb-4">
                                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        <span className="text-xs font-medium text-[#0F172A]">Sign in with Google</span>
                                    </button>

                                    <div className="mt-3 text-center">
                                        <p className="tracking-wider uppercase mb-1 text-slate-400" style={{ fontSize: '9px', fontWeight: 900 }}>IMPORTANT</p>
                                        <p className="text-[#94A3B8]" style={{ fontSize: '10px', fontWeight: 400 }}>
                                            This app is only accessible with a registered email.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        ) : (
                            
                            <div className="animate-fade-in w-full max-w-sm mx-auto origin-top -translate-y-2">
                                <div className="flex justify-center mb-4">
                                    <img 
                                        src="/LOGO-KREATIVA-EDUCATION-NETWORK-01.png" 
                                        alt="Logo Kreativa" 
                                        className="h-20 sm:h-24 w-auto object-contain" 
                                    />
                                </div>

                                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 px-8 py-5 w-full max-w-sm relative z-10">
                                    
                                    <div className="mb-4">
                                        <p className="text-[10px] font-semibold tracking-wider uppercase mb-0.5" style={{ color: '#5001b2' }}>WELCOME BACK</p>
                                        
                                        <h2 className="font-bold text-slate-900" style={{ fontSize: '17px' }}>
                                            <span className="text-[#0F172A] font-bold">Welcome to </span>
                                            <span className="text-[#EAB308] font-bold">{selectedRole}</span>
                                            <span className="text-[#0F172A] font-bold"> Portal</span>
                                        </h2>
                                    </div>

                                    {loginError && (
                                        <div className="mb-4 py-3 px-4 bg-red-50 border border-red-200 rounded-xl text-center flex items-center justify-center">
                                            <p className="text-[11px] text-red-500 font-medium leading-relaxed">{loginError}</p>
                                        </div>
                                    )}

                                    <button onClick={() => login()} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-full hover:bg-[#F8FAFC] transition-colors disabled:opacity-70 disabled:cursor-not-allowed bg-white shadow-xs mb-4">
                                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        <span className="text-xs font-medium text-[#0F172A]">Sign in with Google</span>
                                    </button>

                                    <div className="mt-3 text-center">
                                        <p className="tracking-wider uppercase mb-1 text-slate-400" style={{ fontSize: '9px', fontWeight: 900 }}>IMPORTANT</p>
                                        <p className="text-[#94A3B8]" style={{ fontSize: '10px', fontWeight: 400 }}>
                                            This app is only accessible with a registered email.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-5 w-full pb-4 relative z-10">
                            {!selectedRole && (
                                <div className="max-w-sm mx-auto mb-6 text-[11px] font-medium text-slate-400 leading-relaxed text-center sm:text-left">
                                    By signing in, you agree to our <a href="https://one.kreativaglobal.sch.id/privacy-policy" className="underline hover:text-slate-600">Privacy Policy</a>, <a href="https://one.kreativaglobal.sch.id/terms-of-service" className="underline hover:text-slate-600">Terms of Service</a>, <a href="https://one.kreativaglobal.sch.id/terms-of-use" className="underline hover:text-slate-600">Terms of Use</a> and <a href="https://one.kreativaglobal.sch.id/cookie-policy" className="underline hover:text-slate-600">Cookie Policy</a>.
                                </div>
                            )}
                            <div className="text-[10px] text-slate-400 text-center w-full">
                                © 2026 Copyright Kreativa Education Network. All rights reserved.
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            <div className="hidden lg:block lg:w-[60%] xl:w-[65%] relative bg-slate-900 h-full">
                
                <div className="absolute inset-0 bg-linear-to-r from-blue-950/95 via-blue-900/40 to-transparent z-10"></div>
                
                <div className="absolute inset-0 bg-linear-to-t from-blue-950/90 via-blue-900/20 to-transparent z-10"></div>
                
                <img
                    src={bgLogin}
                    alt="Gedung Kreativa"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                
                <div className="relative z-10 text-white p-12 flex flex-col h-full justify-end w-full">
                    <div className="max-w-md">
                        <p className="text-slate-100 text-sm font-medium drop-shadow-md">
                            <span className="animate-word" style={{ animationDelay: '0s' }}>A</span>
                            <span className="animate-word" style={{ animationDelay: '0.3s' }}>centralized</span>
                            <span className="animate-word" style={{ animationDelay: '0.6s' }}>system</span>
                            <span className="animate-word" style={{ animationDelay: '0.9s' }}>for</span>
                            <span className="animate-word" style={{ animationDelay: '1.2s' }}>managing</span>
                            <span className="animate-word" style={{ animationDelay: '1.5s' }}>school</span>
                            <span className="animate-word" style={{ animationDelay: '1.8s' }}>letters</span>
                            <span className="animate-word" style={{ animationDelay: '2.1s' }}>and</span>
                            <span className="animate-word" style={{ animationDelay: '2.6s' }}>correspondence.</span>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}