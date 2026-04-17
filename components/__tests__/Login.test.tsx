/**
 * Testes Unitários - Componente Login
 * 
 * Este arquivo contém testes para validar o funcionamento do componente Login,
 * incluindo validação de formulário, interação com a API e tratamento de erros.
 * 
 * Autor: Desenvolvedor do EstudaAI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

// Mock do serviço de API
vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

describe('Login Component', () => {
  const mockOnLoginSuccess = vi.fn();
  const mockOnNavigateToRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('deve renderizar o formulário de login corretamente', () => {
    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
        registrationSuccess={false}
      />
    );

    expect(screen.getByPlaceholderText('E-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('deve mostrar mensagem de sucesso após registro', () => {
    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
        registrationSuccess={true}
      />
    );

    expect(screen.getByText(/cadastro realizado com sucesso/i)).toBeInTheDocument();
  });

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup();
    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
        registrationSuccess={false}
      />
    );

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/preencha todos os campos/i)).toBeInTheDocument();
    });
  });

  it('deve chamar onLoginSuccess após login bem-sucedido', async () => {
    const user = userEvent.setup();
    const { authAPI } = await import('../../services/api');
    
    vi.mocked(authAPI.login).mockResolvedValue({
      email: 'test@example.com',
      username: 'testuser',
      first_name: 'Test',
      course: 'Desenvolvimento',
      experience_level: 'Iniciante',
    });

    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
        registrationSuccess={false}
      />
    );

    await user.type(screen.getByPlaceholderText('E-mail'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Senha'), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith({
        name: 'Test',
        email: 'test@example.com',
        course: 'Desenvolvimento',
        experienceLevel: 'Iniciante',
      });
    });
  });

  it('deve exibir erro quando login falhar', async () => {
    const user = userEvent.setup();
    const { authAPI } = await import('../../services/api');
    
    vi.mocked(authAPI.login).mockRejectedValue(new Error('Credenciais inválidas'));

    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
        registrationSuccess={false}
      />
    );

    await user.type(screen.getByPlaceholderText('E-mail'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Senha'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });

  it('deve navegar para registro quando clicar no link', async () => {
    const user = userEvent.setup();
    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
        registrationSuccess={false}
      />
    );

    const registerLink = screen.getByRole('button', { name: /cadastre-se/i });
    await user.click(registerLink);

    expect(mockOnNavigateToRegister).toHaveBeenCalled();
  });
});

