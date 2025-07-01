# Система управления каналами

## Обзор

Теперь парсер получает список каналов из базы данных через API бэкенда, вместо жестко заданных переменных окружения. Это позволяет управлять каналами через веб-интерфейс.

## Новые переменные окружения для парсера

Добавьте следующие переменные в `.env` файл парсера:

```env
# Backend API connection
API_BASE_URL=http://localhost:3001
API_USERNAME=your_backend_username
API_PASSWORD=your_backend_password
```

## API Endpoints для управления каналами

### Получить все каналы
```
GET /channels
Authorization: Bearer <token>
```

### Создать новый канал
```
POST /channels
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "@channel_name",
  "channel_id": 1234567890
}
```

### Получить канал по ID
```
GET /channels/:id
Authorization: Bearer <token>
```

### Удалить канал
```
DELETE /channels/:id
Authorization: Bearer <token>
```

### Получить ID каналов для парсера
```
GET /channels/parser/ids
Authorization: Bearer <token>
```

## Как это работает

1. **Инициализация**: При запуске парсер подключается к API и получает список каналов
2. **Аутентификация**: Используется логин/пароль для получения JWT токена
3. **Отказоустойчивость**: При ошибке подключения к API парсер повторяет попытку через 30 секунд
