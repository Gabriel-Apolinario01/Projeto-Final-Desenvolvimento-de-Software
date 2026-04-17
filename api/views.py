"""
Views do EstudaAI - Endpoints da API REST

Este módulo contém todas as views (endpoints) da API REST do EstudaAI.
Implementa autenticação, gerenciamento de usuários e CRUD completo de trilhas.

Autor: Desenvolvedor do EstudaAI
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import LearningPath, Step
from .serializers import (
    LearningPathSerializer, 
    UserSerializer, 
    UserRegistrationSerializer,
    StepSerializer
)

# Obtém o modelo User customizado
User = get_user_model()


class UserRegistrationView(APIView):
    """
    View para registro de novos usuários.
    
    Este endpoint permite que novos usuários se cadastrem no sistema.
    Após o cadastro bem-sucedido, retorna os tokens JWT para autenticação automática.
    
    Métodos:
        POST: Cria um novo usuário e retorna tokens JWT
    
    Permissões:
        AllowAny: Qualquer pessoa pode acessar (não requer autenticação)
    
    Exemplo de requisição:
        POST /api/auth/register/
        {
            "username": "joao",
            "email": "joao@email.com",
            "password": "senha123",
            "first_name": "João",
            "course": "Desenvolvimento de Software",
            "experience_level": "Iniciante"
        }
    
    Exemplo de resposta (201):
        {
            "user": {...},
            "tokens": {
                "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
            }
        }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Registra um novo usuário no sistema.
        
        Processa os dados de registro, valida com o serializer, cria o usuário
        e retorna os tokens JWT para autenticação imediata.
        
        Args:
            request: Objeto Request do Django REST Framework
        
        Returns:
            Response: Resposta JSON com dados do usuário e tokens JWT
                - Status 201: Cadastro bem-sucedido
                - Status 400: Dados inválidos (erros de validação)
        """
        # Valida os dados recebidos usando o serializer
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            # Cria o usuário no banco de dados
            user = serializer.save()
            
            # Gera tokens JWT para autenticação automática
            refresh = RefreshToken.for_user(user)
            
            # Retorna dados do usuário e tokens
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        # Se os dados não forem válidos, retorna erros de validação
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """
    View para autenticação de usuários (login).
    
    Este endpoint permite que usuários façam login usando email ou username.
    Após autenticação bem-sucedida, retorna tokens JWT.
    
    Métodos:
        POST: Autentica usuário e retorna tokens JWT
    
    Permissões:
        AllowAny: Qualquer pessoa pode acessar
    
    Exemplo de requisição:
        POST /api/auth/login/
        {
            "username": "joao@email.com",  # ou apenas "joao"
            "password": "senha123"
        }
    
    Exemplo de resposta (200):
        {
            "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
            "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
            "user": {...}
        }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Autentica um usuário e retorna tokens JWT.
        
        Aceita login com email ou username. Primeiro tenta encontrar o usuário
        por email, depois por username. Em seguida, valida a senha.
        
        Args:
            request: Objeto Request com credenciais (username/email e password)
        
        Returns:
            Response: Resposta JSON com tokens JWT e dados do usuário
                - Status 200: Login bem-sucedido
                - Status 400: Dados faltando
                - Status 401: Credenciais inválidas
        """
        # Obtém email/username e senha da requisição
        email_or_username = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')
        
        # Valida se os campos obrigatórios foram fornecidos
        if not email_or_username or not password:
            return Response(
                {'detail': 'Email/username e senha são obrigatórios'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tenta encontrar o usuário primeiro por email
        try:
            user = User.objects.get(email=email_or_username)
        except User.DoesNotExist:
            # Se não encontrar por email, tenta por username
            try:
                user = User.objects.get(username=email_or_username)
            except User.DoesNotExist:
                # Usuário não encontrado
                return Response(
                    {'detail': 'Credenciais inválidas'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        # Autentica o usuário com a senha fornecida
        user = authenticate(username=user.username, password=password)
        if user is None:
            # Senha incorreta
            return Response(
                {'detail': 'Credenciais inválidas'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Gera tokens JWT para o usuário autenticado
        refresh = RefreshToken.for_user(user)
        
        # Retorna tokens e dados do usuário
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


class UserProfileView(APIView):
    """
    View para obter perfil do usuário autenticado.
    
    Retorna os dados do usuário atualmente autenticado (baseado no token JWT).
    
    Métodos:
        GET: Retorna dados do perfil do usuário
    
    Permissões:
        IsAuthenticated: Requer token JWT válido
    
    Exemplo de requisição:
        GET /api/auth/profile/
        Headers: Authorization: Bearer <access_token>
    
    Exemplo de resposta (200):
        {
            "id": 1,
            "username": "joao",
            "email": "joao@email.com",
            "first_name": "João",
            "course": "Desenvolvimento de Software",
            "experience_level": "Iniciante"
        }
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Retorna o perfil do usuário autenticado.
        
        Args:
            request: Objeto Request com usuário autenticado em request.user
        
        Returns:
            Response: Dados do usuário em formato JSON
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LearningPathViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento completo de trilhas de aprendizagem.
    
    Este ViewSet fornece operações CRUD completas (Create, Read, Update, Delete)
    para trilhas de aprendizagem. Todas as operações são filtradas para mostrar
    apenas as trilhas do usuário autenticado.
    
    Métodos disponíveis:
        GET /api/learning-paths/ - Lista todas as trilhas do usuário
        POST /api/learning-paths/ - Cria uma nova trilha
        GET /api/learning-paths/{id}/ - Obtém detalhes de uma trilha
        PUT /api/learning-paths/{id}/ - Atualiza uma trilha
        DELETE /api/learning-paths/{id}/ - Deleta uma trilha
        POST /api/learning-paths/{id}/toggle_step/ - Alterna conclusão de etapa
    
    Permissões:
        IsAuthenticated: Requer autenticação JWT
    
    Ações customizadas:
        toggle_step: Alterna o status de conclusão de uma etapa específica
    """
    serializer_class = LearningPathSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Retorna apenas as trilhas do usuário autenticado.
        
        Esta função filtra automaticamente as trilhas para garantir que
        cada usuário veja apenas suas próprias trilhas.
        
        Returns:
            QuerySet: Trilhas do usuário autenticado, ordenadas por data de criação
        """
        return LearningPath.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """
        Cria uma nova trilha de aprendizagem.
        
        Converte o formato de dados do frontend (onde 'steps' pode vir)
        para o formato esperado pelo serializer ('steps_data').
        
        Args:
            request: Objeto Request com dados da trilha
        
        Returns:
            Response: Trilha criada em formato JSON
                - Status 201: Trilha criada com sucesso
                - Status 400: Erros de validação
        """
        # Cria uma cópia dos dados para não modificar o original
        data = request.data.copy()
        
        # Se o frontend enviar 'steps', converte para 'steps_data'
        if 'steps' in data:
            steps = data.pop('steps')
            data['steps_data'] = steps
        
        # Valida e cria a trilha
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )
    
    @action(detail=True, methods=['post'])
    def toggle_step(self, request, pk=None):
        """
        Alterna o status de conclusão de uma etapa específica.
        
        Esta ação customizada permite marcar/desmarcar etapas como concluídas.
        Após alterar o status, recalcula automaticamente o progresso da trilha.
        
        Args:
            request: Objeto Request contendo 'step_index' no body
            pk: ID da trilha (primary key)
        
        Body da requisição:
            {
                "step_index": 0  # Índice da etapa (0 = primeira, 1 = segunda, etc.)
            }
        
        Returns:
            Response: Trilha atualizada com novo progresso
                - Status 200: Operação bem-sucedida
                - Status 400: Índice inválido ou erro
        
        Exemplo:
            POST /api/learning-paths/1/toggle_step/
            {
                "step_index": 2
            }
        """
        # Obtém a trilha (já filtrada por usuário pelo get_queryset)
        learning_path = self.get_object()
        step_index = request.data.get('step_index')
        
        try:
            # Obtém todas as etapas da trilha ordenadas
            steps = list(learning_path.step_set.all().order_by('order'))
            
            # Valida se o índice está dentro do range
            if 0 <= step_index < len(steps):
                # Obtém a etapa pelo índice
                step = steps[step_index]
                
                # Alterna o status de conclusão
                step.completed = not step.completed
                step.save()
                
                # Recalcula o progresso da trilha automaticamente
                learning_path.calculate_progress()
                
                # Retorna a trilha atualizada
                serializer = self.get_serializer(learning_path)
                return Response(serializer.data)
            else:
                # Índice fora do range
                return Response(
                    {'error': 'Índice de etapa inválido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            # Captura qualquer erro inesperado
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
