@echo off
REM ============================================================================
REM 4psychotic - Web Deployment Script (Windows)
REM Builds and deploys to Vercel, Netlify, or S3
REM
REM Usage:
REM   deploy-web.bat [vercel|netlify|s3|manual] [--prod]
REM
REM Examples:
REM   deploy-web.bat vercel --prod
REM   deploy-web.bat netlify --prod
REM   deploy-web.bat s3 --prod
REM ============================================================================

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_DIR=%~dp0..
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set LOG_FILE=%PROJECT_DIR%\logs\web_deploy_%TIMESTAMP%.log
set DIST_DIR=%PROJECT_DIR%\dist

mkdir "%PROJECT_DIR%\logs" 2>nul

call :print_header
call :validate_inputs %*
call :log "Starting web deployment..."
call :log "Provider: %PROVIDER%"
call :log "Production: %PROD_FLAG%"

call :build_web

if "%PROVIDER%"=="vercel" (
    call :deploy_vercel
) else if "%PROVIDER%"=="netlify" (
    call :deploy_netlify
) else if "%PROVIDER%"=="s3" (
    call :deploy_s3
) else if "%PROVIDER%"=="manual" (
    call :deploy_manual
)

call :success "Web deployment completed!"
exit /b 0

REM ============================================================================
REM Functions
REM ============================================================================

:print_header
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  4psychotic - Web Deployment (Windows)                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
exit /b 0

:validate_inputs
set PROVIDER=%1
set PROD_FLAG=%2

if "!PROVIDER!"=="" set PROVIDER=manual
if "!PROD_FLAG!"=="--prod" set PROD_FLAG=true
if "!PROD_FLAG!"=="" set PROD_FLAG=false

if "!PROVIDER!"=="vercel" (
    call :success "Provider: !PROVIDER!"
) else if "!PROVIDER!"=="netlify" (
    call :success "Provider: !PROVIDER!"
) else if "!PROVIDER!"=="s3" (
    call :success "Provider: !PROVIDER!"
) else if "!PROVIDER!"=="manual" (
    call :success "Provider: !PROVIDER!"
) else (
    call :error "Invalid provider: !PROVIDER!"
    exit /b 1
)
exit /b 0

:build_web
call :log "Building web application..."
cd /d "%PROJECT_DIR%"

REM Clean previous build
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"

REM Run build
call npm run build
if errorlevel 1 (
    call :error "Build failed"
    exit /b 1
)

if not exist "%DIST_DIR%" (
    call :error "Build failed: dist directory not created"
    exit /b 1
)

call :success "Web build completed"
exit /b 0

:deploy_vercel
call :log "Deploying to Vercel..."

where vercel >nul 2>&1
if errorlevel 1 (
    call :warning "Vercel CLI not found. Installing..."
    call npm install -g vercel
)

cd /d "%DIST_DIR%"

if "%PROD_FLAG%"=="true" (
    call :log "Production deployment..."
    call vercel --prod --yes
) else (
    call :log "Preview deployment..."
    call vercel --yes
)

if errorlevel 1 (
    call :error "Vercel deployment failed"
    exit /b 1
)

call :success "Vercel deployment completed"
cd /d "%PROJECT_DIR%"
exit /b 0

:deploy_netlify
call :log "Deploying to Netlify..."

where netlify >nul 2>&1
if errorlevel 1 (
    call :warning "Netlify CLI not found. Installing..."
    call npm install -g netlify-cli
)

cd /d "%DIST_DIR%"

if "%PROD_FLAG%"=="true" (
    call :log "Production deployment..."
    call netlify deploy --prod --dir .
) else (
    call :log "Preview deployment..."
    call netlify deploy --dir .
)

if errorlevel 1 (
    call :error "Netlify deployment failed"
    exit /b 1
)

call :success "Netlify deployment completed"
cd /d "%PROJECT_DIR%"
exit /b 0

:deploy_s3
call :log "Deploying to AWS S3..."

where aws >nul 2>&1
if errorlevel 1 (
    call :error "AWS CLI not found. Install with: pip install awscli"
    exit /b 1
)

if "!S3_BUCKET!"=="" (
    set /p S3_BUCKET="Enter S3 bucket name: "
)

if "!AWS_REGION!"=="" (
    set AWS_REGION=us-east-1
)

call :log "Uploading to s3://!S3_BUCKET!/..."

call aws s3 sync "%DIST_DIR%" "s3://!S3_BUCKET!/" ^
    --region !AWS_REGION! ^
    --delete ^
    --cache-control "public, max-age=3600"

if errorlevel 1 (
    call :error "S3 deployment failed"
    exit /b 1
)

call :success "S3 deployment completed"
exit /b 0

:deploy_manual
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Manual Deployment Instructions                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Build directory: %DIST_DIR%
echo.
echo Option 1: SCP to Server
echo   scp -r "%DIST_DIR%\*" user@server:/var/www/4psychotic
echo.
echo Option 2: Rsync to Server
echo   rsync -avz "%DIST_DIR%\" user@server:/var/www/4psychotic/
echo.
echo Option 3: Docker
echo   docker build -t 4psychotic:latest .
echo   docker push your-registry/4psychotic:latest
echo.
echo Option 4: FTP
echo   ftp user@ftp-server
echo   cd /public_html
echo   mput "%DIST_DIR%\*"
echo.
call :success "Build ready for manual deployment"
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
