/**
 * App.tsx - Componente Principal da Aplicação EstudaAI
 * 
 * Este é o componente raiz da aplicação React. Gerencia o estado global,
 * autenticação, navegação entre views e comunicação com a API backend.
 * 
 * Funcionalidades principais:
 * - Gerenciamento de autenticação (login/logout)
 * - Carregamento de trilhas do usuário
 * - Navegação entre diferentes views (dashboard, detalhes, criação)
 * - Integração com API Django para persistência de dados
 * 
 * Autor: Desenvolvedor do EstudaAI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LearningPath, User } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PathDetail from './components/PathDetail';
import CreatePath from './components/CreatePath';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';

/**
 * Tipos de views disponíveis na aplicação.
 * Define todas as telas/páginas que o usuário pode navegar.
 */
type View = 'dashboard' | 'path-detail' | 'create-path' | 'explore-paths';

/**
 * Componente principal da aplicação EstudaAI.
 * 
 * Este componente gerencia todo o estado da aplicação e coordena
 * a renderização das diferentes views baseado no estado de autenticação.
 * 
 * @returns JSX.Element - Árvore de componentes React da aplicação
 */
const App: React.FC = () => {
  // Estado das trilhas do usuário
  const [userPaths, setUserPaths] = useState<LearningPath[]>([]);
  
  // Estado da view atual (qual tela está sendo exibida)
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Trilha selecionada para visualização detalhada
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  
  // Estado do sidebar (aberto/fechado) - importante para mobile
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Estado de autenticação
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Dados do usuário autenticado
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Estado do modal de autenticação (hidden, login, register)
  const [authModal, setAuthModal] = useState<'hidden' | 'login' | 'register'>('hidden');

  /**
   * Effect para verificar autenticação ao carregar a aplicação.
   * 
   * Ao carregar a página, verifica se existe um token JWT no localStorage.
   * Se existir, tenta obter o perfil do usuário para manter a sessão ativa.
   * Isso permite que o usuário permaneça logado mesmo após recarregar a página.
   */
  useEffect(() => {
    const checkAuth = async () => {
      // Verifica se há token de acesso salvo
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        try {
          // Importa dinamicamente o serviço de API
          const { authAPI } = await import('./services/api');
          
          // Obtém os dados do perfil do usuário
          const userData = await authAPI.getProfile();
          
          // Converte o formato da API para o formato esperado pelo frontend
          const user: User = {
            name: userData.first_name || userData.username,
            email: userData.email,
            course: userData.course,
            experienceLevel: userData.experience_level,
          };
          
          // Atualiza o estado com o usuário autenticado
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          // Se houver erro (token inválido/expirado), limpa o localStorage
          console.error("Failed to load user from API", error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    };
    
    // Executa a verificação ao montar o componente
    checkAuth();
  }, []);

  /**
   * Effect para carregar trilhas quando o usuário estiver autenticado.
   * 
   * Sempre que o usuário autenticado mudar, carrega todas as trilhas
   * do usuário do banco de dados através da API Django.
   */
  useEffect(() => {
    const loadPaths = async () => {
      // Só carrega se houver usuário autenticado e token válido
      if (currentUser && localStorage.getItem('accessToken')) {
        try {
          // Importa dinamicamente o serviço de API
          const { learningPathsAPI } = await import('./services/api');
          
          // Busca todas as trilhas do usuário
          const paths = await learningPathsAPI.getAll();
          
          // Converte o formato da API (snake_case) para o formato do frontend (camelCase)
          const formattedPaths: LearningPath[] = paths.map((path: any) => ({
            id: String(path.id),
            title: path.title,
            description: path.description,
            category: path.category,
            difficulty: path.difficulty,
            progress: path.progress,
            is_recommended: path.is_recommended || false, // Preserva flag de recomendação
            steps: path.steps.map((step: any) => ({
              title: step.title,
              description: step.description,
              rationale: step.rationale,
              completed: step.completed,
              subSteps: step.subSteps || [],
            })),
          }));
          
          // Atualiza o estado com as trilhas carregadas
          setUserPaths(formattedPaths);
        } catch (error) {
          // Em caso de erro, define trilhas vazias
          console.error("Failed to load paths from API", error);
          setUserPaths([]);
        }
      }
    };
    
    // Executa o carregamento sempre que o usuário mudar
    loadPaths();
  }, [currentUser]);
  
  /**
   * Handler para quando o login é bem-sucedido.
   * 
   * Atualiza o estado de autenticação e fecha o modal de autenticação.
   * 
   * @param user - Dados do usuário autenticado
   */
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setAuthModal('hidden');
  };

  /**
   * Handler para logout do usuário.
   * 
   * Remove os tokens do localStorage, limpa o estado do usuário
   * e redireciona para a landing page.
   */
  const handleLogout = async () => {
    // Importa e chama a função de logout da API
    const { authAPI } = await import('./services/api');
    authAPI.logout();
    
    // Limpa todo o estado da aplicação
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserPaths([]);
    setSelectedPath(null);
    setCurrentView('dashboard');
  };

  /**
   * Handler para selecionar uma trilha para visualização.
   * 
   * Quando o usuário clica em uma trilha, esta função atualiza
   * a trilha selecionada e muda a view para os detalhes.
   * 
   * @param path - Trilha selecionada pelo usuário
   */
  const handleSelectPath = async (path: LearningPath | Omit<LearningPath, 'progress'>) => {
    console.log("handleSelectPath chamado com:", path.id, path.title);
    
    // Verifica se a trilha já está na lista do usuário
    const existingPath = userPaths.find(p => p.id === path.id);
    
    if (existingPath) {
      // Se já existe, usa a versão da lista (com progresso atualizado e steps completos)
      console.log("Usando trilha existente da lista:", existingPath.id);
      setSelectedPath(existingPath);
      setCurrentView('path-detail');
      setSidebarOpen(false);
    } else {
      // Se não existe na lista, busca do banco de dados para garantir dados completos
      console.log("Buscando trilha do banco:", path.id);
      try {
        const { learningPathsAPI } = await import('./services/api');
        const fullPathData = await learningPathsAPI.getById(path.id);
        
        console.log("Trilha carregada do banco:", fullPathData);
        
        // Converte para o formato do frontend
        const fullPath: LearningPath = {
          id: String(fullPathData.id),
          title: fullPathData.title,
          description: fullPathData.description,
          category: fullPathData.category,
          difficulty: fullPathData.difficulty,
          progress: fullPathData.progress || 0,
          is_recommended: (fullPathData as any).is_recommended || false,
          steps: fullPathData.steps.map((step: any) => ({
            title: step.title,
            description: step.description,
            rationale: step.rationale,
            completed: step.completed || false,
            subSteps: step.subSteps || [],
          })),
        };
        
        console.log("Trilha formatada:", fullPath);
        setSelectedPath(fullPath);
        setCurrentView('path-detail');
        setSidebarOpen(false);
      } catch (error) {
        console.error("Failed to load path details", error);
        // Em caso de erro, tenta usar os dados que temos
        const fallbackPath: LearningPath = {
          ...path,
          progress: (path as LearningPath).progress ?? 0,
          steps: (path as any).steps || [],
        };
        console.log("Usando trilha fallback:", fallbackPath);
        setSelectedPath(fallbackPath);
        setCurrentView('path-detail');
        setSidebarOpen(false);
      }
    }
  };
  
  /**
   * Handler para adicionar uma trilha gerada pela IA.
   * 
   * Quando o usuário cria uma trilha usando a IA do Gemini,
   * esta função salva a trilha no banco de dados através da API
   * e atualiza a lista de trilhas do usuário.
   * 
   * @param path - Trilha gerada pela IA (sem id e progress ainda)
   */
  const handleAddGeneratedPath = async (path: Omit<LearningPath, 'id' | 'progress'>) => {
    try {
      // Importa o serviço de API
      const { learningPathsAPI } = await import('./services/api');
      
      // Cria a trilha no banco de dados
      // is_recommended será false para trilhas personalizadas criadas pelo usuário
      const createdPath = await learningPathsAPI.create({
        title: path.title,
        description: path.description,
        category: path.category,
        difficulty: path.difficulty,
        is_recommended: (path as any).is_recommended || false, // Preserva flag se existir
        // Converte as etapas para o formato esperado pela API
        steps_data: path.steps.map(step => ({
          title: step.title,
          description: step.description,
          rationale: step.rationale,
          subSteps: step.subSteps || [],
        })),
      });
      
      // Converte a resposta da API para o formato do frontend
      const newPath: LearningPath = {
        id: String(createdPath.id),
        title: createdPath.title,
        description: createdPath.description,
        category: createdPath.category,
        difficulty: createdPath.difficulty,
        progress: createdPath.progress,
        is_recommended: (createdPath as any).is_recommended || false,
        steps: createdPath.steps.map((step: any) => ({
          title: step.title,
          description: step.description,
          rationale: step.rationale,
          completed: step.completed,
          subSteps: step.subSteps || [],
        })),
      };
      
      // Adiciona a nova trilha à lista e seleciona para visualização
      setUserPaths([...userPaths, newPath]);
      setSelectedPath(newPath);
      setCurrentView('path-detail');
    } catch (error) {
      console.error("Failed to create path", error);
      // Em produção, você pode mostrar um toast de erro aqui
    }
  };

  /**
   * Handler para alternar o status de conclusão de uma etapa.
   * 
   * Quando o usuário marca/desmarca uma etapa como concluída,
   * esta função atualiza o status no banco de dados e recalcula
   * o progresso da trilha automaticamente.
   * 
   * @param pathId - ID da trilha
   * @param stepIndex - Índice da etapa a ser alterada
   */
  const handleToggleStep = async (pathId: string, stepIndex: number) => {
    try {
      // Importa o serviço de API
      const { learningPathsAPI } = await import('./services/api');
      
      // Chama a API para alternar o status da etapa
      const updatedPath = await learningPathsAPI.toggleStep(pathId, stepIndex);
      
      // Converte a resposta para o formato do frontend
      const formattedPath: LearningPath = {
        id: String(updatedPath.id),
        title: updatedPath.title,
        description: updatedPath.description,
        category: updatedPath.category,
        difficulty: updatedPath.difficulty,
        progress: updatedPath.progress, // Progresso já recalculado pela API
        is_recommended: (updatedPath as any).is_recommended || false,
        steps: updatedPath.steps.map((step: any) => ({
          title: step.title,
          description: step.description,
          rationale: step.rationale,
          completed: step.completed,
          subSteps: step.subSteps || [],
        })),
      };
      
      // Atualiza a trilha na lista
      const updatedPaths = userPaths.map(p => p.id === pathId ? formattedPath : p);
      setUserPaths(updatedPaths);
      
      // Se a trilha atual estiver selecionada, atualiza também
      if (selectedPath && selectedPath.id === pathId) {
        setSelectedPath(formattedPath);
      }
    } catch (error) {
      console.error("Failed to toggle step", error);
    }
  };

  /**
   * Handler para deletar uma trilha.
   * 
   * Remove a trilha do banco de dados e da lista local.
   * Se a trilha deletada estiver sendo visualizada, volta para o dashboard.
   * 
   * @param pathId - ID da trilha a ser deletada
   */
  const handleDeletePath = async (pathId: string) => {
    console.log("handleDeletePath chamado para ID:", pathId);
    
    try {
      // Importa o serviço de API
      const { learningPathsAPI } = await import('./services/api');
      
      // Deleta a trilha no banco de dados
      console.log("Deletando trilha no banco de dados...");
      await learningPathsAPI.delete(pathId);
      console.log("Trilha deletada com sucesso no banco");
      
      // Remove da lista local
      const updatedPaths = userPaths.filter(p => p.id !== pathId);
      console.log(`Removendo trilha da lista. Antes: ${userPaths.length}, Depois: ${updatedPaths.length}`);
      setUserPaths(updatedPaths);
      
      // Se a trilha deletada estava sendo visualizada, volta para dashboard
      if (selectedPath?.id === pathId) {
        console.log("Trilha deletada estava selecionada, voltando para dashboard");
        setSelectedPath(null);
        setCurrentView('dashboard');
      }
      
      console.log("Exclusão concluída com sucesso");
    } catch (error: any) {
      console.error("Erro ao deletar trilha:", error);
      alert(`Erro ao excluir trilha: ${error.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Handler para salvar trilhas recomendadas no banco de dados.
   * 
   * Salva múltiplas trilhas recomendadas permanentemente no banco.
   * Esta função é chamada apenas UMA VEZ quando as trilhas recomendadas
   * são geradas pela primeira vez para um usuário.
   * 
   * @param paths - Array de trilhas recomendadas a serem salvas
   */
  const handleSaveRecommendedPaths = async (paths: Omit<LearningPath, 'id' | 'progress'>[]) => {
    try {
      // Importa o serviço de API
      const { learningPathsAPI } = await import('./services/api');
      
      // Salva cada trilha recomendada no banco de dados
      const savedPaths = await Promise.all(
        paths.map(path => 
          learningPathsAPI.create({
            title: path.title,
            description: path.description,
            category: path.category,
            difficulty: path.difficulty,
            is_recommended: true, // Marca como trilha recomendada
            steps_data: path.steps.map(step => ({
              title: step.title,
              description: step.description,
              rationale: step.rationale,
              subSteps: step.subSteps || [],
            })),
          })
        )
      );
      
      // Converte e adiciona as trilhas salvas à lista do usuário
      const formattedPaths: LearningPath[] = savedPaths.map((createdPath: any) => ({
        id: String(createdPath.id),
        title: createdPath.title,
        description: createdPath.description,
        category: createdPath.category,
        difficulty: createdPath.difficulty,
        progress: createdPath.progress,
        is_recommended: true,
        steps: createdPath.steps.map((step: any) => ({
          title: step.title,
          description: step.description,
          rationale: step.rationale,
          completed: step.completed,
          subSteps: step.subSteps || [],
        })),
      }));
      
      // Atualiza a lista de trilhas do usuário
      setUserPaths(prev => [...prev, ...formattedPaths]);
    } catch (error) {
      console.error("Failed to save recommended paths", error);
      throw error; // Propaga o erro para que o Dashboard possa tratar
    }
  }
  
  /**
   * Calcula o progresso geral do usuário.
   * 
   * Soma o progresso de todas as trilhas e calcula a média.
   * 
   * @returns number - Progresso médio em porcentagem (0-100)
   */
  const totalProgress = userPaths.reduce((sum, path) => sum + path.progress, 0);
  const overallProgress = userPaths.length > 0 
    ? Math.round(totalProgress / userPaths.length) 
    : 0;

  /**
   * Renderiza o conteúdo baseado na view atual.
   * 
   * Esta função decide qual componente renderizar baseado no estado
   * currentView. É o sistema de roteamento simples da aplicação.
   * 
   * @returns JSX.Element - Componente correspondente à view atual
   */
  const renderContent = () => {
    switch (currentView) {
      case 'path-detail':
        // View de detalhes da trilha
        if (!selectedPath) {
          console.warn("selectedPath é null, voltando para dashboard");
          setCurrentView('dashboard');
          return null;
        }
        console.log("Renderizando PathDetail com:", selectedPath);
        return (
          <PathDetail
            path={selectedPath}
            onToggleStep={handleToggleStep}
            onBack={() => setCurrentView('dashboard')}
            onDelete={handleDeletePath}
          />
        );
        
      case 'create-path':
        // View de criação de trilha com IA
        return <CreatePath onPathGenerated={handleAddGeneratedPath} />;
        
      case 'explore-paths':
        // View de exploração de trilhas recomendadas
        return (
          <Dashboard
            userPaths={userPaths}
            currentUser={currentUser}
            onSelectPath={handleSelectPath}
            overallProgress={overallProgress}
            isExploreView={true}
            onSaveRecommendedPaths={handleSaveRecommendedPaths}
          />
        );
        
      case 'dashboard':
      default:
        // View principal - Dashboard com trilhas do usuário
        return (
          <Dashboard 
            userPaths={userPaths} 
            currentUser={currentUser}
            onSelectPath={handleSelectPath}
            onNavigateToExplore={() => setCurrentView('explore-paths')}
            overallProgress={overallProgress}
            onSaveRecommendedPaths={handleSaveRecommendedPaths}
          />
        );
    }
  };

  /**
   * Se o usuário não estiver autenticado, renderiza a landing page.
   * 
   * A landing page é a primeira tela que o usuário vê, com opções
   * para fazer login ou se cadastrar.
   */
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage 
          onLogin={() => setAuthModal('login')} 
          onRegister={() => setAuthModal('register')} 
        />
        {/* Modal de autenticação (login ou registro) */}
        {authModal !== 'hidden' && (
          <AuthModal
            initialView={authModal}
            onClose={() => setAuthModal('hidden')}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </>
    );
  }

  /**
   * Renderiza a aplicação completa para usuários autenticados.
   * 
   * Inclui sidebar, header e a área de conteúdo principal.
   */
  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar de navegação */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Área principal (header + conteúdo) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header com menu e informações do usuário */}
        <Header 
          onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        
        {/* Área de conteúdo principal */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
