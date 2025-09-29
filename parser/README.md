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

## Docker

```bash
docker-compose up parser
```