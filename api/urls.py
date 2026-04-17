"""
URLs da API do EstudaAI

Este módulo define todas as rotas/endpoints da API REST do EstudaAI.
Utiliza o Django REST Framework Router para rotas automáticas do ViewSet
e define rotas customizadas para autenticação.

Autor: Desenvolvedor do EstudaAI
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LearningPathViewSet, UserRegistrationView, UserProfileView, UserLoginView

# Router do Django REST Framework para rotas automáticas do ViewSet
# Isso gera automaticamente as rotas CRUD para LearningPathViewSet:
# - GET /api/learning-paths/ (listar)
# - POST /api/learning-paths/ (criar)
# - GET /api/learning-paths/{id}/ (detalhes)
# - PUT /api/learning-paths/{id}/ (atualizar)
# - DELETE /api/learning-paths/{id}/ (deletar)
router = DefaultRouter()
router.register(r'learning-paths', LearningPathViewSet, basename='learningpath')

# URLs da API
urlpatterns = [
    # Inclui todas as rotas do router (rotas do ViewSet)
    path('', include(router.urls)),
    
    # Rotas de autenticação
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', UserLoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Renovação de token JWT
    path('auth/profile/', UserProfileView.as_view(), name='profile'),
]
