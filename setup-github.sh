#!/bin/bash

# Formance Ledger Visualizer - GitHub Setup Script
echo "🚀 Setting up GitHub repository for Formance Ledger Visualizer..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Please run 'git init' first."
    exit 1
fi

# Get repository name from user
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter repository name (default: formance-ledger-visualizer): " REPO_NAME
REPO_NAME=${REPO_NAME:-formance-ledger-visualizer}

echo "📝 Creating GitHub repository: $GITHUB_USERNAME/$REPO_NAME"

# Create repository on GitHub (requires GitHub CLI)
if command -v gh &> /dev/null; then
    echo "🔧 Creating repository using GitHub CLI..."
    gh repo create $REPO_NAME --public --description "A comprehensive UI visualization tool for Formance Ledger capabilities across various use cases"
    
    # Add remote origin
    git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git
    
    # Push to GitHub
    echo "📤 Pushing code to GitHub..."
    git branch -M main
    git push -u origin main
    
    echo "✅ Repository created and code pushed successfully!"
    echo "🌐 Your repository is available at: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
else
    echo "⚠️  GitHub CLI not found. Please create the repository manually:"
    echo "1. Go to https://github.com/new"
    echo "2. Create a new repository named: $REPO_NAME"
    echo "3. Run the following commands:"
    echo "   git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
fi

echo "🎉 Setup complete! You can now:"
echo "   - View your repository at: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "   - Enable GitHub Pages in repository settings"
echo "   - Install dependencies with: npm install"
echo "   - Start development with: npm run dev"
