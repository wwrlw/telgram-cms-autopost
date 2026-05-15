# Карта функционала приложения (Telegram Parser / News Publisher)

Полный разбор всех функций, пользовательских сценариев и возможностей для улучшения.

---

## 1. Аутентификация и пользователи

| Действие | API | Права | Фронт | Описание |
|----------|-----|--------|-------|----------|
| Вход | `POST /auth/login` | — | LoginPage | Логин + пароль, в ответ accessToken + refreshToken (refresh в httpOnly cookie). |
| Обновление токена | `POST /auth/refresh` | — | Автоматически (router) | По refreshToken из cookie/body выдаётся новый access + refresh. |
| Регистрация пользователя | `POST /auth/register` | MANAGE_USERS | UserManagement | Создание пользователя (логин, пароль, роль). |
| Список пользователей | `GET /auth/users` | MANAGE_USERS | UserManagement | Все пользователи. |
| Смена роли | `PUT /auth/users/:id/role` | MANAGE_USERS | UserManagement | Роль: super_admin, admin, editor, banned. |
| Бан | `POST /auth/users/:id/ban` | MANAGE_USERS | UserManagement | Перевод в banned. |
| Разбан | `POST /auth/users/:id/unban` | MANAGE_USERS | UserManagement | Возврат роли (указать новую роль). |
| Добавить в избранное | `POST /auth/favorites/add` | Авторизован | Favorites | userId + postId. |
| Убрать из избранного | `POST /auth/favorites/remove` | Авторизован | Favorites | userId + postId. |
| Список избранного | `GET /auth/favorites/:userId` | Авторизован | Favorites | Массив postId. |

**Роли и доступ:**  
- **super_admin** — всё + Settings, User management.  
- **admin** — почти всё, кроме части настроек.  
- **editor** — контент, публикация, категории, избранное; нет Channels, Posted channels, Analytics, Users, Logs.  
- **banned** — доступ запрещён.

---

## 2. Посты (сбор, показ, фильтрация)

| Действие | API | Права | Фронт | Описание |
|----------|-----|--------|-------|----------|
| Список постов (пагинация) | `GET /posts` | — | Posts | page, limit; без параметров — первая страница, 24 поста. |
| Поиск/фильтры | `GET /posts/search` или `GET /posts?…` | — | Posts | Фильтры: source_channel, text, is_unique, category_id, date_from, date_to. Сортировка: timestamp, created_at, source_channel, err (asc/desc). |
| Бесконечный скролл | `GET /posts/infinite-scroll` | — | Posts | cursor (lastId) + limit, те же фильтры и сортировка. |
| Один пост | `GET /post/:id` | — | Post | Детальная карточка поста. |
| Статистика за сегодня | `GET /posts/stats` | — | — | Количество постов за сегодня. |

**Метаданные поста в ответах:**  
source_channel, channel_username, text, unique_text, timestamp, url, media (type, file_path, thumbnail_path, has_spoiler), is_unique, format (html/markdown), category_id, category_name, category_color, conversion_metrics (er, err, views, reactions, comments, forwards), scheduled_at, is_published, published_at, telegram_message_id, published_channel_id и т.д.

**Что можно улучшить:**  
- Сохранённые фильтры/пресеты.  
- Экспорт списка (CSV/Excel).  
- Групповые действия (массовое изменение категории, тегов).

---

## 2а. Алгоритм оценки вирусности постов

**Цель:** автоматически ранжировать посты по потенциалу вирального распространения, выделять «горячие» для приоритетной публикации.

**Метрики для скоринга (используются из `conversion_metrics`):**

| Метрика | Вес | Описание |
|---------|-----|----------|
| ERR (Engagement Rate Reach) | 0.35 | Реакции / просмотры — качество вовлечённости |
| Forwards (репосты) | 0.25 | Сигнал виральности — пользователи делятся |
| Views / час | 0.20 | Скорость набора просмотров (velocity) |
| Comments | 0.10 | Обсуждаемость |
| Reactions count | 0.10 | Абсолютное число реакций |

**Формула скора:**
```
virality_score = (ERR * 0.35) + (forwards_norm * 0.25) + (views_velocity * 0.20) + (comments_norm * 0.10) + (reactions_norm * 0.10)
```
Все метрики нормализуются по максимальному значению за скользящее окно (24 ч / 7 дней).

**API:**

| Действие | API | Права | Фронт | Описание |
|----------|-----|--------|-------|----------|
| Топ «горячих» постов | `GET /posts/hot?window=24h&limit=10` | VIEW_POSTS | Posts (вкладка «Горячие») | Возвращает посты, отсортированные по virality_score desc; window: 24h / 7d / 30d. |
| Скор конкретного поста | `GET /posts/:id/virality` | VIEW_POSTS | Post (карточка) | virality_score + breakdown по каждой метрике. |
| Пересчёт скоров | `POST /posts/recalculate-virality` | EDIT_POSTS | — | Запускает batch-пересчёт для всех постов (вызывается по cron или вручную). |

**Хранение:** поле `virality_score` (число 0–100) в коллекции posts, обновляется фоновым процессом каждые N минут.

**Что можно улучшить:**  
- ML-модель вместо взвешенной суммы (обучение на исторических данных канала).  
- Учёт времени суток и дня недели при расчёте velocity.  
- Автопубликация постов с virality_score выше порога.

---

## 3. Редактирование поста и метаданные

| Действие | API | Прата | Фронт | Описание |
|----------|-----|--------|-------|----------|
| Создать пост | `POST /posts` | CREATE_POSTS | CreatePost | multipart: text, media[], is_unique, url, format; опционально scheduled_at + channel_id (сразу в отложенные). |
| Обновить пост | `PUT /posts/:id` | EDIT_POSTS | Post | multipart: text, media[] (type, file_path, thumbnail_path, has_spoiler), is_unique, url, format. |
| Уникализация текста (ИИ) | `POST /posts/:id/uniquize` | EDIT_POSTS | Post | Timeweb GPT: переписывает текст, сохраняет в unique_text, is_unique=true. В body можно передать custom_prompt, save_prompt, channel_id (сейчас не используются в контроллере). |
| Удалить пост | `DELETE /post/:id` | DELETE_POSTS | Post / список | Удаление из БД; если пост опубликован — удаление из Telegram (telegram_message_id + published_channel_id). |
| Очистка старых постов | `POST /posts/cleanup?threshold=&removeCount=&dryRun=` | CLEANUP_POSTS | — | Удаление по возрасту (threshold в днях), лимит removeCount, dryRun для проверки. |

**Медиа в посте:**  
- type: photo / video / audio / document.  
- file_path, thumbnail_path, has_spoiler.  
- Загрузка файлов — отдельно через `/media/upload`, затем пути подставляются в пост.

**Что можно улучшить:**  
- Рерайт под канал при публикации (сейчас закомментирован в PublishPostToChannelUseCase).  
- Редактирование уже опубликованного поста в Telegram (или явное «только локально»).  
- Версионирование текста (история правок).  
- Массовое редактирование (категория, теги) по выбору.

---

## 4. Публикация и отложенная публикация

| Действие | API | Права | Фронт | Описание |
|----------|-----|--------|-------|----------|
| Опубликовать пост в канал | `POST /publish/:postId/:channelId` | PUBLISH_POSTS | Post (PublishModal) | Мгновенная публикация в выбранный канал (Bot API или MTProto). |
| Удалить пост из Telegram | `DELETE /publish/:postId` | PUBLISH_POSTS | DeleteFromTelegramModal | Удаление сообщения из канала по postId (ищется telegram_message_id и published_channel_id). |
| Список каналов для публикации | `GET /publish/channels` | — | Модалки публикации | Активные каналы (posted-channels, is_active). |
| Запланировать публикацию | `POST /posts/:id/schedule` | PUBLISH_POSTS | Post, ScheduleControls | body: scheduled_at, channel_id. В БД обновляется пост; в Telegram создаётся отложенное сообщение (MTProto/Bot). |
| Список отложенных | `GET /posts/scheduled?channel_id=` | — | SheduledPosts | По каналу или все. |
| Отменить отложенную | `DELETE /posts/:id/schedule` | DELETE_POSTS | — | Снятие с отложенной в БД + удаление отложенного сообщения в Telegram. |
| Список опубликованных | `GET /posts/published?channel_id=` | — | — | Уже опубликованные посты. |

**Служебные (вызывает parser/backend):**  
- `PUT /posts/:id/scheduled-message-id` — сохранение scheduled_message_id после постановки в очередь.  
- `PUT /posts/:id/published-message-id` — сохранение telegram_message_id и published_channel_id после публикации.  
- `PUT /posts/:id/mark-scheduled-as-published` — переход из «отложенный» в «опубликован».

**Что можно улучшить:**  
- Автопубликация по правилам (например, топ N «горячих» раз в час).  
- Очередь публикаций с приоритетами.  
- Рерайт перед публикацией (включить и настраивать по каналу).  
- Подпись/водяной знак по каналу (поле signature уже есть в канале).

---

## 5. Каналы для парсинга (источники новостей)

| Действие | API | Права | Фронт | Описание |
|----------|-----|--------|-------|----------|
| Список каналов | `GET /channels` | — | Channels | Все каналы, с которых парсится контент. |
| Один канал | `GET /channels/:id` | — | — | По id. |
| Добавить канал | `POST /channels` | MANAGE_CHANNELS | CreateChannelModal | username, channel_id, category_id?, is_private?, prompt?. |
| Обновить канал | `PUT /channels/:id` | MANAGE_CHANNELS | Channels | Те же поля. |
| Удалить канал | `DELETE /channels/:id` | MANAGE_CHANNELS | Channels | Удаление из БД. |
| ID каналов для парсера | `GET /channels/parser/ids` | VIEW_POSTS | Parser (внутр.) | Список channel_id для парсера (используется parser'ом при старте). |

**Модель канала:** username, channel_id, category_id, is_private, prompt (для рерайта под канал — пока не используется при публикации).

**Что можно улучшить:**  
- Поиск/подбор каналов по теме (ИИ по описанию и постам).  
- Автокатегоризация канала при добавлении.  
- Статистика по каналу (сколько постов за период, средний ER).

---

## 6. Каналы для публикации (куда постим)

| Действие | API | Права | Фронт | Описание |
|----------|-----|--------|-------|----------|
| Список | `GET /posted-channels` | — | PublicationChannels | Все каналы публикации. |
| Активные | `GET /posted-channels/active` | — | Parser, модалки | Только is_active. |
| Один | `GET /posted-channels/:id` | — | — | По id. |
| Создать | `POST /posted-channels` | MANAGE_PUBLICATION_CHANNELS | PublicationChannels | name, channel_id, is_private, is_active?, bot_token?, prompt?, signature?. |
| Обновить | `PUT /posted-channels/:id` | MANAGE_PUBLICATION_CHANNELS | PublicationChannels | Те же поля. |
| Удалить | `DELETE /posted-channels/:id` | MANAGE_PUBLICATION_CHANNELS | PublicationChannels | Удаление. |

**Поля канала:** name, channel_id (Telegram), is_private, is_active, bot_token (если Bot API), signature (подпись поста), prompt (инструкция для рерайта — пока не используется при публикации).

**Что можно улучшить:**  
- Создание канала «по категории» с подсказкой названия/описания от ИИ.  
- Шаблоны подписи/формата поста по каналу.  
- Проверка прав бота в канале при сохранении.

---

## 7. Категории

| Действие | API | Права | Фронт | Описание |
|----------|-----|--------|-------|----------|
| Список | `GET /categories` | — | Categories, фильтры постов | Все категории. |
| Одна | `GET /categories/:id` | — | — | По id. |
| Создать | `POST /categories` | MANAGE_CATEGORIES | CreateCategoryModal | name, description?, color?, is_active?. |
| Обновить | `PUT /categories/:id` | MANAGE_CATEGORIES | Categories | Те же поля. |
| Удалить | `DELETE /categories/:id` | MANAGE_CATEGORIES | Categories | Удаление. |

**Использование:** привязка постов и каналов парсинга к категориям; фильтр постов по category_id; отображение category_name/category_color в карточке поста.

**Что можно улучшить:**  
- Автоклассификация поста по тексту (ИИ), предложение категории при создании/редактировании.  
- Автосоздание каналов публикации по категориям (шаблон канала на категорию).

---

## 8. Медиа

| Действие | API | Права | Фронт | Описание |
|----------|-----|--------|-------|----------|
| Загрузка файлов | `POST /media/upload` | UPLOAD_MEDIA | CreatePost, Post (редактор) | multipart; возвращает type, file_path, original_name, mime_type. Файлы сохраняются в ./media. |
| Раздача файлов | Статика `GET /media/*` | — | — | fastify-static из папки media. |
| Генерация изображения (ComfyUI) | `POST /media/generate` | UPLOAD_MEDIA | Post (редактор) | Отправляет текст поста в ComfyUI API, получает сгенерированное изображение, сохраняет и привязывает к посту. |
| Статус генерации (ComfyUI) | `GET /media/generate/:jobId` | UPLOAD_MEDIA | Post (редактор) | Polling статуса задачи в ComfyUI (prompt_id → выполнено/в очереди/ошибка). |

**ComfyUI интеграция:**  
ComfyUI — локальный/удалённый сервис генерации изображений (Stable Diffusion и др.) с REST API.  
Сценарий: пользователь открывает пост → нажимает «Сгенерировать обложку» → backend передаёт текст поста в ComfyUI в качестве промпта → ComfyUI возвращает изображение → оно прикрепляется как медиа к посту.  
Конфигурируется через переменные окружения (`COMFYUI_URL`, `COMFYUI_WORKFLOW_ID`).

**Что можно улучшить:**  
- Генерация превью/обложек для видео.  
- Выбор воркфлоу ComfyUI из UI (пресеты стилей: фото, арт, минимализм).  
- Лимиты размера/типов и квоты по пользователю.

---

## 9. Аналитика

| Действие | API | Права | Фронт | Описание |
|----------|-----|--------|-------|----------|
| Дневная аналитика по каналу | `GET /analytics/daily?channelid=&limit=&startDate=&endDate=` | VIEW_ANALYTICS | Analytics, AnalyticsChannel | Коллекция channel_analytics_daily: данные по дням для channel_id. |

**Что можно улучшить:**  
- Сводка по всем каналам, сравнение каналов.  
- Метрики по постам (просмотры, реакции, ER) в карточке поста и в списке.  
- Дашборд «горячих» постов (топ по ER/просмотрам за период).

---

## 10. Логи

| Действие | API | Права | Фронт | Описание |
|----------|-----|--------|-------|----------|
| Общий лог | `GET /logs?page=&limit=&sort=` | VIEW_LOGS | SystemLogs | Пагинация, сортировка по timestamp (asc/desc). |
| Лог по пользователю | `GET /logs/user/:userId?page=&limit=&sort=` | VIEW_LOGS | SystemLogs | Действия конкретного пользователя. |
| Infinite scroll логов | `GET /logs/infinite-scroll?…` | VIEW_LOGS | SystemLogs | Курсорная пагинация. |

**Что можно улучшить:**  
- Фильтры по действию, дате, сущности (пост/канал/пользователь).  
- Экспорт логов.

---

## 11. Parser (фоновый сервис)

**Не API пользователя, а внутренняя логика:**

- При старте запрашивает у backend: список каналов для парсинга (`/channels`, конфиги), список каналов для публикации (`/posted-channels/active`).
- Подключается к Telegram (MTProto по STRING_SESSION), подписывается на сообщения из целевых каналов.
- Новые посты сохраняет в MongoDB (коллекция posts), медиа — в parser/media, пути попадают в пост.
- Обновляет статистику каналов (подписчики и т.д.).
- Обрабатывает очередь отложенной публикации: сверяет с backend запланированные посты, при наступлении времени публикует в Telegram и вызывает backend для сохранения scheduled_message_id / published_message_id.

**Косвенное взаимодействие пользователя:**  
добавление/удаление каналов парсинга и каналов публикации в UI влияет на то, что видит и куда постит parser.

---

## 12. Сводная таблица прав по сущностям

| Сущность | Просмотр | Создание | Редактирование | Удаление | Специальное |
|----------|-----------|-----------|-----------------|----------|-------------|
| Посты | VIEW_POSTS | CREATE_POSTS | EDIT_POSTS | DELETE_POSTS | PUBLISH_POSTS, CLEANUP_POSTS, BULK_DELETE_POSTS (право есть, отдельного bulk API нет) |
| Каналы парсинга | — | MANAGE_CHANNELS | MANAGE_CHANNELS | MANAGE_CHANNELS | — |
| Каналы публикации | — | MANAGE_PUBLICATION_CHANNELS | MANAGE_PUBLICATION_CHANNELS | MANAGE_PUBLICATION_CHANNELS | — |
| Категории | — | MANAGE_CATEGORIES | MANAGE_CATEGORIES | MANAGE_CATEGORIES | — |
| Пользователи | MANAGE_USERS | CREATE_USER | ASSIGN_ROLE | — | ban/unban через смену роли |
| Медиа | — | UPLOAD_MEDIA | — | — | — |
| Аналитика | VIEW_ANALYTICS | — | — | — | — |
| Логи | VIEW_LOGS | — | — | — | — |

---

## 13. Идеи для улучшения (по приоритету)

**Контент и посты**  
- Включить рерайт перед публикацией (по каналу: prompt/signature).  
- Классификация поста по тексту (ИИ), авто-предложение категории.  
- «Горячие» посты: скор вирусности по ER/просмотрам/дате (алгоритм — раздел 2а), фильтр и автопубликация топ-N.  
- Генерация обложки к посту через ComfyUI (локальная Stable Diffusion) — раздел 8.  
- История изменений текста поста.

**Публикация**  
- Автопубликация по расписанию и правилам (например, топ горячих раз в N часов).  
- Очередь публикаций с приоритетами и лимитами по каналу.

**Каналы и категории**  
- Подбор каналов для парсинга: ИИ-оценка релевантности по описанию/постам.  
- Создание канала публикации «по категории» с подсказкой названия/описания от ИИ.  
- Статистика по каналам парсинга (объём постов, средний ER).

**Медиа и метаданные**  
- Загрузка/редактирование поста с явными метаданными (автор, источник, теги).  
- Единый формат метаданных для отображения в Telegram (подпись, ссылка на источник).

**Админ и UX**  
- Массовые операции: смена категории, тегов, удаление по выбору (использовать BULK_DELETE_POSTS).  
- Сохранённые фильтры/пресеты списка постов.  
- Экспорт постов/логов (CSV/Excel).  
- Дашборд аналитики (сводка по каналам, топ постов).

Эту карту можно использовать для планирования фич, проверки полноты прав и сценариев пользователя.