<!-- # Telegram Parser (TypeScript)

TypeScript парсер для Telegram каналов с сохранением в MongoDB и обработкой медиа файлов.

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Скопируйте файл конфигурации:
```bash
cp env.example .env
```

3. Отредактируйте `.env` файл:
```env
# Telegram API credentials
API_ID=your_api_id_here
API_HASH=your_api_hash_here
STRING_SESSION=your_session_string_here

# Target channel IDs (comma separated)
TARGET_CHANNEL_IDS=-1002624835396,-1002735773285

# MongoDB configuration
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=telegram_parser

# Media storage path
MEDIA_PATH=./media
```

## Запуск

### Разработка
```bash
npm run dev
```

### Продакшн
```bash
npm run build
npm start
```

### Слежение за изменениями
```bash
npm run watch
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

При первом запуске парсер попросит ввести номер телефона и код подтверждения. После успешной авторизации в консоли будет выведен session string, который нужно сохранить в `.env` файл.  -->