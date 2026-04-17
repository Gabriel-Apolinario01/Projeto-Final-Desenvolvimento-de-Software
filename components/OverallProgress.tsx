import React from 'react';

interface OverallProgressProps {
  progress: number;
}

const OverallProgress: React.FC<OverallProgressProps> = ({ progress }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Seu Progresso Geral</h3>
      <div className="flex items-center justify-center sm:justify-start space-x-6">
        <div className="relative h-32 w-32">
          <svg className="h-full w-full" viewBox="0 0 120 120">
            <circle
              className="text-slate-200"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="60"
              cy="60"
            />
            <circle
              className="text-red-800"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="60"
              cy="60"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-red-800">{progress}%</span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <h4 className="text-xl font-bold text-slate-900">
            {progress < 10 && 'A jornada começa!'}
            {progress >= 10 && progress < 40 && 'Ótimo começo!'}
            {progress >= 40 && progress < 70 && 'Você está no caminho certo!'}
            {progress >= 70 && progress < 100 && 'Quase lá, continue assim!'}
            {progress === 100 && 'Parabéns por sua dedicação!'}
          </h4>
          <p className="text-slate-600 mt-1">Este é o seu progresso médio em todas as trilhas.</p>
        </div>
      </div>
    </div>
  );
};

export default OverallProgress;