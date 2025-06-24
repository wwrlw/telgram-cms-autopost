# Telegram Parser Backend

Fastify backend API для работы с постами из Telegram каналов.

## Архитектура

Проект построен по принципам Clean Architecture:

```
src/
├── models/          # Модели данных
├── interfaces/      # Интерфейсы
├── repositories/    # Слой доступа к данным
├── services/        # Бизнес-логика
├── use-cases/       # Сценарии использования
├── routes/          # API маршруты
├── middleware/      # middleware
├── plugins/         # Fastify plugins
├── exceptions/      # Errors
├── container/       # Dependency Injection
└── db/             # Конфигурация БД
```

## Установка

```bash
npm install
```

## Запуск

### Разработка
```bash
npm run dev
```

### Продакшн
```bash
npm run build
node dist/index.js
```

## API Endpoints

### Аутентификация
- `POST /auth/register` - Регистрация пользователя
- `POST /auth/login` - Вход в систему

### Посты
- `GET /posts` - Получить все посты (требует аутентификации)
- `GET /post/:id` - Получить пост по ID (требует аутентификации)

## База данных

Backend работает с MongoDB и использует коллекцию `posts`, которая заполняется отдельным TypeScript парсером.

## Структура данных

```typescript
interface Post {
  _id?: ObjectId;
  source_channel: string;  // username канала
  text: string;           // текст сообщения
  timestamp: Date;        // время сообщения
  url: string;           // ссылка на пост
  media: Media[];        // медиа файлы
  is_unique: boolean;    // уникальность контента
  created_at: Date;      // время создания записи
}

interface Media {
  type: string;          // тип медиа (photo, video, document)
  file_path: string;     // путь к файлу
}
```

## Переменные окружения

Создайте `.env` файл:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27019/telegram_parser
JWT_SECRET=your_jwt_secret_here
``` 