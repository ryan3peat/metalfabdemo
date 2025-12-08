# Quick check of DATABASE_URL format
$envContent = Get-Content .env -ErrorAction SilentlyContinue

if (-not $envContent) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

$dbUrl = $envContent | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $_ -replace '^DATABASE_URL=', '' }

if (-not $dbUrl) {
    Write-Host "❌ DATABASE_URL not found in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔍 DATABASE_URL Format Check:`n" -ForegroundColor Cyan

# Mask password
$maskedUrl = $dbUrl -replace ':[^:@]+@', ':****@'
Write-Host "Connection String: $maskedUrl`n"

# Check format
if ($dbUrl -match '^postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)$') {
    $user = $matches[1]
    $password = $matches[2]
    $host = $matches[3]
    $port = $matches[4]
    $database = $matches[5]
    
    Write-Host "✅ Format: Valid" -ForegroundColor Green
    Write-Host "   User: $user"
    Write-Host "   Password: " -NoNewline
    if ($password) {
        Write-Host "***" -NoNewline
        if ($password.Length -gt 3) {
            Write-Host $password.Substring($password.Length - 3)
        } else {
            Write-Host "***"
        }
    } else {
        Write-Host "MISSING" -ForegroundColor Red
    }
    Write-Host "   Host: $host"
    Write-Host "   Port: $port"
    Write-Host "   Database: $database`n"
    
    # Check if Supabase
    if ($host -match 'supabase\.co') {
        Write-Host "✅ Detected: Supabase database" -ForegroundColor Green
        if ($host -match 'qnndqiaoeslxlkdvskqn') {
            Write-Host "✅ Project ID matches: qnndqiaoeslxlkdvskqn`n" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Warning: Host does not match expected project ID`n" -ForegroundColor Yellow
        }
    }
    
    # Check common issues
    if (-not $password -or $password.Length -lt 5) {
        Write-Host "⚠️  Warning: Password seems too short or missing" -ForegroundColor Yellow
    }
    
    if ($host -notmatch 'supabase\.co' -and $host -notmatch 'localhost') {
        Write-Host "⚠️  Warning: Unusual host format" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ Invalid Format!" -ForegroundColor Red
    Write-Host "Expected: postgresql://user:password@host:port/database`n"
    Write-Host "Example:"
    Write-Host "postgresql://postgres:yourpassword@db.qnndqiaoeslxlkdvskqn.supabase.co:5432/postgres`n"
}
