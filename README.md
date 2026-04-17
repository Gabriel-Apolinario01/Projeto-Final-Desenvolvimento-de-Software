# 🎓 EstudaAI - Personalized Learning Paths

<div align="center">

![EstudaAI Logo](https://img.shields.io/badge/EstudaAI-Learning%20Paths-red?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)
![Django](https://img.shields.io/badge/Django-5.2.8-092E20?style=for-the-badge&logo=django)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript)

**Plataforma inteligente de trilhas de aprendizagem personalizadas com IA**

[Características](#-características) • [Tecnologias](#-tecnologias) • [Instalação](#-instalação) • [Uso](#-uso) • [API](#-api)

</div>

---

## 📋 Sobre o Projeto

O **EstudaAI** é uma plataforma completa de aprendizado personalizado que utiliza inteligência artificial (Google Gemini) para criar trilhas de aprendizagem customizadas baseadas nos objetivos e perfil do estudante. O sistema permite criar, gerenciar e acompanhar o progresso em trilhas de conhecimento estruturadas.

**📝 Nota**: Todo o código está amplamente comentado de forma profissional, facilitando a compreensão e manutenção do projeto. Os testes unitários garantem a qualidade e confiabilidade do sistema.

### 🎯 Principais Funcionalidades

- ✅ **Autenticação Completa**: Sistema de registro e login com JWT
- ✅ **Trilhas Personalizadas**: Criação de trilhas via IA baseadas em prompts
- ✅ **Recomendações Inteligentes**: Sugestões de trilhas baseadas no perfil do usuário
- ✅ **Acompanhamento de Progresso**: Marcação de etapas concluídas e cálculo automático de progresso
- ✅ **Persistência de Dados**: Todas as informações são salvas no banco de dados
- ✅ **Interface Moderna**: Design responsivo e intuitivo com Tailwind CSS

---

## 🛠️ Tecnologias

### Frontend
- **React 19.2.0** - Biblioteca JavaScript para construção de interfaces
- **TypeScript 5.8.2** - Superset do JavaScript com tipagem estática
- **Vite 6.2.0** - Build tool e dev server ultra-rápido
- **Tailwind CSS** - Framework CSS utility-first
- **React DOM 19.2.0** - Renderização React para navegadores

### Backend
- **Django 5.2.8** - Framework web Python de alto nível
- **Django REST Framework 3.16.1** - Toolkit para construção de APIs REST
- **Django REST Framework SimpleJWT 5.5.1** - Autenticação JWT
- **Django CORS Headers 4.9.0** - Headers CORS para Django
- **SQLite** - Banco de dados relacional (pode ser migrado para PostgreSQL/MySQL)

### IA e Serviços
- **Google Gemini AI** - Geração de conteúdo e trilhas personalizadas
- **@google/genai 1.28.0** - SDK oficial do Google Generative AI

---

## 🚀 Instalação

### Pré-requisitos

- **Python 3.8+**
- **Node.js 16+**
- **npm** ou **yarn**
- **Conta Google** com API Key do Gemini (opcional para desenvolvimento)

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd estudaai---personalized-learning-paths-2
```

### 2. Configuração do Backend (Django)

```bash
# Instalar dependências Python
pip install -r requirements.txt

# Executar migrações do banco de dados
python manage.py makemigrations
python manage.py migrate

# Criar superusuário (opcional, para acessar admin)
python manage.py createsuperuser
```

### 3. Configuração do Frontend (React)

```bash
# Instalar dependências Node.js
npm install
```

### 4. Configuração da API Gemini (Opcional)

A API key do Gemini está configurada no arquivo `services/geminiService.ts`. Para produção, configure via variável de ambiente.

---

## 🧪 Testes

O projeto possui testes unitários completos para backend e frontend.

### Executar Testes do Backend

```bash
# Executar todos os testes
python manage.py test

# Executar testes de um app específico
python manage.py test api

# Executar com verbosidade
python manage.py test --verbosity=2
```

### Executar Testes do Frontend

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm test -- --watch

# Executar com interface gráfica
npm run test:ui

# Executar com cobertura
npm run test:coverage
```

Para mais detalhes sobre os testes, consulte o arquivo [TESTES.md](./TESTES.md).

---

## 📖 Uso

### Iniciar o Servidor Backend

```bash
python manage.py runserver
```

O backend estará disponível em: `http://localhost:8000`

### Iniciar o Servidor Frontend

```bash
npm run dev
```

O frontend estará disponível em: `http://localhost:3000` ou `http://localhost:3001`

### Acessar o Sistema

1. Abra o navegador em `http://localhost:3001`
2. Clique em **"Cadastre-se"** para criar uma conta
3. Preencha os dados (nome, email, senha, curso, nível de experiência)
4. Faça login com suas credenciais
5. Crie trilhas personalizadas ou explore recomendações

---

## 🔐 Autenticação

### Registro de Usuário

- **Email único**: O sistema valida que cada email só pode ser cadastrado uma vez
- **Senha mínima**: 6 caracteres
- **Campos obrigatórios**: Email, senha, nome
- **Campos opcionais**: Curso, nível de experiência

### Login

- Login pode ser feito com **email** ou **username**
- Tokens JWT são armazenados no localStorage
- Refresh token automático quando o access token expira
- Sessão persiste mesmo após fechar o navegador

### Persistência de Dados

- ✅ Todas as trilhas são salvas no banco de dados Django
- ✅ Progresso é mantido entre sessões
- ✅ Ao fazer logout e login novamente, todas as trilhas são recuperadas
- ✅ Dados persistem mesmo após reiniciar os servidores

---

## 📡 API Endpoints

### Autenticação

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/auth/register/` | Registrar novo usuário | Não |
| POST | `/api/auth/login/` | Login (obter tokens JWT) | Não |
| POST | `/api/auth/refresh/` | Renovar access token | Não |
| GET | `/api/auth/profile/` | Obter perfil do usuário | Sim |

### Trilhas de Aprendizagem

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/learning-paths/` | Listar trilhas do usuário | Sim |
| POST | `/api/learning-paths/` | Criar nova trilha | Sim |
| GET | `/api/learning-paths/{id}/` | Obter detalhes de uma trilha | Sim |
| PUT | `/api/learning-paths/{id}/` | Atualizar trilha | Sim |
| DELETE | `/api/learning-paths/{id}/` | Deletar trilha | Sim |
| POST | `/api/learning-paths/{id}/toggle_step/` | Alternar conclusão de etapa | Sim |

### Exemplo de Requisição

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "usuario@email.com", "password": "senha123"}'

# Listar trilhas (requer token)
curl -X GET http://localhost:8000/api/learning-paths/ \
  -H "Authorization: Bearer <access_token>"
```

---

## 🗂️ Estrutura do Projeto

```
estudaai---personalized-learning-paths-2/
├── api/                          # App Django (Backend)
│   ├── models.py                # Models do banco de dados
│   ├── views.py                 # Views da API REST
│   ├── serializers.py           # Serializers DRF
│   ├── urls.py                  # URLs da API
│   ├── admin.py                 # Configuração do Django Admin
│   └── migrations/              # Migrações do banco de dados
│
├── mysite/                       # Configurações Django
│   ├── settings.py              # Configurações do projeto
│   ├── urls.py                  # URLs principais
│   └── wsgi.py                  # WSGI config
│
├── components/                   # Componentes React
│   ├── AuthModal.tsx            # Modal de autenticação
│   ├── Dashboard.tsx            # Dashboard principal
│   ├── CreatePath.tsx           # Criação de trilhas
│   ├── PathDetail.tsx           # Detalhes da trilha
│   ├── LandingPage.tsx          # Página inicial
│   └── ...
│
├── services/                     # Serviços
│   ├── api.ts                   # Cliente da API Django
│   └── geminiService.ts         # Serviço de IA Gemini
│
├── App.tsx                       # Componente principal React
├── index.tsx                     # Entry point React
├── index.html                    # HTML base
├── types.ts                      # Tipos TypeScript
├── package.json                  # Dependências Node.js
├── requirements.txt              # Dependências Python
└── manage.py                     # Script Django
```

---

## 🎨 Funcionalidades Detalhadas

### 1. Criação de Trilhas com IA

- Descreva o que deseja aprender em um prompt
- A IA gera uma trilha completa com:
  - 8-10 etapas estruturadas
  - Descrição detalhada de cada etapa
  - Justificativa (rationale) de cada etapa
  - 4-6 subtópicos por etapa
  - Links de recursos externos para cada subtópico

### 2. Recomendações Personalizadas

- O sistema gera 3 trilhas recomendadas baseadas em:
  - Curso/área de formação do usuário
  - Nível de experiência (Iniciante, Intermediário, Avançado)
- Recomendações são cacheadas no localStorage

### 3. Acompanhamento de Progresso

- Marque etapas como concluídas
- Progresso calculado automaticamente (%)
- Visualização clara do progresso geral
- Histórico de todas as trilhas

### 4. Gerenciamento de Trilhas

- Visualizar todas as trilhas criadas
- Ver detalhes completos de cada trilha
- Deletar trilhas não desejadas
- Explorar trilhas recomendadas

---

## 🔒 Segurança

- ✅ Autenticação JWT com tokens de acesso e refresh
- ✅ Validação de email único no banco de dados
- ✅ Senhas com hash seguro (Django)
- ✅ CORS configurado para desenvolvimento
- ✅ Validação de dados no backend e frontend
- ⚠️ **Nota**: Para produção, configure:
  - HTTPS
  - SECRET_KEY seguro
  - DEBUG = False
  - Configurações de segurança Django

---

## 🧪 Testes

### Verificar se o Backend está funcionando

```bash
python manage.py check
python manage.py runserver
```

### Verificar se o Frontend está funcionando

```bash
npm run dev
```

### Testar API diretamente

```bash
# Verificar endpoints
curl http://localhost:8000/api/learning-paths/
```

---

## 📝 Scripts Disponíveis

### Backend (Django)

```bash
python manage.py runserver          # Iniciar servidor
python manage.py makemigrations     # Criar migrações
python manage.py migrate            # Aplicar migrações
python manage.py createsuperuser    # Criar admin
python manage.py shell              # Django shell
```

### Frontend (React)

```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

---

## 🐛 Troubleshooting

### Problema: Email já cadastrado

**Solução**: O sistema valida emails únicos. Se você tentar cadastrar um email existente, receberá uma mensagem de erro.

### Problema: Token expirado

**Solução**: O sistema renova tokens automaticamente. Se persistir, faça logout e login novamente.

### Problema: Trilhas não aparecem

**Solução**: Verifique se está autenticado e se o backend está rodando na porta 8000.

### Problema: CORS Error

**Solução**: Verifique se `CORS_ALLOWED_ORIGINS` no `settings.py` inclui a URL do frontend.

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido Gabriel Apolinário

---

## 🔗 Links Úteis

- [Documentação Django](https://docs.djangoproject.com/)
- [Documentação React](https://react.dev/)
- [Documentação Django REST Framework](https://www.django-rest-framework.org/)
- [Documentação Google Gemini](https://ai.google.dev/docs)

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela! ⭐**

</div>
