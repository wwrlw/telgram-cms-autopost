# Telegram Parser Backend

Backend API для Telegram парсера.

## Установка

```bash
npm install
```

## Настройка

Создайте файл `.env` в корне проекта:

```env
# MongoDB
MONGODB_URI=mongodb://username:password@localhost:27017
MONGODB_DB=parse-news

# Server
PORT=3001
NODE_ENV=development
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

## Docker

```bash
docker-compose up backend
```

## API Endpoints

### Posts
- `GET /posts` - Получить список постов
- `GET /post/:id` - Получить пост по ID
- `DELETE /post/:id` - Удалить пост

### Channels
- `GET /channels` - Получить список каналов
- `POST /channels` - Создать канал
- `PUT /channels/:id` - Обновить канал
- `DELETE /channels/:id` - Удалить канал

### Posted Channels
- `GET /posted-channels` - Получить все каналы публикации
- `GET /posted-channels/active` - Получить активные каналы публикации
- `POST /posted-channels` - Создать канал публикации
- `PUT /posted-channels/:id` - Обновить канал публикации
- `DELETE /posted-channels/:id` - Удалить канал публикации

### Publish
- `POST /publish/:postId/:channelId` - Опубликовать пост в канал

### Auth
- `POST /auth/login` - Войти в систему
- `POST /auth/register` - Зарегистрироваться 