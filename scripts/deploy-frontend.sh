#!/bin/bash
set -e  # Exit on error

SERVICE_NAME="jobposting-frontend"
DEPLOY_DIR="/var/www/job-posting-frontend"
BACKUP_DIR="/var/www/job-posting-frontend.backup.$(date +%s)"
TARBALL="/tmp/frontend-deploy.tar.gz"

echo "========================================="
echo "Frontend Deployment Script"
echo "========================================="
echo "Service: $SERVICE_NAME"
echo "Deploy Directory: $DEPLOY_DIR"
echo "Backup Directory: $BACKUP_DIR"
echo "========================================="

# Stop service
echo "Stopping $SERVICE_NAME service..."
sudo systemctl stop $SERVICE_NAME || echo "Service was not running"

# Backup existing deployment
if [ -d "$DEPLOY_DIR" ]; then
  echo "Backing up existing deployment to $BACKUP_DIR..."
  sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR"
else
  echo "No existing deployment found, skipping backup"
fi

# Extract new code
echo "Extracting new code to $DEPLOY_DIR..."
sudo mkdir -p "$DEPLOY_DIR"
sudo tar -xzf "$TARBALL" -C "$DEPLOY_DIR"
sudo chown -R jobpostinguser:jobpostinguser "$DEPLOY_DIR"

# Install and build
echo "Installing dependencies..."
cd "$DEPLOY_DIR"
sudo -u jobpostinguser bun install

echo "Building application (this may take a few minutes)..."
sudo -u jobpostinguser bun --env-file=/home/jobpostinguser/.env.production run build

# Start service
echo "Starting $SERVICE_NAME service..."
sudo systemctl start $SERVICE_NAME

# Check service status
echo "Checking service status..."
sleep 3
sudo systemctl status $SERVICE_NAME --no-pager || {
  echo "❌ Service failed to start! Checking logs..."
  sudo journalctl -u $SERVICE_NAME -n 50 --no-pager
  exit 1
}

# Cleanup old backups (keep last 3)
echo "Cleaning up old backups (keeping last 3)..."
ls -dt /var/www/job-posting-frontend.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf || echo "No old backups to clean"

echo "========================================="
echo "✅ Frontend deployment successful!"
echo "========================================="
