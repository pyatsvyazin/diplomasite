<?php

namespace Database\Seeders;

use App\Enums\Post\PostPublishedAs;
use App\Enums\Post\PostStatus;
use App\Enums\Post\PostType;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PostSeeder extends Seeder
{
    public function run(): void
    {
        $authorId = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->value('id');

        if (! $authorId) {
            $this->command?->warn('PostSeeder: администратор не найден, посты не созданы.');

            return;
        }

        /** @var list<array<string, mixed>> $rows */
        $rows = array_merge(
            $this->baseNewsRows(),
            $this->extraNewsRows(),
            $this->articleRows(),
            $this->draftAndArchivedRows(),
        );

        foreach ($rows as $i => $row) {
            $title = (string) $row['title'];
            $slug = Str::slug($title);
            /** @var PostStatus $status */
            $status = $row['status'];
            /** @var PostType $type */
            $type = $row['type'];
            /** @var PostPublishedAs $publishedAs */
            $publishedAs = $row['published_as'];
            /** @var array<string, mixed> $content */
            $content = $row['content'];

            $publishedAt = null;
            if ($status === PostStatus::Published) {
                $daysAgo = isset($row['days_ago'])
                    ? (int) $row['days_ago']
                    : max(1, 30 - $i);
                $publishedAt = now()->subDays($daysAgo);
            }

            Post::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'title' => $title,
                    'content' => $content,
                    'excerpt' => $row['excerpt'] ?? null,
                    'cover_image_url' => $row['cover_image_url'] ?? null,
                    'cover_color' => $row['cover_color'] ?? '#E5E7EB',
                    'keywords' => $row['keywords'] ?? [],
                    'type' => $type,
                    'status' => $status,
                    'author_id' => $authorId,
                    'published_as' => $publishedAs,
                    'published_name' => $row['published_name'] ?? null,
                    'is_pinned' => (bool) ($row['is_pinned'] ?? false),
                    'published_at' => $publishedAt,
                ]
            );
        }

        $this->command?->info('PostSeeder: материалов — '.count($rows).'.');
    }

    /** @return array<int, array<string, mixed>> */
    private function baseNewsRows(): array
    {
        return [
            [
                'title' => 'Изменения в порядке подачи обращений в госорганы',
                'type' => PostType::News,
                'status' => PostStatus::Published,
                'published_as' => PostPublishedAs::Company,
                'is_pinned' => true,
                'excerpt' => 'Кратко о новых сроках и требованиях к оформлению заявлений.',
                'cover_image_url' => 'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?q=80&w=1200&auto=format&fit=crop',
                'cover_color' => '#DCE7F5',
                'keywords' => ['новости', 'госорганы', 'заявления'],
                'days_ago' => 2,
                'content' => $this->tiptapDoc([
                    $this->h2('Что изменилось'),
                    $this->p('С этого месяца уточнены требования к электронным обращениям и срокам ответа ведомств. Для граждан это означает более строгую проверку комплекта документов при первой подаче.'),
                    $this->p('Мы обновили шаблоны заявлений и чек-листы — их можно запросить на консультации.'),
                    $this->ul([
                        'Проверьте реквизиты получателя и тему обращения.',
                        'Приложите сканы в читаемом качестве, не обрезая поля.',
                        'Сохраните номер исходящего и дату отправки.',
                    ]),
                ]),
            ],
            [
                'title' => 'Запущен онлайн-формат первичной юридической консультации',
                'type' => PostType::News,
                'status' => PostStatus::Published,
                'published_as' => PostPublishedAs::Company,
                'is_pinned' => true,
                'excerpt' => 'Теперь первичную консультацию можно получить дистанционно в удобное время.',
                'cover_image_url' => 'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1200&auto=format&fit=crop',
                'cover_color' => '#E8DFC7',
                'keywords' => ['онлайн', 'консультация', 'новости'],
                'days_ago' => 4,
                'content' => $this->tiptapDoc([
                    $this->h2('Как записаться'),
                    $this->p('В личном кабинете или при обработке заявки юрист предложит слот — онлайн или очно. Подтверждение приходит на почту.'),
                    $this->p('Перед встречей подготовьте краткое описание ситуации и имеющиеся документы.'),
                ]),
            ],
            [
                'title' => 'Обновлены шаблоны договоров для малого бизнеса',
                'type' => PostType::News,
                'status' => PostStatus::Published,
                'published_as' => PostPublishedAs::Custom,
                'published_name' => 'Редакция юридического отдела',
                'excerpt' => 'Подготовили новую редакцию типовых договоров с учётом последних изменений практики.',
                'cover_image_url' => 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
                'cover_color' => '#E9E4DA',
                'keywords' => ['договор', 'бизнес', 'шаблоны'],
                'days_ago' => 6,
                'content' => $this->tiptapDoc([
                    $this->p('В обновлённых шаблонах уточнены блоки ответственности, электронный документооборот и порядок расторжения.'),
                    $this->h2('Для кого'),
                    $this->p('ИП и ООО с типовыми сделками поставки, подряда и оказания услуг. Индивидуальная адаптация — по запросу.'),
                ]),
            ],
            [
                'title' => 'Приём в праздничные дни: график работы опубликован',
                'type' => PostType::News,
                'status' => PostStatus::Published,
                'published_as' => PostPublishedAs::Company,
                'excerpt' => 'Публикуем расписание офлайн- и онлайн-приёма на период праздничных дней.',
                'cover_image_url' => 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop',
                'cover_color' => '#E3E8D8',
                'keywords' => ['график', 'приём', 'праздники'],
                'days_ago' => 8,
                'content' => $this->tiptapDoc([
                    $this->p('Офис работает по сокращённому графику, дежурные консультации доступны онлайн.'),
                    $this->p('Актуальное расписание — в разделе «Контакты» на сайте.'),
                ]),
            ],
            [
                'title' => 'Новый раздел на сайте: новости и разборы практики',
                'type' => PostType::News,
                'status' => PostStatus::Published,
                'published_as' => PostPublishedAs::Company,
                'excerpt' => 'Теперь мы регулярно публикуем короткие новости и практические комментарии юристов.',
                'cover_image_url' => 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1200&auto=format&fit=crop',
                'cover_color' => '#E5E7EB',
                'keywords' => ['сайт', 'новости', 'публикации'],
                'days_ago' => 10,
                'content' => $this->tiptapDoc([
                    $this->p('В разделе — анонсы изменений в законодательстве и практические рекомендации без «воды».'),
                    $this->p('Материалы не заменяют индивидуальную консультацию, но помогают сориентироваться в теме.'),
                ]),
            ],
        ];
    }

    /** @return list<array<string, mixed>> */
    private function extraNewsRows(): array
    {
        $topics = [
            ['title' => 'Как подготовить претензию контрагенту', 'excerpt' => 'Пошаговый разбор: что указать в претензии и как зафиксировать срок ответа.', 'keywords' => ['претензия', 'договор', 'бизнес'], 'days_ago' => 3],
            ['title' => 'Сроки исковой давности: на что обратить внимание', 'excerpt' => 'Разбираем типовые ситуации, когда срок можно восстановить, а когда — нет.', 'keywords' => ['исковая давность', 'суд'], 'days_ago' => 5],
            ['title' => 'Онлайн-консультации: как записаться и что подготовить', 'excerpt' => 'Краткая инструкция для клиентов перед первой встречей с юристом.', 'keywords' => ['консультация', 'онлайн'], 'days_ago' => 7],
            ['title' => 'Изменения в правилах выдачи судебных приказов', 'excerpt' => 'Что изменилось для кредиторов и должников в 2025–2026 году.', 'keywords' => ['судебный приказ', 'закон'], 'days_ago' => 9],
            ['title' => 'Проверка договора аренды: чек-лист для арендатора', 'excerpt' => 'На что смотреть в договоре помещения, чтобы снизить риски при открытии бизнеса.', 'keywords' => ['аренда', 'бизнес'], 'days_ago' => 11],
            ['title' => 'Защита персональных данных на сайте компании', 'excerpt' => 'Минимальный набор документов для соответствия 152-ФЗ.', 'keywords' => ['персональные данные', 'сайт'], 'days_ago' => 13],
            ['title' => 'Медиация в семейных спорах: когда она уместна', 'excerpt' => 'Альтернатива суду при разделе имущества и спорах о детях.', 'keywords' => ['медиация', 'семья'], 'days_ago' => 15],
            ['title' => 'Налоговые проверки: права предпринимателя', 'excerpt' => 'Как вести себя при выездной проверке и какие документы подготовить заранее.', 'keywords' => ['налоги', 'проверка'], 'days_ago' => 17],
            ['title' => 'Взыскание задолженности с физлица: этапы', 'excerpt' => 'От претензии до исполнительного производства — краткая схема.', 'keywords' => ['долг', 'взыскание'], 'days_ago' => 19],
            ['title' => 'Трудовой договор с удалённым сотрудником', 'excerpt' => 'Какие условия обязательно прописать, чтобы снизить риски споров.', 'keywords' => ['труд', 'удалёнка'], 'days_ago' => 21],
            ['title' => 'Ответственность застройщика по ДДУ', 'excerpt' => 'Неустойка, штрафы и практические советы дольщикам.', 'keywords' => ['застройщик', 'ДДУ'], 'days_ago' => 23],
            ['title' => 'Регистрация товарного знака: с чего начать', 'excerpt' => 'Этапы регистрации и типичные ошибки заявителей.', 'keywords' => ['товарный знак', 'ИС'], 'days_ago' => 25],
            ['title' => 'Корпоративный конфликт: выход участника из ООО', 'excerpt' => 'Как оценить долю и оформить сделку без блокировки деятельности.', 'keywords' => ['ООО', 'учредители'], 'days_ago' => 27],
            ['title' => 'Обжалование решения ГИБДД', 'excerpt' => 'Сроки, комплект документов и когда имеет смысл идти в суд.', 'keywords' => ['ГИБДД', 'административное'], 'days_ago' => 29],
            ['title' => 'Юридический щит: итоги квартала', 'excerpt' => 'Краткий отчёт о ключевых делах и изменениях в практике агентства.', 'keywords' => ['агентство', 'итоги'], 'days_ago' => 31],
        ];

        return array_map(function (array $t) {
            return [
                'title' => $t['title'],
                'type' => PostType::News,
                'status' => PostStatus::Published,
                'published_as' => PostPublishedAs::Company,
                'is_pinned' => false,
                'excerpt' => $t['excerpt'],
                'cover_color' => '#E8DFC7',
                'keywords' => $t['keywords'],
                'days_ago' => $t['days_ago'],
                'content' => $this->tiptapDoc([
                    $this->h2('Кратко по сути'),
                    $this->p($t['excerpt'].' Ниже — основные тезисы, которые мы разбираем на консультациях.'),
                    $this->ul([
                        'Соберите документы заранее: договор, переписка, платёжные документы.',
                        'Зафиксируйте сроки и факты в хронологическом порядке.',
                        'При необходимости запишитесь на консультацию через сайт.',
                    ]),
                    $this->p('Материал носит информационный характер и не заменяет индивидуальную юридическую консультацию.'),
                ]),
            ];
        }, $topics);
    }

    /** @return list<array<string, mixed>> */
    private function articleRows(): array
    {
        return [
            [
                'title' => 'Как подготовиться к судебному заседанию',
                'type' => PostType::Article,
                'status' => PostStatus::Published,
                'published_as' => PostPublishedAs::Custom,
                'published_name' => 'Юридический щит',
                'excerpt' => 'Практическое руководство для клиентов: документы, поведение в зале суда, типичные ошибки.',
                'keywords' => ['суд', 'статья'],
                'days_ago' => 12,
                'content' => $this->tiptapDoc([
                    $this->h2('Документы'),
                    $this->p('Возьмите паспорт, копии процессуальных документов и хронологию событий.'),
                    $this->h2('В зале суда'),
                    $this->ul(['Отвечайте по существу', 'Не спорьте с оппонентом эмоционально', 'Уточняйте непонятные формулировки']),
                ]),
            ],
            [
                'title' => 'Чек-лист для проверки договора поставки',
                'type' => PostType::Article,
                'status' => PostStatus::Published,
                'published_as' => PostPublishedAs::Company,
                'excerpt' => 'На что смотреть заказчику и поставщику перед подписанием.',
                'keywords' => ['договор', 'поставка'],
                'days_ago' => 20,
                'content' => $this->tiptapDoc([
                    $this->p('Договор поставки — один из самых частых документов в B2B. Ниже — пункты, которые мы проверяем в первую очередь.'),
                    $this->ul(['Предмет и спецификация', 'Цена и порядок расчётов', 'Ответственность и неустойка', 'Форс-мажор и сроки']),
                ]),
            ],
            [
                'title' => 'Абонентское обслуживание: что входит в пакет',
                'type' => PostType::Article,
                'status' => PostStatus::Published,
                'published_as' => PostPublishedAs::Company,
                'excerpt' => 'Кому подходит формат юридического сопровождения по подписке.',
                'keywords' => ['абонемент', 'бизнес'],
                'days_ago' => 35,
                'content' => $this->tiptapDoc([
                    $this->h2('Для кого'),
                    $this->p('ИП и малый бизнес с регулярным потоком договоров и кадровых вопросов.'),
                    $this->h2('Что обычно входит'),
                    $this->p('Консультации, претензии, типовые договоры, сопровождение проверок — объём зависит от тарифа.'),
                ]),
            ],
        ];
    }

    /** @return list<array<string, mixed>> */
    private function draftAndArchivedRows(): array
    {
        return [
            [
                'title' => 'Черновик: новая редакция оферты (не опубликовано)',
                'type' => PostType::News,
                'status' => PostStatus::Draft,
                'published_as' => PostPublishedAs::Company,
                'excerpt' => 'Готовится обновление оферты на сайте.',
                'content' => $this->tiptapDoc([$this->p('Текст в работе у юридического отдела.')]),
            ],
            [
                'title' => 'Черновик: вебинар для предпринимателей',
                'type' => PostType::News,
                'status' => PostStatus::Draft,
                'published_as' => PostPublishedAs::Company,
                'excerpt' => 'Анонс будет опубликован после согласования программы.',
                'content' => $this->tiptapDoc([$this->p('Планируемая дата — следующий месяц.')]),
            ],
            [
                'title' => 'Архив: старый график работы на майские праздники',
                'type' => PostType::News,
                'status' => PostStatus::Archived,
                'published_as' => PostPublishedAs::Company,
                'excerpt' => 'Материал снят с публикации, сохранён для истории.',
                'days_ago' => 120,
                'content' => $this->tiptapDoc([$this->p('Актуальный график смотрите в разделе контактов.')]),
            ],
            [
                'title' => 'Архив: акция на первую консультацию 2024',
                'type' => PostType::News,
                'status' => PostStatus::Archived,
                'published_as' => PostPublishedAs::Company,
                'excerpt' => 'Акция завершена.',
                'days_ago' => 200,
                'content' => $this->tiptapDoc([$this->p('Информация оставлена в архиве.')]),
            ],
        ];
    }

    /** Корневой узел контента TipTap (JSON). */
    private function tiptapDoc(array $nodes): array
    {
        return ['type' => 'doc', 'content' => $nodes];
    }

    private function p(string $text): array
    {
        return ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]];
    }

    private function h2(string $text): array
    {
        return [
            'type' => 'heading',
            'attrs' => ['level' => 2],
            'content' => [['type' => 'text', 'text' => $text]],
        ];
    }

    private function ul(array $items): array
    {
        return [
            'type' => 'bulletList',
            'content' => array_map(
                fn ($item) => ['type' => 'listItem', 'content' => [$this->p($item)]],
                $items
            ),
        ];
    }
}
