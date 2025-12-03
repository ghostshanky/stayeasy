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

# 1. Login as Tenant
Write-Host "Logging in as Tenant (tenant1@example.com)..."
$tenantToken = Login-User -email "tenant1@example.com" -password "password"
if (-not $tenantToken) { exit 1 }
Write-Host "Tenant logged in." -ForegroundColor Green

# 2. Login as Owner
Write-Host "Logging in as Owner (owner1@example.com)..."
$ownerToken = Login-User -email "owner1@example.com" -password "password"
if (-not $ownerToken) { exit 1 }
Write-Host "Owner logged in." -ForegroundColor Green

# Get Owner ID (we need it to verify message reception, though we can send via email too)
# We can decode token or just use the known ID from seed: user-owner-1
$ownerId = "user-owner-1"

# 3. Tenant sends message to Owner via Email
Write-Host "Tenant sending message to Owner (owner1@example.com)..."
$messageBody = @{
    recipientId = "owner1@example.com"
    content = "Hello from test script via email!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/messages" -Method Post -Body $messageBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $tenantToken" }
    Write-Host "Message sent successfully." -ForegroundColor Green
    $messageId = $response.data.id
    Write-Host "Message ID: $messageId"
} catch {
    Write-Host "Failed to send message." -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Error Body: $body"
    }
    exit 1
}

# 4. Owner checks Inbox
Write-Host "Owner checking inbox..."
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/messages/inbox" -Method Get -Headers @{ Authorization = "Bearer $ownerToken" }
    $messages = $response.data
    $found = $messages | Where-Object { $_.content -eq "Hello from test script via email!" }
    
    if ($found) {
        Write-Host "Message found in Owner's inbox!" -ForegroundColor Green
    } else {
        Write-Host "Message NOT found in Owner's inbox." -ForegroundColor Red
        Write-Host "Inbox contents:"
        $messages | ForEach-Object { Write-Host "- $($_.content)" }
        exit 1
    }
} catch {
    Write-Host "Failed to fetch inbox." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# 5. Tenant checks Conversations
Write-Host "Tenant checking conversations..."
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/messages/conversations" -Method Get -Headers @{ Authorization = "Bearer $tenantToken" }
    $conversations = $response.data
    # Check if conversation with Owner exists
    # Note: The API returns 'otherUser' object
    $found = $conversations | Where-Object { $_.otherUser.email -eq "owner1@example.com" }
    
    if ($found) {
        Write-Host "Conversation with Owner found!" -ForegroundColor Green
    } else {
        Write-Host "Conversation with Owner NOT found." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Failed to fetch conversations." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

Write-Host "Messaging test completed successfully!" -ForegroundColor Green
