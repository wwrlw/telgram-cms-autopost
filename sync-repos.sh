#!/bin/bash
set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Функция синхронизации backend
sync_backend() {
    log "Синхронизация backend..."
    
    # Создаем новую ветку для backend
    git branch -D temp/backend 2>/dev/null || true
    git subtree split --prefix=http -b temp/backend
    
    # Пушим в backend репу
    git push backend temp/backend:main --force-with-lease
    
    # Удаляем временную ветку
    git branch -D temp/backend
    
    success "Backend синхронизирован"
}

# Функция синхронизации frontend
sync_frontend() {
    log "Синхронизация frontend..."
    
    # Проверяем есть ли remote для frontend
    if ! git remote get-url frontend &>/dev/null; then
        warning "Remote 'frontend' не настроен. Добавьте его:"
        echo "git remote add frontend git@gitlab.tubecorporate.com:tools/telegram/frontend.git"
        return 1
    fi
    
    # Создаем новую ветку для frontend
    git branch -D temp/frontend 2>/dev/null || true
    git subtree split --prefix=src -b temp/frontend
    
    # Пушим в frontend репу
    git push frontend temp/frontend:main --force-with-lease
    
    # Удаляем временную ветку
    git branch -D temp/frontend
    
    success "Frontend синхронизирован"
}

# Функция синхронизации parser
sync_parser() {
    log "Синхронизация parser..."
    
    # Проверяем есть ли remote для parser
    if ! git remote get-url parser &>/dev/null; then
        warning "Remote 'parser' не настроен. Добавьте его:"
        echo "git remote add parser git@gitlab.tubecorporate.com:tools/telegram/parser.git"
        return 1
    fi
    
    # Создаем новую ветку для parser
    git branch -D temp/parser 2>/dev/null || true
    git subtree split --prefix=parser -b temp/parser
    
    # Пушим в parser репу
    git push parser temp/parser:main --force-with-lease
    
    # Удаляем временную ветку
    git branch -D temp/parser
    
    success "Parser синхронизирован"
}

# Основная логика
SERVICE=${1:-"all"}

case $SERVICE in
    "backend")
        sync_backend
        ;;
    "frontend")
        sync_frontend
        ;;
    "parser")
        sync_parser
        ;;
    "all")
        log "Синхронизация всех сервисов..."
        sync_backend
        sync_frontend || true
        sync_parser || true
        success "Все сервисы синхронизированы"
        ;;
    *)
        error "Неверный сервис: $SERVICE"
        echo "Доступные: backend, frontend, parser, all"
        exit 1
        ;;
esac

log "Синхронизация завершена!" 