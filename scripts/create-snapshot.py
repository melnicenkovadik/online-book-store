#!/usr/bin/env python3
"""
Создает снапшот указанной папки со всеми файлами и их содержимым
Usage: python scripts/create-snapshot.py [folder] [output]
Example: python scripts/create-snapshot.py src src-snapshot.md
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import argparse

# Конфигурация
CONFIG = {
    # Расширения файлов для включения в снапшот
    'include_extensions': {
        '.ts', '.tsx', '.js', '.jsx',
        '.css', '.scss', '.sass', '.less',
        '.json', '.md', '.txt', '.yml', '.yaml',
        '.html', '.xml', '.svg',
        '.env', '.gitignore', '.eslintrc', '.py'
    },
    
    # Папки и файлы для исключения
    'exclude_patterns': {
        'node_modules', '.git', '.next', 'dist', 'build',
        '.turbo', 'coverage', '.nyc_output', 'logs',
        '__pycache__', '.pytest_cache', 'venv', 'env',
        '.venv', '.DS_Store', 'Thumbs.db'
    },
    
    # Максимальный размер файла в байтах (100KB)
    'max_file_size': 100 * 1024,
    
    # Максимальная глубина вложенности
    'max_depth': 10,
}

def get_language_by_extension(filename):
    """Получает язык для подсветки синтаксиса по расширению файла"""
    ext = Path(filename).suffix.lower()
    basename = Path(filename).name.lower()
    
    lang_map = {
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.js': 'javascript', 
        '.jsx': 'jsx',
        '.py': 'python',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.less': 'less',
        '.json': 'json',
        '.md': 'markdown',
        '.html': 'html',
        '.xml': 'xml',
        '.yml': 'yaml',
        '.yaml': 'yaml',
        '.svg': 'xml',
        '.txt': 'text',
    }
    
    # Специальные случаи для файлов без расширения
    if not ext:
        if 'dockerfile' in basename:
            return 'dockerfile'
        elif 'makefile' in basename:
            return 'makefile'
        elif 'gitignore' in basename:
            return 'gitignore'
        elif 'eslintrc' in basename:
            return 'json'
        return 'text'
    
    return lang_map.get(ext, 'text')

def should_exclude(name, is_directory=False):
    """Проверяет, следует ли исключить файл/папку"""
    return name in CONFIG['exclude_patterns'] or name.startswith('.')

def should_include_file(filename):
    """Проверяет, следует ли включить файл"""
    path = Path(filename)
    ext = path.suffix.lower()
    
    # Файлы без расширения (как Dockerfile, README)
    if not ext and path.name.isupper():
        return True
    
    return ext in CONFIG['include_extensions']

def create_file_tree(dir_path, prefix='', is_last=True, depth=0):
    """Создает дерево файловой структуры"""
    if depth > CONFIG['max_depth']:
        return ''
    
    name = Path(dir_path).name
    if should_exclude(name, True):
        return ''
    
    tree = ''
    connector = '└── ' if is_last else '├── '
    tree += f"{prefix}{connector}{name}/\n"
    
    try:
        items = []
        for item in Path(dir_path).iterdir():
            if should_exclude(item.name, item.is_dir()):
                continue
            if item.is_file() and not should_include_file(item.name):
                continue
            items.append(item)
        
        items.sort(key=lambda x: (x.is_file(), x.name.lower()))
        
        for i, item in enumerate(items):
            is_last_item = i == len(items) - 1
            new_prefix = prefix + ('    ' if is_last else '│   ')
            
            if item.is_dir():
                tree += create_file_tree(item, new_prefix, is_last_item, depth + 1)
            else:
                file_connector = '└── ' if is_last_item else '├── '
                tree += f"{new_prefix}{file_connector}{item.name}\n"
                
    except PermissionError:
        print(f"⚠️  Нет доступа к директории {dir_path}")
    except Exception as e:
        print(f"⚠️  Ошибка при чтении директории {dir_path}: {e}")
    
    return tree

def collect_files(dir_path, depth=0):
    """Собирает все файлы рекурсивно"""
    if depth > CONFIG['max_depth']:
        return []
    
    files = []
    try:
        for item in Path(dir_path).rglob('*'):
            if item.is_file():
                # Проверяем путь на исключения
                parts = item.parts
                if any(should_exclude(part, True) for part in parts):
                    continue
                
                if not should_include_file(item.name):
                    continue
                
                try:
                    if item.stat().st_size <= CONFIG['max_file_size']:
                        files.append(item)
                    else:
                        size_kb = item.stat().st_size // 1024
                        print(f"⚠️  Файл {item} пропущен (размер {size_kb} KB)")
                except Exception as e:
                    print(f"⚠️  Не удалось получить информацию о файле {item}: {e}")
                    
    except Exception as e:
        print(f"⚠️  Ошибка при сборе файлов из {dir_path}: {e}")
    
    return files

def create_snapshot(source_dir, output_file):
    """Создает снапшот"""
    source_path = Path(source_dir).resolve()
    source_name = source_path.name
    
    if not source_path.exists():
        print(f"❌ Папка {source_dir} не существует")
        sys.exit(1)
    
    # Создаем папку snapshots если не существует
    snapshots_dir = Path('snapshots')
    if not snapshots_dir.exists():
        snapshots_dir.mkdir(parents=True, exist_ok=True)
        print(f"📁 Создана папка: {snapshots_dir}")
    
    # Корректируем путь к выходному файлу
    final_output_file = snapshots_dir / Path(output_file).name
    
    print(f"📁 Создание снапшота папки: {source_dir}")
    print(f"📄 Выходной файл: {final_output_file}")
    
    markdown = f"# Снапшот папки {source_name}\n\n"
    markdown += f"*Создано: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}*\n\n"
    
    # Добавляем дерево структуры
    print('🌳 Генерация дерева файлов...')
    markdown += '## Структура файлов\n\n```\n'
    markdown += f"{source_name}/\n"
    
    try:
        items = []
        for item in source_path.iterdir():
            if should_exclude(item.name, item.is_dir()):
                continue
            if item.is_file() and not should_include_file(item.name):
                continue
            items.append(item)
        
        items.sort(key=lambda x: (x.is_file(), x.name.lower()))
        
        for i, item in enumerate(items):
            is_last = i == len(items) - 1
            
            if item.is_dir():
                markdown += create_file_tree(item, '', is_last, 1)
            else:
                connector = '└── ' if is_last else '├── '
                markdown += f"{connector}{item.name}\n"
                
    except Exception as e:
        print(f"❌ Ошибка при создании дерева: {e}")
    
    markdown += '```\n\n---\n\n'
    
    # Собираем все файлы
    print('📋 Сбор файлов...')
    files = collect_files(source_path)
    print(f"📊 Найдено файлов: {len(files)}")
    
    if not files:
        print('⚠️  Файлы для включения в снапшот не найдены')
        return
    
    # Добавляем содержимое файлов
    markdown += '## Содержимое файлов\n\n'
    
    files.sort(key=lambda x: str(x))
    
    for i, file_path in enumerate(files):
        relative_path = file_path.relative_to(source_path)
        normalized_path = str(relative_path).replace('\\', '/')  # Для Windows
        
        print(f"📄 Обработка [{i + 1}/{len(files)}]: {normalized_path}")
        
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            language = get_language_by_extension(file_path.name)
            
            markdown += f"### {normalized_path}\n"
            markdown += f"```{language}\n"
            markdown += content
            markdown += '\n```\n\n'
            
        except Exception as e:
            print(f"⚠️  Не удалось прочитать файл {file_path}: {e}")
            markdown += f"### {normalized_path}\n"
            markdown += f"*Ошибка чтения файла: {e}*\n\n"
    
    # Записываем результат
    try:
        final_output_file.write_text(markdown, encoding='utf-8')
        print(f"✅ Снапшот создан: {final_output_file}")
        
        size_kb = final_output_file.stat().st_size // 1024
        print(f"📊 Размер файла: {size_kb} KB")
        
    except Exception as e:
        print(f"❌ Ошибка записи файла: {e}")
        sys.exit(1)

def main():
    """Главная функция"""
    parser = argparse.ArgumentParser(
        description='📸 Создание снапшота папки с кодом',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Примеры:
  python scripts/create-snapshot.py src src-snapshot.md
  python scripts/create-snapshot.py components components-snapshot.md  
  python scripts/create-snapshot.py . full-project-snapshot.md

Настройки:
  Поддерживаемые расширения: {', '.join(sorted(CONFIG['include_extensions']))}
  Исключаемые папки: {', '.join(sorted(CONFIG['exclude_patterns']))}
  Максимальный размер файла: {CONFIG['max_file_size'] // 1024} KB
  Максимальная глубина: {CONFIG['max_depth']} уровней
        """
    )
    
    parser.add_argument('folder', nargs='?', default='src',
                       help='Папка для создания снапшота (по умолчанию: src)')
    parser.add_argument('output', nargs='?', 
                       help='Выходной файл (по умолчанию: [папка]-snapshot.md)')
    
    args = parser.parse_args()
    
    if not args.output:
        folder_name = Path(args.folder).name
        args.output = f"{folder_name}-snapshot.md"
    
    print('📸 Создание снапшота...')
    create_snapshot(args.folder, args.output)

if __name__ == '__main__':
    main()
