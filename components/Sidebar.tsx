import React from 'react';
import { HomeIcon, SparklesIcon, CompassIcon, XIcon, BrainCircuitIcon } from './icons/Icons';

type View = 'dashboard' | 'path-detail' | 'create-path' | 'explore-paths';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-red-800 text-white'
        : 'text-slate-200 hover:bg-red-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-4 text-sm font-medium">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
  
  const handleNavigation = (view: View) => {
    setCurrentView(view);
    setIsOpen(false);
  }

  return (
    <>
        <div 
            className={`fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsOpen(false)}
        ></div>
        <aside className={`fixed lg:relative z-40 flex-shrink-0 w-64 bg-red-900 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-red-800">
                <div className="flex items-center">
                    <BrainCircuitIcon className="h-8 w-8 text-white" />
                    <span className="ml-3 text-xl font-bold text-white">EstudaAI</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden text-slate-200 hover:text-white"
                >
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <NavItem
                    icon={<HomeIcon className="h-5 w-5" />}
                    label="Meu Painel"
                    isActive={currentView === 'dashboard'}
                    onClick={() => handleNavigation('dashboard')}
                />
                <NavItem
                    icon={<CompassIcon className="h-5 w-5" />}
                    label="Explorar Trilhas"
                    isActive={currentView === 'explore-paths'}
                    onClick={() => handleNavigation('explore-paths')}
                />
                <NavItem
                    icon={<SparklesIcon className="h-5 w-5" />}
                    label="Criar com IA"
                    isActive={currentView === 'create-path'}
                    onClick={() => handleNavigation('create-path')}
                />
            </nav>
            <div className="p-4 mt-auto border-t border-red-800">
                <p className="text-xs text-slate-300 text-center">EstudaAI. Todos os direitos reservados.</p>
            </div>
        </aside>
    </>
  );
};

export default Sidebar;