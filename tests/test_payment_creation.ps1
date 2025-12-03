$baseUrl = "http://localhost:3002/api"

# Function to login and get token
function Login-User {
    param (
        [string]$email,
        [string]$password
    )
    $body = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
        return $response.data.accessToken
    } catch {
        Write-Host "Login failed for $email" -ForegroundColor Red
        Write-Host $_.Exception.Message
        return $null
    }
}

# 1. Login as Tenant (tenant2@example.com)
Write-Host "Logging in as Tenant (tenant2@example.com)..."
$tenantToken = Login-User -email "tenant2@example.com" -password "password"
if (-not $tenantToken) { exit 1 }
Write-Host "Tenant logged in." -ForegroundColor Green

# 2. Create Payment for Booking-2
Write-Host "Creating payment for booking-2..."
$paymentBody = @{
    bookingId = "booking-2"
    amount = 180000
    upiId = "test@upi"
    merchantName = "StayEasy Test"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/payments/create" -Method Post -Body $paymentBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $tenantToken" }
    
    if ($response.success) {
        Write-Host "Payment created successfully." -ForegroundColor Green
        Write-Host "Payment ID: $($response.data.paymentId)"
    } else {
        Write-Host "Failed to create payment (API returned success=false)." -ForegroundColor Red
        Write-Host $response.error.message
        exit 1
    }
} catch {
    Write-Host "Failed to create payment." -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "Error Body: $body"
    } else {
         Write-Host "No response body available."
    }
    exit 1
}

Write-Host "Payment creation test completed successfully!" -ForegroundColor Green
