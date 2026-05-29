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

        $rows = [
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
                'content' => $this->doc([
                    $this->p('С этого месяца вступили в силу изменения по формату обращений и срокам ответа.'),
                    $this->p('Мы уже адаптировали шаблоны документов и готовы помочь с подачей.'),
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
                'content' => $this->doc([
                    $this->p('Мы добавили онлайн-слоты в расписание юристов для первичных консультаций.'),
                    $this->p('Записаться можно через сайт — подтверждение приходит на почту и в личный кабинет.'),
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
                'content' => $this->doc([
                    $this->p('В обновлённых шаблонах уточнены блоки ответственности и порядок электронного документооборота.'),
                    $this->p('При необходимости подготовим индивидуальную версию под вашу деятельность.'),
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
                'content' => $this->doc([
                    $this->p('Офис работает по сокращённому графику, а дежурные консультации остаются доступными онлайн.'),
                    $this->p('Актуальное расписание всегда можно проверить в разделе «Контакты».'),
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
                'content' => $this->doc([
                    $this->p('В разделе будут появляться анонсы изменений в законодательстве и практические рекомендации.'),
                    $this->p('Подписывайтесь на обновления, чтобы не пропускать важные материалы.'),
                ]),
            ],
        ];

        foreach ($rows as $i => $row) {
            $title = $row['title'];
            $slug = Str::slug($title);
            $publishedAt = $row['status'] === PostStatus::Published ? now()->subDays(10 - $i * 2) : null;

            Post::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'title' => $title,
                    'content' => $row['content'],
                    'excerpt' => $row['excerpt'] ?? null,
                    'cover_image_url' => $row['cover_image_url'] ?? null,
                    'cover_color' => $row['cover_color'] ?? '#E5E7EB',
                    'keywords' => $row['keywords'] ?? [],
                    'type' => $row['type'],
                    'status' => $row['status'],
                    'author_id' => $authorId,
                    'published_as' => $row['published_as'],
                    'published_name' => $row['published_name'] ?? null,
                    'is_pinned' => (bool) ($row['is_pinned'] ?? false),
                    'published_at' => $publishedAt,
                ]
            );
        }
    }

    private function doc(array $nodes): array
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
