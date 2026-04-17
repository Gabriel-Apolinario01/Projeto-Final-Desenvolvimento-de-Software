/**
 * Componente Dashboard - Painel principal com trilhas do usuário
 * 
 * Este componente exibe o dashboard principal da aplicação, mostrando:
 * - Progresso geral do usuário
 * - Trilhas recomendadas (geradas pela IA)
 * - Trilhas em progresso (com progresso > 0)
 * - Trilhas personalizadas criadas pelo usuário
 * 
 * Funcionalidades:
 * - Carrega trilhas do usuário da API
 * - Gera recomendações iniciais usando IA (apenas uma vez por usuário)
 * - Analisa desempenho do usuário automaticamente
 * - Gera novas recomendações baseadas no desempenho (automático e contínuo)
 * - Salva todas as trilhas permanentemente no banco de dados
 * - NUNCA deleta trilhas existentes, apenas adiciona novas recomendações
 * - Exibe progresso de cada trilha
 * - Estados de loading e erro
 * - Visualização de trilhas em cards
 * 
 * Sistema de Recomendações Automáticas:
 * - Monitora progresso, trilhas concluídas e áreas de interesse
 * - Gera novas recomendações quando:
 *   * Usuário completa trilhas
 *   * Há menos de 3 trilhas recomendadas não iniciadas
 *   * Progresso médio é alto e usuário está ativo
 *   * Passou tempo suficiente desde última verificação (24-48h)
 * - As novas recomendações são sempre ADICIONADAS, nunca substituem as antigas
 * 
 * Autor: Desenvolvedor do EstudaAI
 */

import React, { useState, useEffect, useRef } from 'react';
import { LearningPath, User } from '../types';
import PathCard from './PathCard';
import OverallProgress from './OverallProgress';
import { ArrowRightIcon, SparklesIcon, CompassIcon, BookOpenIcon } from './icons/Icons';
import { generateRecommendedPaths, generatePerformanceBasedRecommendations } from '../services/geminiService';
import { analyzePerformance, shouldGenerateNewRecommendations, generatePerformanceSummary } from '../services/performanceAnalyzer';

/**
 * Props do componente Dashboard.
 */
interface DashboardProps {
  /** Lista de trilhas do usuário */
  userPaths: LearningPath[];
  /** Callback quando uma trilha é selecionada para visualização */
  onSelectPath: (path: LearningPath | Omit<LearningPath, 'progress'>) => void;
  /** Dados do usuário autenticado */
  currentUser: User | null;
  /** Progresso geral do usuário (média de todas as trilhas) */
  overallProgress: number;
  /** Callback para navegar para a view de exploração (opcional) */
  onNavigateToExplore?: () => void;
  /** Indica se está na view de exploração (mostra recomendações) */
  isExploreView?: boolean;
  /** Callback para salvar trilhas recomendadas no banco de dados */
  onSaveRecommendedPaths?: (paths: Omit<LearningPath, 'id' | 'progress'>[]) => Promise<void>;
}

/**
 * Componente de skeleton (loading) para cards de trilhas.
 * 
 * Exibido enquanto as trilhas estão sendo carregadas, proporcionando
 * uma melhor experiência visual (evita layout shift).
 * 
 * @returns JSX.Element - Card de skeleton
 */
const PathCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
        <div className="p-6">
            {/* Skeleton do título */}
            <div className="h-4 bg-slate-200 rounded w-2/4 mb-2"></div>
            {/* Skeleton da categoria */}
            <div className="h-3 bg-slate-200 rounded w-1/4 mb-4"></div>
            {/* Skeleton da descrição */}
            <div className="h-6 bg-slate-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-full mt-3"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
        {/* Skeleton do footer */}
        <div className="bg-white px-6 py-3 h-[53px] mt-auto flex items-center justify-end">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        </div>
    </div>
);

/**
 * Componente Dashboard principal.
 * 
 * Gerencia a exibição de trilhas do usuário organizadas em 3 seções:
 * 1. Trilhas Recomendadas (is_recommended = true)
 * 2. Trilhas em Progresso (progress > 0)
 * 3. Trilhas Personalizadas (is_recommended = false)
 * 
 * As trilhas recomendadas são geradas apenas UMA VEZ por usuário e salvas
 * permanentemente no banco de dados.
 * 
 * @param props - Props do componente Dashboard
 * @returns JSX.Element - Dashboard com trilhas organizadas por seções
 */
const Dashboard: React.FC<DashboardProps> = ({ 
  userPaths, 
  onSelectPath, 
  currentUser, 
  overallProgress, 
  onNavigateToExplore, 
  isExploreView = false,
  onSaveRecommendedPaths
}) => {
  // Estado das trilhas recomendadas (geradas pela IA)
  // Pode ter progress se a trilha já foi iniciada
  const [recommendedPaths, setRecommendedPaths] = useState<(LearningPath | Omit<LearningPath, 'progress'>)[]>([]);
  
  // Estado de loading das recomendações
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado de erro ao carregar recomendações
  const [error, setError] = useState<string | null>(null);
  
  // Ref para rastrear se já tentamos gerar recomendações iniciais (evita loops infinitos)
  const hasTriedGenerating = useRef(false);
  
  // Ref para rastrear a última verificação de recomendações baseadas em desempenho
  const lastPerformanceCheck = useRef<Date | null>(null);
  
  // Ref para evitar múltiplas gerações simultâneas de recomendações baseadas em desempenho
  const isGeneratingPerformanceRecommendations = useRef(false);

  /**
   * Effect para carregar trilhas recomendadas do banco de dados.
   * 
   * Carrega trilhas recomendadas que já foram salvas no banco de dados.
   * Se não existirem trilhas recomendadas para o usuário, gera novas
   * usando a IA e salva permanentemente no banco.
   * 
   * IMPORTANTE: As trilhas recomendadas são geradas APENAS UMA VEZ por usuário.
   * Uma vez salvas no banco, serão sempre carregadas do banco, nunca regeneradas.
   */
  useEffect(() => {
    if (currentUser) {
      // Busca trilhas recomendadas do banco de dados (is_recommended = true)
      const recommendedFromDB = userPaths.filter(path => 
        (path as any).is_recommended === true
      );
      
      if (recommendedFromDB.length > 0) {
        // Se já existem trilhas recomendadas no banco, usa elas
        // Inclui progress para que seja exibido nos cards
        setRecommendedPaths(recommendedFromDB.map(path => ({
          id: path.id,
          title: path.title,
          description: path.description,
          category: path.category,
          difficulty: path.difficulty,
          progress: path.progress, // Inclui progress para exibição
          steps: path.steps,
        })));
        setIsLoading(false);
        hasTriedGenerating.current = false; // Reset para permitir nova tentativa se necessário
      } else if (onSaveRecommendedPaths && !hasTriedGenerating.current) {
        // Se não existem trilhas recomendadas e ainda não tentamos gerar, gera novas
        hasTriedGenerating.current = true; // Marca que tentamos gerar
        
        const fetchRecommendations = async () => {
          setIsLoading(true);
          setError(null);
          
          try {
            // Gera novas trilhas usando IA e salva permanentemente no banco de dados
            const paths = await generateRecommendedPaths(
              currentUser.course || 'Desenvolvimento', 
              currentUser.experienceLevel || 'Iniciante'
            );
            
            // Adiciona flag is_recommended = true para cada trilha
            const pathsWithFlag = paths.map((p) => ({
              ...p,
              is_recommended: true,
            }));
            
            // Salva as trilhas recomendadas permanentemente no banco de dados
            // Esta função também atualiza userPaths no App.tsx
            await onSaveRecommendedPaths(pathsWithFlag);
            
            // Atualiza o estado local (será atualizado quando userPaths mudar)
            setRecommendedPaths(pathsWithFlag);
          } catch (err: any) {
            // Em caso de erro (API indisponível, etc.), mostra mensagem
            console.error("AI Recommendation failed.", err);
            setError(`Não foi possível gerar recomendações personalizadas. Tente novamente mais tarde.`);
            setRecommendedPaths([]);
            hasTriedGenerating.current = false; // Permite tentar novamente em caso de erro
          } finally {
            setIsLoading(false);
          }
        };
        
        // Executa a geração de recomendações apenas uma vez
        fetchRecommendations();
      }
    }
  }, [currentUser, userPaths, onSaveRecommendedPaths]); // Re-executa quando userPaths muda

  /**
   * Effect para gerar recomendações automáticas baseadas no desempenho.
   * 
   * Monitora o desempenho do usuário e gera novas recomendações automaticamente
   * quando apropriado (ex: quando completa trilhas, quando tem poucas trilhas
   * recomendadas não iniciadas, etc.).
   * 
   * IMPORTANTE: As novas recomendações são ADICIONADAS às existentes,
   * nunca substituem ou deletam trilhas antigas.
   */
  useEffect(() => {
    // Só executa se houver usuário, trilhas e callback para salvar
    if (!currentUser || !onSaveRecommendedPaths || userPaths.length === 0) {
      return;
    }

    // Busca trilhas recomendadas existentes
    const existingRecommended = userPaths.filter(path => 
      (path as any).is_recommended === true
    );

    // Se não há trilhas recomendadas ainda, não gera baseado em desempenho
    // (a geração inicial já foi feita no useEffect anterior)
    if (existingRecommended.length === 0) {
      return;
    }

    // Analisa o desempenho do usuário
    const metrics = analyzePerformance(userPaths);

    // Verifica se deve gerar novas recomendações
    const shouldGenerate = shouldGenerateNewRecommendations(
      metrics,
      existingRecommended,
      lastPerformanceCheck.current || undefined
    );

    // Se deve gerar e não está gerando já, gera novas recomendações
    if (shouldGenerate && !isGeneratingPerformanceRecommendations.current) {
      isGeneratingPerformanceRecommendations.current = true;
      lastPerformanceCheck.current = new Date();

      const generateNewRecommendations = async () => {
        try {
          setIsLoading(true);
          setError(null);

          // Gera resumo do desempenho
          const performanceSummary = generatePerformanceSummary(metrics, currentUser);

          // Gera novas recomendações baseadas no desempenho
          const newPaths = await generatePerformanceBasedRecommendations(
            currentUser.course || 'Desenvolvimento',
            currentUser.experienceLevel || 'Iniciante',
            performanceSummary
          );

          // Adiciona flag is_recommended = true para cada nova trilha
          const pathsWithFlag = newPaths.map((p) => ({
            ...p,
            is_recommended: true,
          }));

          // Salva as novas trilhas recomendadas no banco de dados
          // IMPORTANTE: Isso ADICIONA às trilhas existentes, não substitui
          await onSaveRecommendedPaths(pathsWithFlag);

          console.log(`✅ ${pathsWithFlag.length} novas trilhas recomendadas geradas baseadas no desempenho!`);
        } catch (err: any) {
          // Em caso de erro, apenas loga (não mostra erro ao usuário para não ser intrusivo)
          console.error("Erro ao gerar recomendações baseadas em desempenho:", err);
          // Não define erro aqui para não interferir na experiência do usuário
        } finally {
          setIsLoading(false);
          isGeneratingPerformanceRecommendations.current = false;
        }
      };

      // Executa a geração de novas recomendações
      generateNewRecommendations();
    }
  }, [currentUser, userPaths, onSaveRecommendedPaths]); // Re-executa quando userPaths muda (incluindo quando progresso muda)

  /**
   * Filtra trilhas por categoria para exibição organizada.
   * 
   * Organiza as trilhas em 3 grupos:
   * - Recomendadas: is_recommended = true
   * - Em Progresso: progress > 0 (qualquer trilha com progresso)
   * - Personalizadas: is_recommended = false (trilhas criadas pelo usuário)
   */
  
  // Trilhas em progresso (qualquer trilha com progresso > 0 e < 100)
  // Inclui tanto trilhas recomendadas quanto personalizadas que estão sendo feitas
  const inProgressPaths = userPaths.filter(path => 
    path.progress > 0 && path.progress < 100
  );
  
  // Trilhas concluídas (progress = 100) - podem aparecer em "Trilhas em Progresso" ou seção separada
  const completedPaths = userPaths.filter(path => path.progress === 100);
  
  // Trilhas recomendadas que ainda não foram iniciadas (progress = 0)
  // Apenas trilhas recomendadas que não foram iniciadas aparecem aqui
  const notStartedRecommended = userPaths.filter(path => 
    (path as any).is_recommended === true && path.progress === 0
  );
  
  // Trilhas personalizadas (criadas pelo usuário, não recomendadas)
  // Inclui todas as trilhas personalizadas, independente do progresso
  const personalPaths = userPaths.filter(path => 
    (path as any).is_recommended === false
  );

  /**
   * Renderiza uma seção de trilhas com título e grid de cards.
   * 
   * @param title - Título da seção
   * @param paths - Array de trilhas a serem exibidas
   * @param icon - Ícone React para o título (opcional)
   * @param emptyMessage - Mensagem quando não há trilhas (opcional)
   */
  const renderPathSection = (
    title: string,
    paths: LearningPath[],
    icon?: React.ReactNode,
    emptyMessage?: string
  ) => {
    if (paths.length === 0 && !emptyMessage) {
      return null;
    }

    return (
      <div className="mb-12">
        <div className="flex items-center mb-6">
          {icon && <span className="mr-2">{icon}</span>}
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        </div>
        
        {paths.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map((path) => (
              <PathCard
                key={path.id}
                path={path}
                onSelect={async () => {
                  console.log("Dashboard: onSelectPath chamado para:", path.id);
                  await onSelectPath(path);
                }}
              />
            ))}
          </div>
        ) : (
          emptyMessage && (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-slate-600">{emptyMessage}</p>
            </div>
          )
        )}
      </div>
    );
  };

  // Se estiver na view de exploração, mostra apenas recomendações
  if (isExploreView) {
    const pathsToDisplay = Array.from(
      new Map([...recommendedPaths, ...userPaths].map(p => [p.id, p])).values()
    );

    return (
      <div className="animate-fade-in">
        <div className="flex items-center mb-6">
          <CompassIcon className="h-6 w-6 text-red-800 mr-2" />
          <h2 className="text-2xl font-bold text-slate-900">Explorar Trilhas</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <PathCardSkeleton key={i} />
            ))}
          </div>
        ) : pathsToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pathsToDisplay.map((path) => (
              <PathCard
                key={path.id}
                path={path}
                onSelect={async () => {
                  console.log("Dashboard: onSelectPath chamado para:", path.id);
                  await onSelectPath(path);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-slate-600">
              Nenhuma trilha recomendada disponível no momento.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Dashboard principal com 3 seções
  return (
    <div className="animate-fade-in">
      {/* Seção de progresso geral */}
      <div className="mb-8">
        <OverallProgress progress={overallProgress} />
      </div>

      {/* Mensagem de erro (se houver) */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Seção 1: Trilhas em Progresso */}
      {renderPathSection(
        'Trilhas em Progresso',
        [...inProgressPaths, ...completedPaths], // Inclui trilhas em progresso e concluídas
        <BookOpenIcon className="h-6 w-6 text-red-800" />,
        'Você ainda não iniciou nenhuma trilha. Comece uma trilha recomendada ou crie uma personalizada!'
      )}

      {/* Seção 2: Trilhas Recomendadas */}
      {isLoading ? (
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <SparklesIcon className="h-6 w-6 text-red-800 mr-2" />
            <h2 className="text-2xl font-bold text-slate-900">Trilhas Recomendadas para Você</h2>
            {onNavigateToExplore && (
              <button
                onClick={onNavigateToExplore}
                className="ml-auto flex items-center text-red-800 hover:text-red-900 font-medium transition-colors"
              >
                Explorar todas
                <ArrowRightIcon className="ml-1 h-5 w-5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <PathCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : (
        renderPathSection(
          'Trilhas Recomendadas para Você',
          notStartedRecommended,
          <SparklesIcon className="h-6 w-6 text-red-800" />,
          'Ainda não há trilhas recomendadas. Complete seu perfil para receber recomendações personalizadas!'
        )
      )}

      {/* Botão para explorar todas as recomendações */}
      {notStartedRecommended.length > 0 && onNavigateToExplore && (
        <div className="mb-12 flex justify-end">
          <button
            onClick={onNavigateToExplore}
            className="flex items-center text-red-800 hover:text-red-900 font-medium transition-colors"
          >
            Explorar todas as recomendações
            <ArrowRightIcon className="ml-1 h-5 w-5" />
          </button>
        </div>
      )}

      {/* Seção 3: Trilhas Personalizadas */}
      {renderPathSection(
        'Minhas Trilhas Personalizadas',
        personalPaths,
        <BookOpenIcon className="h-6 w-6 text-red-800" />,
        'Você ainda não criou nenhuma trilha personalizada. Crie uma trilha usando IA!'
      )}
    </div>
  );
};

export default Dashboard;
