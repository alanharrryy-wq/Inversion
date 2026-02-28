#Requires AutoHotkey v2.0
#SingleInstance Force

runId := "{{RUN_ID}}"
logPath := "{{LOG_PATH}}"
resultPath := "{{RESULT_PATH}}"
windowReadyTimeoutMs := {{WINDOW_READY_TIMEOUT_MS}}
readinessTimeoutMs := {{READINESS_TIMEOUT_MS}}
betweenWorkersDelayMs := {{BETWEEN_WORKERS_DELAY_MS}}
readinessStableChecks := 3
readinessStableIntervalMs := 300
stepSeq := 0
ERR_NO_CODE_PROCESS := "ERR_NO_CODE_PROCESS"
ERR_NO_MATCHING_WINDOW := "ERR_NO_MATCHING_WINDOW"
ERR_READY_TIMEOUT := "ERR_READY_TIMEOUT"
resultWrittenByWorker := Map()
strictResultsMode := false

GetEnvOrEmpty(name) {
    local value := ""
    try {
        value := EnvGet(name)
    } catch {
        value := ""
    }
    return value
}

strictRaw := StrLower(Trim(GetEnvOrEmpty("HOS_STRICT")))
strictResultsMode := (strictRaw = "1" || strictRaw = "true" || strictRaw = "yes" || strictRaw = "on")

NormalizeDetail(detail) {
    text := StrReplace(detail, "|", "/")
    text := StrReplace(text, "`r", " ")
    text := StrReplace(text, "`n", " ")
    return Trim(text)
}

BoolText(value) {
    return value ? "true" : "false"
}

WriteStep(workerId, step, hwnd, pid, status, title, readinessWaitMs, fallbackUsed, detail) {
    global logPath
    global stepSeq
    stepSeq += 1
    stamp := FormatTime(, "yyyy-MM-dd HH:mm:ss")
    detailField := "pid=" pid " title=" NormalizeDetail(title) " readiness_wait_ms=" readinessWaitMs " " NormalizeDetail(detail)
    line := Format(
        "{:05d}|{}|{}|{}|{}|{}|{}|{}",
        stepSeq,
        stamp,
        workerId,
        step,
        hwnd,
        status,
        NormalizeDetail(detailField),
        BoolText(fallbackUsed)
    )
    FileAppend(line "`n", logPath, "UTF-8")
}

WriteResult(workerId, status, detail) {
    global resultPath
    global resultWrittenByWorker

    if resultWrittenByWorker.Has(workerId) {
        return false
    }

    line := workerId "|" status "|" NormalizeDetail(detail)
    FileAppend(line "`n", resultPath, "UTF-8-RAW")
    resultWrittenByWorker[workerId] := true
    return true
}

JoinCsv(items) {
    if (items.Length = 0) {
        return ""
    }

    local csv := ""
    for item in items {
        csv .= (csv = "" ? "" : ",") item
    }
    return csv
}

GetFolderNameFromPath(path) {
    local normalized := StrReplace(path, "/", "\")
    while (StrLen(normalized) > 1 && SubStr(normalized, -1) = "\") {
        normalized := SubStr(normalized, 1, -1)
    }

    local slashPos := InStr(normalized, "\",, -1)
    if (slashPos = 0) {
        return Trim(normalized)
    }
    return Trim(SubStr(normalized, slashPos + 1))
}

GetCodeWindowSnapshot() {
    snapshot := Map()
    for hwnd in WinGetList("ahk_exe Code.exe") {
        snapshot[hwnd] := true
    }
    return snapshot
}

LaunchVSCodeWindow(worktreePath, &launchPid, &launchDetail) {
    launchPid := 0
    launchDetail := ""
    q := Chr(34)

    try {
        Run(["code", "-n", worktreePath],,, &launchPid)
        return true
    } catch Error as errArrayPath {
        try {
            Run("code -n " q worktreePath q,,, &launchPid)
            return true
        } catch Error as errPath {
            local localAppData := EnvGet("LOCALAPPDATA")
            if !localAppData {
                launchDetail := "localappdata_missing"
                return false
            }

            local codeExe := localAppData "\Programs\Microsoft VS Code\Code.exe"
            if !FileExist(codeExe) {
                launchDetail := "code_exe_missing:" codeExe
                return false
            }

            try {
                Run([codeExe, "-n", worktreePath],,, &launchPid)
                return true
            } catch Error as errArrayFallback {
                try {
                    Run(q codeExe q " -n " q worktreePath q,,, &launchPid)
                    return true
                } catch Error as errFallback {
                    launchDetail := "launch_failed:" errFallback.Message
                    return false
                }
            }
        }
    }
}

WaitForNewCodeWindow(snapshot, timeoutMs, &newHwnd) {
    newHwnd := 0
    local deadline := A_TickCount + timeoutMs

    while (A_TickCount <= deadline) {
        for hwnd in WinGetList("ahk_exe Code.exe") {
            if !snapshot.Has(hwnd) {
                newHwnd := hwnd
                return true
            }
        }
        Sleep(200)
    }

    return false
}

GetWindowTitleSafe(hwnd) {
    local title := ""
    try {
        title := WinGetTitle("ahk_id " hwnd)
    } catch {
        title := ""
    }
    return title
}

IsCodeWindowHwnd(hwnd) {
    if !WinExist("ahk_id " hwnd) {
        return false
    }

    local processName := ""
    try {
        processName := WinGetProcessName("ahk_id " hwnd)
    } catch {
        processName := ""
    }
    return StrLower(processName) = "code.exe"
}

SelectCodeWindowByTitleScan(folderName, workerId, runToken, &selectedHwnd, &detail) {
    selectedHwnd := 0
    detail := ""

    local codeWindows := WinGetList("ahk_exe Code.exe")
    if (codeWindows.Length = 0) {
        detail := "no_code_windows_for_title_scan"
        return false
    }

    local needles := [folderName, workerId, runToken]
    local labels := ["folder", "worker", "run"]
    loop needles.Length {
        local needle := Trim(needles[A_Index])
        if (needle = "") {
            continue
        }

        local needleLower := StrLower(needle)
        for hwnd in codeWindows {
            if !IsCodeWindowHwnd(hwnd) {
                continue
            }
            local title := GetWindowTitleSafe(hwnd)
            if InStr(StrLower(title), needleLower) {
                selectedHwnd := hwnd
                detail := "matched_" labels[A_Index] "_needle=" needle
                return true
            }
        }
    }

    detail := "no_title_match folder=" folderName " worker=" workerId " run=" runToken
    return false
}

SelectRecentCodeWindow(&selectedHwnd, &errorCode, &detail) {
    global ERR_NO_CODE_PROCESS
    global ERR_NO_MATCHING_WINDOW

    selectedHwnd := 0
    errorCode := ""
    detail := ""

    local codeWindows := WinGetList("ahk_exe Code.exe")
    if (codeWindows.Length = 0) {
        errorCode := ERR_NO_CODE_PROCESS
        detail := "no_code_windows_for_recent_fallback"
        return false
    }

    local activeHwnd := WinActive("ahk_exe Code.exe")
    if (activeHwnd && IsCodeWindowHwnd(activeHwnd)) {
        selectedHwnd := activeHwnd
        detail := "selected_active_code_window"
        return true
    }

    for hwnd in codeWindows {
        if !IsCodeWindowHwnd(hwnd) {
            continue
        }
        if (Trim(GetWindowTitleSafe(hwnd)) != "") {
            selectedHwnd := hwnd
            detail := "selected_zorder_non_empty_title"
            return true
        }
    }

    for hwnd in codeWindows {
        if IsCodeWindowHwnd(hwnd) {
            selectedHwnd := hwnd
            detail := "selected_zorder_any_title"
            return true
        }
    }

    errorCode := ERR_NO_MATCHING_WINDOW
    detail := "no_eligible_recent_code_window"
    return false
}

EnsureActiveForInput(hwnd, timeoutMs, &failDetail) {
    failDetail := ""

    if !WinExist("ahk_id " hwnd) {
        failDetail := "input_guard_window_missing"
        return false
    }

    if !ActivateWindowByHwnd(hwnd, timeoutMs) {
        failDetail := "input_guard_activate_timeout"
        return false
    }

    if !WinActive("ahk_id " hwnd) {
        failDetail := "input_guard_not_active"
        return false
    }

    return true
}

GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle) {
    pid := 0
    processName := ""
    windowTitle := ""

    try {
        pid := WinGetPID("ahk_id " hwnd)
    } catch {
        pid := 0
    }

    try {
        processName := WinGetProcessName("ahk_id " hwnd)
    } catch {
        processName := ""
    }

    try {
        windowTitle := WinGetTitle("ahk_id " hwnd)
    } catch {
        windowTitle := ""
    }
}

ActivateWindowByHwnd(hwnd, timeoutMs) {
    try {
        WinActivate("ahk_id " hwnd)
    } catch {
        return false
    }

    local deadline := A_TickCount + timeoutMs
    while (A_TickCount <= deadline) {
        if WinActive("ahk_id " hwnd) {
            return true
        }
        Sleep(100)
    }

    return false
}

WaitForWindowReadyByFolder(hwnd, folderName) {
    global ERR_READY_TIMEOUT
    global readinessTimeoutMs
    global readinessStableChecks
    global readinessStableIntervalMs

    result := Map(
        "ready", false,
        "title", "",
        "wait_ms", 0,
        "error_code", "",
        "detail", ""
    )

    local started := A_TickCount
    local deadline := started + readinessTimeoutMs
    local consecutive := 0
    local folderNeedle := StrLower(folderName)

    while (A_TickCount <= deadline) {
        if !WinExist("ahk_id " hwnd) {
            result["wait_ms"] := A_TickCount - started
            result["error_code"] := ERR_READY_TIMEOUT
            result["detail"] := "readiness_timeout:window_missing_during_readiness_wait"
            return result
        }

        local title := ""
        try {
            title := WinGetTitle("ahk_id " hwnd)
        } catch {
            title := ""
        }
        result["title"] := title

        if InStr(StrLower(title), folderNeedle) {
            consecutive += 1
            if (consecutive >= readinessStableChecks) {
                result["ready"] := true
                result["wait_ms"] := A_TickCount - started
                result["detail"] := "ready_by_folder_stable"
                return result
            }
        } else {
            consecutive := 0
        }

        Sleep(readinessStableIntervalMs)
    }

    result["wait_ms"] := A_TickCount - started
    result["error_code"] := ERR_READY_TIMEOUT
    result["detail"] := "readiness_timeout:folder_title_not_stable_before_timeout"
    return result
}

DispatchWorker(workerId, worktreePath, promptPath) {
    global runId
    global windowReadyTimeoutMs
    global ERR_NO_MATCHING_WINDOW

    local hwnd := 0
    local pid := 0
    local processName := ""
    local windowTitle := ""
    local launchPid := 0
    local launchDetail := ""
    local folderName := ""
    local readinessWaitMs := 0
    local fallbackUsed := false
    local promptText := ""
    local targetWorktreePath := worktreePath
    local readiness := Map()
    local resultStatus := "FAIL"
    local resultDetail := "unexpected_exit"
    local workerPass := false
    local abortWorker := false
    local clipSaved := ""
    local clipboardCaptured := false
    local clipboardRestored := false

    WriteStep(workerId, "start", hwnd, pid, "OK", windowTitle, readinessWaitMs, fallbackUsed, "dispatch_worker_start")
    try {
        if !FileExist(promptPath) {
            WriteStep(workerId, "prompt_load", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, "prompt_missing")
            resultDetail := "prompt_missing"
            abortWorker := true
        }

        if !abortWorker {
            promptText := FileRead(promptPath, "UTF-8")
            if (Trim(promptText) = "") {
                WriteStep(workerId, "prompt_load", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, "prompt_empty")
                resultDetail := "prompt_empty"
                abortWorker := true
            }
        }

        if !abortWorker {
            try {
                SplitPath(targetWorktreePath, &folderName)
            } catch {
                folderName := ""
            }
            if (Trim(folderName) = "") {
                folderName := GetFolderNameFromPath(targetWorktreePath)
            }
            if (InStr(folderName, "\") || InStr(folderName, "/")) {
                folderName := GetFolderNameFromPath(targetWorktreePath)
            }
            if (Trim(folderName) = "") {
                WriteStep(workerId, "derive_folder", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, "folder_name_unavailable")
                resultDetail := "folder_name_unavailable"
                abortWorker := true
            }
        }

        if !abortWorker {
            if !DirExist(targetWorktreePath) {
                WriteStep(workerId, "validate_worktree_path", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, "worktree_missing")
                resultDetail := "worktree_missing"
                abortWorker := true
            }
        }

        local snapshot := Map()
        if !abortWorker {
            snapshot := GetCodeWindowSnapshot()
            WriteStep(workerId, "snapshot_windows", hwnd, pid, "OK", windowTitle, readinessWaitMs, fallbackUsed, "snapshot_taken")

            if !LaunchVSCodeWindow(targetWorktreePath, &launchPid, &launchDetail) {
                WriteStep(workerId, "launch_window", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, launchDetail)
                resultDetail := "launch_window_failed"
                abortWorker := true
            } else {
                WriteStep(workerId, "launch_window", hwnd, pid, "OK", windowTitle, readinessWaitMs, fallbackUsed, "launch_pid=" launchPid)
            }
        }

        if !abortWorker {
            local newHwnd := 0
            if WaitForNewCodeWindow(snapshot, windowReadyTimeoutMs, &newHwnd) {
                hwnd := newHwnd
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "detect_new_hwnd", hwnd, pid, "OK", windowTitle, readinessWaitMs, fallbackUsed, "new_hwnd_detected")
            } else {
                WriteStep(workerId, "detect_new_hwnd", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, "new_hwnd_timeout")

                local titleScanHwnd := 0
                local titleScanDetail := ""
                if SelectCodeWindowByTitleScan(folderName, workerId, runId, &titleScanHwnd, &titleScanDetail) {
                    hwnd := titleScanHwnd
                    fallbackUsed := true
                    GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                    WriteStep(workerId, "fallback_title_scan", hwnd, pid, "OK", windowTitle, readinessWaitMs, fallbackUsed, titleScanDetail)
                    WriteStep(workerId, "fallback_recent_code_window", hwnd, pid, "SKIP", windowTitle, readinessWaitMs, fallbackUsed, "title_scan_selected")
                } else {
                    WriteStep(workerId, "fallback_title_scan", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, titleScanDetail)

                    local recentHwnd := 0
                    local recentErrorCode := ""
                    local recentDetail := ""
                    if SelectRecentCodeWindow(&recentHwnd, &recentErrorCode, &recentDetail) {
                        hwnd := recentHwnd
                        fallbackUsed := true
                        GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                        WriteStep(workerId, "fallback_recent_code_window", hwnd, pid, "OK", windowTitle, readinessWaitMs, fallbackUsed, recentDetail)
                    } else {
                        WriteStep(workerId, "fallback_recent_code_window", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, recentErrorCode ":" recentDetail)
                        resultDetail := (recentErrorCode != "") ? recentErrorCode : ERR_NO_MATCHING_WINDOW
                        abortWorker := true
                    }
                }
            }
        }

        if !abortWorker {
            if !IsCodeWindowHwnd(hwnd) {
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "validate_hwnd_owner", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, "hwnd_not_code_exe:" processName)
                resultDetail := "hwnd_not_code_exe"
                abortWorker := true
            } else {
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "validate_hwnd_owner", hwnd, pid, "OK", windowTitle, readinessWaitMs, fallbackUsed, "code_exe_confirmed")
            }
        }

        if !abortWorker {
            if !ActivateWindowByHwnd(hwnd, windowReadyTimeoutMs) {
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "activate_window", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, "activate_timeout")
                resultDetail := "activate_timeout"
                abortWorker := true
            } else {
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "activate_window", hwnd, pid, "OK", windowTitle, readinessWaitMs, fallbackUsed, "active")
            }
        }

        if !abortWorker {
            readiness := WaitForWindowReadyByFolder(hwnd, folderName)
            readinessWaitMs := readiness["wait_ms"]
            if !readiness["ready"] {
                fallbackUsed := true
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "wait_ready_folder", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, readiness["error_code"] ":" readiness["detail"])
                Sleep(40000)
                WriteStep(workerId, "readiness_fallback_sleep", hwnd, pid, "OK", windowTitle, readinessWaitMs, fallbackUsed, "ERR_READY_TIMEOUT:fallback_sleep_40000")
            } else {
                windowTitle := readiness["title"]
                WriteStep(workerId, "wait_ready_folder", hwnd, pid, "OK", windowTitle, readinessWaitMs, fallbackUsed, readiness["detail"])
            }
        }

        if !abortWorker {
            local guardDetail := ""
            if !EnsureActiveForInput(hwnd, windowReadyTimeoutMs, &guardDetail) {
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "guard_before_ctrl_shift_p", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, guardDetail)
                resultDetail := "guard_before_ctrl_shift_p_failed"
                abortWorker := true
            }
        }
        if !abortWorker {
            Send("^+p")
            Sleep(250)
        }

        if !abortWorker {
            local guardDetail := ""
            if !EnsureActiveForInput(hwnd, windowReadyTimeoutMs, &guardDetail) {
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "guard_before_open_codex_sidebar_text", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, guardDetail)
                resultDetail := "guard_before_open_codex_sidebar_text_failed"
                abortWorker := true
            }
        }
        if !abortWorker {
            SendText("Open Codex Sidebar")
            Sleep(220)
        }

        if !abortWorker {
            local guardDetail := ""
            if !EnsureActiveForInput(hwnd, windowReadyTimeoutMs, &guardDetail) {
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "guard_before_palette_enter", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, guardDetail)
                resultDetail := "guard_before_palette_enter_failed"
                abortWorker := true
            }
        }
        if !abortWorker {
            Send("{Enter}")
            Sleep(350)
            GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
            WriteStep(workerId, "open_codex_sidebar", hwnd, pid, "OK", windowTitle, readinessWaitMs, true, "command_palette_dispatched")
        }

        if !abortWorker {
            clipSaved := ClipboardAll()
            clipboardCaptured := true
            A_Clipboard := promptText
            if !ClipWait(2) {
                A_Clipboard := clipSaved
                clipboardRestored := true
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "paste_prompt", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, "clipboard_unavailable")
                resultDetail := "clipboard_unavailable"
                abortWorker := true
            }
        }

        if !abortWorker {
            local guardDetail := ""
            if !EnsureActiveForInput(hwnd, windowReadyTimeoutMs, &guardDetail) {
                A_Clipboard := clipSaved
                clipboardRestored := true
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "guard_before_paste", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, guardDetail)
                resultDetail := "guard_before_paste_failed"
                abortWorker := true
            }
        }
        if !abortWorker {
            Send("^v")
            Sleep(150)
            A_Clipboard := clipSaved
            clipboardRestored := true
            GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
            WriteStep(workerId, "paste_prompt", hwnd, pid, "OK", windowTitle, readinessWaitMs, true, "prompt_pasted")
        }

        if !abortWorker {
            local guardDetail := ""
            if !EnsureActiveForInput(hwnd, windowReadyTimeoutMs, &guardDetail) {
                GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
                WriteStep(workerId, "guard_before_submit", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, guardDetail)
                resultDetail := "guard_before_submit_failed"
                abortWorker := true
            }
        }
        if !abortWorker {
            ; Submission contract: exactly one Enter, no Ctrl+Enter, no retries.
            Send("{Enter}")
            GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
            WriteStep(workerId, "submit_prompt", hwnd, pid, "OK", windowTitle, readinessWaitMs, true, "single_enter_submission")
            resultStatus := "PASS"
            resultDetail := "sent hwnd=" hwnd " pid=" pid " title=" NormalizeDetail(windowTitle) " readiness_wait_ms=" readinessWaitMs " fallback_used=" BoolText(fallbackUsed)
            workerPass := true
        }
    } catch Error as e {
        GetWindowDiagnostics(hwnd, &pid, &processName, &windowTitle)
        WriteStep(workerId, "dispatch_exception", hwnd, pid, "FAIL", windowTitle, readinessWaitMs, fallbackUsed, "dispatch_exception:" e.Message)
        resultStatus := "FAIL"
        resultDetail := "dispatch_exception"
        workerPass := false
    } finally {
        if (clipboardCaptured && !clipboardRestored) {
            try {
                A_Clipboard := clipSaved
            } catch {
            }
        }
        WriteResult(workerId, resultStatus, resultDetail)
    }

    return workerPass
}

DispatchAll() {
    global betweenWorkersDelayMs

    failures := 0
{{JOBS_BLOCK}}
    return failures
}

if FileExist(resultPath) {
    FileDelete(resultPath)
}
if FileExist(logPath) {
    FileDelete(logPath)
}

WriteStep("SYSTEM", "start", 0, 0, "OK", "", 0, false, "run_id=" runId)
failures := DispatchAll()
if strictResultsMode {
    missingWorkers := []
    for workerName in ["A_core", "B_tooling", "C_features", "D_validation"] {
        if !resultWrittenByWorker.Has(workerName) {
            missingWorkers.Push(workerName)
        }
    }

    if (missingWorkers.Length > 0) {
        failures += missingWorkers.Length
        WriteStep("SYSTEM", "strict_results_check", 0, 0, "FAIL", "", 0, false, "missing_workers=" JoinCsv(missingWorkers))
    } else {
        WriteStep("SYSTEM", "strict_results_check", 0, 0, "OK", "", 0, false, "all_required_workers_have_one_result")
    }
}
WriteStep("SYSTEM", "end", 0, 0, failures > 0 ? "FAIL" : "OK", "", 0, false, "failures=" failures)

ExitApp(failures > 0 ? 2 : 0)
