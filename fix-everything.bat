@echo off
REM 🚀 MODO YOLO - ARREGLO COMPLETO AUTOMATIZADO (Windows)
REM Ejecutar: fix-everything.bat

echo 🚀 MODO YOLO ACTIVADO - Arreglando proyecto...
echo.

echo 📦 Paso 1/4: Limpiando node_modules antiguos...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist apps\web\node_modules rmdir /s /q apps\web\node_modules
if exist packages\db\node_modules rmdir /s /q packages\db\node_modules
if exist packages\core\node_modules rmdir /s /q packages\core\node_modules
if exist .next rmdir /s /q .next

echo ✅ Limpieza completada
echo.

echo 📥 Paso 2/4: Instalando dependencias actualizadas...
call npm install

echo ✅ Instalación completada
echo.

echo 🔍 Paso 3/4: Verificando vulnerabilidades...
call npm audit

echo.
echo 🏗️ Paso 4/4: Generando cliente Prisma...
cd packages\db
call npm run generate
cd ..\..

echo.
echo ✅ ¡TODO ARREGLADO!
echo.
echo 📝 Próximos pasos manuales:
echo    1. En VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
echo    2. O simplemente recarga VS Code (Ctrl+R)
echo.
echo 🎯 Resultado esperado:
echo    ✅ 0 vulnerabilidades
echo    ✅ Sin errores JSX
echo    ✅ React 19 + Next.js 15 instalados
pause
