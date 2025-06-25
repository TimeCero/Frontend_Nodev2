$body = @{
    project_id = 'a3702f2f-a4a8-49b5-af7c-66dcb367285d'
    proposal = 'Test proposal with more than 50 characters to meet validation requirements for this field'
    cover_letter = 'Test cover letter with more than 100 characters to meet the validation requirements for this field in the application form submission process'
    estimated_duration = '2 weeks'
} | ConvertTo-Json

$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIzYzJkMjcwLTQ5NzgtNGI2MS1hNmNkLTc5MzM4MmE3NDk0NiIsImVtYWlsIjpudWxsLCJ1c2VyVHlwZSI6ImZyZWVsYW5jZXIiLCJwcm92aWRlciI6ImdpdGh1YiIsImlhdCI6MTc1MDc4OTI4OCwiZXhwIjoxNzUxMzk0MDg4fQ.ReueTqkUegGtntF3N9M2LXJHosgr9CRARQhvLkIHGxU'
}

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/applications' -Method POST -Headers $headers -Body $body
    Write-Host 'Status:' $response.StatusCode
    Write-Host 'Content:' $response.Content
} catch {
    Write-Host 'Error Status:' $_.Exception.Response.StatusCode
    Write-Host 'Error Message:' $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host 'Error Content:' $responseBody
    }
}