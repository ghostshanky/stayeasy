
$baseUrl = "http://localhost:3002/api"
$ownerEmail = "dummy@gmail.com"
$ownerPassword = "dummy"

# 1. Login as Owner
Write-Host "Logging in as Owner..."
$loginPayload = @{
    email = $ownerEmail
    password = $ownerPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    $token = $loginResponse.data.accessToken
    $ownerId = $loginResponse.data.user.id
    Write-Host "Login successful. Token received."
} catch {
    Write-Error "Login failed: $_"
    exit 1
}

# 2. Add Property
Write-Host "Adding a new property..."
$propertyPayload = @{
    title = "Test Property via Script"
    description = "This is a test property created by the verification script."
    location = "Test City"
    price_per_night = 1500
    capacity = 4
    images = @("https://example.com/test-image.jpg")
    amenities = @("WiFi: Free", "Parking: Paid")
    tags = @("Cozy", "Modern")
    owner_id = $ownerId
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
}

try {
    $addResponse = Invoke-RestMethod -Uri "$baseUrl/owner/properties" -Method Post -Body $propertyPayload -Headers $headers -ContentType "application/json"
    
    if ($addResponse.success) {
        Write-Host "Property added successfully. ID: $($addResponse.data.id)"
        $newPropertyId = $addResponse.data.id
    } else {
        Write-Error "Failed to add property: $($addResponse.error)"
        exit 1
    }
} catch {
    Write-Error "Add Property request failed: $_"
    exit 1
}

# 3. Verify Property in My Listings
Write-Host "Verifying property in My Listings..."
try {
    $myListingsResponse = Invoke-RestMethod -Uri "$baseUrl/owner/properties" -Method Get -Headers $headers
    
    $found = $false
    foreach ($prop in $myListingsResponse.data) {
        if ($prop.id -eq $newPropertyId) {
            Write-Host "Property found in My Listings!"
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Error "Property NOT found in My Listings."
    }
} catch {
    Write-Error "Get My Listings request failed: $_"
}

# 4. Verify Property in Public Search
Write-Host "Verifying property in Public Search..."
try {
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/properties?city=Test City" -Method Get
    
    $found = $false
    foreach ($prop in $searchResponse.data) {
        if ($prop.id -eq $newPropertyId) {
            Write-Host "Property found in Public Search!"
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Error "Property NOT found in Public Search."
    }
} catch {
    Write-Error "Search request failed: $_"
}
