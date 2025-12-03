$baseUrl = "http://localhost:3002/api"
$email = "test_settings_" + (Get-Random) + "@example.com"
$password = "password123"
$newPassword = "newpassword123"
$name = "Test User"

function Invoke-ApiRequest {
    param (
        [string]$Uri,
        [string]$Method = "GET",
        [hashtable]$Body = @{},
        [string]$Token = $null
    )

    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    $params = @{
        Uri = $Uri
        Method = $Method
        Headers = $headers
        ErrorAction = "Stop"
    }

    if ($Method -ne "GET" -and $Body.Count -gt 0) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }

    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Host "Error calling $Uri ($Method): $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Response Body: $errorBody" -ForegroundColor Yellow
        }
        throw $_
    }
}

Write-Host "1. Creating a temporary user..." -ForegroundColor Cyan
try {
    $signupResponse = Invoke-ApiRequest -Uri "$baseUrl/auth/signup" -Method "POST" -Body @{
        email = $email
        password = $password
        name = $name
        role = "OWNER"
    }
    $token = $signupResponse.data.accessToken
    $userId = $signupResponse.data.user.id
    Write-Host "User created. ID: $userId" -ForegroundColor Green
} catch {
    Write-Host "Failed to create user. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Updating Profile..." -ForegroundColor Cyan
try {
    $updateResponse = Invoke-ApiRequest -Uri "$baseUrl/users/$userId" -Method "PUT" -Token $token -Body @{
        name = "Updated Name"
        bio = "Updated Bio"
        mobile = "1234567890"
    }
    Write-Host "Profile updated successfully." -ForegroundColor Green
} catch {
    Write-Host "Failed to update profile." -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Verifying Profile Update..." -ForegroundColor Cyan
try {
    $userResponse = Invoke-ApiRequest -Uri "$baseUrl/users/$userId" -Method "GET" -Token $token
    if ($userResponse.name -eq "Updated Name" -and $userResponse.bio -eq "Updated Bio") {
        Write-Host "Profile verification successful." -ForegroundColor Green
    } else {
        Write-Host "Profile verification failed. Data mismatch." -ForegroundColor Red
        Write-Host "Expected: Name='Updated Name', Bio='Updated Bio'" -ForegroundColor Yellow
        Write-Host "Actual: Name='$($userResponse.name)', Bio='$($userResponse.bio)'" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "Failed to fetch profile." -ForegroundColor Red
    exit 1
}

Write-Host "`n4. Changing Password..." -ForegroundColor Cyan
try {
    $passwordResponse = Invoke-ApiRequest -Uri "$baseUrl/users/$userId/password" -Method "PUT" -Token $token -Body @{
        currentPassword = $password
        newPassword = $newPassword
    }
    Write-Host "Password changed successfully." -ForegroundColor Green
} catch {
    Write-Host "Failed to change password." -ForegroundColor Red
    exit 1
}

Write-Host "`n5. Verifying Login with New Password..." -ForegroundColor Cyan
try {
    $loginResponse = Invoke-ApiRequest -Uri "$baseUrl/auth/login" -Method "POST" -Body @{
        email = $email
        password = $newPassword
    }
    $newToken = $loginResponse.data.accessToken
    Write-Host "Login with new password successful." -ForegroundColor Green
} catch {
    Write-Host "Login with new password failed." -ForegroundColor Red
    exit 1
}

Write-Host "`n6. Deleting Account..." -ForegroundColor Cyan
try {
    $deleteResponse = Invoke-ApiRequest -Uri "$baseUrl/users/$userId" -Method "DELETE" -Token $newToken
    Write-Host "Account deleted successfully." -ForegroundColor Green
} catch {
    Write-Host "Failed to delete account." -ForegroundColor Red
    exit 1
}

Write-Host "`n7. Verifying Account Deletion (Login should fail)..." -ForegroundColor Cyan
try {
    $failLoginResponse = Invoke-ApiRequest -Uri "$baseUrl/auth/login" -Method "POST" -Body @{
        email = $email
        password = $newPassword
    }
    Write-Host "Login succeeded unexpectedly! Account was not deleted." -ForegroundColor Red
    exit 1
} catch {
    Write-Host "Login failed as expected (Account deleted)." -ForegroundColor Green
}

Write-Host "`nAll tests passed successfully!" -ForegroundColor Green
exit 0
