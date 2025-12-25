# 🎯 CodeHub Input Feature - Quick Reference

## How to Use Input in Your Code

### 1. Write Code That Needs Input
Choose your language and write code with input statements:

```python
# Python
name = input("Enter name: ")
age = int(input("Enter age: "))
```

```cpp
// C++
string name;
int age;
cin >> name >> age;
```

```javascript
// JavaScript
process.stdin.on('data', (data) => {
    const lines = data.toString().split('\n');
    console.log('Hello ' + lines[0]);
    process.exit(0);
});
```

### 2. Provide Input Values
In the **"Input (optional)"** textarea below the Run button:
- Put each input value on a **new line**
- Match the number of inputs your code expects

Example input:
```
Alice
25
```

### 3. Run Your Code
Click the **"▶ Run Code"** button and see results!

## ⚠️ Common Mistakes

❌ **DON'T** put all inputs on one line: `Alice 25`

✅ **DO** put each input on separate lines:
```
Alice
25
```

## 📚 Examples by Language

### Python Examples

#### Example 1: Simple Input
```python
x = int(input())
y = int(input())
print(f"Sum = {x + y}")
```
**Input:**
```
10
20
```
**Output:** `Sum = 30`

#### Example 2: String Input
```python
name = input()
print(f"Hello, {name}!")
```
**Input:**
```
World
```
**Output:** `Hello, World!`

### C++ Examples

#### Example 1: Multiple cin
```cpp
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << "Product: " << (a * b) << endl;
    return 0;
}
```
**Input:**
```
5
7
```
**Output:** `Product: 35`

#### Example 2: String Input
```cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
    string word;
    cin >> word;
    cout << "You entered: " << word << endl;
    return 0;
}
```
**Input:**
```
CodeHub
```
**Output:** `You entered: CodeHub`

### JavaScript Examples

#### Example 1: Simple stdin
```javascript
process.stdin.on('data', (data) => {
    const num = parseInt(data.toString());
    console.log('Double:', num * 2);
    process.exit(0);
});
```
**Input:**
```
15
```
**Output:** `Double: 30`

#### Example 2: Multiple Lines
```javascript
process.stdin.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    const sum = lines.reduce((acc, val) => acc + parseInt(val), 0);
    console.log('Total:', sum);
    process.exit(0);
});
```
**Input:**
```
10
20
30
```
**Output:** `Total: 60`

## 💡 Pro Tips

1. **Count Your Inputs**: If your code has 3 `input()` or `cin >>`, provide 3 lines
2. **Empty Input OK**: If code doesn't need input, leave textarea empty
3. **Test Simple First**: Start with 1-2 inputs before trying complex cases
4. **Check Types**: Use `int(input())` for numbers in Python
5. **Debug Output**: Add print statements to see what values your code receives

## 🔍 Debugging Tips

### If Output Shows "Error":
- Check syntax (missing semicolons, parentheses)
- Verify all variables are declared
- Match input types (int vs string)

### If Code Times Out:
- Check for infinite loops
- Make sure JavaScript code calls `process.exit(0)`
- Verify input format matches what code expects

### If Wrong Output:
- Count input lines vs code's input statements
- Check for extra newlines in input
- Verify data types (number vs string)

## 🎓 Learning Path

### Level 1 - Beginner: Single Input
```python
# Python
x = int(input())
print(x * 2)
```
Input: `5` → Output: `10`

### Level 2 - Intermediate: Multiple Inputs
```cpp
// C++
int a, b, c;
cin >> a >> b >> c;
cout << "Average: " << (a + b + c) / 3.0 << endl;
```
Input: `10\n20\n30` → Output: `Average: 20`

### Level 3 - Advanced: Array Processing
```javascript
// JavaScript
process.stdin.on('data', (data) => {
    const arr = data.toString().trim().split('\n').map(Number);
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    console.log(`Max: ${max}, Min: ${min}`);
    process.exit(0);
});
```
Input: `5\n12\n3\n8` → Output: `Max: 12, Min: 3`

## 📞 Need Help?

Check full documentation:
- **User Guide**: `docs/User_Input_Guide.md`
- **Examples**: See test file `tests/integration/persistentContainers.test.js`
- **Architecture**: `docs/Persistent_Container_Architecture.md`

## ✨ Feature Highlights

- ✅ **All Languages Supported**: Python, C++, JavaScript
- ✅ **Multiple Inputs**: Unlimited input lines
- ✅ **Fast Execution**: Results in milliseconds
- ✅ **Error Handling**: Clear error messages
- ✅ **No Setup Needed**: Just write code and run!

---

**Happy Coding! 🚀**

Remember: Each input value on a new line!
