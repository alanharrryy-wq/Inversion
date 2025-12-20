@echo off
setlocal
echo ======================================================
echo  Rollback KPI Slide 13 Skeleton v13.0.0
echo ======================================================
pwsh -NoExit -ExecutionPolicy Bypass -File "%~dp0Rollback.ps1"
pause
