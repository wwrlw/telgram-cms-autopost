# Telegram Parser

Парсер для сбора постов из Telegram каналов.

## Установка

```bash
npm install
```

## Настройка

Создайте файл `.env` в корне проекта:

```env
# Telegram API
API_ID=your_api_id
API_HASH=your_api_hash
STRING_SESSION=your_session_string

# MongoDB
MONGO_URI=mongodb://username:password@localhost:27017
MONGO_DB_NAME=parse-news

# API
API_BASE_URL=http://localhost:3001
API_USERNAME=your_username
API_PASSWORD=your_password

# Media
MEDIA_PATH=./media
```

## Запуск

```bash
npm start
```

## Docker

```bash
docker-compose up parser
```

## Структура проекта

```
src/
├── types/
│   └── index.ts          # TypeScript типы
├── services/
│   ├── mongoService.ts   # Работа с MongoDB
│   ├── mediaService.ts   # Обработка медиа файлов
│   └── telegramService.ts # Основной сервис Telegram
└── index.ts              # Главный файл
```

## Функциональность

- ✅ Парсинг сообщений из указанных каналов по ID
- ✅ Сохранение в MongoDB с уникальными индексами
- ✅ Обработка и оптимизация изображений
- ✅ Скачивание медиа файлов (фото, видео, документы)
- ✅ Graceful shutdown
- ✅ TypeScript с полной типизацией
- ✅ Обработка ошибок и логирование
- ✅ Автоматическое обновление статистики постов (просмотры, реакции, комментарии)
- ✅ Проверка дубликатов по тексту и URL
- ✅ Автоматическая очистка дубликатов
- ✅ Настраиваемые лимиты для обновления статистики

## Формат данных в MongoDB

```json
{
  "_id": "ObjectId",
  "id": "channelId_messageId",
  "source_channel": "username",
  "channel_id": 123456789,
  "text": "Текст сообщения",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "url": "https://t.me/username/123",
  "media": [
    {
      "type": "photo",
      "file_id": "unique_id",
      "file_path": "/path/to/file.jpg",
      "mime_type": "image/jpeg",
      "file_size": 12345,
      "width": 1920,
      "height": 1080
    }
  ],
  "is_unique": false,
  "created_at": "2025-01-01T12:00:00.000Z",
  "updated_at": "2025-01-01T12:00:00.000Z"
}
```

## Получение Telegram API credentials

1. Перейдите на https://my.telegram.org
2. Войдите в свой аккаунт
3. Перейдите в "API development tools"
4. Создайте новое приложение
5. Скопируйте `api_id` и `api_hash`

## Получение session string

При первом запуске парсер попросит ввести номер телефона и код подтверждения. После успешной авторизации в консоли будет выведен session string, который нужно сохранить в `.env` файл. 