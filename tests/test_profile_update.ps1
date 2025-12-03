
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

# 2. Update Profile
Write-Host "Updating profile..."
$updatePayload = @{
    name = "Updated Name via Script"
    bio = "This bio was updated by the test script."
    mobile = "9876543210"
    role = "OWNER"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
}

try {
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/users/$userId" -Method Put -Body $updatePayload -Headers $headers -ContentType "application/json"
    
    Write-Host "Update response received."
    
    if ($updateResponse.name -eq "Updated Name via Script" -and $updateResponse.role -eq "OWNER") {
        Write-Host "Profile updated successfully!"
    } else {
        Write-Error "Profile update mismatch. Expected 'Updated Name via Script' and 'OWNER', got '$($updateResponse.name)' and '$($updateResponse.role)'"
        exit 1
    }
} catch {
    Write-Error "Update Profile request failed: $_"
    exit 1
}

# 3. Verify Persistence (Get Profile)
Write-Host "Verifying persistence..."
try {
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/users/$userId" -Method Get -Headers $headers
    
    if ($getResponse.name -eq "Updated Name via Script" -and $getResponse.bio -eq "This bio was updated by the test script." -and $getResponse.mobile -eq "9876543210" -and $getResponse.role -eq "OWNER") {
        Write-Host "Persistence verified! All fields match."
    } else {
        Write-Error "Persistence check failed. Data mismatch."
        Write-Host "Got: $($getResponse | ConvertTo-Json)"
        exit 1
    }
} catch {
    Write-Error "Get Profile request failed: $_"
    exit 1
}
