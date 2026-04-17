/**
 * Testes Unitários - Serviço de API
 * 
 * Este arquivo contém testes para validar o funcionamento do serviço de API,
 * incluindo autenticação, requisições autenticadas, refresh de tokens e
 * operações CRUD de trilhas.
 * 
 * Autor: Desenvolvedor do EstudaAI
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authAPI, learningPathsAPI } from '../api';

// Mock global do fetch
global.fetch = vi.fn();

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authAPI', () => {
    describe('register', () => {
      it('deve registrar usuário e salvar tokens', async () => {
        const mockResponse = {
          user: {
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
          },
          tokens: {
            access: 'access_token',
            refresh: 'refresh_token',
          },
        };

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await authAPI.register({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          first_name: 'Test',
          course: 'Desenvolvimento',
          experience_level: 'Iniciante',
        });

        expect(result).toEqual(mockResponse.user);
        expect(localStorage.getItem('accessToken')).toBe('access_token');
        expect(localStorage.getItem('refreshToken')).toBe('refresh_token');
      });

      it('deve lançar erro quando registro falhar', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ detail: 'Email já cadastrado' }),
        } as Response);

        await expect(
          authAPI.register({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            first_name: 'Test',
            course: 'Desenvolvimento',
            experience_level: 'Iniciante',
          })
        ).rejects.toThrow('Email já cadastrado');
      });
    });

    describe('login', () => {
      it('deve fazer login e salvar tokens', async () => {
        const mockResponse = {
          access: 'access_token',
          refresh: 'refresh_token',
          user: {
            email: 'test@example.com',
            username: 'testuser',
          },
        };

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await authAPI.login('test@example.com', 'password123');

        expect(result).toEqual(mockResponse.user);
        expect(localStorage.getItem('accessToken')).toBe('access_token');
        expect(localStorage.getItem('refreshToken')).toBe('refresh_token');
      });

      it('deve lançar erro quando login falhar', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ detail: 'Credenciais inválidas' }),
        } as Response);

        await expect(
          authAPI.login('test@example.com', 'wrongpassword')
        ).rejects.toThrow('Credenciais inválidas');
      });
    });

    describe('getProfile', () => {
      it('deve obter perfil do usuário autenticado', async () => {
        localStorage.setItem('accessToken', 'valid_token');

        const mockProfile = {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          first_name: 'Test',
        };

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfile,
        } as Response);

        const result = await authAPI.getProfile();

        expect(result).toEqual(mockProfile);
        expect(vi.mocked(fetch)).toHaveBeenCalledWith(
          'http://localhost:8000/api/auth/profile/',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer valid_token',
            }),
          })
        );
      });
    });

    describe('logout', () => {
      it('deve remover tokens do localStorage', () => {
        localStorage.setItem('accessToken', 'token');
        localStorage.setItem('refreshToken', 'refresh');

        authAPI.logout();

        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();
      });
    });
  });

  describe('learningPathsAPI', () => {
    beforeEach(() => {
      localStorage.setItem('accessToken', 'valid_token');
    });

    describe('getAll', () => {
      it('deve listar todas as trilhas do usuário', async () => {
        const mockPaths = [
          { id: 1, title: 'Trilha 1' },
          { id: 2, title: 'Trilha 2' },
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockPaths,
        } as Response);

        const result = await learningPathsAPI.getAll();

        expect(result).toEqual(mockPaths);
      });
    });

    describe('create', () => {
      it('deve criar uma nova trilha', async () => {
        const mockPath = {
          id: 1,
          title: 'Nova Trilha',
          description: 'Descrição',
        };

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockPath,
        } as Response);

        const result = await learningPathsAPI.create({
          title: 'Nova Trilha',
          description: 'Descrição',
        });

        expect(result).toEqual(mockPath);
        expect(vi.mocked(fetch)).toHaveBeenCalledWith(
          'http://localhost:8000/api/learning-paths/',
          expect.objectContaining({
            method: 'POST',
            body: expect.any(String),
          })
        );
      });
    });

    describe('delete', () => {
      it('deve deletar uma trilha', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => {},
        } as Response);

        await learningPathsAPI.delete('1');

        expect(vi.mocked(fetch)).toHaveBeenCalledWith(
          'http://localhost:8000/api/learning-paths/1/',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    describe('toggleStep', () => {
      it('deve alternar status de uma etapa', async () => {
        const mockUpdatedPath = {
          id: 1,
          progress: 50,
          steps: [{ id: 1, completed: true }],
        };

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockUpdatedPath,
        } as Response);

        const result = await learningPathsAPI.toggleStep('1', 0);

        expect(result).toEqual(mockUpdatedPath);
        expect(vi.mocked(fetch)).toHaveBeenCalledWith(
          'http://localhost:8000/api/learning-paths/1/toggle_step/',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ step_index: 0 }),
          })
        );
      });
    });
  });
});

