/**
 * Componente Login - Tela de autenticação de usuários
 * 
 * Este componente exibe o formulário de login e gerencia a autenticação
 * do usuário através da API Django. Suporta login com email ou username.
 * 
 * Funcionalidades:
 * - Validação de campos obrigatórios
 * - Autenticação via API Django
 * - Exibição de erros de autenticação
 * - Navegação para tela de registro
 * 
 * Autor: Desenvolvedor do EstudaAI
 */

import React, { useState } from 'react';
import { User } from '../types';
import { BrainCircuitIcon, MailIcon, KeyIcon } from './icons/Icons';

/**
 * Props do componente Login.
 */
interface LoginProps {
  /** Callback chamado quando o login é bem-sucedido, recebe os dados do usuário */
  onLoginSuccess: (user: User) => void;
  /** Callback para navegar para a tela de registro */
  onNavigateToRegister: () => void;
  /** Indica se houve um registro bem-sucedido antes (para mostrar mensagem) */
  registrationSuccess: boolean;
}

/**
 * Componente de Login.
 * 
 * Renderiza um formulário de login com validação e integração com a API.
 * Após login bem-sucedido, chama onLoginSuccess com os dados do usuário.
 * 
 * @param props - Props do componente Login
 * @returns JSX.Element - Formulário de login
 */
const Login: React.FC<LoginProps> = ({ 
  onLoginSuccess, 
  onNavigateToRegister, 
  registrationSuccess 
}) => {
  // Estado do email/username digitado
  const [email, setEmail] = useState('');
  
  // Estado da senha digitada
  const [password, setPassword] = useState('');
  
  // Estado para mensagens de erro
  const [error, setError] = useState<string | null>(null);

  /**
   * Handler para submissão do formulário de login.
   * 
   * Valida os campos, chama a API de autenticação e, em caso de sucesso,
   * converte os dados do formato da API para o formato do frontend e
   * chama o callback onLoginSuccess.
   * 
   * @param e - Evento de submit do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  // Previne recarregamento da página
    setError(null);  // Limpa erros anteriores

    // Validação: campos obrigatórios
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    try {
        // Importa dinamicamente o serviço de API
        const { authAPI } = await import('../services/api');
        
        // Faz o login através da API Django
        const user = await authAPI.login(email, password);
        
        // Converte formato da API (snake_case) para formato do frontend (camelCase)
        const frontendUser: User = {
          name: user.first_name || user.username,
          email: user.email,
          course: user.course,
          experienceLevel: user.experience_level,
        };
        
        // Chama callback de sucesso (irá atualizar o estado no App.tsx)
        onLoginSuccess(frontendUser);
    } catch (err: any) {
        // Em caso de erro, exibe mensagem ao usuário
        setError(err.message || 'Ocorreu um erro ao tentar fazer login.');
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg animate-fade-in-fast">
      {/* Cabeçalho do formulário */}
      <div className="text-center">
        <BrainCircuitIcon className="mx-auto h-12 w-12 text-red-800" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Bem-vindo(a) ao EstudaAI
        </h1>
        <p className="mt-2 text-slate-600">
          Faça login para continuar sua jornada de aprendizado.
        </p>
      </div>
      
      {/* Mensagem de sucesso após registro */}
      {registrationSuccess && (
        <div className="p-4 text-sm text-green-800 bg-green-100 border-l-4 border-green-500 rounded-r-lg" role="alert">
          <p className="font-bold">Cadastro realizado com sucesso!</p>
          <p>Agora você pode fazer login com suas novas credenciais.</p>
        </div>
      )}
      
      {/* Formulário de login */}
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {/* Campo de email/username */}
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MailIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-red-800 focus:border-red-800 transition"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
        </div>
        
        {/* Campo de senha */}
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <KeyIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-red-800 focus:border-red-800 transition"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
        </div>

        {/* Mensagem de erro (se houver) */}
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {/* Botão de submit */}
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 transition-colors"
          >
            Entrar
          </button>
        </div>
      </form>
      
      {/* Link para registro */}
      <p className="text-sm text-center text-slate-600">
        Não tem uma conta?{' '}
        <button onClick={onNavigateToRegister} className="font-medium text-red-800 hover:text-red-700">
          Cadastre-se
        </button>
      </p>
    </div>
  );
};

export default Login;
