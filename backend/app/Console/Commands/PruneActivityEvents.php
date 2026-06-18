<?php

namespace App\Console\Commands;

use App\Services\Activity\ActivityLogService;
use Illuminate\Console\Command;

class PruneActivityEvents extends Command
{
    protected $signature = 'activity:prune {--days= : Срок хранения в днях (по умолчанию из config)}';

    protected $description = 'Удалить события ленты «Последние действия» старше заданного срока';

    public function handle(ActivityLogService $activityLog): int
    {
        $days = $this->option('days');
        if ($days !== null && $days !== '') {
            config(['activity.retention_days' => max(1, (int) $days)]);
        }

        $deleted = $activityLog->pruneExpired();

        $this->info(sprintf(
            'Удалено записей старше %d дн.: %d',
            ActivityLogService::retentionDays(),
            $deleted,
        ));

        return self::SUCCESS;
    }
}
