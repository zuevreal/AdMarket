# AdMarket — Progress Tracker

## 📍 Текущий статус: Этап 2 завершён

---

## Этап 1: Каркас Бэкенда ✅
- [x] Структура папок `backend/`
- [x] `docker-compose.yml` (PostgreSQL 15 + Python 3.11)
- [x] `.env.example` с переменными окружения
- [x] `backend/app/core/config.py` — pydantic-settings
- [x] `backend/app/models.py` — SQLAlchemy 2.0 Async
  - User (telegram_id, language_code, role)
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

---

## Этап 3: Mini App (Frontend) 🔜
- [ ] Инициализация Vite + React + TypeScript
- [ ] Telegram WebApp SDK интеграция
- [ ] Компоненты UI (каталог каналов, карточка канала)
- [ ] TON Connect интеграция

---

## Этап 4: Smart Contracts 🔜
- [ ] Escrow контракт на Tact
- [ ] Интеграция с бэкендом

---

## Коммиты
1. `feat: scaffold backend with FastAPI, Docker, and SQLAlchemy models`
