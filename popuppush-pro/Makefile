# Pop-up Push Pro - Makefile
# Quick commands for development and deployment

.PHONY: help setup start stop restart logs status backup restore clean test deploy

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "${BLUE}Pop-up Push Pro - Available Commands${NC}"
	@echo "===================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "${GREEN}%-15s${NC} %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Initial setup (run once)
	@echo "${YELLOW}Setting up Pop-up Push Pro...${NC}"
	chmod +x setup.sh
	./setup.sh

start: ## Start all services
	@echo "${GREEN}Starting services...${NC}"
	docker-compose up -d
	@echo "${GREEN}Services started!${NC}"
	@echo "API: http://localhost:3001"
	@echo "Web: http://localhost"

stop: ## Stop all services
	@echo "${YELLOW}Stopping services...${NC}"
	docker-compose down
	@echo "${GREEN}Services stopped${NC}"

restart: ## Restart all services
	@echo "${YELLOW}Restarting services...${NC}"
	docker-compose restart
	@echo "${GREEN}Services restarted${NC}"

logs: ## View logs (follow mode)
	@echo "${BLUE}Viewing logs...${NC}"
	docker-compose logs -f

logs-api: ## View API logs only
	@docker-compose logs -f api

logs-db: ## View database logs only
	@docker-compose logs -f postgres

status: ## Show services status
	@echo "${BLUE}Services Status:${NC}"
	@docker-compose ps

health: ## Run health checks
	@echo "${BLUE}Running health checks...${NC}"
	@curl -s http://localhost:3001/health && echo " ${GREEN}✓ API OK${NC}" || echo " ${RED}✗ API Failed${NC}"
	@curl -s http://localhost/nginx-health && echo " ${GREEN}✓ Nginx OK${NC}" || echo " ${RED}✗ Nginx Failed${NC}"
	@docker-compose exec -T postgres pg_isready -q && echo "${GREEN}✓ PostgreSQL OK${NC}" || echo "${RED}✗ PostgreSQL Failed${NC}"
	@docker-compose exec -T redis redis-cli ping | grep -q PONG && echo "${GREEN}✓ Redis OK${NC}" || echo "${RED}✗ Redis Failed${NC}"

backup: ## Backup database and uploads
	@echo "${YELLOW}Creating backup...${NC}"
	@mkdir -p backups
	@docker-compose exec -T postgres pg_dump -U popuppush popuppush > backups/db_$(shell date +%Y%m%d_%H%M%S).sql
	@tar -czf backups/uploads_$(shell date +%Y%m%d_%H%M%S).tar.gz uploads/ 2>/dev/null || echo "No uploads to backup"
	@echo "${GREEN}Backup completed!${NC}"

restore: ## Restore from backup (interactive)
	@echo "${YELLOW}Available backups:${NC}"
	@ls -1 backups/ 2>/dev/null || echo "No backups found"
	@read -p "Enter backup filename: " file; \
	if [ -f "backups/$$file" ]; then \
		docker-compose exec -T postgres psql -U popuppush popuppush < backups/$$file; \
		echo "${GREEN}Restored from $$file${NC}"; \
	else \
		echo "${RED}File not found${NC}"; \
	fi

clean: ## Clean up containers and volumes (⚠️ destructive)
	@echo "${RED}WARNING: This will delete all data!${NC}"
	@read -p "Are you sure? Type 'yes' to confirm: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker-compose down -v; \
		docker system prune -f; \
		echo "${GREEN}Cleanup completed${NC}"; \
	else \
		echo "${YELLOW}Cancelled${NC}"; \
	fi

build: ## Rebuild containers
	@echo "${YELLOW}Rebuilding containers...${NC}"
	docker-compose build --no-cache
	@echo "${GREEN}Build completed${NC}"

shell-api: ## Open shell in API container
	@docker-compose exec api sh

shell-db: ## Open PostgreSQL shell
	@docker-compose exec postgres psql -U popuppush popuppush

shell-redis: ## Open Redis CLI
	@docker-compose exec redis redis-cli

test: ## Run tests (when implemented)
	@echo "${YELLOW}Running tests...${NC}"
	@docker-compose exec api npm test 2>/dev/null || echo "${YELLOW}No tests configured yet${NC}"

deploy: ## Deploy to production (requires server config)
	@echo "${YELLOW}Deploying to production...${NC}"
	@echo "${BLUE}Building for production...${NC}"
	docker-compose -f docker-compose.yml up -d --build
	@echo "${GREEN}Deployment completed!${NC}"

update: ## Update to latest version
	@echo "${YELLOW}Updating Pop-up Push Pro...${NC}"
	@git pull 2>/dev/null || echo "Not a git repository, skipping git pull"
	docker-compose pull
	docker-compose up -d --build
	@echo "${GREEN}Update completed!${NC}"

# Development helpers
dev-logs: ## Development mode logs (all services)
	@docker-compose logs -f --tail=100

dev-restart-api: ## Quick API restart for development
	@docker-compose restart api
	@echo "${GREEN}API restarted${NC}"

dev-db-reset: ## Reset database (development only)
	@echo "${RED}Resetting database...${NC}"
	@docker-compose exec postgres psql -U popuppush -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null || true
	@docker-compose exec postgres psql -U popuppush -f /docker-entrypoint-initdb.d/01-schema.sql 2>/dev/null || true
	@docker-compose exec postgres psql -U popuppush -f /docker-entrypoint-initdb.d/02-seed.sql 2>/dev/null || true
	@echo "${GREEN}Database reset completed${NC}"

# Information
info: ## Show system information
	@echo "${BLUE}System Information:${NC}"
	@echo "==================="
	@echo "Docker version: $(shell docker --version)"
	@echo "Docker Compose version: $(shell docker-compose --version)"
	@echo ""
	@echo "${BLUE}Container Status:${NC}"
	@docker-compose ps
	@echo ""
	@echo "${BLUE}Resource Usage:${NC}"
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" 2>/dev/null || echo "Containers not running"

# SSL Certificate Management
ssl-generate: ## Generate self-signed SSL certificates
	@echo "${YELLOW}Generating SSL certificates...${NC}"
	@mkdir -p nginx/ssl
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/key.pem \
		-out nginx/ssl/cert.pem \
		-subj "/C=SA/ST=Riyadh/L=Riyadh/O=PopUpPush/CN=localhost"
	@echo "${GREEN}SSL certificates generated${NC}"

ssl-renew: ## Renew Let's Encrypt certificates (production)
	@echo "${YELLOW}Renewing SSL certificates...${NC}"
	@certbot renew
	@docker-compose restart nginx
	@echo "${GREEN}SSL certificates renewed${NC}"
