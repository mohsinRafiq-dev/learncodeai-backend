# Code Sanitization Quick Reference

## What is Code Sanitization?

**Code sanitization** is validating and cleaning user input to prevent security attacks in a code execution platform.

### Why It's Critical

Your CodeHub platform executes user-submitted code. Without sanitization:

```javascript
// Attacker submits this Python code:
import os
os.system("rm -rf /")  // Deletes everything in container

// Without sanitization: Code runs and destroys data
// With sanitization: Code is rejected before execution
```

## Three Types of Sanitization

### 1️⃣ Input Validation (Before Execution)

**What it does**: Check code/input before running

**Example**
```javascript
// ❌ REJECTED
input: "import os\nprint(os.getcwd())"  
// Dangerous pattern detected: trying to access OS

// ✅ ACCEPTED
input: "print('Hello, World!')"
// Clean code, safe to execute
```

**Checks Performed**
- Size limits (max 10MB code, 5MB input)
- Dangerous patterns per language (os, sys, socket, etc.)
- Null bytes and control characters
- Language-specific requirements (C++ must have main(), etc.)

### 2️⃣ Execution Isolation (During Execution)

**What it does**: Run code in safe container

- Docker container isolation
- 256MB memory limit
- 0.5 CPU quota
- 30-second timeout

### 3️⃣ Output Escaping (After Execution)

**What it does**: Make output safe for browser display

**Example**
```javascript
// Raw output (unsafe):
output: "<script>alert('XSS')</script>"

// Escaped output (safe):
output: "&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;"

// Browser displays as text, doesn't execute script
```

## Implementation in Your Code

### Backend: Sanitization Service

**File**: `codehub-backend/src/services/sanitizationService.js`

**Methods**
```javascript
// Validate code before execution
const validation = sanitizationService.sanitizeCode(code, language);
// Returns: { isValid: boolean, errors: string[] }

// Validate user input
const validation = sanitizationService.sanitizeInput(input);
// Returns: { isValid: boolean, errors: string[] }

// Escape output for display
const safe = sanitizationService.escapeOutput(output);
// Returns: HTML-safe string

// Complete request validation
const validation = sanitizationService.validateExecutionRequest({
  code, language, input
});
// Returns: { isValid, errors, sanitized: { code, language, input } }
```

### Backend: Code Execution Controller

**File**: `codehub-backend/src/controllers/codeExecutionController.js`

**Updated Flow**
```javascript
1. Receive code/input from user
2. Call sanitizationService.validateExecutionRequest()
3. If validation fails, return error with specific issues
4. If valid, execute with sanitized inputs
5. Sanitize output before returning to client
6. Client receives safe, escaped output
```

### Frontend: Sanitization Utilities

**File**: `codehub-frontend/src/utils/sanitization.ts`

**Methods**
```typescript
// Escape HTML for safe display
escapeHtml(text)  // "test<script>" → "test&lt;script&gt;"

// Validate code before submission
validateCodeInput(code, language)
// Returns: { isValid, errors }

// Format output for display
formatExecutionResult(result)
// Returns: { output, error, exitCode, formattedOutput, hasError }

// Safe component for displaying output
<SafeOutputViewer output={result.output} />
```

## Dangerous Patterns Examples

### Python ❌
```python
# All of these are BLOCKED:
import os              # OS access
import sys             # System access
from subprocess import run  # Process execution
eval("code")           # Dynamic code evaluation
exec("code")           # Dynamic execution
open("file.txt")       # File operations
import socket          # Network operations
__import__("os")       # Dynamic imports
```

### C++ ❌
```cpp
// All of these are BLOCKED:
#include <unistd.h>    // Unix calls
system("ls");          // System command
fork();                 // Process forking
exec*();                // Execution functions
#include <sys/socket.h> // Network operations
```

### JavaScript ❌
```javascript
// All of these are BLOCKED:
require("fs");                    // File system
require("child_process");         // Process execution
require("net");                   // Network
eval("code");                     // Dynamic evaluation
Function("code");                 // Dynamic function
import("fs");                     // ES6 file system
```

## Safe Code Examples ✅

### Python
```python
name = input("Enter your name: ")
for i in range(5):
    print(f"{i}: {name}")
```

### C++
```cpp
#include <iostream>
using namespace std;
int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
```

### JavaScript
```javascript
const numbers = [1, 2, 3, 4, 5];
numbers.forEach(n => console.log(n * 2));
```

## API Responses

### ✅ Valid Code Execution
```json
{
  "success": true,
  "data": {
    "output": "Hello, World!\n",
    "error": "",
    "exitCode": 0,
    "executionTime": 45
  }
}
```

### ❌ Validation Failed
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Dangerous patterns detected: import\\s+os"
  ]
}
```

### ❌ Execution Failed
```json
{
  "success": false,
  "message": "Code execution failed",
  "error": "Syntax error in your code..."
}
```

## Testing Sanitization

### Run Unit Tests
```bash
npm test -- tests/unit/sanitization.service.test.js
```

### Manual Testing

**Test 1: Reject dangerous code**
```javascript
POST /api/code/execute
{
  "code": "import os",
  "language": "python",
  "input": ""
}
// Expected: 400 error with "Dangerous patterns" message
```

**Test 2: Accept safe code**
```javascript
POST /api/code/execute
{
  "code": "print('test')",
  "language": "python",
  "input": ""
}
// Expected: 200 with output "test\n"
```

**Test 3: Escape HTML in output**
```javascript
POST /api/code/execute
{
  "code": "print('<div>test</div>')",
  "language": "python",
  "input": ""
}
// Expected: output is "&lt;div&gt;test&lt;/div&gt;" (escaped)
```

**Test 4: Reject oversized code**
```javascript
POST /api/code/execute
{
  "code": "[10MB+ of code]",
  "language": "python",
  "input": ""
}
// Expected: 400 error with "exceeds maximum size" message
```

## Key Takeaways

| Aspect | How It's Protected |
|--------|-------------------|
| **Injection Attacks** | Dangerous pattern detection + Docker isolation |
| **XSS Attacks** | HTML entity escaping on output |
| **Resource Exhaustion** | Size limits (10MB code, 5MB input, 100KB output) |
| **System Access** | Docker isolation + container resource limits |
| **DoS Attacks** | 30-second timeout + connection pooling |

## Files Modified

| File | Changes |
|------|---------|
| `sanitizationService.js` | ✨ NEW - Core sanitization logic |
| `codeExecutionController.js` | 🔄 Updated - Uses sanitization service |
| `sanitization.service.test.js` | ✨ NEW - Comprehensive test suite |
| `sanitization.ts` | ✨ NEW - Frontend utilities |
| `CODE_SANITIZATION_GUIDE.md` | ✨ NEW - Full documentation |

## Next Steps

1. **Run tests** to verify implementation
```bash
npm test -- tests/unit/sanitization.service.test.js
```

2. **Manual testing** with edge cases

3. **Deploy** to staging environment

4. **Monitor** execution logs for false positives

5. **Document** usage in team wiki

## Still Have Questions?

See the full guide: `CODE_SANITIZATION_GUIDE.md`

