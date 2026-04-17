/**
 * Serviço de API - Cliente para comunicação com o backend Django
 * 
 * Este módulo contém todas as funções para comunicação com a API REST do backend.
 * Gerencia autenticação, requisições autenticadas, refresh de tokens e todas
 * as operações CRUD de trilhas de aprendizagem.
 * 
 * Autor: Desenvolvedor do EstudaAI
 * 
 * @module services/api
 */

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Função auxiliar para fazer requisições HTTP autenticadas à API.
 * 
 * Esta função centraliza a lógica de requisições, adicionando automaticamente
 * o token JWT no header Authorization. Se o token expirar (401), tenta
 * renovar automaticamente usando o refresh token.
 * 
 * @param endpoint - Endpoint da API (ex: '/learning-paths/')
 * @param options - Opções da requisição fetch (method, body, headers, etc.)
 * @returns Promise com os dados JSON da resposta
 * @throws Error se a requisição falhar
 * 
 * @example
 * const paths = await apiRequest('/learning-paths/');
 * const newPath = await apiRequest('/learning-paths/', {
 *   method: 'POST',
 *   body: JSON.stringify(pathData)
 * });
 */
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  // Obtém o token de acesso do localStorage
  const token = localStorage.getItem('accessToken');
  
  // Configura os headers da requisição
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Se houver token, adiciona no header Authorization
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Faz a requisição inicial
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // Se receber 401 (Unauthorized), tenta renovar o token
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Tenta a requisição novamente com o novo token
      headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }
  
  // DELETE pode retornar 204 (No Content) sem corpo - sucesso
  if (response.status === 204) {
    return null;
  }
  
  // Se a resposta não for bem-sucedida, lança erro
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro na requisição' }));
    throw new Error(error.detail || error.message || 'Erro na requisição');
  }
  
  // Tenta retornar os dados JSON da resposta
  // Se não houver conteúdo (status 204 já tratado acima), retorna null
  try {
    const text = await response.text();
    if (!text) {
      return null;
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Renova o access token usando o refresh token.
 * 
 * Quando o access token expira, esta função é chamada para obter um novo
 * token usando o refresh token armazenado no localStorage.
 * 
 * @returns Promise<boolean> - true se o token foi renovado com sucesso, false caso contrário
 * 
 * @example
 * const refreshed = await refreshToken();
 * if (refreshed) {
 *   console.log('Token renovado com sucesso!');
 * }
 */
async function refreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  
  // Se não houver refresh token, não pode renovar
  if (!refreshToken) return false;
  
  try {
    // Faz requisição para renovar o token
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      // Salva o novo access token
      localStorage.setItem('accessToken', data.access);
      return true;
    }
  } catch (error) {
    console.error('Erro ao renovar token:', error);
  }
  
  return false;
}

/**
 * API de Autenticação
 * 
 * Contém todas as funções relacionadas à autenticação de usuários:
 * registro, login, logout e obtenção de perfil.
 */
export const authAPI = {
  /**
   * Registra um novo usuário no sistema.
   * 
   * Após o cadastro bem-sucedido, salva os tokens JWT no localStorage
   * para autenticação automática.
   * 
   * @param userData - Dados do usuário para cadastro
   * @param userData.username - Nome de usuário
   * @param userData.email - Email único do usuário
   * @param userData.password - Senha (mínimo 6 caracteres)
   * @param userData.first_name - Primeiro nome
   * @param userData.course - Área de formação
   * @param userData.experience_level - Nível de experiência
   * @returns Promise com dados do usuário criado
   * @throws Error se o cadastro falhar (email duplicado, dados inválidos, etc.)
   * 
   * @example
   * try {
   *   const user = await authAPI.register({
   *     username: 'joao',
   *     email: 'joao@email.com',
   *     password: 'senha123',
   *     first_name: 'João',
   *     course: 'Desenvolvimento',
   *     experience_level: 'Iniciante'
   *   });
   *   console.log('Usuário criado:', user);
   * } catch (error) {
   *   console.error('Erro no cadastro:', error.message);
   * }
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    course: string;
    experience_level: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erro no cadastro' }));
      throw new Error(error.detail || error.message || 'Erro no cadastro');
    }
    
    const data = await response.json();
    
    // Salva os tokens JWT no localStorage para autenticação automática
    localStorage.setItem('accessToken', data.tokens.access);
    localStorage.setItem('refreshToken', data.tokens.refresh);
    
    return data.user;
  },
  
  /**
   * Autentica um usuário e retorna os tokens JWT.
   * 
   * O login pode ser feito com email ou username. Após autenticação
   * bem-sucedida, salva os tokens no localStorage.
   * 
   * @param email - Email ou username do usuário
   * @param password - Senha do usuário
   * @returns Promise com dados do usuário autenticado
   * @throws Error se as credenciais forem inválidas
   * 
   * @example
   * try {
   *   const user = await authAPI.login('joao@email.com', 'senha123');
   *   console.log('Login realizado:', user);
   * } catch (error) {
   *   console.error('Erro no login:', error.message);
   * }
   */
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Credenciais inválidas' }));
      throw new Error(error.detail || 'Credenciais inválidas');
    }
    
    const data = await response.json();
    
    // Salva os tokens JWT no localStorage
    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);
    
    // Retorna dados do usuário da resposta
    return data.user || data;
  },
  
  /**
   * Obtém o perfil do usuário autenticado.
   * 
   * Requer que o usuário esteja autenticado (token válido no localStorage).
   * 
   * @returns Promise com dados do perfil do usuário
   * @throws Error se não estiver autenticado ou token inválido
   * 
   * @example
   * const profile = await authAPI.getProfile();
   * console.log('Perfil:', profile);
   */
  async getProfile() {
    return apiRequest('/auth/profile/');
  },
  
  /**
   * Realiza logout do usuário.
   * 
   * Remove os tokens JWT do localStorage, efetivamente desautenticando
   * o usuário. Esta função não faz requisição ao servidor, apenas limpa
   * o localStorage.
   * 
   * @example
   * authAPI.logout();
   * // Usuário agora está desautenticado
   */
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

/**
 * API de Trilhas de Aprendizagem
 * 
 * Contém todas as funções para gerenciar trilhas de aprendizagem:
 * listar, criar, atualizar, deletar e gerenciar etapas.
 */
export const learningPathsAPI = {
  /**
   * Lista todas as trilhas do usuário autenticado.
   * 
   * @returns Promise com array de trilhas do usuário
   * @throws Error se não estiver autenticado
   * 
   * @example
   * const paths = await learningPathsAPI.getAll();
   * console.log('Trilhas:', paths);
   */
  async getAll() {
    return apiRequest('/learning-paths/');
  },
  
  /**
   * Obtém detalhes de uma trilha específica pelo ID.
   * 
   * @param id - ID da trilha
   * @returns Promise com dados completos da trilha
   * @throws Error se a trilha não for encontrada ou não pertencer ao usuário
   * 
   * @example
   * const path = await learningPathsAPI.getById('123');
   * console.log('Trilha:', path);
   */
  async getById(id: string) {
    return apiRequest(`/learning-paths/${id}/`);
  },
  
  /**
   * Cria uma nova trilha de aprendizagem.
   * 
   * @param pathData - Dados da trilha a ser criada
   * @param pathData.title - Título da trilha
   * @param pathData.description - Descrição da trilha
   * @param pathData.category - Categoria da trilha
   * @param pathData.difficulty - Nível de dificuldade
   * @param pathData.steps_data - Array com as etapas da trilha
   * @returns Promise com a trilha criada (incluindo ID gerado)
   * @throws Error se os dados forem inválidos
   * 
   * @example
   * const newPath = await learningPathsAPI.create({
   *   title: 'Aprenda React',
   *   description: 'Trilha completa de React',
   *   category: 'Desenvolvimento',
   *   difficulty: 'Iniciante',
   *   steps_data: [...]
   * });
   */
  async create(pathData: any) {
    return apiRequest('/learning-paths/', {
      method: 'POST',
      body: JSON.stringify(pathData),
    });
  },
  
  /**
   * Atualiza uma trilha existente.
   * 
   * @param id - ID da trilha a ser atualizada
   * @param pathData - Dados atualizados da trilha
   * @returns Promise com a trilha atualizada
   * @throws Error se a trilha não for encontrada ou dados inválidos
   * 
   * @example
   * const updated = await learningPathsAPI.update('123', {
   *   title: 'Novo título'
   * });
   */
  async update(id: string, pathData: any) {
    return apiRequest(`/learning-paths/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(pathData),
    });
  },
  
  /**
   * Deleta uma trilha do usuário.
   * 
   * @param id - ID da trilha a ser deletada
   * @returns Promise<void>
   * @throws Error se a trilha não for encontrada
   * 
   * @example
   * await learningPathsAPI.delete('123');
   * console.log('Trilha deletada');
   */
  async delete(id: string) {
    // Usa apiRequest que já trata status 204 corretamente
    return apiRequest(`/learning-paths/${id}/`, {
      method: 'DELETE',
    });
  },
  
  /**
   * Alterna o status de conclusão de uma etapa específica.
   * 
   * Marca uma etapa como concluída ou não concluída, e recalcula
   * automaticamente o progresso da trilha.
   * 
   * @param pathId - ID da trilha
   * @param stepIndex - Índice da etapa (0 = primeira, 1 = segunda, etc.)
   * @returns Promise com a trilha atualizada (com novo progresso)
   * @throws Error se o índice for inválido ou trilha não encontrada
   * 
   * @example
   * // Marca a primeira etapa (índice 0) como concluída
   * const updated = await learningPathsAPI.toggleStep('123', 0);
   * console.log('Progresso atualizado:', updated.progress);
   */
  async toggleStep(pathId: string, stepIndex: number) {
    return apiRequest(`/learning-paths/${pathId}/toggle_step/`, {
      method: 'POST',
      body: JSON.stringify({ step_index: stepIndex }),
    });
  },
};
