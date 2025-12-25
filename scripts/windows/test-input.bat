@echo off
echo Testing Persistent Container Architecture
echo.
echo ============================================
echo Test 1: Python with cin equivalent (input)
echo ============================================
curl -X POST http://localhost:5000/api/code/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"code\":\"x = int(input())\\ny = int(input())\\nprint(f'Sum: {x + y}')\",\"language\":\"python\",\"input\":\"10\\n20\"}"
echo.
echo.
echo ============================================
echo Test 2: C++ with cin
echo ============================================
curl -X POST http://localhost:5000/api/code/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"code\":\"#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    int a, b;\\n    cin >> a >> b;\\n    cout << \\\"Sum: \\\" << (a + b) << endl;\\n    return 0;\\n}\",\"language\":\"cpp\",\"input\":\"15\\n25\"}"
echo.
echo.
echo ============================================
echo Test 3: JavaScript with stdin
echo ============================================
curl -X POST http://localhost:5000/api/code/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"code\":\"process.stdin.on('data', (data) => {\\n    const lines = data.toString().trim().split('\\\\n');\\n    const a = parseInt(lines[0]);\\n    const b = parseInt(lines[1]);\\n    console.log('Sum:', a + b);\\n    process.exit(0);\\n});\",\"language\":\"javascript\",\"input\":\"100\\n200\"}"
echo.
