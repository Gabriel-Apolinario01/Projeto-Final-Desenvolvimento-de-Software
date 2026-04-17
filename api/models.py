"""
Models do EstudaAI - Definição dos modelos de dados do banco

Este módulo contém todos os modelos de dados utilizados no sistema EstudaAI.
Desenvolvido para gerenciar usuários, trilhas de aprendizagem, etapas e sub-etapas.

Autor: Desenvolvedor do EstudaAI
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    """
    Modelo de usuário customizado que estende o AbstractUser do Django.
    
    Este modelo representa os usuários do sistema EstudaAI, incluindo informações
    adicionais como curso e nível de experiência que são utilizadas para
    personalizar as recomendações de trilhas de aprendizagem.
    
    Atributos:
        email (EmailField): Email único do usuário (obrigatório e único)
        course (CharField): Área de formação/curso do usuário (opcional)
        experience_level (CharField): Nível de experiência (Iniciante, Intermediário, Avançado)
    
    Exemplo de uso:
        user = User.objects.create_user(
            username='joao',
            email='joao@email.com',
            password='senha123',
            course='Desenvolvimento de Software',
            experience_level='Iniciante'
        )
    """
    # Campo de email único - garante que cada email só pode ser cadastrado uma vez
    email = models.EmailField(unique=True, verbose_name='email address')
    
    # Curso/área de formação do usuário (usado para recomendações personalizadas)
    course = models.CharField(max_length=100, blank=True, default='')
    
    # Nível de experiência do usuário - usado para adaptar o conteúdo das trilhas
    experience_level = models.CharField(
        max_length=20,
        choices=[
            ('Iniciante', 'Iniciante'),
            ('Intermediário', 'Intermediário'),
            ('Avançado', 'Avançado'),
        ],
        default='Iniciante'
    )
    
    def __str__(self):
        """
        Retorna uma representação em string do usuário.
        Prioriza o email, mas usa o username como fallback.
        """
        return self.email or self.username


class SubStep(models.Model):
    """
    Modelo que representa uma sub-etapa dentro de uma etapa de aprendizagem.
    
    Sub-etapas são tópicos específicos dentro de uma etapa maior, cada uma
    contendo um tópico a ser estudado e um link para recursos externos.
    
    Atributos:
        topic (CharField): Nome/tópico da sub-etapa
        link (URLField): URL para recurso externo relacionado ao tópico
    
    Exemplo:
        sub_step = SubStep.objects.create(
            topic='Variáveis e Tipos de Dados',
            link='https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide'
        )
    """
    topic = models.CharField(max_length=200)
    link = models.URLField(max_length=500)
    
    def __str__(self):
        """Retorna o tópico da sub-etapa como representação em string."""
        return self.topic


class Step(models.Model):
    """
    Modelo que representa uma etapa dentro de uma trilha de aprendizagem.
    
    Cada etapa contém informações sobre o que deve ser aprendido, uma justificativa
    do porquê é importante, e uma lista de sub-etapas com recursos específicos.
    
    Atributos:
        learning_path (ForeignKey): Trilha de aprendizagem à qual esta etapa pertence
        title (CharField): Título da etapa
        description (TextField): Descrição detalhada do que será aprendido
        rationale (TextField): Justificativa da importância desta etapa
        completed (BooleanField): Indica se a etapa foi concluída pelo usuário
        order (IntegerField): Ordem da etapa na sequência da trilha
        sub_steps (ManyToManyField): Lista de sub-etapas relacionadas
    
    Exemplo:
        step = Step.objects.create(
            learning_path=my_path,
            title='Fundamentos de JavaScript',
            description='Aprenda os conceitos básicos...',
            rationale='Essencial para entender programação web',
            order=1,
            completed=False
        )
    """
    # Relacionamento com a trilha de aprendizagem
    learning_path = models.ForeignKey(
        'LearningPath', 
        on_delete=models.CASCADE, 
        related_name='step_set', 
        null=True, 
        blank=True
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    rationale = models.TextField()  # Por que esta etapa é importante
    completed = models.BooleanField(default=False)  # Status de conclusão
    order = models.IntegerField(default=0)  # Ordem na sequência
    
    # Relacionamento muitos-para-muitos com sub-etapas
    sub_steps = models.ManyToManyField(SubStep, blank=True)
    
    class Meta:
        """Configurações do modelo Step."""
        ordering = ['order']  # Ordena etapas por ordem crescente
    
    def __str__(self):
        """Retorna o título da etapa como representação em string."""
        return self.title


class LearningPath(models.Model):
    """
    Modelo principal que representa uma trilha de aprendizagem completa.
    
    Uma trilha de aprendizagem é um conjunto estruturado de etapas que guiam
    o estudante em um caminho de aprendizado sobre um tópico específico.
    Cada trilha pertence a um usuário e mantém informações sobre progresso.
    
    Atributos:
        id (AutoField): ID único da trilha (chave primária)
        title (CharField): Título da trilha
        description (TextField): Descrição do que será aprendido
        category (CharField): Categoria da trilha (ex: Desenvolvimento, Design)
        difficulty (CharField): Nível de dificuldade (Iniciante, Intermediário, Avançado)
        user (ForeignKey): Usuário proprietário da trilha
        progress (IntegerField): Percentual de progresso (0-100)
        created_at (DateTimeField): Data de criação (automático)
        updated_at (DateTimeField): Data da última atualização (automático)
    
    Métodos:
        calculate_progress(): Calcula e atualiza o progresso baseado nas etapas concluídas
    
    Exemplo:
        path = LearningPath.objects.create(
            title='Aprenda JavaScript do Zero',
            description='Trilha completa para iniciantes...',
            category='Desenvolvimento',
            difficulty='Iniciante',
            user=current_user
        )
    """
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    difficulty = models.CharField(
        max_length=20,
        choices=[
            ('Iniciante', 'Iniciante'),
            ('Intermediário', 'Intermediário'),
            ('Avançado', 'Avançado'),
        ]
    )
    
    # Relacionamento com o usuário - cada trilha pertence a um usuário
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,  # Se o usuário for deletado, suas trilhas também são
        related_name='learning_paths'
    )
    
    # Progresso da trilha em porcentagem (0-100)
    progress = models.IntegerField(default=0)
    
    # Indica se é uma trilha recomendada (gerada automaticamente pela IA)
    # False = trilha personalizada criada pelo usuário
    # True = trilha recomendada gerada automaticamente
    is_recommended = models.BooleanField(default=False)
    
    # Timestamps automáticos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        """Configurações do modelo LearningPath."""
        # Ordena trilhas pela mais recente primeiro
        ordering = ['-created_at']
    
    def __str__(self):
        """Retorna o título da trilha como representação em string."""
        return self.title
    
    def calculate_progress(self):
        """
        Calcula o progresso da trilha baseado nas etapas concluídas.
        
        Este método conta quantas etapas foram marcadas como concluídas,
        calcula a porcentagem e atualiza o campo progress da trilha.
        
        Returns:
            int: Percentual de progresso (0-100)
        
        Exemplo:
            path = LearningPath.objects.get(id=1)
            progress = path.calculate_progress()  # Retorna 50 se metade das etapas estiver concluída
        """
        total_steps = self.step_set.count()
        
        # Se não houver etapas, progresso é 0
        if total_steps == 0:
            self.progress = 0
            self.save()
            return 0
        
        # Conta quantas etapas foram concluídas
        completed_steps = self.step_set.filter(completed=True).count()
        
        # Calcula a porcentagem (arredondado para inteiro)
        self.progress = int((completed_steps / total_steps) * 100)
        self.save()
        
        return self.progress
