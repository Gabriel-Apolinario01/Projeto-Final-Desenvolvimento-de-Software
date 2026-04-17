/**
 * Setup de testes - Configuração global para testes
 * 
 * Este arquivo configura o ambiente de testes, importando matchers
 * customizados do jest-dom e configurando mocks globais.
 * 
 * Autor: Desenvolvedor do EstudaAI
 */

import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Limpa após cada teste para evitar vazamento de estado
afterEach(() => {
  cleanup();
});

// Mock do localStorage para testes
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

