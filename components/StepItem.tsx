
import React, { useState } from 'react';
import { Step } from '../types';
import { CheckIcon, ChevronDownIcon, LightBulbIcon } from './icons/Icons';

interface StepItemProps {
  step: Step;
  index: number;
  isCompleted: boolean;
  onToggle: () => void;
}

const ExternalLinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);


const StepItem: React.FC<StepItemProps> = ({ step, index, isCompleted, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`rounded-lg transition-all duration-300 border ${
        isCompleted ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-start p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center h-6 pt-0.5">
          <button
            onClick={(e) => {
                e.stopPropagation(); // Impede que o clique no botão abra/feche o acordeão
                onToggle();
            }}
            aria-label={isCompleted ? 'Marcar etapa como não concluída' : 'Marcar etapa como concluída'}
            className={`relative flex items-center justify-center h-6 w-6 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-red-800 ${
              isCompleted ? 'bg-green-500 border-green-400' : 'bg-white border-slate-300 hover:border-slate-400'
            }`}
          >
            {isCompleted && <CheckIcon className="h-4 w-4 text-white" />}
          </button>
        </div>
        <div className="ml-4 text-sm flex-1">
          <p className={`font-bold ${
              isCompleted ? 'text-green-800 line-through' : 'text-slate-800'
            }`}
          >
            {index + 1}. {step.title}
          </p>
          <p className={`mt-1 ${
              isCompleted ? 'text-slate-500' : 'text-slate-600'
          }`}>
            {step.description}
          </p>
        </div>
        {step.subSteps && step.subSteps.length > 0 && (
            <div className="ml-4 p-1">
                <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
        )}
      </div>
      {isOpen && (
          <div className="pb-4 px-4 ml-14 animate-fade-in-fast border-t border-slate-200 pt-4">
              {step.rationale && (
                  <div className="mb-4 flex items-start gap-2 p-3 bg-yellow-50 border-l-4 border-yellow-300 rounded-r-md">
                      <LightBulbIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-800">Por que isso é importante?</h4>
                        <p className="text-sm text-yellow-700">{step.rationale}</p>
                      </div>
                  </div>
              )}
              {step.subSteps && step.subSteps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Tópicos a abordar:</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-slate-600">
                        {step.subSteps.map((subStep, i) => (
                            <li key={i} className="flex items-start justify-between">
                                <span className="flex-1 pr-4">{subStep.topic}</span>
                                <a 
                                    href={subStep.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="ml-2 inline-flex items-center text-xs font-medium text-red-700 hover:text-red-900 transition-colors flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Sugestão
                                    <ExternalLinkIcon className="h-3 w-3 ml-1" />
                                </a>
                            </li>
                        ))}
                    </ul>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default StepItem;