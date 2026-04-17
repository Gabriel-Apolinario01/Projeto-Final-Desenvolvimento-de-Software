# Setup do Projeto EstudaAI

Este projeto tem frontend React (Vite) e backend Django (API REST).

## Pré-requisitos

- Python 3.8+
- Node.js 16+
- npm ou yarn

## Setup do Backend (Django)

1. **Instale as dependências Python:**
```bash
pip install -r requirements.txt
```

2. **Execute as migrações:**
```bash
python manage.py makemigrations
python manage.py migrate
```

3. **Crie um superusuário (opcional, para admin):**
```bash
python manage.py createsuperuser
```

4. **Inicie o servidor Django:**
```bash
python manage.py runserver
```

O backend estará rodando em: `http://localhost:8000`

## Setup do Frontend (React)

1. **Instale as dependências:**
```bash
npm install
```

2. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

O frontend estará rodando em: `http://localhost:3000` ou `http://localhost:3001`

## Configuração da API Gemini

A API key do Gemini está configurada no arquivo `services/geminiService.ts`. 
Para produção, configure via variável de ambiente.

## Estrutura do Projeto

```
estudaai---personalized-learning-paths-2/
├── api/                    # App Django (backend)
│   ├── models.py          # Models do banco de dados
│   ├── views.py           # Views da API
│   ├── serializers.py     # Serializers DRF
│   └── urls.py            # URLs da API
├── mysite/                # Configurações Django
│   └── settings.py        # Settings do projeto
├── components/            # Componentes React
├── services/              # Serviços (API e Gemini)
│   ├── api.ts            # Cliente da API Django
│   └── geminiService.ts  # Serviço Gemini AI
└── App.tsx               # Componente principal
```

## Endpoints da API

- `POST /api/auth/register/` - Registrar novo usuário
- `POST /api/auth/login/` - Login (obter tokens JWT)
- `GET /api/auth/profile/` - Perfil do usuário autenticado
- `GET /api/learning-paths/` - Listar trilhas do usuário
- `POST /api/learning-paths/` - Criar nova trilha
- `GET /api/learning-paths/{id}/` - Detalhes de uma trilha
- `POST /api/learning-paths/{id}/toggle_step/` - Alternar conclusão de etapa
- `DELETE /api/learning-paths/{id}/` - Deletar trilha

## Autenticação

O projeto usa JWT (JSON Web Tokens) para autenticação. Os tokens são armazenados no localStorage do navegador.

## Banco de Dados

O projeto usa SQLite por padrão. Para produção, configure PostgreSQL ou MySQL no `settings.py`.

