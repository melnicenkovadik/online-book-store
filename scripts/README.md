# 📸 Скрипты создания снапшотов

Набор скриптов для создания снапшотов папок с исходным кодом. Снапшот включает в себя структуру папок и содержимое всех файлов в удобном markdown формате.

## 🚀 Быстрый старт

```bash
# JavaScript/Node.js версия
node scripts/create-snapshot.js src src-snapshot.md

# Python версия  
python3 scripts/create-snapshot.py src src-snapshot.md

# Bash версия (Unix/Linux/macOS)
./scripts/create-snapshot.sh src src-snapshot.md
```

**📁 Все снапшоты автоматически сохраняются в папку `snapshots/`**

## 📋 Доступные скрипты

### 1. Node.js версия (`create-snapshot.js`)
**Требования:** Node.js
**Особенности:**
- Самая полная версия с расширенными настройками
- Поддержка всех платформ
- Гибкая конфигурация

```bash
# Основное использование
node scripts/create-snapshot.js [папка] [выходной_файл]

# Примеры (файлы сохраняются в snapshots/)
node scripts/create-snapshot.js src src-snapshot.md
node scripts/create-snapshot.js components components-snapshot.md  
node scripts/create-snapshot.js . full-project-snapshot.md

# Справка
node scripts/create-snapshot.js --help
```

### 2. Python версия (`create-snapshot.py`)
**Требования:** Python 3.6+
**Особенности:**
- Кроссплатформенная
- Простая в использовании
- Хорошая производительность

```bash
# Основное использование
python scripts/create-snapshot.py [папка] [выходной_файл]

# Примеры (файлы сохраняются в snapshots/)
python3 scripts/create-snapshot.py src src-snapshot.md
python3 scripts/create-snapshot.py components components-snapshot.md
python3 scripts/create-snapshot.py . full-project-snapshot.md

# Справка
python scripts/create-snapshot.py --help
```

### 3. Bash версия (`create-snapshot.sh`)
**Требования:** Bash (Unix/Linux/macOS)
**Особенности:**
- Нативная для Unix-систем
- Быстрая работа
- Минимальные зависимости

```bash
# Основное использование
./scripts/create-snapshot.sh [папка] [выходной_файл]

# Примеры (файлы сохраняются в snapshots/)
./scripts/create-snapshot.sh src src-snapshot.md
./scripts/create-snapshot.sh components components-snapshot.md
./scripts/create-snapshot.sh . full-project-snapshot.md

# Справка
./scripts/create-snapshot.sh --help
```

## ⚙️ Конфигурация

Все скрипты используют похожие настройки по умолчанию:

### Поддерживаемые расширения файлов
- **Код:** `.ts`, `.tsx`, `.js`, `.jsx`, `.py`
- **Стили:** `.css`, `.scss`, `.sass`, `.less`
- **Данные:** `.json`, `.yml`, `.yaml`, `.xml`
- **Документация:** `.md`, `.txt`, `.html`
- **Конфигурация:** `.env`, `.gitignore`, `.eslintrc`
- **Без расширения:** `README`, `Dockerfile`, `Makefile`

### Исключаемые папки
- `node_modules`, `.git`, `.next`, `dist`, `build`
- `__pycache__`, `.pytest_cache`, `venv`, `.venv`
- `.turbo`, `coverage`, `.nyc_output`, `logs`
- `.DS_Store`, `Thumbs.db`

### Ограничения
- **Максимальный размер файла:** 100 KB
- **Максимальная глубина вложенности:** 10 уровней

## 📁 Структура вывода

Все снапшоты сохраняются в папку `snapshots/` в корне проекта:

```
project/
├── snapshots/           # 📁 Папка со снапшотами
│   ├── .gitkeep        # 📄 Для сохранения папки в git
│   ├── src-snapshot.md      # 📄 Снапшот папки src
│   ├── components-snapshot.md   # 📄 Снапшот компонентов
│   └── api-snapshot.md      # 📄 Снапшот API роутов
└── scripts/
    ├── create-snapshot.js   # 🛠 Node.js скрипт
    ├── create-snapshot.py   # 🛠 Python скрипт  
    └── create-snapshot.sh   # 🛠 Bash скрипт
```

## 📖 Формат снапшота

Созданный снапшот содержит:

1. **Заголовок с датой создания**
2. **Дерево файловой структуры**
   ```
   src/
   ├── components/
   │   ├── Button.tsx
   │   └── Modal.tsx
   └── utils/
       └── helpers.ts
   ```

3. **Содержимое каждого файла** с подсветкой синтаксиса
   ```typescript
   // src/components/Button.tsx
   export function Button() {
     return <button>Click me</button>;
   }
   ```

## 🛠 Настройка скриптов

### Node.js версия
Редактируйте объект `CONFIG` в `scripts/create-snapshot.js`:

```javascript
const CONFIG = {
  includeExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludePatterns: ['node_modules', '.git'],
  maxFileSize: 100 * 1024, // 100KB
  maxDepth: 10,
};
```

### Python версия
Редактируйте словарь `CONFIG` в `scripts/create-snapshot.py`:

```python
CONFIG = {
    'include_extensions': {'.ts', '.tsx', '.js', '.jsx'},
    'exclude_patterns': {'node_modules', '.git'},
    'max_file_size': 100 * 1024,  # 100KB
    'max_depth': 10,
}
```

### Bash версия
Редактируйте переменные в начале `scripts/create-snapshot.sh`:

```bash
INCLUDE_EXTENSIONS=("ts" "tsx" "js" "jsx")
EXCLUDE_PATTERNS=("node_modules" ".git")
MAX_FILE_SIZE=$((100 * 1024))  # 100KB
```

## 💡 Примеры использования

### Снапшот всего проекта
```bash
node scripts/create-snapshot.js . project-full-snapshot.md
# Создает: snapshots/project-full-snapshot.md
```

### Снапшот только компонентов
```bash
node scripts/create-snapshot.js src/components components-snapshot.md
# Создает: snapshots/components-snapshot.md
```

### Снапшот API роутов
```bash
node scripts/create-snapshot.js src/api api-snapshot.md
# Создает: snapshots/api-snapshot.md
```

### Снапшот конкретной функциональности
```bash
node scripts/create-snapshot.js src/features/auth auth-feature-snapshot.md
# Создает: snapshots/auth-feature-snapshot.md
```

## 🔧 Интеграция с проектом

### Добавление в package.json
```json
{
  "scripts": {
    "snapshot:src": "node scripts/create-snapshot.js src src-snapshot.md",
    "snapshot:components": "node scripts/create-snapshot.js src/components components-snapshot.md", 
    "snapshot:uikit": "node scripts/create-snapshot.js src/components/uikit uikit-snapshot.md",
    "snapshot:api": "node scripts/create-snapshot.js src/app/api api-snapshot.md",
    "snapshot:full": "node scripts/create-snapshot.js . project-snapshot.md"
  }
}
```

### Использование через npm
```bash
npm run snapshot:src        # → snapshots/src-snapshot.md
npm run snapshot:components # → snapshots/components-snapshot.md
npm run snapshot:uikit     # → snapshots/uikit-snapshot.md
npm run snapshot:api       # → snapshots/api-snapshot.md
npm run snapshot:full      # → snapshots/project-snapshot.md
```

### Добавление в Makefile
```makefile
snapshot-src:
	node scripts/create-snapshot.js src src-snapshot.md

snapshot-components:
	node scripts/create-snapshot.js src/components components-snapshot.md

snapshot-uikit:
	node scripts/create-snapshot.js src/components/uikit uikit-snapshot.md

snapshot-api:
	node scripts/create-snapshot.js src/app/api api-snapshot.md

snapshot-full:
	node scripts/create-snapshot.js . project-snapshot.md
```

### Использование через make
```bash
make snapshot-src        # → snapshots/src-snapshot.md
make snapshot-components # → snapshots/components-snapshot.md
make snapshot-uikit     # → snapshots/uikit-snapshot.md
make snapshot-api       # → snapshots/api-snapshot.md
make snapshot-full      # → snapshots/project-snapshot.md
```

## 🚨 Лучшие практики

1. **Автоматическое сохранение:** Все файлы сохраняются в `snapshots/`
2. **Исключайте ненужные файлы:** Добавляйте паттерны в `excludePatterns`
3. **Ограничивайте размер:** Большие файлы автоматически пропускаются
4. **Используйте осмысленные имена:** `feature-auth-snapshot.md` лучше чем `snapshot.md`
5. **Документируйте назначение:** Добавляйте комментарии в снапшоты
6. **Версионирование:** Включайте дату/версию в имя файла
7. **Git ignore:** Снапшоты автоматически добавлены в `.gitignore`

## 🎯 Кейсы использования

- **Документирование архитектуры**
- **Код-ревью и аудит**
- **Обучение и онбординг**
- **Создание техдокументации**
- **Архивирование состояния проекта**
- **Передача кода заказчику**
- **Анализ кодовой базы**

## ⚡ Производительность

| Размер проекта | Node.js | Python | Bash |
|---------------|---------|--------|------|
| Маленький (<50 файлов) | ~1 сек | ~1 сек | ~0.5 сек |
| Средний (100-500 файлов) | ~3 сек | ~2 сек | ~1 сек |
| Большой (>1000 файлов) | ~10 сек | ~5 сек | ~3 сек |

## 🐛 Решение проблем

### Скрипт не запускается
```bash
# Для bash скрипта - сделайте исполняемым
chmod +x scripts/create-snapshot.sh

# Для Python - проверьте версию
python --version  # Должен быть 3.6+

# Для Node.js - проверьте установку
node --version
```

### Файлы не включаются
- Проверьте расширения в конфигурации
- Убедитесь что файл не превышает лимит размера
- Проверьте что папка не в списке исключений

### Большой размер выходного файла
- Увеличьте фильтрацию файлов
- Уменьшите `maxFileSize`
- Добавьте больше паттернов в `excludePatterns`

---

*💡 Совет: Начните с небольшой папки чтобы протестировать настройки, а затем применяйте к большим проектам.*
