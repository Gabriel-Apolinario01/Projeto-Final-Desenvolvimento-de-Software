/**
 * Componente Register - Tela de registro de novos usuários
 * 
 * Este componente exibe o formulário de cadastro e gerencia o registro
 * de novos usuários através da API Django. Inclui validações de campos
 * e feedback visual para o usuário.
 * 
 * Funcionalidades:
 * - Validação de campos obrigatórios
 * - Validação de senha mínima (6 caracteres)
 * - Registro via API Django
 * - Navegação para tela de login
 * - Exibição de erros de validação
 * 
 * Autor: Desenvolvedor do EstudaAI
 */

import React, { useState } from 'react';
import { User } from '../types';
import { BrainCircuitIcon, MailIcon, KeyIcon, UserCircleIcon, AcademicCapIcon, SignalIcon } from './icons/Icons';

/**
 * Props do componente Register.
 */
interface RegisterProps {
  /** Callback chamado quando o registro é bem-sucedido */
  onSuccessfulRegistration: () => void;
  /** Callback para navegar para a tela de login */
  onNavigateToLogin: () => void;
}

/**
 * Componente de Registro.
 * 
 * Renderiza um formulário completo de cadastro com todos os campos necessários
 * para criar uma conta no EstudaAI. Após registro bem-sucedido, chama
 * onSuccessfulRegistration.
 * 
 * @param props - Props do componente Register
 * @returns JSX.Element - Formulário de registro
 */
const Register: React.FC<RegisterProps> = ({ 
  onSuccessfulRegistration, 
  onNavigateToLogin 
}) => {
  // Estados dos campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [course, setCourse] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'Iniciante' | 'Intermediário' | 'Avançado'>('Iniciante');
  
  // Estado para mensagens de erro
  const [error, setError] = useState<string | null>(null);

  /**
   * Handler para submissão do formulário de registro.
   * 
   * Valida todos os campos, verifica se a senha tem no mínimo 6 caracteres,
   * chama a API de registro e, em caso de sucesso, chama o callback
   * onSuccessfulRegistration.
   * 
   * @param e - Evento de submit do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  // Previne recarregamento da página
    setError(null);  // Limpa erros anteriores

    // Validação: campos obrigatórios
    if (!name || !email || !password || !course) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    // Validação: senha deve ter no mínimo 6 caracteres
    if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    try {
        // Importa dinamicamente o serviço de API
        const { authAPI } = await import('../services/api');
        
        // Faz o registro através da API Django
        // O backend valida email único e cria o usuário no banco
        await authAPI.register({
          username: email.split('@')[0],  // Gera username a partir do email
          email,
          password,
          first_name: name,
          course,
          experience_level: experienceLevel,
        });
        
        // Se chegou aqui, registro foi bem-sucedido
        // Chama callback para mostrar mensagem de sucesso e voltar para login
        onSuccessfulRegistration();
    } catch (err: any) {
        // Em caso de erro (email duplicado, dados inválidos, etc.)
        setError(err.message || 'Ocorreu um erro ao tentar se cadastrar.');
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg animate-fade-in-fast">
      {/* Cabeçalho do formulário */}
      <div className="text-center">
        <BrainCircuitIcon className="mx-auto h-12 w-12 text-red-800" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Crie sua Conta
        </h1>
        <p className="mt-2 text-slate-600">
          Comece sua jornada de aprendizado personalizado agora.
        </p>
      </div>
      
      {/* Formulário de registro */}
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        {/* Campo de nome completo */}
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <UserCircleIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-red-800 focus:border-red-800 transition"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
        </div>
        
        {/* Campo de email */}
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MailIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
                id="email"
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
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-red-800 focus:border-red-800 transition"
                placeholder="Senha (mínimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
        </div>
        
        {/* Campo de curso/área de formação */}
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <AcademicCapIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
                id="course"
                name="course"
                type="text"
                required
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-red-800 focus:border-red-800 transition"
                placeholder="Curso/Área de formação"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
            />
        </div>
        
        {/* Campo de nível de experiência (select) */}
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SignalIcon className="h-5 w-5 text-slate-400" />
            </div>
            <select
                id="experience-level"
                name="experience-level"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as 'Iniciante' | 'Intermediário' | 'Avançado')}
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-800 focus:border-red-800 transition appearance-none"
            >
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
            </select>
        </div>

        {/* Mensagem de erro (se houver) */}
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {/* Botão de submit */}
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 transition-colors"
          >
            Cadastrar
          </button>
        </div>
      </form>
      
      {/* Link para login */}
      <p className="text-sm text-center text-slate-600">
        Já tem uma conta?{' '}
        <button onClick={onNavigateToLogin} className="font-medium text-red-800 hover:text-red-700">
          Faça login
        </button>
      </p>
    </div>
  );
};

export default Register;
