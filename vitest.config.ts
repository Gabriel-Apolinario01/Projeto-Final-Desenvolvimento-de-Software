/**
 * Configuração do Vitest para testes unitários
 * 
 * Este arquivo configura o ambiente de testes usando Vitest com suporte
 * para React Testing Library e jsdom para simular o ambiente do navegador.
 * 
 * Autor: Desenvolvedor do EstudaAI
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
      ],
    },
  },
});

