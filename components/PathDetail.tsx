import React from 'react';
import { LearningPath } from '../types';
import StepItem from './StepItem';
import { ArrowLeftIcon, TrashIcon } from './icons/Icons';

interface PathDetailProps {
  path: LearningPath;
  onToggleStep: (pathId: string, stepIndex: number) => void;
  onBack: () => void;
  onDelete: (pathId: string) => void;
}

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
    const colorClasses = {
        'Iniciante': 'bg-green-100 text-green-800',
        'Intermediário': 'bg-yellow-100 text-yellow-800',
        'Avançado': 'bg-red-100 text-red-800',
    }[difficulty] || 'bg-slate-100 text-slate-800';

    return (
        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${colorClasses}`}>
            {difficulty}
        </span>
    );
};

const PathDetail: React.FC<PathDetailProps> = ({ path, onToggleStep, onBack, onDelete }) => {
  console.log("PathDetail renderizado com:", path);
  
  // Garante que path.steps existe e é um array
  const steps = path.steps || [];
  
  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir a trilha "${path.title}"?`)) {
      onDelete(path.id);
    }
  };
    
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-6 flex justify-between items-center">
            <button
                onClick={onBack}
                className="flex items-center text-sm font-medium text-red-800 hover:text-red-700 transition-colors"
            >
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
                Voltar
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center text-sm font-medium text-red-500 hover:text-red-400 transition-colors p-2 rounded-md hover:bg-red-500/10"
              aria-label="Excluir trilha"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
        </div>
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-4 mb-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-red-800">{path.category}</span>
            {path.difficulty && <DifficultyBadge difficulty={path.difficulty} />}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1 mb-3">{path.title}</h1>
        <p className="text-slate-600 mb-6">{path.description}</p>
        
        <div className="mb-8">
            <div className="flex justify-between text-sm text-slate-700 mb-2">
                <span>Progresso Total</span>
                <span className="font-bold">{path.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-red-700 to-red-900 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${path.progress}%` }}
                ></div>
            </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Etapas da Trilha</h2>
          {steps.length > 0 ? (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <StepItem
                  key={index}
                  step={step}
                  index={index}
                  isCompleted={step.completed || false}
                  onToggle={() => onToggleStep(path.id, index)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>Esta trilha ainda não possui etapas definidas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PathDetail;