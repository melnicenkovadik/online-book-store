# 📚 Интернет-магазин учебников

Современный интернет-магазин учебников построенный на Next.js 15 с TypeScript.

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Открыть http://localhost:3000
```

## 📸 Создание снапшотов кода

Проект включает удобные скрипты для создания снапшотов кода:

```bash
# Снапшот всей папки src
npm run snapshot:src

# Снапшот только компонентов
npm run snapshot:components

# Снапшот UI Kit
npm run snapshot:uikit

# Снапшот API роутов
npm run snapshot:api

# Полный снапшот проекта
npm run snapshot:full
```

Подробнее смотрите в [scripts/README.md](scripts/README.md)

## 🛠 Технологии

- **Framework:** Next.js 15 с App Router
- **Language:** TypeScript
- **UI:** React с Radix UI компонентами
- **Styling:** SCSS модули
- **Database:** MongoDB с Mongoose
- **State Management:** Zustand
- **Data Fetching:** SWR
- **Linting:** Biome

## 📁 Структура проекта

```
src/
├── app/                 # Next.js App Router страницы
├── components/          # React компоненты
├── lib/                 # Утилиты и модели БД
├── services/            # API сервисы
├── store/               # Zustand stores
└── types/               # TypeScript типы
```

## 🗄 База данных

Проект использует MongoDB. Установите переменную окружения:

```bash
MONGODB_URI=mongodb://localhost:27017/bookstore
```

## 📋 Доступные команды

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для продакшена
npm run start        # Запуск продакшен сервера
npm run lint         # Проверка кода
npm run format       # Форматирование кода

```
