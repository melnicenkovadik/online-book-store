#!/bin/bash

# Создает снапшот указанной папки со всеми файлами и их содержимым
# Usage: ./scripts/create-snapshot.sh [folder] [output]
# Example: ./scripts/create-snapshot.sh src src-snapshot.md

set -euo pipefail

# Конфигурация
INCLUDE_EXTENSIONS=("ts" "tsx" "js" "jsx" "css" "scss" "sass" "json" "md" "txt" "html" "xml" "yml" "yaml" "py")
EXCLUDE_PATTERNS=("node_modules" ".git" ".next" "dist" "build" "__pycache__" ".DS_Store" "Thumbs.db")
MAX_FILE_SIZE=$((100 * 1024))  # 100KB

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Функции
log_info() {
    echo -e "${BLUE}$1${NC}"
}

log_success() {
    echo -e "${GREEN}$1${NC}"
}

log_warning() {
    echo -e "${YELLOW}$1${NC}"
}

log_error() {
    echo -e "${RED}$1${NC}"
}

# Проверка, нужно ли исключить файл/папку
should_exclude() {
    local name="$1"
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        if [[ "$name" == "$pattern" ]]; then
            return 0
        fi
    done
    return 1
}

# Проверка, нужно ли включить файл
should_include_file() {
    local filename="$1"
    local extension="${filename##*.}"
    
    # Файлы без расширения (README, Dockerfile и т.д.)
    if [[ "$filename" == "$extension" ]]; then
        if [[ "$filename" =~ ^[A-Z][A-Z_]*$ ]]; then
            return 0
        fi
        return 1
    fi
    
    for ext in "${INCLUDE_EXTENSIONS[@]}"; do
        if [[ "$extension" == "$ext" ]]; then
            return 0
        fi
    done
    return 1
}

# Определение языка для подсветки синтаксиса
get_language() {
    local filename="$1"
    local extension="${filename##*.}"
    local basename=$(basename "$filename")
    
    case "$extension" in
        "ts") echo "typescript" ;;
        "tsx") echo "tsx" ;;
        "js") echo "javascript" ;;
        "jsx") echo "jsx" ;;
        "py") echo "python" ;;
        "css") echo "css" ;;
        "scss") echo "scss" ;;
        "sass") echo "sass" ;;
        "json") echo "json" ;;
        "md") echo "markdown" ;;
        "html") echo "html" ;;
        "xml") echo "xml" ;;
        "yml"|"yaml") echo "yaml" ;;
        "txt") echo "text" ;;
        *) 
            if [[ "$basename" =~ [Dd]ockerfile ]]; then
                echo "dockerfile"
            elif [[ "$basename" =~ [Mm]akefile ]]; then
                echo "makefile"
            elif [[ "$basename" =~ gitignore ]]; then
                echo "gitignore"
            else
                echo "text"
            fi
            ;;
    esac
}

# Создание дерева файловой структуры
create_tree() {
    local dir="$1"
    local prefix="$2"
    local is_last="$3"
    
    if should_exclude "$(basename "$dir")"; then
        return
    fi
    
    local name=$(basename "$dir")
    local connector
    if [[ "$is_last" == "true" ]]; then
        connector="└── "
    else
        connector="├── "
    fi
    
    echo "${prefix}${connector}${name}/"
    
    if [[ ! -d "$dir" ]]; then
        return
    fi
    
    local items=()
    while IFS= read -r -d '' item; do
        local basename_item=$(basename "$item")
        if should_exclude "$basename_item"; then
            continue
        fi
        if [[ -f "$item" ]] && ! should_include_file "$basename_item"; then
            continue
        fi
        items+=("$item")
    done < <(find "$dir" -maxdepth 1 -mindepth 1 -print0 | sort -z)
    
    local count=${#items[@]}
    for ((i=0; i<count; i++)); do
        local item="${items[$i]}"
        local is_last_item=$([[ $((i+1)) -eq $count ]] && echo "true" || echo "false")
        local new_prefix
        if [[ "$is_last" == "true" ]]; then
            new_prefix="${prefix}    "
        else
            new_prefix="${prefix}│   "
        fi
        
        if [[ -d "$item" ]]; then
            create_tree "$item" "$new_prefix" "$is_last_item"
        else
            local file_connector
            if [[ "$is_last_item" == "true" ]]; then
                file_connector="└── "
            else
                file_connector="├── "
            fi
            echo "${new_prefix}${file_connector}$(basename "$item")"
        fi
    done
}

# Сбор всех файлов рекурсивно
collect_files() {
    local source_dir="$1"
    local -a files=()
    
    while IFS= read -r -d '' file; do
        local rel_path="${file#$source_dir/}"
        
        # Проверяем путь на исключения
        local skip=false
        IFS='/' read -ra path_parts <<< "$rel_path"
        for part in "${path_parts[@]}"; do
            if should_exclude "$part"; then
                skip=true
                break
            fi
        done
        
        if [[ "$skip" == "true" ]]; then
            continue
        fi
        
        if ! should_include_file "$(basename "$file")"; then
            continue
        fi
        
        local file_size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo 0)
        if [[ $file_size -gt $MAX_FILE_SIZE ]]; then
            log_warning "Файл $file пропущен (размер $((file_size / 1024)) KB)"
            continue
        fi
        
        files+=("$file")
    done < <(find "$source_dir" -type f -print0)
    
    printf '%s\n' "${files[@]}" | sort
}

# Показ справки
show_help() {
    cat << EOF
📸 Скрипт создания снапшотов папок

Использование:
  ./scripts/create-snapshot.sh [папка] [выходной_файл]

Примеры:
  ./scripts/create-snapshot.sh src src-snapshot.md
  ./scripts/create-snapshot.sh components components-snapshot.md
  ./scripts/create-snapshot.sh . full-project-snapshot.md

Опции:
  -h, --help     Показать эту справку

Настройки:
  Поддерживаемые расширения: ${INCLUDE_EXTENSIONS[*]}
  Исключаемые папки: ${EXCLUDE_PATTERNS[*]}
  Максимальный размер файла: $((MAX_FILE_SIZE / 1024)) KB
EOF
}

# Основная функция создания снапшота
create_snapshot() {
    local source_dir="$1"
    local output_file="$2"
    
    if [[ ! -d "$source_dir" ]]; then
        log_error "❌ Папка $source_dir не существует"
        exit 1
    fi
    
    # Создаем папку snapshots если не существует
    local snapshots_dir="snapshots"
    if [[ ! -d "$snapshots_dir" ]]; then
        mkdir -p "$snapshots_dir"
        log_info "📁 Создана папка: $snapshots_dir"
    fi
    
    # Корректируем путь к выходному файлу
    local final_output_file="$snapshots_dir/$(basename "$output_file")"
    
    local source_name=$(basename "$source_dir")
    local absolute_source_dir=$(cd "$source_dir" && pwd)
    
    log_info "📁 Создание снапшота папки: $source_dir"
    log_info "📄 Выходной файл: $final_output_file"
    
    # Создаем начало markdown файла
    {
        echo "# Снапшот папки $source_name"
        echo ""
        echo "*Создано: $(date '+%d.%m.%Y %H:%M:%S')*"
        echo ""
        echo "## Структура файлов"
        echo ""
        echo '```'
        echo "$source_name/"
    } > "$final_output_file"
    
    # Генерируем дерево
    log_info "🌳 Генерация дерева файлов..."
    
    local items=()
    while IFS= read -r -d '' item; do
        local basename_item=$(basename "$item")
        if should_exclude "$basename_item"; then
            continue
        fi
        if [[ -f "$item" ]] && ! should_include_file "$basename_item"; then
            continue
        fi
        items+=("$item")
    done < <(find "$absolute_source_dir" -maxdepth 1 -mindepth 1 -print0 | sort -z)
    
    local count=${#items[@]}
    for ((i=0; i<count; i++)); do
        local item="${items[$i]}"
        local is_last=$([[ $((i+1)) -eq $count ]] && echo "true" || echo "false")
        
        if [[ -d "$item" ]]; then
            create_tree "$item" "" "$is_last" >> "$final_output_file"
        else
            local connector
            if [[ "$is_last" == "true" ]]; then
                connector="└── "
            else
                connector="├── "
            fi
            echo "${connector}$(basename "$item")" >> "$final_output_file"
        fi
    done
    
    {
        echo '```'
        echo ""
        echo "---"
        echo ""
        echo "## Содержимое файлов"
        echo ""
    } >> "$final_output_file"
    
    # Собираем файлы
    log_info "📋 Сбор файлов..."
    local files_list=()
    while IFS= read -r -d '' file; do
        files_list+=("$file")
    done < <(collect_files "$absolute_source_dir" | tr '\n' '\0')
    
    log_info "📊 Найдено файлов: ${#files_list[@]}"
    
    if [[ ${#files_list[@]} -eq 0 ]]; then
        log_warning "⚠️  Файлы для включения в снапшот не найдены"
        return
    fi
    
    # Обрабатываем каждый файл
    local count=0
    for file in "${files_list[@]}"; do
        ((count++))
        local rel_path="${file#$absolute_source_dir/}"
        log_info "📄 Обработка [$count/${#files_list[@]}]: $rel_path"
        
        local language
        language=$(get_language "$file")
        
        {
            echo "### $rel_path"
            echo "\`\`\`$language"
            cat "$file" 2>/dev/null || echo "*Ошибка чтения файла*"
            echo ""
            echo '```'
            echo ""
        } >> "$final_output_file"
    done
    
    log_success "✅ Снапшот создан: $final_output_file"
    
    local size_kb
    size_kb=$(stat -c%s "$final_output_file" 2>/dev/null || stat -f%z "$final_output_file" 2>/dev/null || echo 0)
    size_kb=$((size_kb / 1024))
    log_info "📊 Размер файла: ${size_kb} KB"
}

# Главная функция
main() {
    # Обработка аргументов
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
    esac
    
    local source_dir="${1:-src}"
    local output_file="${2:-}"
    
    if [[ -z "$output_file" ]]; then
        local folder_name=$(basename "$source_dir")
        output_file="${folder_name}-snapshot.md"
    fi
    
    log_info "📸 Создание снапшота..."
    create_snapshot "$source_dir" "$output_file"
}

# Запуск если скрипт выполняется напрямую
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
