#!/bin/bash

# Script para iniciar o projeto EstudaAI

echo "🚀 Iniciando EstudaAI..."

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale Python 3.8+"
    exit 1
fi

# Verificar se Node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 16+"
    exit 1
fi

# Instalar dependências Python se necessário
echo "📦 Verificando dependências Python..."
pip3 install -r requirements.txt

# Instalar dependências Node se necessário
echo "📦 Verificando dependências Node..."
npm install

# Executar migrações Django
echo "🗄️  Executando migrações do banco de dados..."
python3 manage.py makemigrations
python3 manage.py migrate

echo ""
echo "✅ Setup completo!"
echo ""
echo "Para iniciar o projeto:"
echo "  Terminal 1 (Backend Django): python3 manage.py runserver"
echo "  Terminal 2 (Frontend React): npm run dev"
echo ""

