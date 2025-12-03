$baseUrl = "http://localhost:3007/api"
$email = "testuser" + (Get-Random) + "@example.com"
$password = "password123"

# Signup
$body = @{
    email = $email
    password = $password
    name = "Test User"
    role = "TENANT"
} | ConvertTo-Json

Write-Host "Signing up as $email..."

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -Body $body -ContentType "application/json"
    $token = $response.data.accessToken
    Write-Host "Signup successful. Token: $token"
} catch {
    Write-Host "Signup failed."
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
         $stream = $_.Exception.Response.GetResponseStream()
         $reader = New-Object System.IO.StreamReader($stream)
         $body = $reader.ReadToEnd()
         Write-Host "Error Body: $body"
    }
    exit 1
}

# Send message to owner1@example.com
$msgBody = @{
    recipientId = "owner1@example.com"
    content = "Hello from new user"
} | ConvertTo-Json

Write-Host "Sending message..."

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/messages" -Method Post -Body $msgBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
    Write-Host "Message sent successfully."
    Write-Host "Message ID: $($response.data.id)"
} catch {
    Write-Host "Failed to send message."
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
         $stream = $_.Exception.Response.GetResponseStream()
         $reader = New-Object System.IO.StreamReader($stream)
         $body = $reader.ReadToEnd()
         Write-Host "Error Body: $body"
    }
    exit 1
}

# Check conversations
Write-Host "Checking conversations..."
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/messages/conversations" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "Conversations count: $($response.data.Length)"
    if ($response.data.Length -gt 0) {
        Write-Host "First conversation with: $($response.data[0].otherUser.email)"
    } else {
        Write-Host "No conversations found."
    }
} catch {
    Write-Host "Failed to fetch conversations."
    Write-Host $_.Exception.Message
    exit 1
}
