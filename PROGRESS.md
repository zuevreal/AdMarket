# AdMarket — Progress Tracker

## 📍 Текущий статус: Channel Edit & Deep Link готов ✅

---

## Этап 1: Каркас Бэкенда ✅
- [x] Структура папок `backend/`
- [x] `docker-compose.yml` (PostgreSQL 15 + Python 3.11)
- [x] `.env.example` с переменными окружения
- [x] `backend/app/core/config.py` — pydantic-settings
- [x] `backend/app/models.py` — SQLAlchemy 2.0 Async
  - User (telegram_id, language_code, role, **wallet_address**)
  - Channel (verified_stats JSONB, **price_per_post**)
  - Deal (status enum, smart_contract_address)
- [x] `.gitignore` для защиты секретов

---

## Этап 2: Telegram Bot ✅
- [x] `aiogram>=3.4.0` добавлен в зависимости
- [x] `backend/app/core/database.py` — async session manager
- [x] `backend/app/bot/setup.py` — Bot + Dispatcher (без circular import)
- [x] `backend/app/bot/handlers.py` — /start с upsert в БД
- [x] `backend/app/locales/{en,ru}.json` — i18n (+ channel_auto_connected)
- [x] `backend/app/main.py` — lifespan + polling интеграция
- [x] WebApp кнопка в /start (InlineKeyboardButton + WebAppInfo)
- [x] **Auto-Connect Deep Link** ← **NEW**
  - `ChatMemberUpdated` handler для авто-регистрации каналов
  - DM-уведомление при добавлении бота как админа

---

## Этап 3: Mini App (Frontend) ✅
- [x] Инициализация Vite + React + TypeScript
- [x] Telegram WebApp SDK интеграция
- [x] TailwindCSS с Telegram CSS переменными
- [x] UI компоненты (loading state, info cards)
- [x] Docker интеграция
- [x] CloudPub tunnel (allowedHosts в vite.config.ts)
- [x] TON Connect интеграция
- [x] **Wallet Sync с бэкендом**
- [x] **Frontend i18n (локализация)** — 40+ ключей
- [x] **Channel Management UI**
  - `pages/MyChannels.tsx` — список каналов
  - `components/AddChannelModal.tsx` — добавление/редактирование
  - Навигация Home ↔ My Channels в App.tsx
  - Deep link кнопка "Выбрать канал" (`WebApp.openTelegramLink()`)
  - Редактирование цены канала через ту же модалку ← **NEW**
  - Форматирование цены (убраны лишние нули) ← **NEW**

---

## Этап 3.5: API Layer ✅
- [x] `backend/app/api/__init__.py` — пакет API
- [x] `backend/app/api/deps.py` — Telegram initData HMAC-SHA256 валидация
- [x] `backend/app/api/users.py` — POST /wallet эндпоинт
- [x] **`backend/app/api/channels.py`**
  - POST `/api/channels/` — **Upsert** (создать или обновить) ← **NEW**
  - GET `/api/channels/my` — мои каналы
  - DELETE `/api/channels/{id}` — удалить канал
- [x] CORS middleware в main.py
- [x] Vite proxy `/api` → `backend:8000`
- [x] Auto-create tables on startup (`Base.metadata.create_all`)

---

## Этап 4: Smart Contracts 🔜
- [ ] Escrow контракт на Tact
- [ ] Интеграция с бэкендом

---

## Коммиты
1. `feat: scaffold backend with FastAPI, Docker, and SQLAlchemy models`
2. `feat: add Telegram bot with aiogram, /start handler and i18n`
3. `feat: add React frontend with Vite, TailwindCSS and Telegram WebApp SDK`
4. `feat: add WebApp button with inline keyboard to /start command`
5. `chore: configure Vite allowedHosts for CloudPub tunnel`
6. `feat: add TON Connect wallet integration`
7. `feat: add wallet sync API with initData validation`
8. `feat: add frontend i18n with Telegram language detection`
9. `feat: add channel management with bot admin verification`
10. `feat: add auto-connect deep link and channel editing` ← **NEXT**
