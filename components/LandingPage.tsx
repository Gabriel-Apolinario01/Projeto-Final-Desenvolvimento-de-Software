import React from 'react';
import { BrainCircuitIcon, ClipboardListIcon, LightBulbIcon, ChartBarIcon } from './icons/Icons';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-800 mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600">{children}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
    return (
        <div className="bg-slate-100 min-h-screen">
            <header className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full z-10">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <BrainCircuitIcon className="h-8 w-8 text-red-800" />
                        <span className="ml-3 text-xl font-bold text-slate-800">EstudaAI</span>
                    </div>
                    <div className="space-x-2">
                        <button onClick={onLogin} className="px-4 py-2 text-sm font-medium text-red-800 rounded-md hover:bg-red-50 transition-colors">
                            Login
                        </button>
                        <button onClick={onRegister} className="px-4 py-2 text-sm font-medium text-white bg-red-800 rounded-md hover:bg-red-900 transition-colors shadow-sm">
                            Cadastre-se Grátis
                        </button>
                    </div>
                </nav>
            </header>

            <main>
                <section className="pt-32 pb-20 text-center bg-white">
                    <div className="container mx-auto px-6">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                            Organize seus estudos com <span className="text-red-800">trilhas de aprendizado</span> inteligentes.
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">
                            O EstudaAI ajuda você a alcançar seus objetivos de estudo, seja com nossas trilhas prontas ou criando uma personalizada com o poder da Inteligência Artificial.
                        </p>
                        <div className="mt-8">
                            <button onClick={onRegister} className="px-8 py-3 text-lg font-semibold text-white bg-red-800 rounded-lg hover:bg-red-900 transition-transform transform hover:scale-105 shadow-lg">
                                Comece a aprender agora
                            </button>
                        </div>
                    </div>
                </section>

                <section id="features" className="py-20 bg-slate-100">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-slate-900">Como o EstudaAI pode te ajudar?</h2>
                            <p className="mt-4 text-slate-600">Ferramentas projetadas para otimizar seu aprendizado.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard icon={<ClipboardListIcon className="h-6 w-6" />} title="Trilhas Pré-definidas">
                                Comece rapidamente com planos de estudo criados por especialistas em diversas áreas, do desenvolvimento de software à ciência de dados.
                            </FeatureCard>
                            <FeatureCard icon={<LightBulbIcon className="h-6 w-6" />} title="Criação com IA">
                                Tem um objetivo específico? Descreva o que você quer aprender e nossa IA montará uma trilha de estudos completa e detalhada para você em segundos.
                            </FeatureCard>
                            <FeatureCard icon={<ChartBarIcon className="h-6 w-6" />} title="Acompanhe seu Progresso">
                                Marque as etapas concluídas e visualize seu avanço em cada trilha. Mantenha-se motivado vendo o quanto você já evoluiu.
                            </FeatureCard>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-white py-8">
                <div className="container mx-auto px-6 text-center text-slate-600">
                    <p>EstudaAI. Transformando a maneira de aprender.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;