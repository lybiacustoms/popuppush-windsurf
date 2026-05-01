#!/bin/bash

# ============================================
# Pop-up Push Pro - Setup Script
# One-command deployment with demo data
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Functions
# ============================================

print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║              🚀 Pop-up Push Pro Setup                     ║"
    echo "║                                                            ║"
    echo "║     Digital Signage System for Modern Cafes              ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================
# Pre-flight Checks
# ============================================

check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        print_info "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
        exit 1
    fi
    print_success "Docker installed"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed."
        print_info "Run: sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    print_success "Docker Compose installed"
    
    # Check memory
    TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
    if [ $TOTAL_MEM -lt 4096 ]; then
        print_warning "Available memory is less than 4GB ($TOTAL_MEM MB)"
        print_info "Recommended: 4GB+ for production use"
    else
        print_success "Memory check passed (${TOTAL_MEM} MB)"
    fi
    
    # Check disk space
    DISK_SPACE=$(df -m . | tail -1 | awk '{print $4}')
    if [ $DISK_SPACE -lt 10240 ]; then
        print_warning "Available disk space is less than 10GB"
        print_info "Recommended: 20GB+ for production use"
    else
        print_success "Disk space check passed (${DISK_SPACE} MB free)"
    fi
}

# ============================================
# Environment Setup
# ============================================

setup_environment() {
    print_info "Setting up environment..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
            print_warning "Please edit .env and update passwords and API keys!"
            print_info "Required changes:"
            echo "  - DB_PASSWORD"
            echo "  - REDIS_PASSWORD"
            echo "  - JWT_SECRET"
            echo "  - SPORTS_API_KEY (get from https://www.api-football.com/)"
        else
            print_error ".env.example not found!"
            exit 1
        fi
    else
        print_success ".env already exists"
    fi
}

# ============================================
# Directory Setup
# ============================================

setup_directories() {
    print_info "Creating directories..."
    
    mkdir -p uploads
    mkdir -p nginx/ssl
    mkdir -p backups
    
    print_success "Directories created"
}

# ============================================
# SSL Certificates (Self-signed for demo)
# ============================================

generate_ssl() {
    print_info "Checking SSL certificates..."
    
    if [ ! -f nginx/ssl/cert.pem ]; then
        print_info "Generating self-signed SSL certificates..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=SA/ST=Riyadh/L=Riyadh/O=PopUpPush/CN=localhost"
        print_warning "Self-signed certificates generated (use proper SSL for production)"
    else
        print_success "SSL certificates exist"
    fi
}

# ============================================
# Docker Compose Operations
# ============================================

start_services() {
    print_info "Starting Pop-up Push Pro services..."
    
    docker-compose down --remove-orphans 2>/dev/null || true
    
    print_info "Building and starting containers (this may take a few minutes)..."
    docker-compose up -d --build
    
    print_success "Services started successfully!"
}

wait_for_health() {
    print_info "Waiting for services to be healthy..."
    
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if docker-compose ps | grep -q "healthy"; then
            print_success "All services are healthy!"
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        echo -n "."
        sleep 2
    done
    
    print_warning "Some services may still be starting..."
    return 1
}

# ============================================
# Health Checks
# ============================================

health_check() {
    print_info "Running health checks..."
    
    # Check API
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "API is responding"
    else
        print_warning "API health check failed"
    fi
    
    # Check Nginx
    if curl -s http://localhost/nginx-health > /dev/null 2>&1; then
        print_success "Nginx is responding"
    else
        print_warning "Nginx health check failed"
    fi
    
    # Check PostgreSQL
    if docker-compose exec -T postgres pg_isready -U popuppush > /dev/null 2>&1; then
        print_success "PostgreSQL is ready"
    else
        print_warning "PostgreSQL check failed"
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is responding"
    else
        print_warning "Redis check failed"
    fi
}

# ============================================
# Status Display
# ============================================

show_status() {
    echo ""
    print_success "🎉 Pop-up Push Pro is ready!"
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Access URLs:                                               ║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║                                                             ║${NC}"
    echo -e "${GREEN}║  📱 API:       http://$(hostname -I | awk '{print $1}'):3001${NC}"
    echo -e "${GREEN}║  🌐 Web:       http://$(hostname -I | awk '{print $1}')${NC}"
    echo -e "${GREEN}║  🐘 pgAdmin:   http://$(hostname -I | awk '{print $1}'):5050${NC}"
    echo -e "${GREEN}║                                                             ║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  Default Credentials:                                       ║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║                                                             ║${NC}"
    echo -e "${GREEN}║  👤 Admin:     admin@alreem-cafe.com / admin123            ${NC}"
    echo -e "${GREEN}║  🐘 pgAdmin:   admin@popuppush.com / admin123              ${NC}"
    echo -e "${GREEN}║                                                             ║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  Demo Data:                                                 ║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║                                                             ║${NC}"
    echo -e "${GREEN}║  ☕ Cafe:      مقهى الريم                                  ${NC}"
    echo -e "${GREEN}║  📺 Devices:   2 RK3588 Players                            ${NC}"
    echo -e "${GREEN}║  🎵 Content:   Music + Menu + Ads                          ${NC}"
    echo -e "${GREEN}║  ⚽ Schedule:  3 Azan + 1 Match                            ${NC}"
    echo -e "${GREEN}║                                                             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    print_info "Useful commands:"
    echo "  docker-compose logs -f      # View logs"
    echo "  docker-compose ps           # View status"
    echo "  docker-compose down         # Stop services"
    echo "  docker-compose up -d        # Start services"
    echo ""
}

# ============================================
# Main
# ============================================

main() {
    print_header
    
    echo ""
    print_info "Starting setup process..."
    echo ""
    
    check_prerequisites
    setup_environment
    setup_directories
    generate_ssl
    start_services
    wait_for_health
    health_check
    show_status
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Pop-up Push Pro Setup Script"
        echo ""
        echo "Usage: ./setup.sh [option]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check        Run pre-flight checks only"
        echo "  --reset        Reset all data and start fresh"
        echo "  --stop         Stop all services"
        echo ""
        ;;
    --check)
        check_prerequisites
        ;;
    --reset)
        print_warning "This will delete all data! Are you sure? (yes/no)"
        read -r response
        if [ "$response" = "yes" ]; then
            docker-compose down -v
            sudo rm -rf uploads/* postgres_data redis_data
            print_success "All data has been reset"
        else
            print_info "Reset cancelled"
        fi
        ;;
    --stop)
        docker-compose down
        print_success "Services stopped"
        ;;
    *)
        main
        ;;
esac
