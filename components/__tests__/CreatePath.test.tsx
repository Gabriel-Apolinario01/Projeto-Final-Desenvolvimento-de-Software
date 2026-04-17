/**
 * Testes Unitários - Componente CreatePath
 * 
 * Este arquivo contém testes para validar o funcionamento do componente CreatePath,
 * incluindo geração de trilhas com IA, validação de prompts e tratamento de erros.
 * 
 * Autor: Desenvolvedor do EstudaAI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreatePath from '../CreatePath';

// Mock do serviço Gemini
vi.mock('../../services/geminiService', () => ({
  generateLearningPath: vi.fn(),
}));

describe('CreatePath Component', () => {
  const mockOnPathGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o formulário corretamente', () => {
    render(<CreatePath onPathGenerated={mockOnPathGenerated} />);

    expect(screen.getByText(/crie sua trilha de aprendizagem com ia/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/seja específico/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gerar trilha personalizada/i })).toBeInTheDocument();
  });

  it('deve validar prompt vazio', async () => {
    const user = userEvent.setup();
    render(<CreatePath onPathGenerated={mockOnPathGenerated} />);

    const submitButton = screen.getByRole('button', { name: /gerar trilha personalizada/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/descreva o que você quer aprender/i)).toBeInTheDocument();
    });
  });

  it('deve gerar trilha quando prompt for válido', async () => {
    const user = userEvent.setup();
    const { generateLearningPath } = await import('../../services/geminiService');

    const mockPath = {
      title: 'Aprenda React',
      description: 'Trilha completa de React',
      category: 'Desenvolvimento',
      difficulty: 'Iniciante',
      steps: [
        {
          title: 'Fundamentos',
          description: 'Aprenda o básico',
          rationale: 'Base essencial',
          completed: false,
          subSteps: [],
        },
      ],
    };

    vi.mocked(generateLearningPath).mockResolvedValue(mockPath);

    render(<CreatePath onPathGenerated={mockOnPathGenerated} />);

    const textarea = screen.getByPlaceholderText(/seja específico/i);
    await user.type(textarea, 'Quero aprender React');

    const submitButton = screen.getByRole('button', { name: /gerar trilha personalizada/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(generateLearningPath).toHaveBeenCalledWith('Quero aprender React');
      expect(mockOnPathGenerated).toHaveBeenCalledWith(mockPath);
    });
  });

  it('deve exibir loading durante geração', async () => {
    const user = userEvent.setup();
    const { generateLearningPath } = await import('../../services/geminiService');

    vi.mocked(generateLearningPath).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({} as any), 1000))
    );

    render(<CreatePath onPathGenerated={mockOnPathGenerated} />);

    const textarea = screen.getByPlaceholderText(/seja específico/i);
    await user.type(textarea, 'Quero aprender React');

    const submitButton = screen.getByRole('button', { name: /gerar trilha personalizada/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/gerando sua trilha/i)).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando geração falhar', async () => {
    const user = userEvent.setup();
    const { generateLearningPath } = await import('../../services/geminiService');

    vi.mocked(generateLearningPath).mockRejectedValue(
      new Error('Não foi possível gerar a trilha')
    );

    render(<CreatePath onPathGenerated={mockOnPathGenerated} />);

    const textarea = screen.getByPlaceholderText(/seja específico/i);
    await user.type(textarea, 'Quero aprender React');

    const submitButton = screen.getByRole('button', { name: /gerar trilha personalizada/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/não foi possível gerar a trilha/i)).toBeInTheDocument();
    });
  });

  it('deve desabilitar botão durante loading', async () => {
    const user = userEvent.setup();
    const { generateLearningPath } = await import('../../services/geminiService');

    vi.mocked(generateLearningPath).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({} as any), 1000))
    );

    render(<CreatePath onPathGenerated={mockOnPathGenerated} />);

    const textarea = screen.getByPlaceholderText(/seja específico/i);
    await user.type(textarea, 'Quero aprender React');

    const submitButton = screen.getByRole('button', { name: /gerar trilha personalizada/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});

