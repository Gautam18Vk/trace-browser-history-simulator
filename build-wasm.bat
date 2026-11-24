@echo off
REM build-wasm.bat - Compile Trace C Navigation Engine to WebAssembly

echo [INFO] Building WebAssembly module for Trace...

where emcc >nul 2>nul
if %ERRORLEVEL% EQU 0 goto :compile

if exist C:\emsdk\emsdk_env.bat (
    echo [INFO] Activating Emscripten SDK from C:\emsdk...
    call C:\emsdk\emsdk_env.bat
)

:compile
if not exist wasm mkdir wasm

call emcc c_src/stack.c c_src/doubly_linked_list.c c_src/browser_history.c c_src/wasm_bridge.c ^
    -O2 ^
    -s WASM=1 ^
    -s MODULARIZE=1 ^
    -s EXPORT_NAME="createTraceModule" ^
    -s ENVIRONMENT="web,node" ^
    -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap','UTF8ToString','stringToUTF8']" ^
    -s EXPORTED_FUNCTIONS="['_bh_wasm_init','_bh_wasm_visit','_bh_wasm_back','_bh_wasm_forward','_bh_wasm_clear','_bh_wasm_can_go_back','_bh_wasm_can_go_forward','_bh_wasm_get_current_url','_bh_wasm_get_current_title','_bh_wasm_get_current_index','_bh_wasm_get_history_count','_bh_wasm_get_history_url','_bh_wasm_get_history_title','_bh_wasm_get_history_is_current','_bh_wasm_get_back_stack_count','_bh_wasm_get_back_stack_title','_bh_wasm_get_back_stack_url','_bh_wasm_get_forward_stack_count','_bh_wasm_get_forward_stack_title','_bh_wasm_get_forward_stack_url']" ^
    --no-entry ^
    -o wasm/trace.js

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] WebAssembly module successfully built in wasm/
    echo   - wasm/trace.js
    echo   - wasm/trace.wasm
) else (
    echo [ERROR] WebAssembly compilation failed.
    exit /b %ERRORLEVEL%
)
