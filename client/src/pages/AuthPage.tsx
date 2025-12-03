
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, signup, loading } = useAuth();
    const [isSignUpActive, setIsSignUpActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await login(loginEmail, loginPassword);
            navigate('/dashboard/tenant');
        } catch (err: any) {
            setError(err.message || 'Failed to login. Please check your credentials.');
            console.error(err);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await signup(signupEmail, signupPassword, signupName);
            navigate('/dashboard/tenant');
        } catch (err: any) {
            setError(err.message || 'Failed to create account. Please try again.');
            console.error(err);
        }
    };

    const renderButtonContent = (label: string) => {
        return loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
            label
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background-light dark:bg-background-dark p-4">
            {/* Desktop Version */}
            <div className={`hidden md:block auth-container bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg ${isSignUpActive ? 'right-panel-active' : ''}`}>

                    {/* Sign Up Form */}
                    <div className="form-container sign-up-container">
                        <form onSubmit={handleSignup} className="bg-surface-light dark:bg-surface-dark flex items-center justify-center flex-col px-10 h-full text-center">
                            <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-3">Create Account</h1>
                            <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">or use your email for registration</span>
                            <input className="w-full bg-gray-100 dark:bg-gray-800/50 border-none p-3 my-2 text-sm rounded text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary" type="text" placeholder="Name" required value={signupName} onChange={e => setSignupName(e.target.value)} />
                            <input className="w-full bg-gray-100 dark:bg-gray-800/50 border-none p-3 my-2 text-sm rounded text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary" type="email" placeholder="Email" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                            <input className="w-full bg-gray-100 dark:bg-gray-800/50 border-none p-3 my-2 text-sm rounded text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary" type="password" placeholder="Password" required value={signupPassword} onChange={e => setSignupPassword(e.target.value)} />
                            <button type="submit" disabled={loading} className="bg-primary text-white text-sm font-bold py-3 px-11 rounded-lg uppercase tracking-wider mt-4 hover:bg-primary/90 transition-transform flex items-center justify-center min-w-[120px] min-h-[42px]">
                                {renderButtonContent('Sign Up')}
                            </button>
                        </form>
                    </div>

                    {/* Login Form */}
                    <div className="form-container sign-in-container">
                        <form onSubmit={handleLogin} className="bg-surface-light dark:bg-surface-dark flex items-center justify-center flex-col px-10 h-full text-center">
                            <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-3">Login</h1>
                            <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">or use your email account</span>
                            <input className="w-full bg-gray-100 dark:bg-gray-800/50 border-none p-3 my-2 text-sm rounded text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary" type="email" placeholder="Email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                            <input className="w-full bg-gray-100 dark:bg-gray-800/50 border-none p-3 my-2 text-sm rounded text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary" type="password" placeholder="Password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                            {error && <p className="text-error text-xs mt-2">{error}</p>}
                            <button onClick={() => navigate('/')} className="text-xs text-text-light-secondary dark:text-text-dark-secondary my-3 hover:underline">Forgot your password?</button>
                            <button type="submit" disabled={loading} className="bg-primary text-white text-sm font-bold py-3 px-11 rounded-lg uppercase tracking-wider hover:bg-primary/90 transition-transform flex items-center justify-center min-w-[120px] min-h-[42px]">
                                 {renderButtonContent('Login')}
                            </button>
                        </form>
                    </div>

                    {/* Overlay for Toggling */}
                    <div className="overlay-container">
                        <div className="overlay bg-primary bg-gradient-to-r from-primary to-teal-500 text-white">
                            <div className="overlay-panel overlay-left">
                                <h1 className="text-2xl font-bold">Welcome Back!</h1>
                                <p className="text-sm font-light leading-snug tracking-wide my-5">Login to access all the features and personalized content waiting for you.</p>
                                <button id="signIn" onClick={() => { setIsSignUpActive(false); setError(null); }} className="bg-transparent border border-white text-white text-sm font-bold py-3 px-11 rounded-lg uppercase tracking-wider hover:bg-white/10 transition-transform">Login</button>
                            </div>
                            <div className="overlay-panel overlay-right">
                                <h1 className="text-2xl font-bold">Hello, Friend!</h1>
                                <p className="text-sm font-light leading-snug tracking-wide my-5">Create an account to unlock all the features and personalized content waiting for you.</p>
                                <button id="signUp" onClick={() => { setIsSignUpActive(true); setError(null); }} className="bg-transparent border border-white text-white text-sm font-bold py-3 px-11 rounded-lg uppercase tracking-wider hover:bg-white/10 transition-transform">Sign Up</button>
                        </div>
                    </div>
            </div>
            </div>

            {/* Mobile Version */}
            <div className="md:hidden w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => { setIsSignUpActive(false); setError(null); }}
                        className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                            !isSignUpActive
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                        }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => { setIsSignUpActive(true); setError(null); }}
                        className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                            isSignUpActive
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                        }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Forms Container */}
                <div className="p-6">
                    {/* Login Form */}
                    {!isSignUpActive && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="text-center mb-6">
                                <h1 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">Welcome Back</h1>
                                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Login to your account</p>
                            </div>
                            <div className="space-y-3">
                                <input
                                    className="w-full bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-sm rounded-lg text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    type="email"
                                    placeholder="Email"
                                    required
                                    value={loginEmail}
                                    onChange={e => setLoginEmail(e.target.value)}
                                />
                                <input
                                    className="w-full bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-sm rounded-lg text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    type="password"
                                    placeholder="Password"
                                    required
                                    value={loginPassword}
                                    onChange={e => setLoginPassword(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-error text-sm text-center">{error}</p>}
                            <button
                                onClick={() => navigate('/')}
                                className="text-sm text-text-light-secondary dark:text-text-dark-secondary hover:underline text-center w-full"
                            >
                                Forgot your password?
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center min-h-[44px] disabled:opacity-50"
                            >
                                {renderButtonContent('Login')}
                            </button>
                        </form>
                    )}

                    {/* Sign Up Form */}
                    {isSignUpActive && (
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="text-center mb-6">
                                <h1 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">Create Account</h1>
                                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Join StayEasy today</p>
                            </div>
                            <div className="space-y-3">
                                <input
                                    className="w-full bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-sm rounded-lg text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    type="text"
                                    placeholder="Full Name"
                                    required
                                    value={signupName}
                                    onChange={e => setSignupName(e.target.value)}
                                />
                                <input
                                    className="w-full bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-sm rounded-lg text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    type="email"
                                    placeholder="Email"
                                    required
                                    value={signupEmail}
                                    onChange={e => setSignupEmail(e.target.value)}
                                />
                                <input
                                    className="w-full bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-sm rounded-lg text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    type="password"
                                    placeholder="Password"
                                    required
                                    value={signupPassword}
                                    onChange={e => setSignupPassword(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-error text-sm text-center">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center min-h-[44px] disabled:opacity-50 mt-4"
                            >
                                {renderButtonContent('Sign Up')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;