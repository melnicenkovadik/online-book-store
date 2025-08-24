#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Создает снапшот указанной папки со всеми файлами и их содержимым
 * Usage: node scripts/create-snapshot.js [folder] [output]
 * Example: node scripts/create-snapshot.js src src-snapshot.md
 */

// Конфигурация
const CONFIG = {
  // Расширения файлов для включения в снапшот
  includeExtensions: [
    '.ts', '.tsx', '.js', '.jsx',
    '.css', '.scss', '.sass', '.less',
    '.json', '.md', '.txt', '.yml', '.yaml',
    '.html', '.xml', '.svg',
    '.env', '.gitignore', '.eslintrc',
    // Добавьте другие расширения по необходимости
  ],
  
  // Папки и файлы для исключения
  excludePatterns: [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '.turbo',
    'coverage',
    '.nyc_output',
    'logs',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    '*.tmp',
    '*.temp',
  ],
  
  // Максимальный размер файла в байтах (100KB)
  maxFileSize: 100 * 1024,
  
  // Максимальная глубина вложенности
  maxDepth: 10,
};

/**
 * Проверяет, следует ли исключить файл/папку
 */
function shouldExclude(name, isDirectory = false) {
  for (const pattern of CONFIG.excludePatterns) {
    if (pattern.includes('*')) {
      // Простая поддержка wildcards
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(name)) return true;
    } else {
      if (name === pattern) return true;
    }
  }
  return false;
}

/**
 * Проверяет, следует ли включить файл
 */
function shouldIncludeFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  // Файлы без расширения (как Dockerfile, README)
  if (!ext && /^[A-Z][A-Z_]*[A-Z]?$/.test(path.basename(filename))) {
    return true;
  }
  
  return CONFIG.includeExtensions.includes(ext);
}

/**
 * Получает язык для подсветки синтаксиса по расширению файла
 */
function getLanguageByExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  const basename = path.basename(filename).toLowerCase();
  
  const langMap = {
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.js': 'javascript',
    '.jsx': 'jsx',
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
  };
  
  // Специальные случаи для файлов без расширения
  if (!ext) {
    if (basename === 'dockerfile') return 'dockerfile';
    if (basename === 'makefile') return 'makefile';
    if (basename.includes('gitignore')) return 'gitignore';
    if (basename.includes('eslintrc')) return 'json';
    return 'text';
  }
  
  return langMap[ext] || 'text';
}

/**
 * Создает дерево файловой структуры
 */
function createFileTree(dirPath, prefix = '', isLast = true, depth = 0) {
  if (depth > CONFIG.maxDepth) return '';
  
  const name = path.basename(dirPath);
  if (shouldExclude(name, true)) return '';
  
  let tree = '';
  const connector = isLast ? '└── ' : '├── ';
  tree += `${prefix}${connector}${name}/\n`;
  
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const filteredItems = items.filter(item => {
      if (shouldExclude(item.name, item.isDirectory())) return false;
      if (item.isFile() && !shouldIncludeFile(item.name)) return false;
      return true;
    });
    
    filteredItems.forEach((item, index) => {
      const isLastItem = index === filteredItems.length - 1;
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      const itemPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        tree += createFileTree(itemPath, newPrefix, isLastItem, depth + 1);
      } else {
        const fileConnector = isLastItem ? '└── ' : '├── ';
        tree += `${newPrefix}${fileConnector}${item.name}\n`;
      }
    });
  } catch (error) {
    console.warn(`Не удалось прочитать директорию ${dirPath}: ${error.message}`);
  }
  
  return tree;
}

/**
 * Собирает все файлы рекурсивно
 */
function collectFiles(dirPath, depth = 0) {
  if (depth > CONFIG.maxDepth) return [];
  
  const files = [];
  
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      if (shouldExclude(item.name, item.isDirectory())) continue;
      
      const itemPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        files.push(...collectFiles(itemPath, depth + 1));
      } else if (shouldIncludeFile(item.name)) {
        try {
          const stats = fs.statSync(itemPath);
          if (stats.size <= CONFIG.maxFileSize) {
            files.push(itemPath);
          } else {
            console.warn(`Файл ${itemPath} пропущен (размер ${stats.size} байт > ${CONFIG.maxFileSize})`);
          }
        } catch (error) {
          console.warn(`Не удалось получить информацию о файле ${itemPath}: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.warn(`Не удалось прочитать директорию ${dirPath}: ${error.message}`);
  }
  
  return files;
}

/**
 * Создает снапшот
 */
function createSnapshot(sourceDir, outputFile) {
  const absoluteSourceDir = path.resolve(sourceDir);
  const sourceName = path.basename(absoluteSourceDir);
  
  if (!fs.existsSync(absoluteSourceDir)) {
    console.error(`❌ Папка ${sourceDir} не существует`);
    process.exit(1);
  }
  
  // Создаем папку snapshots если не существует
  const snapshotsDir = 'snapshots';
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
    console.log(`📁 Создана папка: ${snapshotsDir}`);
  }
  
  // Корректируем путь к выходному файлу
  const finalOutputFile = path.join(snapshotsDir, path.basename(outputFile));
  
  console.log(`📁 Создание снапшота папки: ${sourceDir}`);
  console.log(`📄 Выходной файл: ${finalOutputFile}`);
  
  let markdown = `# Снапшот папки ${sourceName}\n\n`;
  markdown += `*Создано: ${new Date().toLocaleString('ru-RU')}*\n\n`;
  
  // Добавляем дерево структуры
  console.log('🌳 Генерация дерева файлов...');
  markdown += '## Структура файлов\n\n```\n';
  markdown += `${sourceName}/\n`;
  
  try {
    const items = fs.readdirSync(absoluteSourceDir, { withFileTypes: true });
    const filteredItems = items.filter(item => {
      if (shouldExclude(item.name, item.isDirectory())) return false;
      if (item.isFile() && !shouldIncludeFile(item.name)) return false;
      return true;
    });
    
    filteredItems.forEach((item, index) => {
      const isLast = index === filteredItems.length - 1;
      const itemPath = path.join(absoluteSourceDir, item.name);
      
      if (item.isDirectory()) {
        markdown += createFileTree(itemPath, '', isLast, 1);
      } else {
        const connector = isLast ? '└── ' : '├── ';
        markdown += `${connector}${item.name}\n`;
      }
    });
  } catch (error) {
    console.error(`❌ Ошибка при создании дерева: ${error.message}`);
  }
  
  markdown += '```\n\n---\n\n';
  
  // Собираем все файлы
  console.log('📋 Сбор файлов...');
  const files = collectFiles(absoluteSourceDir);
  console.log(`📊 Найдено файлов: ${files.length}`);
  
  if (files.length === 0) {
    console.warn('⚠️  Файлы для включения в снапшот не найдены');
    return;
  }
  
  // Добавляем содержимое файлов
  markdown += '## Содержимое файлов\n\n';
  
  files.sort().forEach((filePath, index) => {
    const relativePath = path.relative(absoluteSourceDir, filePath);
    const normalizedPath = relativePath.replace(/\\/g, '/'); // Для Windows
    const filename = path.basename(filePath);
    
    console.log(`📄 Обработка [${index + 1}/${files.length}]: ${normalizedPath}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const language = getLanguageByExtension(filename);
      
      markdown += `### ${normalizedPath}\n`;
      markdown += `\`\`\`${language}\n`;
      markdown += content;
      markdown += '\n```\n\n';
    } catch (error) {
      console.warn(`⚠️  Не удалось прочитать файл ${filePath}: ${error.message}`);
      markdown += `### ${normalizedPath}\n`;
      markdown += `*Ошибка чтения файла: ${error.message}*\n\n`;
    }
  });
  
  // Записываем результат
  try {
    fs.writeFileSync(finalOutputFile, markdown, 'utf8');
    console.log(`✅ Снапшот создан: ${finalOutputFile}`);
    
    const stats = fs.statSync(finalOutputFile);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`📊 Размер файла: ${sizeKB} KB`);
  } catch (error) {
    console.error(`❌ Ошибка записи файла: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Показывает помощь
 */
function showHelp() {
  console.log(`
📸 Скрипт создания снапшотов папок

Использование:
  node scripts/create-snapshot.js [папка] [выходной_файл]

Примеры:
  node scripts/create-snapshot.js src src-snapshot.md
  node scripts/create-snapshot.js components components-snapshot.md
  node scripts/create-snapshot.js . full-project-snapshot.md

Опции:
  -h, --help     Показать эту справку

Настройки (в файле scripts/create-snapshot.js):
  - Поддерживаемые расширения: ${CONFIG.includeExtensions.join(', ')}
  - Исключаемые папки: ${CONFIG.excludePatterns.join(', ')}
  - Максимальный размер файла: ${Math.round(CONFIG.maxFileSize / 1024)} KB
  - Максимальная глубина: ${CONFIG.maxDepth} уровней
`);
}

// Главная функция
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  const sourceDir = args[0] || 'src';
  const outputFile = args[1] || `${path.basename(sourceDir)}-snapshot.md`;
  
  console.log('📸 Создание снапшота...');
  createSnapshot(sourceDir, outputFile);
}

// Запуск если файл выполняется напрямую
if (require.main === module) {
  main();
}

module.exports = { createSnapshot, CONFIG };
