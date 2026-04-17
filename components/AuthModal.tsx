import React, { useState } from 'react';
import { User } from '../types';
import Login from './Login';
import Register from './Register';
import { XIcon } from './icons/Icons';

interface AuthModalProps {
  initialView: 'login' | 'register';
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ initialView, onClose, onLoginSuccess }) => {
  const [view, setView] = useState(initialView);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleSuccessfulRegistration = () => {
    setRegistrationSuccess(true);
    setView('login');
  };
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
          onClose();
      }
  }

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast"
        onClick={handleBackdropClick}
    >
        <div className="relative w-full max-w-md mx-4">
             {view === 'login' ? (
                <Login 
                    onLoginSuccess={onLoginSuccess} 
                    onNavigateToRegister={() => setView('register')} 
                    registrationSuccess={registrationSuccess} 
                />
            ) : (
                <Register 
                    onSuccessfulRegistration={handleSuccessfulRegistration} 
                    onNavigateToLogin={() => setView('login')} 
                />
            )}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Fechar modal"
            >
                <XIcon className="h-6 w-6" />
            </button>
        </div>
    </div>
  );
};

export default AuthModal;
