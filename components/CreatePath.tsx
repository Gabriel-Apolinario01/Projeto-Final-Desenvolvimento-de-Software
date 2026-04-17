/**
 * Componente CreatePath - Criação de trilhas de aprendizagem com IA
 * 
 * Este componente permite que o usuário crie uma trilha de aprendizagem
 * personalizada usando a IA do Google Gemini. O usuário descreve o que
 * deseja aprender em um prompt, e a IA gera uma trilha completa e estruturada.
 * 
 * Funcionalidades:
 * - Formulário para descrição do aprendizado desejado
 * - Integração com Google Gemini AI
 * - Validação de prompt vazio
 * - Estado de loading durante geração
 * - Tratamento de erros
 * 
 * Autor: Desenvolvedor do EstudaAI
 */

import React, { useState } from 'react';
import { generateLearningPath } from '../services/geminiService';
import { LearningPath } from '../types';
import { SparklesIcon, LoaderIcon } from './icons/Icons';

/**
 * Props do componente CreatePath.
 */
interface CreatePathProps {
  /** Callback chamado quando uma trilha é gerada com sucesso, recebe a trilha gerada */
  onPathGenerated: (path: Omit<LearningPath, 'id' | 'progress'>) => void;
}

/**
 * Componente para criação de trilhas de aprendizagem usando IA.
 * 
 * Este componente exibe um formulário onde o usuário pode descrever
 * o que deseja aprender. A descrição é enviada para a IA Gemini que
 * gera uma trilha completa e estruturada.
 * 
 * @param props - Props do componente CreatePath
 * @returns JSX.Element - Formulário de criação de trilha
 */
const CreatePath: React.FC<CreatePathProps> = ({ onPathGenerated }) => {
  // Estado do prompt (descrição do que o usuário quer aprender)
  const [prompt, setPrompt] = useState('');
  
  // Estado de loading (indica se a IA está gerando a trilha)
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para mensagens de erro
  const [error, setError] = useState<string | null>(null);

  /**
   * Handler para submissão do formulário.
   * 
   * Valida se o prompt não está vazio, chama o serviço Gemini para gerar
   * a trilha e, em caso de sucesso, chama o callback onPathGenerated.
   * 
   * @param e - Evento de submit do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  // Previne recarregamento da página
    
    // Validação: prompt não pode estar vazio
    if (!prompt.trim()) {
      setError('Por favor, descreva o que você quer aprender.');
      return;
    }

    // Ativa estado de loading e limpa erros anteriores
    setIsLoading(true);
    setError(null);

    try {
      // Chama o serviço Gemini para gerar a trilha
      // Esta função pode levar alguns segundos enquanto a IA processa
      const generatedPath = await generateLearningPath(prompt);
      
      // Passa a trilha gerada para o componente pai (App.tsx)
      // que irá salvá-la no banco de dados
      onPathGenerated(generatedPath);
    } catch (err: any) {
      // Em caso de erro (API indisponível, prompt inválido, etc.)
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      // Desativa o loading independentemente de sucesso ou erro
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Cabeçalho explicativo */}
        <div className="text-center">
            <SparklesIcon className="mx-auto h-12 w-12 text-red-800" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Crie sua Trilha de Aprendizagem com IA
            </h1>
            <p className="mt-4 text-lg text-slate-600">
                Descreva o que você deseja aprender, e nossa IA criará um plano de estudos 
                personalizado para você. Seja específico para melhores resultados!
            </p>
        </div>
      
        {/* Formulário de criação */}
        <form onSubmit={handleSubmit} className="mt-10">
            {/* Textarea para descrição do aprendizado desejado */}
            <div className="relative">
                <textarea
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Seja específico! Ex: 'Quero me tornar um desenvolvedor backend com Node.js, incluindo APIs REST, bancos de dados SQL e NoSQL, e implantação com Docker.'"
                    disabled={isLoading}  // Desabilita durante o loading
                    className="w-full p-4 pr-10 bg-white border-2 border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-red-800 focus:border-red-800 transition disabled:opacity-50"
                />
            </div>

            {/* Mensagem de erro (se houver) */}
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            
            {/* Botão de submit */}
            <div className="mt-6">
                <button
                    type="submit"
                    disabled={isLoading}  // Desabilita durante o loading
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 focus:ring-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        // Estado de loading: mostra spinner e texto
                        <>
                            <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                            Gerando sua trilha...
                        </>
                    ) : (
                        // Estado normal: mostra ícone e texto
                       <>
                         <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                         Gerar Trilha Personalizada
                       </>
                    )}
                </button>
            </div>
        </form>
        
        {/* Aviso sobre possíveis erros da IA */}
        <div className="mt-8 text-center text-xs text-slate-500">
            <p>A IA pode cometer erros. Considere verificar informações importantes.</p>
        </div>
    </div>
  );
};

export default CreatePath;
