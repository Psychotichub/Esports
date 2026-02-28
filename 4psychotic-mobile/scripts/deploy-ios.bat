@echo off
REM ============================================================================
REM 4psychotic - iOS Deployment Script (Windows)
REM Builds and submits to App Store using EAS
REM
REM Usage:
REM   deploy-ios.bat [development|preview|production] [--submit]
REM
REM Examples:
REM   deploy-ios.bat development
REM   deploy-ios.bat production --submit
REM ============================================================================

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_DIR=%~dp0..
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set LOG_FILE=%PROJECT_DIR%\logs\ios_deploy_%TIMESTAMP%.log

mkdir "%PROJECT_DIR%\logs" 2>nul

call :print_header
call :validate_profile %1
call :check_prerequisites

set SUBMIT_FLAG=%2
if "!SUBMIT_FLAG!"=="--submit" set SUBMIT_FLAG=true
if "!SUBMIT_FLAG!"=="" set SUBMIT_FLAG=false

call :log "Starting iOS deployment..."
call :log "Profile: %PROFILE%"
call :log "Submit to App Store: !SUBMIT_FLAG!"

call :setup_credentials
call :build_ios
call :download_build

if "!SUBMIT_FLAG!"=="true" (
    call :submit_to_app_store
) else (
    call :warning "Build not submitted to App Store"
    call :warning "To submit, run: deploy-ios.bat %PROFILE% --submit"
)

call :generate_report
call :success "iOS deployment completed!"
exit /b 0

REM ============================================================================
REM Functions
REM ============================================================================

:print_header
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  4psychotic - iOS Deployment (Windows)                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
exit /b 0

:validate_profile
set PROFILE=%1
if "!PROFILE!"=="" set PROFILE=production

if "!PROFILE!"=="development" (
    call :success "Profile: !PROFILE!"
) else if "!PROFILE!"=="preview" (
    call :success "Profile: !PROFILE!"
) else if "!PROFILE!"=="production" (
    call :success "Profile: !PROFILE!"
) else (
    call :error "Invalid profile: !PROFILE!"
    exit /b 1
)
exit /b 0

:check_prerequisites
call :log "Checking prerequisites..."

where node >nul 2>&1
if errorlevel 1 (
    call :error "Node.js is not installed"
    exit /b 1
)
call :success "Node.js found"

where eas >nul 2>&1
if errorlevel 1 (
    call :warning "EAS CLI not found. Installing..."
    call npm install -g eas-cli
)
call :success "EAS CLI found"

if "!EXPO_ID!"=="" (
    call :error "EXPO_ID environment variable not set"
    call :error "Set with: set EXPO_ID=your-project-id"
    exit /b 1
)
call :success "EXPO_ID configured"
exit /b 0

:setup_credentials
call :log "Setting up iOS signing credentials..."
call eas credentials --platform ios
call :success "Credentials configured"
exit /b 0

:build_ios
call :log "Building for iOS (!PROFILE!)..."
cd /d "%PROJECT_DIR%"

call eas build --platform ios --profile !PROFILE!
if errorlevel 1 (
    call :error "iOS build failed"
    exit /b 1
)

call :success "iOS build completed"
exit /b 0

:download_build
call :log "Downloading iOS build..."
cd /d "%PROJECT_DIR%"

call eas build:download --latest --platform ios
call :success "Build downloaded"
exit /b 0

:submit_to_app_store
call :log "Submitting to App Store..."
cd /d "%PROJECT_DIR%"

call eas submit --platform ios --latest
if errorlevel 1 (
    call :error "App Store submission failed"
    exit /b 1
)

call :success "App Store submission completed"
exit /b 0

:generate_report
set REPORT_FILE=%PROJECT_DIR%\logs\ios_deployment_report_%TIMESTAMP%.txt
(
    echo 4psychotic iOS Deployment Report
    echo Date: %date% %time%
    echo Profile: !PROFILE!
    echo Submit to App Store: !SUBMIT_FLAG!
    echo.
    echo Build Information:
    echo - Platform: iOS
    echo - Bundle ID: com.psychotic.mobile
    echo - Profile: !PROFILE!
    echo.
    echo Next Steps:
    echo 1. Monitor App Store review status
    echo 2. Check email for review updates
    echo 3. Prepare for release
) > "%REPORT_FILE%"
call :success "iOS deployment report: %REPORT_FILE%"
exit /b 0

:log
echo [%date% %time%] %~1
echo [%date% %time%] %~1 >> "%LOG_FILE%"
exit /b 0

:success
echo [SUCCESS] %~1
echo [SUCCESS] %~1 >> "%LOG_FILE%"
exit /b 0

:error
echo [ERROR] %~1
echo [ERROR] %~1 >> "%LOG_FILE%"
exit /b 1

:warning
echo [WARNING] %~1
echo [WARNING] %~1 >> "%LOG_FILE%"
exit /b 0
