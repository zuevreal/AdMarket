# AdMarket — Progress Tracker

## 📍 Текущий статус: Wallet Sync работает ✅

---

## Этап 1: Каркас Бэкенда ✅
- [x] Структура папок `backend/`
- [x] `docker-compose.yml` (PostgreSQL 15 + Python 3.11)
- [x] `.env.example` с переменными окружения
- [x] `backend/app/core/config.py` — pydantic-settings
- [x] `backend/app/models.py` — SQLAlchemy 2.0 Async
  - User (telegram_id, language_code, role, **wallet_address**)
  - Channel (verified_stats JSONB)
  - Deal (status enum, smart_contract_address)
- [x] `.gitignore` для защиты секретов

---

## Этап 2: Telegram Bot ✅
- [x] `aiogram>=3.4.0` добавлен в зависимости
- [x] `backend/app/core/database.py` — async session manager
- [x] `backend/app/bot/setup.py` — Bot + Dispatcher
- [x] `backend/app/bot/handlers.py` — /start с upsert в БД
- [x] `backend/app/locales/{en,ru}.json` — i18n
- [x] `backend/app/main.py` — lifespan + polling интеграция
- [x] WebApp кнопка в /start (InlineKeyboardButton + WebAppInfo)

---

## Этап 3: Mini App (Frontend) ✅
- [x] Инициализация Vite + React + TypeScript
  - `frontend/package.json` с зависимостями
  - `frontend/vite.config.ts` (alias @, proxy /api)
  - `frontend/tsconfig.json`
- [x] Telegram WebApp SDK интеграция
  - `@twa-dev/sdk` в зависимостях
  - `WebApp.ready()` + `WebApp.expand()` в App.tsx
- [x] TailwindCSS с Telegram CSS переменными
  - `tailwind.config.js` (tg-bg, tg-text, tg-button)
  - `index.css` с glass-card и tg-button классами
- [x] UI компоненты (loading state, info cards)
- [x] Docker интеграция
  - `frontend/Dockerfile` (node:20-alpine)
  - Сервис `frontend` в docker-compose.yml
- [x] CloudPub tunnel (allowedHosts в vite.config.ts)
- [x] TON Connect интеграция
  - `@tonconnect/ui-react` в зависимостях
  - `TonConnectUIProvider` в main.tsx
  - `TonConnectButton` в App.tsx
  - Отображение адреса кошелька с копированием
  - `public/tonconnect-manifest.json`
- [x] **Wallet Sync с бэкендом**
  - `useTonWallet()` hook для отслеживания подключения
  - POST `/api/users/wallet` при подключении кошелька
  - Статус-индикатор (syncing, success, error)
- [ ] Компоненты UI (каталог каналов, карточка канала)

---

## Этап 3.5: API Layer ✅ (NEW)
- [x] `backend/app/api/__init__.py` — пакет API
- [x] `backend/app/api/deps.py` — Telegram initData HMAC-SHA256 валидация
- [x] `backend/app/api/users.py` — POST /wallet эндпоинт
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
7. `feat: add wallet sync API with initData validation` ← **NEW**
