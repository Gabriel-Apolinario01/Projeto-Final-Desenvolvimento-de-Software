import React from 'react';
import { LearningPath } from '../types';
import { BookOpenIcon, ChevronRightIcon } from './icons/Icons';

interface PathCardProps {
  path: LearningPath | Omit<LearningPath, 'progress'>;
  onSelect: () => void;
  isPredefined?: boolean;
}

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
    const colorClasses = {
        'Iniciante': 'bg-green-100 text-green-800',
        'Intermediário': 'bg-yellow-100 text-yellow-800',
        'Avançado': 'bg-red-100 text-red-800',
    }[difficulty] || 'bg-slate-100 text-slate-800';

    return (
        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colorClasses}`}>
            {difficulty}
        </span>
    );
};

const PathCard: React.FC<PathCardProps> = ({ path, onSelect, isPredefined = false }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("PathCard clicado:", path.id, path.title);
    if (onSelect) {
      console.log("Chamando onSelect...");
      onSelect();
    } else {
      console.warn("onSelect não está definido!");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer group hover:shadow-red-800/20 hover:ring-2 hover:ring-red-800/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-800">{path.category}</span>
                    {path.difficulty && <DifficultyBadge difficulty={path.difficulty} />}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{path.title}</h3>
            </div>
            <BookOpenIcon className="h-8 w-8 text-slate-400 flex-shrink-0 ml-4" />
        </div>
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{path.description}</p>
        
        {/* Sempre mostra progresso se a trilha tiver progress definido */}
        {'progress' in path && (path as LearningPath).progress !== undefined && (
            <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>Progresso</span>
                    <span className="font-semibold">{(path as LearningPath).progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                        className="bg-red-800 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(path as LearningPath).progress}%` }}
                    ></div>
                </div>
            </div>
        )}
      </div>
       <div className="bg-white px-6 py-3 flex items-center justify-end text-sm font-medium text-red-800 group-hover:bg-slate-50 transition-colors mt-auto">
        {isPredefined ? 'Iniciar Trilha' : 'Continuar'}
        <ChevronRightIcon className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default PathCard;