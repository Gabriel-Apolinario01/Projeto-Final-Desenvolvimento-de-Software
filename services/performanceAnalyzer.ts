/**
 * Serviço de Análise de Desempenho
 * 
 * Este módulo contém funções para analisar o desempenho do usuário
 * e gerar recomendações inteligentes baseadas no progresso e conquistas.
 * 
 * Funcionalidades:
 * - Analisa progresso nas trilhas
 * - Identifica áreas de interesse e domínio
 * - Calcula métricas de desempenho
 * - Determina quando gerar novas recomendações
 * 
 * Autor: Desenvolvedor do EstudaAI
 */

import { LearningPath, User } from '../types';

/**
 * Interface para métricas de desempenho do usuário.
 */
export interface PerformanceMetrics {
  /** Número total de trilhas do usuário */
  totalPaths: number;
  /** Número de trilhas concluídas (progress = 100%) */
  completedPaths: number;
  /** Número de trilhas em progresso (0% < progress < 100%) */
  inProgressPaths: number;
  /** Número de trilhas não iniciadas (progress = 0%) */
  notStartedPaths: number;
  /** Progresso médio de todas as trilhas */
  averageProgress: number;
  /** Categorias mais estudadas (com mais progresso) */
  topCategories: Array<{ category: string; progress: number }>;
  /** Níveis de dificuldade mais explorados */
  difficultyDistribution: {
    iniciante: number;
    intermediario: number;
    avancado: number;
  };
  /** Trilhas concluídas recentemente */
  recentlyCompleted: LearningPath[];
  /** Áreas de interesse baseadas no progresso */
  interestAreas: string[];
}

/**
 * Analisa o desempenho do usuário baseado em suas trilhas.
 * 
 * Calcula métricas como progresso médio, trilhas concluídas,
 * áreas de interesse e distribuição de dificuldades.
 * 
 * @param userPaths - Array de todas as trilhas do usuário
 * @returns Métricas de desempenho calculadas
 * 
 * @example
 * const metrics = analyzePerformance(userPaths);
 * console.log(metrics.averageProgress); // 65.5
 * console.log(metrics.completedPaths); // 3
 */
export const analyzePerformance = (userPaths: LearningPath[]): PerformanceMetrics => {
  // Conta trilhas por status
  const completedPaths = userPaths.filter(p => p.progress === 100);
  const inProgressPaths = userPaths.filter(p => p.progress > 0 && p.progress < 100);
  const notStartedPaths = userPaths.filter(p => p.progress === 0);

  // Calcula progresso médio
  const totalProgress = userPaths.reduce((sum, path) => sum + path.progress, 0);
  const averageProgress = userPaths.length > 0 
    ? Math.round(totalProgress / userPaths.length) 
    : 0;

  // Analisa categorias mais estudadas
  const categoryProgress: Record<string, number> = {};
  userPaths.forEach(path => {
    if (!categoryProgress[path.category]) {
      categoryProgress[path.category] = 0;
    }
    categoryProgress[path.category] += path.progress;
  });

  // Ordena categorias por progresso total
  const topCategories = Object.entries(categoryProgress)
    .map(([category, progress]) => ({
      category,
      progress: Math.round(progress / userPaths.filter(p => p.category === category).length)
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5); // Top 5 categorias

  // Analisa distribuição de dificuldades
  const difficultyDistribution = {
    iniciante: userPaths.filter(p => p.difficulty === 'Iniciante').length,
    intermediario: userPaths.filter(p => p.difficulty === 'Intermediário').length,
    avancado: userPaths.filter(p => p.difficulty === 'Avançado').length,
  };

  // Identifica áreas de interesse (categorias com mais progresso)
  const interestAreas = topCategories
    .filter(cat => cat.progress > 30) // Apenas áreas com progresso significativo
    .map(cat => cat.category);

  // Ordena trilhas concluídas por data (mais recentes primeiro)
  // Nota: Como não temos timestamp no frontend, usamos ordem inversa
  const recentlyCompleted = [...completedPaths].reverse().slice(0, 5);

  return {
    totalPaths: userPaths.length,
    completedPaths: completedPaths.length,
    inProgressPaths: inProgressPaths.length,
    notStartedPaths: notStartedPaths.length,
    averageProgress,
    topCategories,
    difficultyDistribution,
    recentlyCompleted,
    interestAreas,
  };
};

/**
 * Determina se novas recomendações devem ser geradas baseado no desempenho.
 * 
 * Gera novas recomendações quando:
 * - O usuário completa uma trilha
 * - O progresso médio aumenta significativamente
 * - O usuário tem poucas trilhas recomendadas não iniciadas
 * 
 * @param metrics - Métricas de desempenho do usuário
 * @param existingRecommendedPaths - Trilhas recomendadas existentes
 * @param lastRecommendationCheck - Timestamp da última verificação (opcional)
 * @returns true se novas recomendações devem ser geradas
 * 
 * @example
 * const shouldGenerate = shouldGenerateNewRecommendations(metrics, recommendedPaths);
 * if (shouldGenerate) {
 *   // Gerar novas recomendações
 * }
 */
export const shouldGenerateNewRecommendations = (
  metrics: PerformanceMetrics,
  existingRecommendedPaths: LearningPath[],
  lastRecommendationCheck?: Date
): boolean => {
  // Se não há trilhas recomendadas, sempre gera
  if (existingRecommendedPaths.length === 0) {
    return true;
  }

  // Conta trilhas recomendadas não iniciadas
  const notStartedRecommended = existingRecommendedPaths.filter(p => p.progress === 0);
  
  // Se há menos de 3 trilhas recomendadas não iniciadas, gera novas
  if (notStartedRecommended.length < 3) {
    return true;
  }

  // Se o usuário completou pelo menos uma trilha recentemente, gera novas
  if (metrics.completedPaths > 0 && metrics.recentlyCompleted.length > 0) {
    // Verifica se já passou tempo suficiente desde a última verificação
    if (lastRecommendationCheck) {
      const hoursSinceLastCheck = (Date.now() - lastRecommendationCheck.getTime()) / (1000 * 60 * 60);
      // Se passou mais de 24 horas desde a última verificação
      if (hoursSinceLastCheck >= 24) {
        return true;
      }
    } else {
      // Se não há registro de última verificação, gera
      return true;
    }
  }

  // Se o progresso médio é alto (usuário está ativo), gera novas recomendações
  if (metrics.averageProgress > 50 && metrics.inProgressPaths >= 2) {
    // Verifica se já passou tempo suficiente
    if (lastRecommendationCheck) {
      const hoursSinceLastCheck = (Date.now() - lastRecommendationCheck.getTime()) / (1000 * 60 * 60);
      // Se passou mais de 48 horas e o usuário está ativo
      if (hoursSinceLastCheck >= 48) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Gera um resumo de desempenho para ser usado na geração de recomendações.
 * 
 * Cria um texto descritivo do desempenho do usuário que pode ser
 * usado como contexto para a IA gerar recomendações personalizadas.
 * 
 * @param metrics - Métricas de desempenho
 * @param user - Dados do usuário
 * @returns String com resumo do desempenho
 * 
 * @example
 * const summary = generatePerformanceSummary(metrics, currentUser);
 * // "O usuário completou 3 trilhas, tem progresso médio de 65%..."
 */
export const generatePerformanceSummary = (
  metrics: PerformanceMetrics,
  user: User
): string => {
  const parts: string[] = [];

  parts.push(`Área de Formação: ${user.course || 'Não especificada'}`);
  parts.push(`Nível de Experiência: ${user.experienceLevel || 'Iniciante'}`);
  parts.push(`\nDesempenho:`);
  parts.push(`- Total de trilhas: ${metrics.totalPaths}`);
  parts.push(`- Trilhas concluídas: ${metrics.completedPaths}`);
  parts.push(`- Trilhas em progresso: ${metrics.inProgressPaths}`);
  parts.push(`- Progresso médio: ${metrics.averageProgress}%`);

  if (metrics.topCategories.length > 0) {
    parts.push(`\nÁreas mais estudadas:`);
    metrics.topCategories.forEach(cat => {
      parts.push(`- ${cat.category}: ${cat.progress}% de progresso médio`);
    });
  }

  if (metrics.interestAreas.length > 0) {
    parts.push(`\nÁreas de interesse identificadas: ${metrics.interestAreas.join(', ')}`);
  }

  if (metrics.completedPaths > 0) {
    parts.push(`\nTrilhas concluídas recentemente:`);
    metrics.recentlyCompleted.slice(0, 3).forEach(path => {
      parts.push(`- ${path.title} (${path.category}, ${path.difficulty})`);
    });
  }

  parts.push(`\nDistribuição de dificuldades:`);
  parts.push(`- Iniciante: ${metrics.difficultyDistribution.iniciante} trilhas`);
  parts.push(`- Intermediário: ${metrics.difficultyDistribution.intermediario} trilhas`);
  parts.push(`- Avançado: ${metrics.difficultyDistribution.avancado} trilhas`);

  return parts.join('\n');
};

