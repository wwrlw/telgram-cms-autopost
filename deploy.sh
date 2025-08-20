#!/bin/bash
set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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

# Проверяем аргументы
SERVICE=${1:-"all"}
VALID_SERVICES=("all" "backend" "frontend" "parser")

if [[ ! " ${VALID_SERVICES[@]} " =~ " ${SERVICE} " ]]; then
    error "Неверный сервис: $SERVICE"
    echo "Доступные сервисы: ${VALID_SERVICES[*]}"
    exit 1
fi

log "🚀 Начинаем деплой: $SERVICE"

# Функция деплоя конкретного сервиса
deploy_service() {
    local service=$1
    log "🔄 Деплой $service..."
    
    # Останавливаем сервис
    docker-compose stop "$service" 2>/dev/null || true
    
    # Пересобираем и запускаем
    docker-compose up -d --build "$service"
    
    # Проверяем статус
    if docker-compose ps "$service" | grep -q "Up"; then
        success "$service успешно запущен"
    else
        error "Ошибка запуска $service"
        docker-compose logs --tail=20 "$service"
        return 1
    fi
}

# Основная логика
case $SERVICE in
    "all")
        log "Деплой всех сервисов..."
        
        # Останавливаем все
        docker-compose down
        
        # Запускаем все с пересборкой
        docker-compose up -d --build
        
        # Проверяем статус
        sleep 5
        docker-compose ps
        ;;
    *)
        deploy_service "$SERVICE"
        ;;
esac

success "Деплой $SERVICE завершен!"

# Показываем логи последние 10 строк
if [ "$SERVICE" != "all" ]; then
    log "Последние логи $SERVICE:"
    docker-compose logs --tail=10 "$SERVICE"
fi 