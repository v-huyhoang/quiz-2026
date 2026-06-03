# ============================================================
#  Quiz Stack — Makefile
#  Run from project root directory
# ============================================================

# ── Config ───────────────────────────────────────────────────
BE_DIR          := quiz-be
FE_DIR          := quiz-fe
BOT_DIR         := game-test-bot
BE_COMPOSE      := $(BE_DIR)/docker-compose.local.yml
FE_COMPOSE      := $(FE_DIR)/docker-compose.local.yml
FULL_COMPOSE    := -p quiz-2026 -f $(BE_COMPOSE) -f $(FE_COMPOSE)
APP_CONTAINER   := quiz-be-local
FE_CONTAINER    := quiz-fe-local
MYSQL_CONTAINER := quiz-mysql-local

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RED    := \033[0;31m
RESET  := \033[0m

.DEFAULT_GOAL := help

.PHONY: help
help: ## Display list of main commands
	@echo ""
	@echo "$(CYAN)╔══════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)║         Quiz Stack — Makefile            ║$(RESET)"
	@echo "$(CYAN)╚══════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(YELLOW)▶ Setup & Startup$(RESET)"
	@echo "  $(GREEN)setup$(RESET)                   Install whole project for first time (env + build + composer/yarn + migrate + seed)"
	@echo "  $(GREEN)up$(RESET)                      Start full stack (BE + FE + MySQL + Redis)"
	@echo "  $(GREEN)down$(RESET)                    Stop and remove all containers"
	@echo "  $(GREEN)restart$(RESET)                 Restart all containers"
	@echo "  $(GREEN)logs$(RESET)                    View real-time logs of all containers"
	@echo "  $(GREEN)ps$(RESET)                      View containers status"
	@echo ""
	@echo "$(YELLOW)▶ Libraries & Packages$(RESET)"
	@echo "  $(GREEN)fe-install$(RESET)               Install frontend libraries (run on both local machine and container)"
	@echo "  $(GREEN)be-composer$(RESET)              Run composer install in backend container"
	@echo "  $(GREEN)be-recreate$(RESET)              Recreate backend container (use after changing quiz-be/.env)"
	@echo "  $(GREEN)be-services$(RESET)              Start/restart Reverb WebSocket + queue worker (needed after be-composer)"
	@echo ""
	@echo "$(YELLOW)▶ Database & Artisan$(RESET)"
	@echo "  $(GREEN)migrate$(RESET)                  Run migrations"
	@echo "  $(GREEN)migrate-fresh$(RESET)            Drop all tables and re-run migrations (⚠ deletes data)"
	@echo "  $(GREEN)seed$(RESET)                     Run seeders to generate mock data"
	@echo "  $(GREEN)artisan CMD=\"...\"$(RESET)          Run arbitrary php artisan command in container"
	@echo ""
	@echo "$(YELLOW)▶ Test Bot$(RESET)"
	@echo "  $(GREEN)bot-install$(RESET)             Install bot dependencies + Playwright browsers"
	@echo "  $(GREEN)bot-run$(RESET)                 Run the E2E player bot (uses config/config.json)"
	@echo "  $(GREEN)bot-clean$(RESET)               Clear bot reports and screenshots"
	@echo ""
	@echo "$(YELLOW)▶ Shell & Tools$(RESET)"
	@echo "  $(GREEN)be-shell$(RESET)                 Open bash shell in backend container"
	@echo "  $(GREEN)fe-shell$(RESET)                 Open sh shell in frontend container"
	@echo "  $(GREEN)fe-prod-build$(RESET)            Build FE production image"
	@echo ""

# ============================================================
#  SETUP & STARTUP
# ============================================================

.PHONY: setup
setup: ## Install whole project for first time (env + build + composer/yarn + migrate + seed)
	@echo "$(CYAN)▶ [1/6] Creating .env files...$(RESET)"
	@[ -f $(BE_DIR)/.env ] || cp $(BE_DIR)/.env.dev $(BE_DIR)/.env
	@[ -f $(FE_DIR)/.env ] || cp $(FE_DIR)/.env.example $(FE_DIR)/.env
	@echo "$(CYAN)▶ [2/6] Building and starting Docker (full stack)...$(RESET)"
	@docker compose $(FULL_COMPOSE) up -d --build
	@echo "$(CYAN)▶ [3/6] Running composer install + starting Reverb/queue...$(RESET)"
	@docker exec $(APP_CONTAINER) composer install --no-interaction --prefer-dist
	@docker exec $(APP_CONTAINER) supervisorctl start reverb queue 2>/dev/null || true
	@echo "$(CYAN)▶ [4/6] Installing frontend dependencies (yarn install)...$(RESET)"
	@echo "$(CYAN)   - Running yarn install on local machine...$(RESET)"
	@cd $(FE_DIR) && yarn install
	@echo "$(CYAN)   - Running yarn install inside container...$(RESET)"
	@docker exec $(FE_CONTAINER) yarn install
	@echo "$(CYAN)▶ [5/6] Waiting for MySQL to be ready...$(RESET)"
	@$(MAKE) db-wait
	@echo "$(CYAN)▶ [6/6] Generating key + migrating + seeding...$(RESET)"
	@docker exec $(APP_CONTAINER) php artisan key:generate
	@docker exec $(APP_CONTAINER) php artisan migrate --seed --force
	@echo ""
	@echo "$(GREEN)✅ Setup completed!$(RESET)"
	@echo "   Backend:  http://localhost:8000"
	@echo "   Frontend: http://localhost:5173"
	@echo ""

.PHONY: up
up: ## Start full stack
	@echo "$(CYAN)▶ Starting full stack...$(RESET)"
	@docker compose $(FULL_COMPOSE) up -d
	@echo "$(GREEN)✅ Stack is running$(RESET)"
	@echo "   Backend:  http://localhost:8000"
	@echo "   Frontend: http://localhost:5173"

.PHONY: down
down: ## Stop and remove all containers
	@echo "$(CYAN)▶ Stopping full stack...$(RESET)"
	@docker compose $(FULL_COMPOSE) down

.PHONY: restart
restart: ## Restart all containers
	@docker compose $(FULL_COMPOSE) restart

.PHONY: logs
logs: ## View real-time logs of all containers
	@docker compose $(FULL_COMPOSE) logs -f

.PHONY: ps
ps: ## View containers status
	@docker compose $(FULL_COMPOSE) ps

# ============================================================
#  LIBRARIES & PACKAGES
# ============================================================

.PHONY: fe-install
fe-install: ## Install frontend libraries (run on both local machine and container)
	@echo "$(CYAN)▶ Installing on local machine (yarn install)...$(RESET)"
	@cd $(FE_DIR) && yarn install
	@echo "$(CYAN)▶ Installing inside container (yarn install)...$(RESET)"
	@docker exec $(FE_CONTAINER) yarn install
	@echo "$(CYAN)▶ Clearing Vite dep cache so new packages are picked up...$(RESET)"
	@docker exec $(FE_CONTAINER) rm -rf /app/node_modules/.vite
	@docker restart $(FE_CONTAINER)
	@echo "$(GREEN)✅ Frontend libraries installed successfully$(RESET)"

.PHONY: be-composer
be-composer: ## Run composer install in backend container
	@echo "$(CYAN)▶ Running composer install...$(RESET)"
	@docker exec $(APP_CONTAINER) composer install --no-interaction --prefer-dist
	@echo "$(GREEN)✅ Composer install completed$(RESET)"

.PHONY: be-recreate
be-recreate: ## Recreate backend container only (use after changing quiz-be/.env)
	@echo "$(CYAN)▶ Recreating backend container to reload .env...$(RESET)"
	@docker compose $(FULL_COMPOSE) up -d --force-recreate --no-deps app
	@echo "$(GREEN)✅ Backend container recreated with latest .env$(RESET)"

.PHONY: be-services
be-services: ## Start/restart Reverb WebSocket server and queue worker
	@echo "$(CYAN)▶ Starting Reverb and queue worker...$(RESET)"
	@docker exec $(APP_CONTAINER) supervisorctl start reverb queue 2>/dev/null || \
		docker exec $(APP_CONTAINER) supervisorctl restart reverb queue
	@echo "$(GREEN)✅ Reverb and queue are running$(RESET)"

# ============================================================
#  DATABASE & ARTISAN
# ============================================================

.PHONY: migrate
migrate: ## Run migrations
	@echo "$(CYAN)▶ Running migrations...$(RESET)"
	@docker exec $(APP_CONTAINER) php artisan migrate --force
	@echo "$(GREEN)✅ Migrate completed$(RESET)"

.PHONY: migrate-fresh
migrate-fresh: ## Drop all tables and re-run migrations (⚠ deletes data)
	@docker exec $(APP_CONTAINER) php artisan migrate:fresh --force
	@echo "$(GREEN)✅ Fresh migrate completed$(RESET)"

.PHONY: seed
seed: ## Run all seeders
	@echo "$(CYAN)▶ Running seeders...$(RESET)"
	@docker exec $(APP_CONTAINER) php artisan db:seed --force
	@echo "$(GREEN)✅ Seeding completed (admin@quiz.com / password)$(RESET)"

.PHONY: db-wait
db-wait: ## Waiting for MySQL to be ready (used in setup)
	@echo "$(CYAN)▶ Waiting for MySQL...$(RESET)"
	@for i in $$(seq 1 30); do \
		docker exec $(MYSQL_CONTAINER) mysqladmin ping -h localhost --silent 2>/dev/null && break; \
		echo "  Attempt $$i/30..."; \
		sleep 2; \
	done
	@echo "$(GREEN)✅ MySQL is ready$(RESET)"

# ============================================================
#  SHELL & TOOLS
# ============================================================

# ============================================================
#  TEST BOT
# ============================================================

.PHONY: bot-install
bot-install: ## Install bot dependencies + Playwright browsers
	@echo "$(CYAN)▶ Installing game-test-bot dependencies...$(RESET)"
	@cd $(BOT_DIR) && npm install
	@echo "$(CYAN)▶ Installing Playwright Chromium browser...$(RESET)"
	@cd $(BOT_DIR) && npx playwright install chromium
	@echo "$(GREEN)✅ Bot ready. Edit $(BOT_DIR)/config/config.json then run: make bot-run$(RESET)"

.PHONY: bot-run
bot-run: ## Run the E2E player bot
	@echo "$(CYAN)▶ Starting game-test-bot...$(RESET)"
	@cd $(BOT_DIR) && npm run start

.PHONY: bot-clean
bot-clean: ## Clear bot reports and screenshots
	@echo "$(CYAN)▶ Cleaning bot output...$(RESET)"
	@rm -rf $(BOT_DIR)/reports/* $(BOT_DIR)/screenshots/*
	@echo "$(GREEN)✅ Cleaned$(RESET)"

# ============================================================
#  SHELL & TOOLS
# ============================================================

.PHONY: be-shell
be-shell: ## Open bash shell in app container
	@docker exec -it $(APP_CONTAINER) bash

.PHONY: fe-shell
fe-shell: ## Open shell in FE container
	@docker exec -it $(FE_CONTAINER) sh

.PHONY: artisan
artisan: ## Run arbitrary artisan command. Usage: make artisan CMD="route:list"
	@docker exec -it $(APP_CONTAINER) php artisan $(CMD)

.PHONY: fe-prod-build
fe-prod-build: ## Build FE production image
	@echo "$(CYAN)▶ Build FE production image...$(RESET)"
	@docker build -t $${DOCKERHUB_USERNAME:-quiz-fe-prod}/quiz-fe:latest -f $(FE_DIR)/Dockerfile --target prod $(FE_DIR)
	@echo "$(GREEN)✅ FE production image built$(RESET)"
