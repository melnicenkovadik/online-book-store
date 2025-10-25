import { resolve } from "node:path";
import { config } from "dotenv";

// Загружаем переменные окружения из .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import type { Types } from "mongoose";
import { connectToDB } from "../src/lib/db";
import { CategoryModel } from "../src/lib/models/Category";
import { ProductModel } from "../src/lib/models/Product";

interface CategoryDefinition {
  name: string;
  slug: string;
  parentSlug?: string;
  order: number;
  matcher: (product: any) => boolean;
}

// Определяем структуру категорий
const categoryDefinitions: CategoryDefinition[] = [
  // Основные предметы
  {
    name: "Українська мова та література",
    slug: "ukrainian-language",
    order: 1,
    matcher: (p) => {
      const subject = String(p.attributes?.subject || "").toLowerCase();
      const title = p.title.toLowerCase();
      return (
        subject.includes("українська мова") ||
        subject.includes("українська література") ||
        subject.includes("українська мова та читання") ||
        subject.includes("літературне читання") ||
        title.includes("українська мова") ||
        title.includes("української мови") ||
        title.includes("літературне читання") ||
        title.includes("буквар")
      );
    },
  },
  {
    name: "Математика",
    slug: "mathematics",
    order: 2,
    matcher: (p) => {
      const subject = String(p.attributes?.subject || "").toLowerCase();
      const title = p.title.toLowerCase();
      return (
        subject.includes("математика") ||
        subject.includes("алгебра") ||
        subject.includes("геометрія") ||
        title.includes("математика") ||
        title.includes("алгебра") ||
        title.includes("геометрія")
      );
    },
  },
  {
    name: "Іноземні мови",
    slug: "foreign-languages",
    order: 3,
    matcher: (p) => {
      const subject = String(p.attributes?.subject || "").toLowerCase();
      const title = p.title.toLowerCase();
      return (
        subject.includes("англійська") ||
        subject.includes("німецька") ||
        subject.includes("французька") ||
        title.includes("english") ||
        title.includes("deutsch")
      );
    },
  },
  {
    name: "Природничі науки",
    slug: "natural-sciences",
    order: 4,
    matcher: (p) => {
      const subject = String(p.attributes?.subject || "").toLowerCase();
      const title = p.title.toLowerCase();
      return (
        subject.includes("я досліджую світ") ||
        subject.includes("природознавство") ||
        subject.includes("біологія") ||
        subject.includes("хімія") ||
        subject.includes("фізика") ||
        title.includes("я досліджую світ") ||
        title.includes("біологія") ||
        title.includes("хімія") ||
        title.includes("фізика")
      );
    },
  },
  {
    name: "Інформатика",
    slug: "computer-science",
    order: 5,
    matcher: (p) => {
      const subject = String(p.attributes?.subject || "").toLowerCase();
      return subject.includes("інформатика");
    },
  },
  {
    name: "Географія",
    slug: "geography",
    order: 6,
    matcher: (p) => {
      const subject = String(p.attributes?.subject || "").toLowerCase();
      return subject.includes("географія");
    },
  },
  {
    name: "Історія",
    slug: "history",
    order: 7,
    matcher: (p) => {
      const subject = String(p.attributes?.subject || "").toLowerCase();
      return subject.includes("історія");
    },
  },
  {
    name: "Інші предмети",
    slug: "other-subjects",
    order: 8,
    matcher: (p) => {
      const subject = String(p.attributes?.subject || "").toLowerCase();
      const title = p.title.toLowerCase();
      return (
        subject.includes("основи здоров") ||
        subject.includes("образотворче мистецтво") ||
        subject.includes("музичне мистецтво") ||
        subject.includes("трудове навчання") ||
        subject.includes("фізична культура") ||
        subject.includes("правознавство") ||
        subject.includes("економіка") ||
        subject.includes("етика") ||
        title.includes("фізична культура") ||
        title.includes("основи здоров")
      );
    },
  },

  // По классам
  {
    name: "1-4 класи",
    slug: "grades-1-4",
    order: 10,
    matcher: (p) => {
      const classNum = Number(p.attributes?.class);
      if (!Number.isNaN(classNum) && classNum >= 1 && classNum <= 4)
        return true;

      // Проверяем по названию
      const title = p.title.toLowerCase();
      return (
        /\b[1-4]\s*клас/i.test(p.title) ||
        title.includes("початков") ||
        title.includes("нуш 1") ||
        title.includes("нуш 2") ||
        title.includes("нуш 3") ||
        title.includes("нуш 4")
      );
    },
  },
  {
    name: "5-9 класи",
    slug: "grades-5-9",
    order: 11,
    matcher: (p) => {
      const classNum = Number(p.attributes?.class);
      if (!Number.isNaN(classNum) && classNum >= 5 && classNum <= 9)
        return true;

      // Проверяем по названию
      return /\b[5-9]\s*клас/i.test(p.title);
    },
  },
  {
    name: "10-11 класи",
    slug: "grades-10-11",
    order: 12,
    matcher: (p) => {
      const classNum = Number(p.attributes?.class);
      if (!Number.isNaN(classNum) && classNum >= 10 && classNum <= 11)
        return true;

      // Проверяем по названию
      return /\b(10|11)\s*клас/i.test(p.title);
    },
  },
];

async function autoCategorize(dryRun = true) {
  console.log("🔍 Подключение к базе данных...");
  await connectToDB();

  console.log("\n📊 Получение данных...");
  const allProducts = await ProductModel.find({}).lean();
  console.log(`✅ Найдено товаров: ${allProducts.length}`);

  // Создаем или получаем категории
  const categoryMap = new Map<string, Types.ObjectId>();

  console.log("\n🏗️  Создание/проверка категорий...");

  for (const catDef of categoryDefinitions) {
    let category = await CategoryModel.findOne({ slug: catDef.slug });

    if (!category) {
      if (dryRun) {
        console.log(`  [DRY RUN] Будет создана: ${catDef.name}`);
      } else {
        category = await CategoryModel.create({
          name: catDef.name,
          slug: catDef.slug,
          order: catDef.order,
          isActive: true,
        });
        console.log(`  ✅ Создана: ${catDef.name}`);
      }
    } else {
      console.log(`  ℹ️  Существует: ${catDef.name}`);
    }

    if (category) {
      categoryMap.set(catDef.slug, category._id);
    }
  }

  // Анализируем распределение товаров
  console.log("\n📦 Анализ распределения товаров...");

  const categorization = new Map<
    string,
    { count: number; samples: string[] }
  >();

  for (const catDef of categoryDefinitions) {
    categorization.set(catDef.slug, { count: 0, samples: [] });
  }

  let uncategorizedCount = 0;
  const uncategorizedSamples: string[] = [];

  for (const product of allProducts) {
    let hasCategory = false;

    for (const catDef of categoryDefinitions) {
      if (catDef.matcher(product)) {
        hasCategory = true;
        const cat = categorization.get(catDef.slug);
        if (!cat) continue;
        cat.count++;

        if (cat.samples.length < 2) {
          cat.samples.push(product.title);
        }
      }
    }

    if (!hasCategory) {
      uncategorizedCount++;
      if (uncategorizedSamples.length < 5) {
        uncategorizedSamples.push(product.title);
      }
    }
  }

  // Выводим результаты
  console.log("\n📊 РАСПРЕДЕЛЕНИЕ ПО КАТЕГОРИЯМ:");
  console.log("═".repeat(80));

  for (const catDef of categoryDefinitions) {
    const data = categorization.get(catDef.slug);
    if (!data) continue;
    console.log(`\n📁 ${catDef.name} (${catDef.slug})`);
    console.log(`   Товаров: ${data.count}`);
    if (data.samples.length > 0) {
      console.log("   Примеры:");
      for (const sample of data.samples) {
        console.log(`   - ${sample.substring(0, 80)}...`);
      }
    }
  }

  console.log(`\n❓ Товаров без категорий: ${uncategorizedCount}`);
  if (uncategorizedSamples.length > 0) {
    console.log("   Примеры:");
    for (const sample of uncategorizedSamples) {
      console.log(`   - ${sample}`);
    }
  }

  // Применяем категоризацию
  if (!dryRun) {
    console.log("\n\n🚀 ПРИМЕНЕНИЕ КАТЕГОРИЗАЦИИ...");
    let updated = 0;

    for (const product of allProducts) {
      const categoryIds: Types.ObjectId[] = [];

      for (const catDef of categoryDefinitions) {
        if (catDef.matcher(product)) {
          const categoryId = categoryMap.get(catDef.slug);
          if (categoryId) {
            categoryIds.push(categoryId);
          }
        }
      }

      if (categoryIds.length > 0) {
        await ProductModel.updateOne(
          { _id: product._id },
          { $set: { categoryIds } },
        );
        updated++;

        if (updated % 500 === 0) {
          console.log(`  Обработано: ${updated}/${allProducts.length}`);
        }
      }
    }

    console.log(`✅ Обновлено товаров: ${updated}`);

    // Проверяем результаты
    console.log("\n\n🔍 ПРОВЕРКА РЕЗУЛЬТАТОВ:");
    for (const catDef of categoryDefinitions) {
      const categoryId = categoryMap.get(catDef.slug);
      if (categoryId) {
        const count = await ProductModel.countDocuments({
          categoryIds: categoryId,
        });
        console.log(`  ${catDef.name}: ${count} товаров`);
      }
    }
  } else {
    console.log("\n\n⚠️  DRY RUN MODE - изменения не применены");
    console.log("Запустите с параметром --apply чтобы применить изменения");
  }

  console.log("\n✅ Готово!");
  process.exit(0);
}

// Проверяем аргументы командной строки
const shouldApply = process.argv.includes("--apply");
const dryRun = !shouldApply;

if (dryRun) {
  console.log("🔍 Режим: DRY RUN (без изменений в БД)");
  console.log("Запустите с --apply для применения изменений\n");
} else {
  console.log("⚠️  Режим: ПРИМЕНЕНИЕ ИЗМЕНЕНИЙ");
  console.log("Изменения будут записаны в базу данных\n");
}

autoCategorize(dryRun).catch((error) => {
  console.error("❌ Ошибка:", error);
  process.exit(1);
});
