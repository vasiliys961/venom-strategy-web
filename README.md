# VENOM Strategy — веб-версия

Веб-ассистент по личной стратегии на основе метода **VENOM** из книги
Семёна Колосова «Стратегия без иллюзий». Это веб-версия проекта
[venom-strategy-agent](https://github.com/vasiliys961/venom-strategy-agent)
(Telegram-бот) — тот же метод и те же авторские фреймворки (OrgOS,
стресс-тест стратегии, архитектура изменений), но в браузере, с визуальным
VENOM Canvas, и заточена под деплой на Vercel.

## быстрый старт (для нетехнического пользователя)

**смотрите [`HOW_TO_USE.md`](./HOW_TO_USE.md)** — там пошаговая инструкция
на русском, как задеплоить сайт на Vercel без программирования.

## архитектура

```
браузер (Next.js React) <-> /api/venom (Vercel Serverless Function)
                                    |
                              LLM (Polza.ai: Claude/GPT/Gemini)
                                    |
                          Vercel KV (состояние VenomCanvas)
```

в отличие от Telegram-бота (постоянно работающий процесс с long-polling), эта
версия — набор коротких serverless-функций, которые обрабатывают один
шаг диалога за вызов. из-за этого состояние (`VenomCanvas`) хранится не
в файле SQLite, а в Vercel KV (Redis) — файловая система serverless-функций
не сохраняется между вызовами.

**важно:** без настроенного Vercel KV состояние будет храниться только в
памяти конкретной функции и может обрываться между запросами (Vercel
периодически "холодно" перезапускает функции). для надёжной работы
Vercel KV нужно подключить — см. `HOW_TO_USE.md`.

## структура репозитория

```
src/
  app/
    page.tsx           - главная страница (чат + Canvas)
    layout.tsx
    globals.css
    api/venom/route.ts - serverless API: обработка одного шага диалога
  components/
    CanvasView.tsx      - визуальное представление VENOM Canvas
    StageProgress.tsx   - индикатор прогресса по этапам
  lib/
    types.ts            - типы VenomCanvas, Stage, SmartObjective
    prompts.ts           - системные промпты (перенесены из Python-версии)
    llm.ts               - клиент Polza.ai (OpenAI-совместимый)
    graph.ts              - оркестрация этапов VENOM (аналог LangGraph-графа)
    kvStore.ts            - персистентность через Vercel KV
package.json
tsconfig.json
next.config.js
.env.example
```

## локальный запуск для разработки

```bash
npm install
cp .env.example .env.local
# впишите POLZA_API_KEY в .env.local
npm run dev
```

откройте http://localhost:3000

## деплой на Vercel

```bash
npm i -g vercel
vercel
```

или через веб-интерфейс Vercel: Import Project → выбрать этот репозиторий
→ указать переменные окружения из `.env.example` → Deploy.

## метод VENOM

1. **V**ision — образ желаемого будущего (горизонт 10 лет)
2. **E**valuation — анализ текущего состояния через модель OrgOS (8 элементов)
3. **N**arrow gaps — стратегические разрывы (стресс-тест по 6 блокам)
4. **O**bjectives — цели, декомпозированные по методике "Архитектура изменений"
5. **M**anagement — операционная система: привычки, ретроспектива

Подробное описание авторских фреймворков — в `docs/kolosov_frameworks.md`
в основном репозитории [venom-strategy-agent](https://github.com/vasiliys961/venom-strategy-agent).
