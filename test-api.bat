@echo off
REM API Testing Script for Windows
REM Tests all endpoints of the Policy Retriever API

setlocal enabledelayedexpansion

set API_URL=http://localhost:5000
set PASSED=0
set FAILED=0

cls
echo.
echo ========================================================
echo Government Schemes Policy Retriever - API Test Suite
echo ========================================================
echo.

REM Check if API is running
echo Checking API connection...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/api/health' -UseBasicParsing; Write-Host 'Connected!' -ForegroundColor Green } catch { Write-Host 'Failed to connect to API!' -ForegroundColor Red; exit 1 }"

if errorlevel 1 (
    echo.
    echo ERROR: Could not connect to API server
    echo Make sure to run the API first: start-api.bat
    exit /b 1
)

echo.
echo ========================================================
echo Running API Tests...
echo ========================================================
echo.

REM Test 1: Health Check
echo.
echo [TEST 1] Health Check
powershell -Command "Invoke-RestMethod -Uri '%API_URL%/api/health' | ConvertTo-Json | Write-Host -ForegroundColor Green"
set /a PASSED+=1

REM Test 2: Get All Schemes
echo.
echo [TEST 2] Get All Schemes (Paginated)
powershell -Command "Invoke-RestMethod -Uri '%API_URL%/api/schemes?page=1^&pageSize=5' | ConvertTo-Json | Write-Host -ForegroundColor Green"
set /a PASSED+=1

REM Test 3: Search
echo.
echo [TEST 3] Search for 'education'
powershell -Command "@{query='education'; limit=10} | ConvertTo-Json | Out-File -FilePath search_payload.json; Invoke-RestMethod -Uri '%API_URL%/api/schemes/search' -Method Post -Body (Get-Content search_payload.json) -Headers @{'Content-Type'='application/json'} | ConvertTo-Json | Write-Host -ForegroundColor Green; Remove-Item search_payload.json"
set /a PASSED+=1

REM Test 4: Filter by Category
echo.
echo [TEST 4] Filter by Category (Education ^& Learning)
powershell -Command "@{category='Education ^& Learning'; limit=10} | ConvertTo-Json | Out-File -FilePath filter_payload.json; Invoke-RestMethod -Uri '%API_URL%/api/schemes/filter' -Method Post -Body (Get-Content filter_payload.json) -Headers @{'Content-Type'='application/json'} | ConvertTo-Json | Write-Host -ForegroundColor Green; Remove-Item filter_payload.json"
set /a PASSED+=1

REM Test 5: Get Metadata
echo.
echo [TEST 5] Get Metadata
powershell -Command "Invoke-RestMethod -Uri '%API_URL%/api/metadata' | ConvertTo-Json | Write-Host -ForegroundColor Green"
set /a PASSED+=1

REM Test 6: Get Statistics
echo.
echo [TEST 6] Get Statistics
powershell -Command "Invoke-RestMethod -Uri '%API_URL%/api/schemes/statistics' | ConvertTo-Json | Write-Host -ForegroundColor Green"
set /a PASSED+=1

REM Test 7: Advanced Search
echo.
echo [TEST 7] Advanced Search (education + State level)
powershell -Command "@{query='education'; level='State'; limit=10} | ConvertTo-Json | Out-File -FilePath advanced_search.json; Invoke-RestMethod -Uri '%API_URL%/api/schemes/advanced-search' -Method Post -Body (Get-Content advanced_search.json) -Headers @{'Content-Type'='application/json'} | ConvertTo-Json | Write-Host -ForegroundColor Green; Remove-Item advanced_search.json"
set /a PASSED+=1

REM Results
echo.
echo ========================================================
echo Test Results
echo ========================================================
echo.
color 0a
echo  PASSED: %PASSED%
color 0c
echo  FAILED: %FAILED%
color

if %FAILED% equ 0 (
    color 0a
    echo.
    echo All tests passed! 
    echo.
    color
) else (
    color 0c
    echo.
    echo Some tests failed!
    echo.
    color
)

pause

endlocal
