@echo off
echo SalesIQ Analytics Platform Setup Script
echo ======================================

echo Step 1: Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Step 2: Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)

echo.
echo Step 3: Installing client dependencies...
cd ../client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install client dependencies
    pause
    exit /b 1
)

echo.
echo Step 4: Database setup instructions...
echo.
echo IMPORTANT: You need to set up MySQL database manually:
echo.
echo 1. Install MySQL Server from https://dev.mysql.com/downloads/mysql/
echo 2. Or use XAMPP: https://www.apachefriends.org/
echo 3. Create database: mysql -u root -p -e "CREATE DATABASE salesiq;"
echo 4. Import schema: mysql -u root -p salesiq ^< ../database/schema.sql
echo 5. Update server/db.js with your MySQL password
echo.
echo After setting up MySQL, you can start the application:
echo - Server: cd server && npm start
echo - Client: cd client && npm start
echo.

cd ..
echo Setup script completed!
echo Please follow the database setup instructions above.
pause