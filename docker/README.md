# Деплой через Docker

Стек поднимает всё нужное для проекта **«Щит Справедливости»**:

| Сервис | Назначение |
|--------|------------|
| **nginx** | Единая точка входа: сайт (Next.js), API (`/api`), файлы (`/storage`), WebSocket (`/app` → Soketi) |
| **frontend** | Next.js (production build) |
| **backend** | Laravel (PHP-FPM), миграции при старте |
| **queue** | Очередь задач (`php artisan queue:work`) |
| **mysql** | База данных |
| **redis** | Кэш, сессии, очередь |
| **soketi** | Чаты в реальном времени (Pusher-протокол) |

## Схема

```text
Браузер → nginx:80
            ├─ /          → frontend:3000 (Next.js)
            ├─ /api       → backend:9000 (Laravel)
            ├─ /storage   → файлы из volume
            └─ /app/      → soketi:6001 (WebSocket)
```

## Быстрый старт на сервере

### 1. Установите Docker

На Ubuntu/Debian:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# перелогиньтесь
```

Нужны **Docker Compose v2** (`docker compose`, не `docker-compose`).

### 2. Загрузите проект на сервер

```bash
git clone <ваш-репозиторий> diplomaproject
cd diplomaproject
```

### 3. Создайте `.env` в корне репозитория

```bash
cp .env.docker.example .env
nano .env
```

Обязательно замените:

- `APP_KEY` — ключ Laravel (см. команду в `.env.docker.example`)
- `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`
- `APP_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` — ваш домен, например `https://example.ru`
- `MAIL_*` — если нужна почта
- для HTTPS позже: `NEXT_PUBLIC_PUSHER_SCHEME=https`, `PUSHER_SCHEME=https`

**Важно:** при одном домене `NEXT_PUBLIC_API_URL` = `APP_URL` (без `:8000`). API идёт через nginx по пути `/api`.

### 4. Соберите и запустите

```bash
docker compose build
docker compose up -d
```

Первый запуск: backend выполнит `migrate`. Сидеры (демо-данные) — вручную:

```bash
docker compose exec backend php artisan db:seed --force
```

### 5. Проверка

Откройте в браузере `http://IP_СЕРВЕРА` (или домен, если уже настроен DNS).

Логи:

```bash
docker compose logs -f nginx backend frontend
```

## HTTPS (Let's Encrypt)

Проще всего поставить **Caddy** или **certbot** перед nginx, либо использовать Traefik. Минимальный вариант — отдельный reverse-proxy на хосте.

После HTTPS обновите в `.env`:

- `APP_URL=https://ваш-домен.ru`
- `FRONTEND_URL=https://ваш-домен.ru`
- `NEXT_PUBLIC_*` с `https`
- `NEXT_PUBLIC_PUSHER_PORT=443`
- `NEXT_PUBLIC_PUSHER_SCHEME=https`
- `CORS_ALLOWED_ORIGINS=https://ваш-домен.ru`

Пересоберите фронт (в URL зашиваются при `build`):

```bash
docker compose build frontend --no-cache
docker compose up -d
```

## Полезные команды

```bash
# Остановить
docker compose down

# Остановить и удалить БД (осторожно!)
docker compose down -v

# Войти в контейнер Laravel
docker compose exec backend sh

# Очистить кэш конфигурации
docker compose exec backend php artisan config:clear
docker compose exec backend php artisan config:cache

# Только Soketi (как раньше для разработки)
docker compose -f docker-compose.soketi.yml up
```

## Локальная разработка

Docker для прода; локально по-прежнему можно:

- `cd frontend && npm run dev`
- `cd backend && php artisan serve`
- `npm run dev:soketi` — только WebSocket

## Частые проблемы

| Симптом | Что проверить |
|---------|----------------|
| «Failed to fetch» | `NEXT_PUBLIC_API_URL` совпадает с адресом в браузере; nginx и backend запущены |
| 502 Bad Gateway | `docker compose ps`, логи `backend` / `frontend` |
| Чаты не работают | `BROADCAST_DRIVER=pusher`, ключи Pusher совпадают в backend и soketi, `NEXT_PUBLIC_PUSHER_HOST` = домен сайта |
| 500 на API | `docker compose exec backend php artisan migrate:status`, права на `storage` |
| Пустая БД | `docker compose exec backend php artisan db:seed` |

## Файлы

- `docker-compose.yml` — основной стек
- `docker-compose.soketi.yml` — только Soketi (для dev)
- `backend/Dockerfile`, `frontend/Dockerfile`
- `docker/nginx/default.conf` — маршрутизация
- `.env.docker.example` — шаблон переменных
