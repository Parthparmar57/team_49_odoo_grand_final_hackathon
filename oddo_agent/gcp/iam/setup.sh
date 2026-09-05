#!/usr/bin/env bash
# ============================================================
# PeoplePay360 - Google Cloud IAM setup
#
# Creates the three custom IAM roles and binds the users to
# them. Run from Cloud Shell or anywhere gcloud CLI is installed.
#
# Usage:
#   PROJECT_ID=your-project-id bash gcp/iam/setup.sh
# ============================================================
set -euo pipefail

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID to your Google Cloud project ID}"

echo "=============================================="
echo " PeoplePay360 GCP IAM setup"
echo " Project: $PROJECT_ID"
echo "=============================================="

ROLES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/roles"

# ------------------------------------------------------------
# 1. Create custom roles (idempotent - updates if they exist)
# ------------------------------------------------------------
create_or_update_role() {
  local role_id="$1"
  local file="$2"

  if gcloud iam roles describe "$role_id" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "→ Updating existing role: $role_id"
    gcloud iam roles update "$role_id" \
      --project="$PROJECT_ID" \
      --file="$file"
  else
    echo "→ Creating role: $role_id"
    gcloud iam roles create "$role_id" \
      --project="$PROJECT_ID" \
      --file="$file"
  fi
}

create_or_update_role "hrManager" "$ROLES_DIR/hrManager.yaml"
create_or_update_role "hrPayrollUser" "$ROLES_DIR/hrPayrollUser.yaml"
create_or_update_role "hrPayrollManager" "$ROLES_DIR/hrPayrollManager.yaml"

# ------------------------------------------------------------
# 2. Bind users to roles
# ------------------------------------------------------------
bind_user() {
  local role_id="$1"
  local email="$2"
  echo "→ Binding $email to $role_id"
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="user:$email" \
    --role="projects/$PROJECT_ID/roles/$role_id"
}

bind_user "hrManager" "vinayvajabs2276@gmail.com"
bind_user "hrPayrollUser" "vinayvaja2276@gmail.com"
bind_user "hrPayrollManager" "parthparmar5172@gmail.com"

echo ""
echo "=============================================="
echo " IAM setup complete."
echo ""
echo " Users:"
echo "   vinayvajabs2276@gmail.com  -> HR Manager"
echo "   vinayvaja2276@gmail.com    -> HR Payroll User"
echo "   parthparmar5172@gmail.com  -> HR Payroll Manager"
echo "=============================================="