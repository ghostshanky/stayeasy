
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
    name = "Updated Name via Script Fix"
    bio = "This bio was updated by the fix script."
    mobile = "1234567890"
    role = "OWNER"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
}

try {
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/users/$userId" -Method Put -Body $updatePayload -Headers $headers -ContentType "application/json"
    
    Write-Host "Update response received."
    
    # Check for standardized format
    if ($updateResponse.success -eq $true -and $updateResponse.data) {
        Write-Host "Response format is correct (success: true, data: present)."
        
        $userData = $updateResponse.data
        if ($userData.name -eq "Updated Name via Script Fix" -and $userData.role -eq "OWNER") {
            Write-Host "Profile updated successfully!"
        } else {
            Write-Error "Profile update mismatch. Expected 'Updated Name via Script Fix' and 'OWNER', got '$($userData.name)' and '$($userData.role)'"
            exit 1
        }
    } else {
        Write-Error "Invalid response format. Expected { success: true, data: ... }"
        Write-Host "Got: $($updateResponse | ConvertTo-Json)"
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
    
    # Check for standardized format
    if ($getResponse.success -eq $true -and $getResponse.data) {
        $userData = $getResponse.data
        
        if ($userData.name -eq "Updated Name via Script Fix" -and $userData.bio -eq "This bio was updated by the fix script." -and $userData.mobile -eq "1234567890" -and $userData.role -eq "OWNER") {
            Write-Host "Persistence verified! All fields match."
        } else {
            Write-Error "Persistence check failed. Data mismatch."
            Write-Host "Got: $($userData | ConvertTo-Json)"
            exit 1
        }
    } else {
        Write-Error "Invalid GET response format. Expected { success: true, data: ... }"
        Write-Host "Got: $($getResponse | ConvertTo-Json)"
        exit 1
    }
} catch {
    Write-Error "Get Profile request failed: $_"
    exit 1
}
