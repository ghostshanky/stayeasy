
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../api';

interface AuthPageProps {
    setIsAuthenticated: (isAuth: boolean) => void;
    initialMode: 'login' | 'signup';
}

const AuthPage: React.FC<AuthPageProps> = ({ setIsAuthenticated, initialMode }) => {
    const navigate = useNavigate();
    const [isSignUpActive, setIsSignUpActive] = useState(initialMode === 'signup');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');


    useEffect(() => {
        setIsSignUpActive(initialMode === 'signup');
    }, [initialMode]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await loginUser(loginEmail, loginPassword);
            setIsAuthenticated(true);
            navigate('/dashboard/tenant');
        } catch (err) {
            setError('Failed to login. Please check your credentials.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await registerUser(signupName, signupEmail, signupPassword);
            setIsAuthenticated(true);
            navigate('/dashboard/tenant');
        } catch (err) {
            setError('Failed to create account. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
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
            <div className={`auth-container bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg ${isSignUpActive ? 'right-panel-active' : ''}`}>
                
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
                        {error && <p className="text-error text-xs mt-2">{error}</p>
}
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
        </div>
    );
};

export default AuthPage;