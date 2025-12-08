# Test DNS resolution for Supabase database hostname
Write-Host "`n🔍 Testing DNS Resolution for Supabase Database...`n" -ForegroundColor Cyan

$hostname = "db.qnndqiaoeslxlkdvskqn.supabase.co"
$port = 5432

Write-Host "Testing hostname: $hostname`n"

# Test DNS resolution
try {
    $dnsResult = Resolve-DnsName -Name $hostname -ErrorAction Stop
    Write-Host "✅ DNS Resolution: SUCCESS" -ForegroundColor Green
    Write-Host "   IP Address(es):"
    $dnsResult | Where-Object { $_.Type -eq 'A' } | ForEach-Object {
        Write-Host "   - $($_.IPAddress)"
    }
    Write-Host ""
} catch {
    Write-Host "❌ DNS Resolution: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n"
    Write-Host "💡 Possible causes:" -ForegroundColor Yellow
    Write-Host "   1. Supabase project is paused or deleted"
    Write-Host "   2. Project reference ID is incorrect"
    Write-Host "   3. Network/DNS issue`n"
    Write-Host "   → Check your Supabase Dashboard to verify project status`n"
    exit 1
}

# Test port connectivity
Write-Host "Testing port connectivity on port $port...`n"
try {
    $tcpTest = Test-NetConnection -ComputerName $hostname -Port $port -WarningAction SilentlyContinue -ErrorAction Stop
    
    if ($tcpTest.TcpTestSucceeded) {
        Write-Host "✅ Port $port: OPEN" -ForegroundColor Green
        Write-Host "   Connection to database server is possible`n"
    } else {
        Write-Host "❌ Port $port: CLOSED or FILTERED" -ForegroundColor Red
        Write-Host "   Cannot connect to database port`n"
    }
} catch {
    Write-Host "❌ Port Test: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n"
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify project is active in Supabase Dashboard"
Write-Host "2. Get the correct connection string from: Settings → Database → Connection string (URI)"
Write-Host "3. Update your .env file with the correct DATABASE_URL`n"
