#!/bin/bash

echo "🔗 Git Remote Setup for Carrier Dispute System"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}Choose your Git hosting provider:${NC}"
echo "1) GitHub"
echo "2) GitLab"
echo "3) Bitbucket"
echo "4) Custom/Self-hosted"

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        read -p "Enter your GitHub username: " username
        read -p "Enter repository name: " repo
        REMOTE_URL="https://github.com/$username/$repo.git"
        ;;
    2)
        read -p "Enter your GitLab username: " username
        read -p "Enter repository name: " repo
        REMOTE_URL="https://gitlab.com/$username/$repo.git"
        ;;
    3)
        read -p "Enter your Bitbucket username: " username
        read -p "Enter repository name: " repo
        REMOTE_URL="https://bitbucket.org/$username/$repo.git"
        ;;
    4)
        read -p "Enter full Git repository URL: " REMOTE_URL
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo -e "\n${YELLOW}Setting up remote...${NC}"

# Check if remote already exists
if git remote get-url deploy &> /dev/null; then
    echo "Remote 'deploy' already exists. Updating..."
    git remote set-url deploy "$REMOTE_URL"
else
    git remote add deploy "$REMOTE_URL"
fi

echo -e "\n${GREEN}✅ Remote 'deploy' configured: $REMOTE_URL${NC}"
echo -e "\n${YELLOW}To push your code:${NC}"
echo "  git push deploy master"

echo -e "\n${YELLOW}To push with force (if needed):${NC}"
echo "  git push deploy master --force"

echo -e "\n${YELLOW}View all remotes:${NC}"
git remote -v
