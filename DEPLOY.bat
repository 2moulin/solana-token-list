@echo off
echo ============================================
echo  TENET WALLET - Token List Deploy Script
echo ============================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo Step 1: Initializing Git repository...
git init

echo.
echo Step 2: Adding all files...
git add .

echo.
echo Step 3: Creating first commit...
git commit -m "Initial commit: Automated Solana token list"

echo.
echo Step 4: Setting main branch...
git branch -M main

echo.
echo ============================================
echo  IMPORTANT: Enter your GitHub username
echo ============================================
set /p GITHUB_USERNAME="Enter your GitHub username: "

echo.
echo Step 5: Adding remote repository...
git remote add origin https://github.com/%GITHUB_USERNAME%/solana-token-list.git

echo.
echo Step 6: Pushing to GitHub...
echo (You may need to authenticate with your GitHub credentials)
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo  SUCCESS! Repository pushed to GitHub
    echo ============================================
    echo.
    echo Next steps:
    echo 1. Enable GitHub Pages:
    echo    https://github.com/%GITHUB_USERNAME%/solana-token-list/settings/pages
    echo.
    echo 2. Add Helius API secret:
    echo    https://github.com/%GITHUB_USERNAME%/solana-token-list/settings/secrets/actions
    echo.
    echo 3. Run the workflow:
    echo    https://github.com/%GITHUB_USERNAME%/solana-token-list/actions
    echo.
) else (
    echo.
    echo ERROR: Failed to push to GitHub
    echo.
    echo Possible solutions:
    echo 1. Make sure you created the repo on GitHub first
    echo 2. Check your GitHub username is correct
    echo 3. You may need to authenticate with GitHub
    echo.
)

pause
