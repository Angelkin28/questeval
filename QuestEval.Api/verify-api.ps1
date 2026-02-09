$baseUrl = "http://localhost:5122/api"

function Test-Endpoint($method, $endpoint, $body = $null) {
    Write-Host "Testing $method $endpoint..." -ForegroundColor Cyan
    try {
        if ($body) {
            $response = Invoke-RestMethod -Method $method -Uri "$baseUrl/$endpoint" -Body ($body | ConvertTo-Json -Depth 5) -ContentType "application/json"
        } else {
            $response = Invoke-RestMethod -Method $method -Uri "$baseUrl/$endpoint"
        }
        Write-Host "Success!" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "Failed: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            Write-Host $reader.ReadToEnd() -ForegroundColor Yellow
        }
        return $null
    }
}

# 1. Create Group
$group = @{
    Name = "Test Group 101"
    AccessCode = "CODE123"
}
$createdGroup = Test-Endpoint "POST" "groups" $group

if ($createdGroup) {
    $groupId = $createdGroup.Id
    Write-Host "Created Group ID: $groupId" -ForegroundColor Gray

    # 2. Create Project
    $project = @{
        Name = "AI Project"
        Description = "An AI project for testing"
        GroupId = $groupId
        Status = "Active"
    }
    $createdProject = Test-Endpoint "POST" "projects" $project

    if ($createdProject) {
        $projectId = $createdProject.Id
        Write-Host "Created Project ID: $projectId" -ForegroundColor Gray

        # 3. Create Evaluation
        $evaluation = @{
            ProjectId = $projectId
            EvaluatorId = "user-uuid-123" # Simulating external UUID
            FinalScore = 85.5
            Details = @(
                @{
                    CriterionId = "criterion-obj-id-1" # Mock ID
                    CriterionName = "Functionality"
                    Score = 90
                },
                @{
                    CriterionId = "criterion-obj-id-2" # Mock ID
                    CriterionName = "Design"
                    Score = 81
                }
            )
        }
        $createdEval = Test-Endpoint "POST" "evaluations" $evaluation
        
        if ($createdEval) {
             Write-Host "Created Evaluation ID: $($createdEval.Id)" -ForegroundColor Gray
        }
    }
}

Write-Host "Verification Complete." -ForegroundColor Magenta
