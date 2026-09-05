# ============================================================
# PeoplePay360 - Google Cloud IAM setup (Windows PowerShell)
#
# Creates the three custom IAM roles and binds the users to
# them. Requires the gcloud CLI (https://cloud.google.com/sdk).
#
# Usage:
#   $env:PROJECT_ID="your-project-id"
#   powershell -ExecutionPolicy Bypass -File gcp/iam/setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

if (-not $env:PROJECT_ID) {
    Write-Error "Set PROJECT_ID to your Google Cloud project ID:`n  `$env:PROJECT_ID=`"your-project-id`""
}

Write-Output "=============================================="
Write-Output " PeoplePay360 GCP IAM setup"
Write-Output " Project: $env:PROJECT_ID"
Write-Output "=============================================="

$RolesDir = Join-Path $PSScriptRoot "roles"

function Create-Or-Update-Role {
    param([string]$RoleId, [string]$FilePath)

    $exists = $true
    gcloud iam roles describe $RoleId --project=$env:PROJECT_ID *> $null
    if ($LASTEXITCODE -ne 0) { $exists = $false }

    if ($exists) {
        Write-Output "-> Updating existing role: $RoleId"
        gcloud iam roles update $RoleId --project=$env:PROJECT_ID --file=$FilePath
    } else {
        Write-Output "-> Creating role: $RoleId"
        gcloud iam roles create $RoleId --project=$env:PROJECT_ID --file=$FilePath
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to configure role $RoleId"
    }
}

Create-Or-Update-Role "hrManager" (Join-Path $RolesDir "hrManager.yaml")
Create-Or-Update-Role "hrPayrollUser" (Join-Path $RolesDir "hrPayrollUser.yaml")
Create-Or-Update-Role "hrPayrollManager" (Join-Path $RolesDir "hrPayrollManager.yaml")

function Add-UserBinding {
    param([string]$RoleId, [string]$Email)

    Write-Output "-> Binding $Email to $RoleId"
    gcloud projects add-iam-policy-binding $env:PROJECT_ID `
        --member="user:$Email" `
        --role="projects/$env:PROJECT_ID/roles/$RoleId"

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to bind $Email to $RoleId"
    }
}

Add-UserBinding "hrManager" "vinayvajabs2276@gmail.com"
Add-UserBinding "hrPayrollUser" "vinayvaja2276@gmail.com"
Add-UserBinding "hrPayrollManager" "parthparmar5172@gmail.com"

Write-Output ""
Write-Output "=============================================="
Write-Output " IAM setup complete."
Write-Output ""
Write-Output " Users:"
Write-Output "   vinayvajabs2276@gmail.com  -> HR Manager"
Write-Output "   vinayvaja2276@gmail.com    -> HR Payroll User"
Write-Output "   parthparmar5172@gmail.com  -> HR Payroll Manager"
Write-Output "=============================================="