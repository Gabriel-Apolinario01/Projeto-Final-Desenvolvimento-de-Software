"""
Testes Unitários do EstudaAI

Este módulo contém todos os testes unitários para validar o funcionamento
correto das funcionalidades do sistema EstudaAI.

Autor: Desenvolvedor do EstudaAI
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import LearningPath, Step, SubStep

User = get_user_model()


class UserModelTestCase(TestCase):
    """
    Testes para o modelo User.
    
    Valida a criação de usuários, campos obrigatórios e validações.
    """
    
    def setUp(self):
        """
        Configuração inicial para os testes.
        Executado antes de cada teste.
        """
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'course': 'Desenvolvimento de Software',
            'experience_level': 'Iniciante'
        }
    
    def test_create_user(self):
        """Testa a criação de um usuário com todos os campos."""
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.course, 'Desenvolvimento de Software')
        self.assertEqual(user.experience_level, 'Iniciante')
        self.assertTrue(user.check_password('testpass123'))
    
    def test_email_unique(self):
        """Testa que o email deve ser único."""
        User.objects.create_user(**self.user_data)
        
        # Tentar criar outro usuário com o mesmo email deve falhar
        with self.assertRaises(Exception):
            User.objects.create_user(
                username='testuser2',
                email='test@example.com',
                password='testpass123'
            )
    
    def test_user_str_representation(self):
        """Testa a representação em string do usuário."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(str(user), 'test@example.com')


class LearningPathModelTestCase(TestCase):
    """
    Testes para o modelo LearningPath.
    
    Valida criação de trilhas, cálculo de progresso e relacionamentos.
    """
    
    def setUp(self):
        """Configuração inicial."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.learning_path = LearningPath.objects.create(
            title='Trilha de Teste',
            description='Descrição da trilha',
            category='Desenvolvimento',
            difficulty='Iniciante',
            user=self.user
        )
    
    def test_create_learning_path(self):
        """Testa a criação de uma trilha."""
        self.assertEqual(self.learning_path.title, 'Trilha de Teste')
        self.assertEqual(self.learning_path.user, self.user)
        self.assertEqual(self.learning_path.progress, 0)
    
    def test_calculate_progress_no_steps(self):
        """Testa cálculo de progresso quando não há etapas."""
        progress = self.learning_path.calculate_progress()
        self.assertEqual(progress, 0)
    
    def test_calculate_progress_with_steps(self):
        """Testa cálculo de progresso com etapas."""
        # Cria 4 etapas
        for i in range(4):
            Step.objects.create(
                learning_path=self.learning_path,
                title=f'Etapa {i+1}',
                description='Descrição',
                rationale='Justificativa',
                order=i,
                completed=(i < 2)  # Primeiras 2 concluídas
            )
        
        # 2 de 4 etapas concluídas = 50%
        progress = self.learning_path.calculate_progress()
        self.assertEqual(progress, 50)
        
        # Marca mais uma como concluída
        step = self.learning_path.step_set.get(order=2)
        step.completed = True
        step.save()
        
        # 3 de 4 etapas concluídas = 75%
        progress = self.learning_path.calculate_progress()
        self.assertEqual(progress, 75)


class UserRegistrationAPITestCase(TestCase):
    """
    Testes para o endpoint de registro de usuários.
    
    Valida a API de registro, validações e criação de tokens.
    """
    
    def setUp(self):
        """Configuração inicial."""
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.valid_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'password123',
            'first_name': 'Novo',
            'course': 'Ciência da Computação',
            'experience_level': 'Intermediário'
        }
    
    def test_register_user_success(self):
        """Testa registro bem-sucedido de usuário."""
        response = self.client.post(self.register_url, self.valid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        
        # Verifica se o usuário foi criado no banco
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())
    
    def test_register_duplicate_email(self):
        """Testa que não é possível cadastrar email duplicado."""
        # Cria primeiro usuário
        self.client.post(self.register_url, self.valid_data, format='json')
        
        # Tenta criar outro com o mesmo email
        duplicate_data = self.valid_data.copy()
        duplicate_data['username'] = 'anotheruser'
        response = self.client.post(self.register_url, duplicate_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_register_short_password(self):
        """Testa que senha deve ter no mínimo 6 caracteres."""
        invalid_data = self.valid_data.copy()
        invalid_data['password'] = '12345'  # Apenas 5 caracteres
        
        response = self.client.post(self.register_url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)


class UserLoginAPITestCase(TestCase):
    """
    Testes para o endpoint de login.
    
    Valida autenticação com email/username e geração de tokens.
    """
    
    def setUp(self):
        """Configuração inicial."""
        self.client = APIClient()
        self.login_url = '/api/auth/login/'
        
        # Cria um usuário para teste
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_login_with_email(self):
        """Testa login usando email."""
        response = self.client.post(
            self.login_url,
            {'username': 'test@example.com', 'password': 'testpass123'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
    
    def test_login_with_username(self):
        """Testa login usando username."""
        response = self.client.post(
            self.login_url,
            {'username': 'testuser', 'password': 'testpass123'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_login_invalid_credentials(self):
        """Testa login com credenciais inválidas."""
        response = self.client.post(
            self.login_url,
            {'username': 'test@example.com', 'password': 'wrongpassword'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)


class LearningPathAPITestCase(TestCase):
    """
    Testes para os endpoints de trilhas de aprendizagem.
    
    Valida CRUD completo e funcionalidades específicas.
    """
    
    def setUp(self):
        """Configuração inicial."""
        self.client = APIClient()
        
        # Cria usuário e autentica
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Gera token e autentica cliente
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        self.paths_url = '/api/learning-paths/'
    
    def test_create_learning_path(self):
        """Testa criação de trilha completa."""
        path_data = {
            'title': 'Aprenda Python',
            'description': 'Trilha completa de Python',
            'category': 'Programação',
            'difficulty': 'Iniciante',
            'steps_data': [
                {
                    'title': 'Fundamentos',
                    'description': 'Aprenda o básico',
                    'rationale': 'Fundação essencial',
                    'subSteps': [
                        {'topic': 'Variáveis', 'link': 'https://example.com'}
                    ]
                }
            ]
        }
        
        response = self.client.post(self.paths_url, path_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Aprenda Python')
        self.assertTrue(LearningPath.objects.filter(title='Aprenda Python').exists())
    
    def test_list_learning_paths(self):
        """Testa listagem de trilhas do usuário."""
        # Cria algumas trilhas
        LearningPath.objects.create(
            title='Trilha 1',
            description='Descrição 1',
            category='Categoria 1',
            difficulty='Iniciante',
            user=self.user
        )
        
        LearningPath.objects.create(
            title='Trilha 2',
            description='Descrição 2',
            category='Categoria 2',
            difficulty='Intermediário',
            user=self.user
        )
        
        response = self.client.get(self.paths_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_toggle_step(self):
        """Testa alternância de status de etapa."""
        # Cria trilha com etapas
        path = LearningPath.objects.create(
            title='Trilha Teste',
            description='Descrição',
            category='Categoria',
            difficulty='Iniciante',
            user=self.user
        )
        
        step1 = Step.objects.create(
            learning_path=path,
            title='Etapa 1',
            description='Descrição',
            rationale='Justificativa',
            order=0,
            completed=False
        )
        
        step2 = Step.objects.create(
            learning_path=path,
            title='Etapa 2',
            description='Descrição',
            rationale='Justificativa',
            order=1,
            completed=False
        )
        
        # Alterna primeira etapa
        toggle_url = f'/api/learning-paths/{path.id}/toggle_step/'
        response = self.client.post(
            toggle_url,
            {'step_index': 0},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica que a etapa foi marcada como concluída
        step1.refresh_from_db()
        self.assertTrue(step1.completed)
        
        # Verifica que o progresso foi atualizado
        path.refresh_from_db()
        self.assertEqual(path.progress, 50)  # 1 de 2 etapas = 50%
    
    def test_delete_learning_path(self):
        """Testa exclusão de trilha."""
        path = LearningPath.objects.create(
            title='Trilha para Deletar',
            description='Descrição',
            category='Categoria',
            difficulty='Iniciante',
            user=self.user
        )
        
        delete_url = f'/api/learning-paths/{path.id}/'
        response = self.client.delete(delete_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(LearningPath.objects.filter(id=path.id).exists())


class UserProfileAPITestCase(TestCase):
    """
    Testes para o endpoint de perfil do usuário.
    
    Valida obtenção de dados do usuário autenticado.
    """
    
    def setUp(self):
        """Configuração inicial."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Teste',
            course='Desenvolvimento',
            experience_level='Iniciante'
        )
        
        # Autentica
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_get_profile(self):
        """Testa obtenção do perfil do usuário autenticado."""
        response = self.client.get('/api/auth/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['first_name'], 'Teste')
        self.assertEqual(response.data['course'], 'Desenvolvimento')
        self.assertNotIn('password', response.data)  # Senha nunca deve ser retornada
    
    def test_get_profile_unauthorized(self):
        """Testa que perfil requer autenticação."""
        # Remove autenticação
        self.client.credentials()
        
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
