@echo off
REM ============================================================================
REM 4psychotic Mobile App - Master Deployment Script (Windows)
REM Deploys to Web, iOS, and Android with a single command
REM
REM Usage:
REM   deploy.bat [web|ios|android|all] [development|preview|production]
REM
REM Examples:
REM   deploy.bat web production
REM   deploy.bat ios production
REM   deploy.bat android production
REM   deploy.bat all production
REM ============================================================================

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_NAME=4psychotic
set PROJECT_DIR=%~dp0..
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set LOG_FILE=%PROJECT_DIR%\logs\deploy_%TIMESTAMP%.log
set DIST_DIR=%PROJECT_DIR%\dist

REM Create logs directory
if not exist "%PROJECT_DIR%\logs" mkdir "%PROJECT_DIR%\logs"

REM Helper functions
call :print_header
call :validate_inputs %*
call :check_prerequisites
call :log "Deployment started for platform: %PLATFORM% (profile: %PROFILE%)"
call :log "Log file: %LOG_FILE%"

REM Execute deployment
if "%PLATFORM%"=="web" (
    call :deploy_web
) else if "%PLATFORM%"=="ios" (
    call :deploy_ios
) else if "%PLATFORM%"=="android" (
    call :deploy_android
) else if "%PLATFORM%"=="all" (
    call :deploy_all
)

call :generate_report
call :success "Deployment completed successfully!"
exit /b 0

REM ============================================================================
REM Functions
REM ============================================================================

:print_header
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  4psychotic Mobile App - Deployment Script (Windows)      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
exit /b 0

:validate_inputs
if "%1"=="" (
    call :error "Missing platform argument"
    echo Usage: %0 [web^|ios^|android^|all] [development^|preview^|production]
    exit /b 1
)

set PLATFORM=%1
set PROFILE=%2
if "%PROFILE%"=="" set PROFILE=production

if "%PLATFORM%"=="web" (
    call :success "Platform: %PLATFORM%"
) else if "%PLATFORM%"=="ios" (
    call :success "Platform: %PLATFORM%"
) else if "%PLATFORM%"=="android" (
    call :success "Platform: %PLATFORM%"
) else if "%PLATFORM%"=="all" (
    call :success "Platform: %PLATFORM%"
) else (
    call :error "Invalid platform: %PLATFORM%"
    exit /b 1
)

if "%PROFILE%"=="development" (
    call :success "Profile: %PROFILE%"
) else if "%PROFILE%"=="preview" (
    call :success "Profile: %PROFILE%"
) else if "%PROFILE%"=="production" (
    call :success "Profile: %PROFILE%"
) else (
    call :error "Invalid profile: %PROFILE%"
    exit /b 1
)
exit /b 0

:check_prerequisites
call :log "Checking prerequisites..."

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    call :error "Node.js is not installed"
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
call :success "Node.js %NODE_VERSION% found"

REM Check npm
where npm >nul 2>&1
if errorlevel 1 (
    call :error "npm is not installed"
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
call :success "npm %NPM_VERSION% found"

REM Check EAS CLI for mobile builds
if not "%PLATFORM%"=="web" (
    where eas >nul 2>&1
    if errorlevel 1 (
        call :warning "EAS CLI not found. Installing..."
        call npm install -g eas-cli
    )
    call :success "EAS CLI found"
)

REM Check EXPO_ID for mobile builds
if not "%PLATFORM%"=="web" (
    if "!EXPO_ID!"=="" (
        call :error "EXPO_ID environment variable not set"
        call :error "Please set: set EXPO_ID=your-project-id"
        exit /b 1
    )
    call :success "EXPO_ID configured: !EXPO_ID!"
)
exit /b 0

:deploy_web
call :log "Starting web deployment..."
cd /d "%PROJECT_DIR%"

call :log "Building web app..."
call npm run build
if errorlevel 1 (
    call :error "Build failed"
    exit /b 1
)

if not exist "%DIST_DIR%" (
    call :error "Build failed: dist directory not found"
    exit /b 1
)

call :success "Web build completed"
call :warning "Manual deployment required:"
call :warning "  1. Upload dist\ folder to your web host"
call :warning "  2. Or use: vercel --prod --cwd dist"
call :warning "  3. Or use: netlify deploy --prod --dir dist"
exit /b 0

:deploy_ios
call :log "Starting iOS deployment..."
cd /d "%PROJECT_DIR%"

call :log "Building for iOS (%PROFILE%)..."
call eas build --platform ios --profile %PROFILE%
if errorlevel 1 (
    call :error "iOS build failed"
    exit /b 1
)

call :success "iOS build completed"
call :log "Download build from Expo dashboard"
call :log "Submit with: eas submit --platform ios --latest"
exit /b 0

:deploy_android
call :log "Starting Android deployment..."
cd /d "%PROJECT_DIR%"

call :log "Building for Android (%PROFILE%)..."
call eas build --platform android --profile %PROFILE%
if errorlevel 1 (
    call :error "Android build failed"
    exit /b 1
)

call :success "Android build completed"
call :log "Download build from Expo dashboard"
call :log "Submit with: eas submit --platform android --latest"
exit /b 0

:deploy_all
call :log "Starting multi-platform deployment..."
cd /d "%PROJECT_DIR%"

call :log "Building for all platforms (%PROFILE%)..."
call eas build --platform all --profile %PROFILE%
if errorlevel 1 (
    call :error "Multi-platform build failed"
    exit /b 1
)

call :success "All platform builds completed"
exit /b 0

:generate_report
set REPORT_FILE=%PROJECT_DIR%\logs\deployment_report_%TIMESTAMP%.txt
(
    echo 4psychotic Deployment Report
    echo Date: %date% %time%
    echo Platform: %PLATFORM%
    echo Profile: %PROFILE%
    echo Status: Success
    echo.
    echo Log File: %LOG_FILE%
) > "%REPORT_FILE%"
call :success "Deployment report: %REPORT_FILE%"
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
