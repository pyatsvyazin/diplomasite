# Упрощённые команды для Docker-деплоя (Linux/macOS; на Windows — те же команды вручную)

.PHONY: up down build logs seed shell migrate

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f nginx backend frontend

seed:
	docker compose exec backend php artisan db:seed --force

migrate:
	docker compose exec backend php artisan migrate --force

shell:
	docker compose exec backend sh
