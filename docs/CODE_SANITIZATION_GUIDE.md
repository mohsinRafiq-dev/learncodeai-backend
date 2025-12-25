# Code Sanitization Implementation Guide

## Overview

Code sanitization is the process of validating and cleaning user input to prevent security vulnerabilities in a code execution platform. It protects against:

- **Injection Attacks**: Malicious code trying to access system resources
- **XSS (Cross-Site Scripting)**: Malicious output that executes in the browser
- **Resource Exhaustion**: Extremely large inputs that crash the system
- **Path Traversal**: Attempts to access files outside the sandbox
- **DoS (Denial of Service)**: Malicious patterns designed to crash containers

## Architecture

### Three-Layer Defense

```
┌─────────────────────────────────────────────────────────┐
│  1. INPUT VALIDATION LAYER (SanitizationService)       │
│     - Check code length (max 10MB)                      │
│     - Check input length (max 5MB)                      │
│     - Detect dangerous patterns per language           │
│     - Remove null bytes                                │
│     - Language-specific validation                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. EXECUTION LAYER (CodeExecutor)                      │
│     - Docker container isolation                        │
│     - Resource limits (256MB, 0.5 CPU)                 │
│     - 30-second timeout                                │
│     - Separate container per execution                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. OUTPUT ESCAPING LAYER (SanitizationService)        │
│     - HTML entity encoding                             │
│     - Output truncation (max 100KB)                    │
│     - Error message sanitization                       │
│     - Safe JSON serialization                          │
└─────────────────────────────────────────────────────────┘
```

## Dangerous Patterns by Language

### Python
```
❌ import os              - OS module access
❌ import sys             - System module access
❌ from os import ...     - Direct OS imports
❌ subprocess             - Process execution
❌ eval()                 - Dynamic code evaluation
❌ exec()                 - Dynamic code execution
❌ __import__()           - Dynamic imports
❌ open()                 - File operations
❌ socket                 - Network operations
```

### C++
```
❌ #include <unistd.h>          - Unix system calls
❌ #include <sys/socket.h>      - Socket operations
❌ system()                      - System command execution
❌ fork()                        - Process forking
❌ exec*()                       - Execution functions
```

### JavaScript
```
❌ require("fs")                 - File system access
❌ require("child_process")      - Process execution
❌ require("net")                - Network operations
❌ require("http")               - HTTP operations
❌ eval()                        - Dynamic code evaluation
❌ Function()                    - Dynamic function creation
❌ import("fs")                  - ES6 file system access
```

## Implementation Details

### 1. Input Validation

**Code Size Limits**
```javascript
MAX_CODE_SIZE = 10 * 1024 * 1024  // 10MB
MAX_INPUT_SIZE = 5 * 1024 * 1024  // 5MB
```

**Pattern Detection**
```javascript
// Example: Detect 'import os' in Python
DANGEROUS_PATTERNS.python = [
  /import\s+os\s*;?/gi,  // Case-insensitive, global flag
  /from\s+os\s+import/gi,
  // ... more patterns
];
```

**Null Byte Detection**
```javascript
if (sanitized.includes('\0')) {
  errors.push('Null bytes are not allowed');
}
```

### 2. Output Escaping

**HTML Entity Encoding** (Prevents XSS)
```javascript
{
  '&' → '&amp;'
  '<' → '&lt;'
  '>' → '&gt;'
  '"' → '&quot;'
  "'" → '&#x27;'
}
```

**Example**
```javascript
// Unsafe output
output = '<script>alert("XSS")</script>'

// After escaping
escaped = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'

// Safe to display in HTML
<pre>{escaped}</pre>  // Won't execute script
```

**Output Truncation**
```javascript
MAX_OUTPUT_SIZE = 100 * 1024  // 100KB

if (output.length > MAX_OUTPUT_SIZE) {
  output = output.substring(0, MAX_OUTPUT_SIZE) + 
           '\n... (output truncated)'
}
```

### 3. Language-Specific Validation

**Python**
```javascript
// Validates __main__ is allowed but warn about script execution
if (code.includes('__main__')) {
  // Allow for learning purposes
}
```

**C++**
```javascript
// Require main() function and includes
if (!code.includes('main')) {
  errors.push('C++ code must contain a main() function');
}
if (!code.includes('#include')) {
  errors.push('C++ code must include headers');
}
```

**JavaScript**
```javascript
// Require console output for verification
if (!code.includes('console.log') && !code.includes('console.error')) {
  errors.push('JavaScript code should output using console.log()');
}
```

## Usage in CodeExecutionController

### Before
```javascript
async executeCode(req, res) {
  const { code, language, input } = req.body;
  
  // Basic validation only
  if (!code || !language) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  // Execute without sanitization
  const result = await codeExecutorWSService.executeCode(code, language, input);
  
  // Return raw output (potential XSS)
  res.json({ data: result });
}
```

### After
```javascript
async executeCode(req, res) {
  const { code, language, input } = req.body;
  
  // Comprehensive sanitization
  const validation = sanitizationService.validateExecutionRequest({
    code,
    language,
    input: input || ''
  });
  
  if (!validation.isValid) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: validation.errors  // Specific error messages
    });
  }
  
  // Execute with sanitized inputs
  const result = await codeExecutorWSService.executeCode(
    validation.sanitized.code,
    validation.sanitized.language,
    validation.sanitized.input
  );
  
  // Sanitize output before sending
  const sanitizedResult = sanitizationService.sanitizeExecutionResult(result);
  res.json({ data: sanitizedResult });
}
```

## API Response Examples

### Valid Request
```javascript
// Request
{
  "code": "print('Hello, World!')",
  "language": "python",
  "input": "test"
}

// Response
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

### Validation Error
```javascript
// Request with dangerous pattern
{
  "code": "import os; print(os.getcwd())",
  "language": "python",
  "input": ""
}

// Response
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Dangerous patterns detected: import\\s+os\\s*;?"
  ]
}
```

### Size Limit Error
```javascript
// Request with massive code
{
  "code": "[1MB of code]",
  "language": "python"
}

// Response
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Code exceeds maximum size of 10MB"
  ]
}
```

### XSS Prevention Example
```javascript
// Code output contains HTML
output = "<div onclick='alert(1)'>Click me</div>"

// After escaping
escaped = "&lt;div onclick=&#x27;alert(1)&#x27;&gt;Click me&lt;/div&gt;"

// Safe to display in browser
<pre>{escaped}</pre>
```

## Testing

### Unit Tests
```bash
npm test -- tests/unit/sanitization.service.test.js
```

**Test Coverage**
- ✅ Valid code acceptance
- ✅ Dangerous pattern detection
- ✅ Size limit enforcement
- ✅ Null byte detection
- ✅ XSS output escaping
- ✅ Error message sanitization
- ✅ Language-specific validation
- ✅ Control character removal

### Integration Tests
```javascript
// Test end-to-end with controller
it('should reject malicious code in controller', async () => {
  const res = await request(app)
    .post('/api/code/execute')
    .send({
      code: 'import os\nos.system("rm -rf /")',
      language: 'python',
      input: ''
    });
  
  expect(res.status).toBe(400);
  expect(res.body.errors).toBeDefined();
});
```

## Performance Considerations

### Pattern Matching
- **Regex patterns** run on every execution
- **Lazy evaluation**: Only check if size is under limit
- **Early exit**: Stop checking patterns after first match

### Output Processing
- **Escaping only on output**: Input stored without modification
- **Lazy truncation**: Only truncate if exceeding 100KB
- **Streaming for large outputs**: Consider for future optimization

### Optimization Tips
```javascript
// 1. Cache compiled patterns
const patterns = new Map();
for (const [lang, patternList] of Object.entries(DANGEROUS_PATTERNS)) {
  patterns.set(lang, patternList.map(p => new RegExp(p)));
}

// 2. Quick size checks first
if (code.length > MAX_CODE_SIZE) return;

// 3. Early exit on pattern match
let isDangerous = false;
for (const pattern of patterns.get(language)) {
  if (pattern.test(code)) {
    isDangerous = true;
    break;
  }
}
```

## Security Best Practices

### 1. **Defense in Depth**
- Multiple validation layers
- Don't rely on single security measure
- Combine with Docker isolation and resource limits

### 2. **Fail Securely**
- Default to reject
- Provide specific error messages (but not internal details)
- Log security events for monitoring

### 3. **Keep Patterns Updated**
- Review dangerous patterns regularly
- Add new patterns as threats emerge
- Test new patterns before deployment

### 4. **Monitor & Alert**
- Log sanitization failures
- Alert on suspicious patterns
- Track execution anomalies

## Future Enhancements

### 1. Machine Learning Detection
```javascript
// Detect suspicious patterns using ML
const isSuspicious = mlModel.predict(code);
if (isSuspicious) {
  errors.push('Code pattern flagged as potentially malicious');
}
```

### 2. Dynamic Pattern Updates
```javascript
// Load patterns from configuration service
async loadDangerousPatterns() {
  const patterns = await configService.get('dangerous_patterns');
  this.DANGEROUS_PATTERNS = patterns;
}
```

### 3. Audit Logging
```javascript
// Log all sanitization events
auditService.log({
  timestamp: new Date(),
  userId: req.user.id,
  action: 'CODE_EXECUTION',
  sanitationResult: validation,
  ip: req.ip
});
```

### 4. Rate Limiting Integration
```javascript
// Prevent DoS attacks
const rateLimit = await rateLimitService.check(req.user.id);
if (!rateLimit.allowed) {
  return res.status(429).json({ message: 'Too many requests' });
}
```

## Deployment Checklist

- [ ] Install/import sanitizationService in controllers
- [ ] Update all code execution routes
- [ ] Run unit tests for sanitization
- [ ] Run integration tests
- [ ] Test with production-like data
- [ ] Monitor execution logs for false positives
- [ ] Document patterns in team wiki
- [ ] Update API documentation
- [ ] Train team on new validation rules
- [ ] Set up alerts for security events

