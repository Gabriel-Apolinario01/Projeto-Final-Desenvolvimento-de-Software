"""
Serializers do EstudaAI - Conversão de dados entre API e modelos Django

Este módulo contém todos os serializers utilizados para converter objetos Django
em JSON (para API) e vice-versa. Os serializers também realizam validações de dados.

Autor: Desenvolvedor do EstudaAI
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import LearningPath, Step, SubStep

# Obtém o modelo User customizado configurado no settings
User = get_user_model()


class SubStepSerializer(serializers.ModelSerializer):
    """
    Serializer para SubStep - Converte sub-etapas para JSON.
    
    Este serializer é responsável por serializar/deserializar objetos SubStep,
    convertendo-os em formato JSON para comunicação com o frontend.
    
    Campos serializados:
        - id: ID único da sub-etapa
        - topic: Tópico a ser estudado
        - link: URL do recurso externo
    """
    class Meta:
        model = SubStep
        fields = ['id', 'topic', 'link']


class StepSerializer(serializers.ModelSerializer):
    """
    Serializer para Step - Converte etapas para JSON.
    
    Serializa etapas incluindo suas sub-etapas relacionadas. O campo 'subSteps'
    é usado no frontend (camelCase) enquanto o modelo usa 'sub_steps' (snake_case).
    
    Campos serializados:
        - id: ID único da etapa
        - title: Título da etapa
        - description: Descrição detalhada
        - rationale: Justificativa da etapa
        - completed: Status de conclusão
        - order: Ordem na sequência
        - subSteps: Lista de sub-etapas (read-only)
    """
    # Converte sub_steps (snake_case) para subSteps (camelCase) para o frontend
    subSteps = SubStepSerializer(many=True, read_only=True, source='sub_steps')
    
    class Meta:
        model = Step
        fields = ['id', 'title', 'description', 'rationale', 'completed', 'order', 'subSteps']


class LearningPathSerializer(serializers.ModelSerializer):
    """
    Serializer para LearningPath - Converte trilhas de aprendizagem para JSON.
    
    Este serializer é o mais complexo, pois precisa lidar com a criação de trilhas
    completas incluindo todas as etapas e sub-etapas. Ele recebe dados do frontend
    e cria toda a estrutura de relacionamentos no banco de dados.
    
    Campos serializados:
        - id: ID único da trilha (read-only)
        - title: Título da trilha
        - description: Descrição da trilha
        - category: Categoria (ex: Desenvolvimento, Design)
        - difficulty: Nível de dificuldade
        - progress: Percentual de progresso (read-only, calculado)
        - created_at: Data de criação (read-only)
        - updated_at: Data de atualização (read-only)
        - steps: Lista de etapas (read-only, para leitura)
        - steps_data: Lista de etapas (write-only, para criação)
    
    Métodos:
        create(): Cria uma trilha completa com todas as etapas e sub-etapas
    """
    # Campo para leitura - retorna as etapas já criadas
    steps = StepSerializer(many=True, read_only=True, source='step_set')
    
    # Campo para escrita - recebe dados das etapas na criação
    steps_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = LearningPath
        fields = [
            'id', 'title', 'description', 'category', 'difficulty', 'progress', 
            'created_at', 'updated_at', 'steps', 'steps_data', 'is_recommended'
        ]
        # Campos que são gerados automaticamente e não podem ser alterados
        read_only_fields = ['id', 'created_at', 'updated_at', 'progress']
    
    def create(self, validated_data):
        """
        Cria uma trilha de aprendizagem completa com todas as etapas e sub-etapas.
        
        Este método recebe os dados do frontend (que vem em formato de dicionário)
        e cria toda a estrutura no banco de dados:
        1. Cria a trilha principal
        2. Para cada etapa recebida, cria um objeto Step
        3. Para cada sub-etapa, cria ou encontra um SubStep e relaciona à etapa
        
        Args:
            validated_data (dict): Dados validados da trilha (sem steps_data)
        
        Returns:
            LearningPath: Objeto da trilha criada com todas as relações
        
        Exemplo de dados recebidos:
            {
                'title': 'Aprenda JavaScript',
                'description': '...',
                'steps_data': [
                    {
                        'title': 'Fundamentos',
                        'description': '...',
                        'subSteps': [
                            {'topic': 'Variáveis', 'link': 'https://...'}
                        ]
                    }
                ]
            }
        """
        # Extrai os dados das etapas do validated_data
        steps_data = validated_data.pop('steps_data', [])
        
        # Obtém o usuário da requisição (já autenticado)
        user = self.context['request'].user
        
        # Cria a trilha principal
        learning_path = LearningPath.objects.create(user=user, **validated_data)
        
        # Para cada etapa recebida, cria um objeto Step
        for order, step_data in enumerate(steps_data):
            # Extrai as sub-etapas da etapa atual
            sub_steps_data = step_data.pop('subSteps', [])
            
            # Cria a etapa associada à trilha
            step = Step.objects.create(
                learning_path=learning_path,
                order=order,  # Ordem sequencial (0, 1, 2, ...)
                completed=False,  # Inicialmente não concluída
                **step_data  # Demais campos (title, description, rationale)
            )
            
            # Para cada sub-etapa, cria ou encontra um SubStep e relaciona
            for sub_step_data in sub_steps_data:
                # get_or_create: encontra se já existe, cria se não existir
                sub_step, _ = SubStep.objects.get_or_create(
                    topic=sub_step_data['topic'],
                    defaults={'link': sub_step_data.get('link', '')}
                )
                # Relaciona a sub-etapa à etapa
                step.sub_steps.add(sub_step)
        
        return learning_path


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer para User - Serializa dados do usuário (sem senha).
    
    Este serializer é usado para retornar informações do usuário em respostas
    da API. A senha nunca é incluída por questões de segurança.
    
    Campos serializados:
        - id: ID único do usuário
        - username: Nome de usuário
        - email: Email do usuário
        - first_name: Primeiro nome
        - last_name: Último nome
        - course: Área de formação
        - experience_level: Nível de experiência
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'course', 'experience_level'
        ]
        # A senha nunca é retornada, apenas escrita
        extra_kwargs = {'password': {'write_only': True}}


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer para registro de novos usuários.
    
    Este serializer é usado especificamente para criar novos usuários.
    Ele valida que o email seja único e que a senha tenha no mínimo 6 caracteres.
    
    Campos:
        - username: Nome de usuário (obrigatório)
        - email: Email único (obrigatório, validado)
        - password: Senha com mínimo de 6 caracteres
        - first_name: Primeiro nome (opcional)
        - course: Área de formação (opcional)
        - experience_level: Nível de experiência (opcional)
    
    Validações:
        - Email deve ser único no banco de dados
        - Senha deve ter no mínimo 6 caracteres
        - Se username não for fornecido, usa a parte antes do @ do email
    """
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 
            'course', 'experience_level'
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'first_name': {'required': False, 'allow_blank': True},
            'course': {'required': False, 'allow_blank': True},
            'experience_level': {'required': False},
        }
    
    def validate_email(self, value):
        """
        Valida se o email já existe no banco de dados.
        
        Esta validação garante que cada email só possa ser cadastrado uma vez,
        evitando duplicatas e problemas de autenticação.
        
        Args:
            value (str): Email a ser validado
        
        Returns:
            str: Email se for válido
        
        Raises:
            ValidationError: Se o email já estiver cadastrado
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return value
    
    def create(self, validated_data):
        """
        Cria um novo usuário no banco de dados.
        
        Se o username não for fornecido, gera automaticamente usando
        a parte antes do @ do email.
        
        Args:
            validated_data (dict): Dados validados do usuário
        
        Returns:
            User: Objeto do usuário criado
        
        Exemplo:
            user = serializer.create({
                'email': 'joao@email.com',
                'password': 'senha123',
                'first_name': 'João'
            })
            # Username será 'joao' automaticamente se não fornecido
        """
        # Se username não foi fornecido, usar a parte antes do @ do email
        if 'username' not in validated_data or not validated_data['username']:
            validated_data['username'] = validated_data['email'].split('@')[0]
        
        # Cria o usuário com hash de senha automático (Django)
        user = User.objects.create_user(**validated_data)
        return user
