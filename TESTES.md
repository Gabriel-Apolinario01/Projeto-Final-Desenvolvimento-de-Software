# Guia de Testes - EstudaAI

Este documento descreve como executar e entender os testes unitários do projeto EstudaAI.

## 📋 Visão Geral

O projeto possui testes unitários para:
- **Backend (Django)**: Modelos, views, serializers e lógica de negócio
- **Frontend (React)**: Componentes, serviços e funções utilitárias

## 🚀 Executando os Testes

### Backend (Django)

Para executar os testes do backend:

```bash
# No diretório raiz do projeto
python manage.py test

# Executar testes de um app específico
python manage.py test api

# Executar testes com mais verbosidade
python manage.py test --verbosity=2

# Executar um teste específico
python manage.py test api.tests.UserModelTestCase.test_create_user
```

### Frontend (React)

Primeiro, instale as dependências de teste:

```bash
npm install
```

Depois, execute os testes:

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (re-executa ao salvar arquivos)
npm test -- --watch

# Executar testes com interface gráfica
npm run test:ui

# Executar testes com relatório de cobertura
npm run test:coverage
```

## 📁 Estrutura dos Testes

### Backend

```
api/
├── tests.py          # Testes unitários do Django
└── models.py         # Modelos testados
```

### Frontend

```
components/
├── __tests__/
│   ├── Login.test.tsx
│   └── CreatePath.test.tsx
services/
├── __tests__/
│   └── api.test.ts
src/
└── test/
    └── setup.ts      # Configuração global dos testes
```

## 🧪 Cobertura de Testes

### Backend

Os testes do backend cobrem:

- ✅ **Modelos**: Criação de usuários, trilhas, etapas e sub-etapas
- ✅ **Autenticação**: Registro, login, perfil e validações
- ✅ **API de Trilhas**: CRUD completo, toggle de etapas, cálculo de progresso
- ✅ **Validações**: Email único, senha mínima, campos obrigatórios

### Frontend

Os testes do frontend cobrem:

- ✅ **Componentes**: Login, CreatePath, Register, Dashboard
- ✅ **Serviços**: API client, autenticação, requisições
- ✅ **Validações**: Formulários, campos obrigatórios, tratamento de erros

## 📝 Exemplos de Testes

### Teste de Modelo (Django)

```python
def test_create_user(self):
    """Testa a criação de um usuário com todos os campos."""
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )
    
    self.assertEqual(user.username, 'testuser')
    self.assertEqual(user.email, 'test@example.com')
```

### Teste de Componente (React)

```typescript
it('deve chamar onLoginSuccess após login bem-sucedido', async () => {
    const user = userEvent.setup();
    vi.mocked(authAPI.login).mockResolvedValue(mockUser);
    
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    await user.type(screen.getByPlaceholderText('E-mail'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    
    await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
});
```

## 🔍 Comandos Úteis

### Django

```bash
# Ver apenas os testes que falharam
python manage.py test --failfast

# Executar testes em paralelo (mais rápido)
python manage.py test --parallel

# Gerar relatório de cobertura (requer coverage.py)
coverage run --source='.' manage.py test
coverage report
```

### Vitest

```bash
# Executar apenas testes relacionados a arquivos alterados
npm test -- --related

# Executar testes em modo debug
npm test -- --inspect-brk

# Executar testes específicos
npm test -- Login.test.tsx
```

## 📊 Interpretando Resultados

### Testes Passando ✅

```
✅ Login Component
  ✅ deve renderizar o formulário de login corretamente
  ✅ deve validar campos obrigatórios
  ✅ deve chamar onLoginSuccess após login bem-sucedido
```

### Testes Falhando ❌

Quando um teste falha, a saída mostra:
- Nome do teste que falhou
- Mensagem de erro específica
- Stack trace para debug
- Valores esperados vs valores recebidos

## 🐛 Debugging

### Debug no Django

```python
# Adicione breakpoints nos testes
import pdb; pdb.set_trace()
```

### Debug no Vitest

```bash
# Executar em modo debug
npm test -- --inspect-brk

# Usar console.log nos testes
console.log('Valor:', variable);
```

## 📚 Recursos Adicionais

- [Documentação do Django Testing](https://docs.djangoproject.com/en/stable/topics/testing/)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)

## ✨ Boas Práticas

1. **Teste uma coisa por vez**: Cada teste deve validar uma funcionalidade específica
2. **Use nomes descritivos**: Nomes de testes devem deixar claro o que está sendo testado
3. **Arrange-Act-Assert**: Organize testes em três partes: preparação, ação, verificação
4. **Mocks e stubs**: Use mocks para serviços externos (APIs, banco de dados)
5. **Limpeza**: Sempre limpe estado entre testes (setup/teardown)

## 🎯 Próximos Passos

Para aumentar a cobertura de testes:

1. Adicionar testes de integração
2. Testes end-to-end (E2E) com Cypress ou Playwright
3. Testes de performance
4. Testes de acessibilidade

---

**Autor**: Desenvolvedor do EstudaAI

