#!/bin/bash

# Formance Ledger Visualizer - Complete Setup Script
echo "🚀 Setting up Formance Ledger Visualizer..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version $NODE_VERSION detected. Recommended version is 18+."
fi

print_status "Node.js version: $(node -v)"

# Install dependencies with auto-accept
print_status "Installing dependencies..."
if npm install --yes; then
    print_success "Dependencies installed successfully!"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check for vulnerabilities
print_status "Checking for security vulnerabilities..."
if npm audit --audit-level=moderate; then
    print_success "No critical vulnerabilities found"
else
    print_warning "Some vulnerabilities found. Run 'npm audit fix' to fix them."
fi

# Build the project
print_status "Building the project..."
if npm run build; then
    print_success "Project built successfully!"
else
    print_error "Build failed"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Formance Ledger Visualizer"
    print_success "Git repository initialized"
fi

print_success "Setup complete! 🎉"
echo ""
echo "Next steps:"
echo "1. Start development server: ${GREEN}npm run dev${NC}"
echo "2. Open browser to: ${GREEN}http://localhost:3000${NC}"
echo "3. Create GitHub repository: ${GREEN}./setup-github.sh${NC}"
echo "4. Deploy to GitHub Pages: Enable in repository settings"
echo ""
echo "Available commands:"
echo "  ${BLUE}npm run dev${NC}     - Start development server"
echo "  ${BLUE}npm run build${NC}   - Build for production"
echo "  ${BLUE}npm run preview${NC} - Preview production build"
echo "  ${BLUE}npm run lint${NC}    - Run ESLint"
echo ""
