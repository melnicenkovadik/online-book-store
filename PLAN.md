# Магазин підручників — План (Single-Repo Next.js, App Router, TS)

Проект: school-books (Next.js + MongoDB Atlas, без отдельного Express)
Стратегия деплоя: Vercel (SSR/ISR) + Cloudflare (DNS/CDN/SSL)

## 1) Базовая инициализация
- [ ] Next.js (TS, App Router) + Tailwind + ESLint/Prettier + Husky
  - Готово, если: `npm run lint` без ошибок
- [ ] `.env.local`: `MONGODB_URI`, `JWT_SECRET`, `NP_API_KEY`, `UKR_TOKEN`, `FONDY_*`/`LIQPAY_*`, `NEXT_PUBLIC_SITE_URL`
  - Готово, если: переменные читаются без ошибок

## 2) База данных и модели
- [ ] `src/lib/db.ts`: подключение к Mongo (Mongoose) с глобальным кэшем
  - Готово, если: `GET /api/health` = 200
- [ ] Модели
  - `Category { name, slug, parentId? }`
  - `Product { title, slug, sku, price, salePrice?, stock, images[], attributes{class,subject,language,type,year,author,publisher}, categoryIds[] }`
  - `Order { number, items[{productId,qty,price}], customer{fullName,phone,email}, delivery{carrier,cityRef,warehouseRef,address?}, totals{items,shipping,grand}, payment{provider,status,txId}, ttn?, status }`
  - `User { email, hash, role }`
  - Готово, если: коллекции создаются; индексы по `slug/categoryIds`

## 3) Аутентификация админа
- [ ] Локальный логин (Credentials) `/admin/login` → JWT в HttpOnly cookie
  - Готово, если: вход/выход работают; роли `admin|manager` применяются
- [ ] Middleware: защита `'/admin/**'` и `'/api/admin/**'`
  - Готово, если: без токена доступ закрыт

## 4) Публичные API (Route Handlers)
- [ ] `GET /api/catalog/categories` — дерево категорий
  - Готово, если: 200 + массив
- [ ] `GET /api/catalog/products` — список + фильтры (категория, класс, предмет, цена, `q`) + пагинация
  - Готово, если: фильтры и сортировка корректны
- [ ] `GET /api/catalog/products/[slug]` — карточка товара
  - Готово, если: находит по `slug`
- [ ] `POST /api/orders` — создание заказа (валидация схемой)
  - Готово, если: запись в БД + номер заказа

## 5) Доставка (прокси к API перевізників)
- [ ] `GET /api/shipping/nova/cities?q=` и `/warehouses?cityRef=`
  - Готово, если: возвращаются города и отделения
- [ ] `GET /api/shipping/ukr/cities|branches`
  - Готово, если: автоподсказки работают
- [ ] `POST /api/shipping/nova/ttn` и `/api/shipping/ukr/ttn` (опц., для админки)
  - Готово, если: создаётся ТТН и пишется в заказ

## 6) Платежи
- [ ] `POST /api/payments/:provider/create` — формирование платежа (Fondy/LiqPay), URL редиректа
  - Готово, если: в sandbox происходит редирект
- [ ] `POST /api/payments/:provider/callback` — проверка подписи, обновление `order.payment.status` и `order.status`
  - Готово, если: успешная оплата → `paid/processing`

## 7) Публичные страницы
- [ ] `/` — хиты/новинки/акции (SSR/ISR)
  - Готово, если: товары выводятся
- [ ] `/catalog` и `/catalog/[category]` — список + фильтры
  - Готово, если: пагинация < 300 мс/запрос
- [ ] `/product/[slug]` — карточка товара
  - Готово, если: цены/сток корректны
- [ ] `/cart` — локальный кошик (Zustand/Context + localStorage)
  - Готово, если: добавление/удаление/qty
- [ ] `/checkout` — контакты, выбор перевозчика, город/отделение, итог
  - Готово, если: блокируется оплата без валидных данных
- [ ] `/order/[number]` — успех/ошибка после оплаты
  - Готово, если: показывает состояние заказа

## 8) Админка `/admin`
- [ ] Products: список/создание/редактирование/удаление (загрузка в S3-совместимое хранилище)
  - Готово, если: CRUD работает, валидации проходят
- [ ] Categories: CRUD + drag-n-drop сортировка (опц.)
  - Готово, если: дерево корректно
- [ ] Orders: список/деталь/смена статуса, кнопка «Создать ТТН»
  - Готово, если: статусы меняются, ТТН пишется

## 9) Валидации и правила
- [ ] Телефон (UA), email, обязательные поля чекаута (zod/yup)
  - Готово, если: ошибки понятные, UX не блокирует
- [ ] Минимальная сумма для бесплатной доставки (опц.)
  - Готово, если: правило применено в корзине/чекауте

## 10) SEO/Аналитика
- [ ] `sitemap.xml`, `robots.txt`, canonical, OG
  - Готово, если: Rich Results без критичных ошибок
- [ ] `schema.org` `Product/Offer`, `BreadcrumbList`
  - Готово, если: валидатор ок
- [ ] GA4 + Meta Pixel (+ cookie consent при необходимости)
  - Готово, если: собираются `view_item`, `add_to_cart`, `purchase`

## 11) Безопасность
- [ ] Только HTTPS; JWT — HttpOnly+Secure; CORS только для своего домена
  - Готово, если: токен недоступен из JS
- [ ] Rate-limit на `/api/**`, валидации схемой, security headers через `next.config.js/middleware`
  - Готово, если: нет инъекций, брутфорс ограничен

## 12) Производительность
- [ ] Индексы Mongo (`slug`, `categoryIds`, `attributes.*`, текстовый по `title, author, publisher`)
  - Готово, если: фильтры < 200–300 мс
- [ ] ISR на списках/товарах; `next/image` WebP/AVIF
  - Готово, если: LCP < 2.5s (моб), Lighthouse ≥ 85
- [ ] Кэш словарей НП/Укрпошта с TTL; CRON (Vercel Cron) на обновление справочников
  - Готово, если: внешних вызовов меньше, 5xx нет

---

## Дополнительно
- Техдолг/риски: интеграции платежей, стабильность API перевозчиков, миграция данных, S3 права
- Инфраструктура: Vercel env vars, секреты в Cloudflare/Vercel, резервные копии БД
- Definition of Done: KPI страниц, метрики API (<300 мс), покрытие критических сценариев e2e
