# AdMarket — Progress Tracker

## 📍 Текущий статус: Marketplace + User Auto-Registration ✅

---

## Этап 1: Каркас Бэкенда ✅
- [x] Структура папок `backend/`
- [x] `docker-compose.yml` (PostgreSQL 15 + Python 3.11)
- [x] `.env.example` с переменными окружения
- [x] `backend/app/core/config.py` — pydantic-settings
- [x] `backend/app/models.py` — SQLAlchemy 2.0 Async
  - User (telegram_id, language_code, role, **wallet_address**)
  - Channel (verified_stats JSONB, **price_per_post**, **category**)
  - Deal (status enum, smart_contract_address)
- [x] `.gitignore` для защиты секретов

---

## Этап 2: Telegram Bot ✅
- [x] `aiogram>=3.4.0` добавлен в зависимости
- [x] `backend/app/core/database.py` — async session manager
- [x] `backend/app/bot/setup.py` — Bot + Dispatcher
- [x] `backend/app/bot/handlers.py` — /start с upsert в БД
- [x] `backend/app/locales/{en,ru}.json` — i18n
- [x] `backend/app/main.py` — lifespan + polling
- [x] WebApp кнопка в /start (InlineKeyboardButton + WebAppInfo)
- [x] **Auto-Connect Deep Link**
  - `ChatMemberUpdated` handler для авто-регистрации каналов
  - DM-уведомление при добавлении бота как админа

---

## Этап 3: Mini App (Frontend) ✅

### Базовый функционал
- [x] Vite + React + TypeScript
- [x] Telegram WebApp SDK интеграция
- [x] TailwindCSS с Telegram CSS переменными
- [x] Docker интеграция (dev-сервер в контейнере)
- [x] CloudPub tunnel (allowedHosts в vite.config.ts)

### TON Connect 💎
- [x] `@tonconnect/ui-react` интеграция
- [x] Кнопка подключения кошелька
- [x] Синхронизация wallet_address с бэкендом

### Локализация 🌍
- [x] `react-i18next` настроен
- [x] 60+ ключей локализации (EN/RU)
- [x] Автоопределение языка из WebApp

### Управление каналами 📺
- [x] `pages/MyChannels.tsx` — список каналов пользователя
- [x] `components/AddChannelModal.tsx` — добавление/редактирование
  - Выбор категории канала (dropdown)
  - Установка цены за пост
  - Верификация прав бота (POST → бэкенд → Telegram API)
- [x] Deep link кнопка «Выбрать канал из Telegram»
  - `WebApp.openTelegramLink()` + haptic feedback
  - Минимальные права: `admin=post_messages`
- [x] Редактирование существующего канала
- [x] Удаление канала
- [x] Форматирование цены (`parseFloat().toString()`)

### Витрина каналов (Marketplace) 🛒 — NEW!
- [x] `pages/FindChannels.tsx` — публичный каталог
- [x] **Поиск** по названию/описанию с debounce (300ms)
- [x] **Фильтр по категории** (crypto, business, tech, news, entertainment, other)
- [x] **Фильтр по цене** (min/max диапазон в TON)
- [x] Карточки каналов с подписчиками, ценой, категорией
- [x] Кнопка «Купить рекламу» (заглушка для будущего Deal)
- [x] Навигация Home → Find Channels

---

## Этап 3.5: API Layer ✅

### Аутентификация
- [x] `deps.py` — HMAC-SHA256 валидация initData
- [x] **User Auto-Registration** — создание пользователя при первом запросе

### Эндпоинты
- [x] `POST /api/users/wallet` — сохранение wallet_address (upsert)
- [x] `POST /api/channels/` — добавление канала (upsert с category)
- [x] `GET /api/channels/my` — список каналов пользователя
- [x] `DELETE /api/channels/{id}` — удаление канала
- [x] **`GET /api/channels/market`** — публичный каталог с фильтрами — NEW!
  - `?query=` — текстовый поиск
  - `?category=` — фильтр по категории
  - `?min_price=` / `?max_price=` — диапазон цен

### Инфраструктура
- [x] CORS middleware
- [x] Vite proxy `/api` → `backend:8000`
- [x] Auto-create tables on startup

---

## Этап 4: Smart Contracts 🔜
- [ ] Escrow контракт на Tact (Escrow.tact)
- [ ] Интеграция с бэкендом (создание Deal)
- [ ] Оплата через TON Connect

---

## Последние фиксы (Session 4)
- [x] **User Auto-Registration** — пользователь создаётся автоматически
- [x] **Channel Upsert** — обновление канала вместо ошибки "Already registered"
- [x] **Deep Link Stabilization** — haptic feedback + 300ms delay + try-catch
- [x] **Buy Ad Button** — заглушка с `WebApp.showAlert()`

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
10. `feat: add auto-connect deep link and channel editing`
11. `feat: add marketplace showcase with categories and filters`
12. `fix: user auto-registration and upsert logic`
13. `fix: deep link stabilization with haptic feedback` ← NEW
