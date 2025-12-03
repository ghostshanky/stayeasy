
$baseUrl = "http://localhost:3002/api"
$email = "dummy@gmail.com"
$password = "dummy"

# 1. Login
Write-Host "Logging in..."
$loginPayload = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    $token = $loginResponse.data.accessToken
    $userId = $loginResponse.data.user.id
    Write-Host "Login successful. User ID: $userId"
} catch {
    Write-Error "Login failed: $_"
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
}

# 2. Reset Role to TENANT (for testing)
Write-Host "Resetting role to TENANT..."
$resetPayload = @{
    role = "TENANT"
} | ConvertTo-Json

try {
    # We can use the PUT /users/:id endpoint for this as it's already verified
    $resetResponse = Invoke-RestMethod -Uri "$baseUrl/users/$userId" -Method Put -Body $resetPayload -Headers $headers -ContentType "application/json"
    Write-Host "Role reset to TENANT."
} catch {
    Write-Error "Role reset failed: $_"
    exit 1
}

# 3. Test Become Host (PATCH /auth/me/role)
Write-Host "Testing Become Host (PATCH /auth/me/role)..."
$hostPayload = @{
    role = "OWNER"
} | ConvertTo-Json

try {
    $hostResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me/role" -Method Patch -Body $hostPayload -Headers $headers -ContentType "application/json"
    
    if ($hostResponse.success -eq $true -and $hostResponse.data.user.role -eq "OWNER") {
        Write-Host "Successfully became a host! Role is now OWNER."
    } else {
        Write-Error "Failed to become host. Response: $($hostResponse | ConvertTo-Json)"
        exit 1
    }
} catch {
    Write-Error "Become Host request failed: $_"
    exit 1
}

# 4. Verify Persistence
Write-Host "Verifying persistence..."
try {
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
    
    if ($meResponse.data.user.role -eq "OWNER") {
        Write-Host "Persistence verified! User is an OWNER."
    } else {
        Write-Error "Persistence check failed. Role is $($meResponse.data.user.role)"
        exit 1
    }
} catch {
    Write-Error "Get Me request failed: $_"
    exit 1
}
