// Pre-generated tutorials for Python, C++, and JavaScript.
//
// Python has a full beginner→expert curriculum (24 tutorials across 4 modules),
// imported from ./seedData/pythonTutorials.js. C++ and JavaScript still ship
// the original starter set inline below — expand them next using
// pythonTutorials.js as the template.

import pythonTutorials from './seedData/pythonTutorials.js';

export const mainConcepts = {
  python: [
    'Variables and Data Types', 'Operators and Expressions', 'Strings',
    'Input/Output', 'Conditionals', 'Loops',
    'Lists and Tuples', 'Dictionaries and Sets', 'Functions',
    'Function Arguments', 'Higher-Order Functions', 'Comprehensions',
    'File I/O', 'Error Handling', 'Modules and Imports',
    'OOP Basics', 'Inheritance', 'Iterators and Generators',
    'Decorators', 'Context Managers', 'Async Programming',
    'Type Hints', 'Testing', 'Concurrency',
  ],
  javascript: ['Variables', 'Conditionals', 'Loops', 'Functions', 'DOM Manipulation'],
  cpp: ['Variables', 'Input/Output', 'Control Structures', 'Loops', 'Functions'],
};

export const preGeneratedTutorials = [
  ...pythonTutorials,

  // ============ C++ TUTORIALS (legacy starter set) ============
  {
    title: 'C++ Variables and Data Types',
    description: 'Understanding variables and data types in C++',
    content: `## Variables - Main Concept for C++

Variables are named memory locations that store values. In C++, variables must be declared with a specific data type before use.

### Common Data Types:
- **int**: Integer numbers (-2^31 to 2^31-1)
- **float**: Decimal numbers (32-bit, ~6-7 decimal places)
- **double**: High-precision decimal numbers (64-bit, ~15-16 decimal places)
- **char**: Single character or ASCII value
- **bool**: True or false (1 or 0)
- **string**: Text strings (requires #include <string>)

### Variable Declaration:
\`\`\`cpp
dataType variableName = initialValue;
int age = 25;
float pi = 3.14f;
\`\`\`

### Memory and Types:
- Type determines how much memory is allocated
- Must be explicitly declared before use
- Type checking is strict in C++ (unlike Python)`,
    language: 'cpp',
    concept: 'Variables',
    difficulty: 'beginner',
    module: 'Foundations',
    order: 1,
    estimatedMinutes: 15,
    notes: [
      'Variables must be declared before use',
      'Variable names are case-sensitive',
      'Initialization assigns initial value to variable',
      'Use const for values that should not change'
    ],
    tips: [
      'Always initialize variables before using them',
      'Use meaningful variable names',
      'Use const for constants to prevent accidental changes',
      'Use double instead of float for better precision'
    ],
    codeExamples: [
      {
        title: 'Basic Variable Declaration',
        description: 'Declare and initialize variables',
        code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    int age = 25;
    float height = 5.7f;
    char grade = 'A';
    string name = "John";

    cout << "Name: " << name << endl;
    cout << "Age: " << age << endl;
    cout << "Height: " << height << endl;
    cout << "Grade: " << grade << endl;

    return 0;
}`,
        input: '',
        expectedOutput: `Name: John
Age: 25
Height: 5.7
Grade: A`,
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['basics', 'variables', 'data-types'],
    createdBy: null,
    isAIgenerated: false,
    isPublished: true,
  },
  {
    title: 'C++ Input and Output',
    description: 'Learn to read input and display output',
    content: `## Input/Output - Main Concept for C++

C++ provides cin for input and cout for output through the iostream library.

### Output with cout:
- **cout**: Displays output on the screen
- **<<**: Insertion operator (for output)
- **endl**: Ends the line and flushes the buffer

### Input with cin:
- **cin**: Reads input from the keyboard
- **>>**: Extraction operator (for input)
- **getline()**: Reads entire line including spaces

### Important Points:
- Always include <iostream> header
- cin stops reading at whitespace (use getline for full lines)
- Output operations can be chained: cout << a << b << c;`,
    language: 'cpp',
    concept: 'Input/Output',
    difficulty: 'beginner',
    module: 'Foundations',
    order: 2,
    estimatedMinutes: 15,
    notes: [
      'Always include <iostream> header',
      'Use using namespace std; to avoid std:: prefix',
      'cin stops reading at whitespace (spaces, tabs, newlines)',
      'Use getline(cin, string) to read entire lines'
    ],
    tips: [
      'Provide clear prompts before asking for input',
      'Validate user input when possible',
      'Use endl or "\\n" to end lines (endl is slower)',
      'Chain multiple outputs with << operator'
    ],
    codeExamples: [
      {
        title: 'Basic Input/Output',
        description: 'Read name and age, display greeting',
        code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    int age;

    cout << "Enter your name: ";
    cin >> name;

    cout << "Enter your age: ";
    cin >> age;

    cout << "Hello, " << name << "! You are " << age << " years old." << endl;

    return 0;
}`,
        input: 'Alice\n28',
        expectedOutput: 'Enter your name: Enter your age: Hello, Alice! You are 28 years old.',
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['input-output', 'basics'],
    createdBy: null,
    isAIgenerated: false,
    isPublished: true,
  },
  {
    title: 'C++ Control Structures: If-Else',
    description: 'Make decisions in your C++ programs',
    content: `## Control Structures - Main Concept for C++

If-else statements allow your program to execute different code based on conditions.

### Syntax:
\`\`\`cpp
if (condition) {
    // code if condition is true
} else if (condition2) {
    // code if condition2 is true
} else {
    // code if all conditions are false
}
\`\`\`

### Operators:
- **Comparison**: ==, !=, <, >, <=, >=
- **Logical**: && (and), || (or), ! (not)
- **Ternary**: condition ? valueIfTrue : valueIfFalse

### Best Practices:
- Use curly braces {} even for single statements
- Keep conditions simple and readable`,
    language: 'cpp',
    concept: 'Control Structures',
    difficulty: 'beginner',
    module: 'Foundations',
    order: 3,
    estimatedMinutes: 15,
    notes: [
      'Use curly braces {} to define code blocks',
      'Comparison operators: ==, !=, <, >, <=, >=',
      'Logical operators: &&, ||, !',
      'Conditions must be enclosed in parentheses'
    ],
    tips: [
      'Indent your code for readability',
      'Test with various input values including edge cases',
      'Use else if for multiple conditions',
      'Use switch statements for many equal comparisons'
    ],
    codeExamples: [
      {
        title: 'Check Even or Odd',
        description: 'Determine if a number is even or odd',
        code: `#include <iostream>
using namespace std;

int main() {
    int num;
    cout << "Enter a number: ";
    cin >> num;
    if (num % 2 == 0) {
        cout << num << " is even" << endl;
    } else {
        cout << num << " is odd" << endl;
    }
    return 0;
}`,
        input: '7',
        expectedOutput: '7 is odd',
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['control-structures', 'conditionals'],
    createdBy: null,
    isAIgenerated: false,
    isPublished: true,
  },
  {
    title: 'C++ Loops: For and While',
    description: 'Repeat code using loops',
    content: `## Loops - Main Concept for C++

Loops repeat a block of code multiple times.

### Loop Types:
1. **for loop**: Best when you know how many times to repeat
2. **while loop**: Best when you repeat based on a condition
3. **do-while loop**: Always executes at least once

### Loop Control Statements:
- **break**: Exits loop immediately
- **continue**: Skips current iteration and goes to next`,
    language: 'cpp',
    concept: 'Loops',
    difficulty: 'beginner',
    module: 'Foundations',
    order: 4,
    estimatedMinutes: 15,
    notes: [
      'for loop: for(init; condition; increment)',
      'while loop: while(condition)',
      'do-while: do { } while(condition);',
      'Loop variable scope in for loops'
    ],
    tips: [
      'Use break to exit loop early',
      'Use continue to skip current iteration',
      'Avoid infinite loops by updating loop condition',
      'Use curly braces even for single statements'
    ],
    codeExamples: [
      {
        title: 'For Loop: Print 1 to 5',
        description: 'Simple for loop counting up',
        code: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 5; i++) {
        cout << i << endl;
    }
    return 0;
}`,
        input: '',
        expectedOutput: `1
2
3
4
5`,
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['loops', 'control-structures'],
    createdBy: null,
    isAIgenerated: false,
    isPublished: true,
  },

  // ============ JAVASCRIPT TUTORIALS (legacy starter set) ============
  {
    title: 'JavaScript Variables and Data Types',
    description: 'Learn about variables and primitive data types in JavaScript',
    content: `## Variables - Main Concept for JavaScript

Variables store data values in JavaScript. You can declare variables using var, let, or const keywords.

### Data Types:
- **string**: Text enclosed in quotes
- **number**: Integer or decimal numbers
- **boolean**: true or false
- **null**: Intentionally empty value
- **undefined**: Variable declared but not assigned
- **object**: Complex data structure
- **array**: Ordered list of values
- **symbol**: Unique identifiers (ES6+)

### Variable Declaration Keywords:
- **var**: Function-scoped, can be redeclared (legacy)
- **let**: Block-scoped, cannot be redeclared in same scope (modern)
- **const**: Block-scoped, cannot be reassigned (recommended)`,
    language: 'javascript',
    concept: 'Variables',
    difficulty: 'beginner',
    module: 'Foundations',
    order: 1,
    estimatedMinutes: 15,
    notes: [
      'const is preferred for modern JavaScript',
      'let has block scope, var has function scope',
      'Always use meaningful variable names',
      'Variables are case-sensitive in JavaScript'
    ],
    tips: [
      'Avoid using var in modern code',
      'Use const by default, let if you need to reassign',
      'Initialize variables at declaration time',
      'Use descriptive names in camelCase for variables'
    ],
    codeExamples: [
      {
        title: 'Variable Declaration',
        description: 'Different ways to declare variables',
        code: `const name = "Alice";
let age = 25;
const isStudent = true;

console.log(name);
console.log(age);
console.log(isStudent);`,
        input: '',
        expectedOutput: `Alice
25
true`,
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['variables', 'basics'],
    createdBy: null,
    isAIgenerated: false,
    isPublished: true,
  },
  {
    title: 'JavaScript Conditional Statements',
    description: 'Control program flow with if-else statements',
    content: `## Conditionals - Main Concept for JavaScript

Conditional statements execute different code based on conditions.

### Syntax:
\`\`\`javascript
if (condition) {
    // code if true
} else if (condition2) {
    // code if condition2 true
} else {
    // code if all false
}
\`\`\`

### Operators:
- **Comparison**: ==, ===, !=, !==, <, >, <=, >=
- **Logical**: && (and), || (or), ! (not)
- **Ternary**: condition ? valueIfTrue : valueIfFalse`,
    language: 'javascript',
    concept: 'Conditionals',
    difficulty: 'beginner',
    module: 'Foundations',
    order: 2,
    estimatedMinutes: 15,
    notes: [
      'Comparison operators: ==, ===, !=, !==, <, >, <=, >=',
      'Logical operators: &&, ||, !',
      'Use === for strict equality (recommended)',
      'JavaScript uses truthy and falsy values'
    ],
    tips: [
      'Always use === instead of ==',
      'Combine conditions with && and ||',
      'Test all branches of your conditionals',
      'Use ternary operator for simple conditions'
    ],
    codeExamples: [
      {
        title: 'If-Else Statement',
        description: 'Check if age is adult or minor',
        code: `const age = 18;

if (age >= 18) {
    console.log("You are an adult");
} else {
    console.log("You are a minor");
}`,
        input: '',
        expectedOutput: 'You are an adult',
        order: 1
      }
    ],
    isPreGenerated: true,
    tags: ['conditionals', 'control-flow'],
    createdBy: null,
    isAIgenerated: false,
    isPublished: true,
  },
  {
    title: 'JavaScript Loops',
    description: 'Repeat code using for, while, and forEach loops',
    content: `## Loops - Main Concept for JavaScript

Loops repeat code blocks multiple times:

### Loop Types:
1. **for**: Classic loop with initialization, condition, and increment
2. **while**: Repeats while condition is true
3. **do-while**: Always executes at least once
4. **forEach**: Iterates over array elements (cannot use break)
5. **for...of**: Iterates over values (modern, ES6+)
6. **for...in**: Iterates over property keys (avoid for arrays)`,
    language: 'javascript',
    concept: 'Loops',
    difficulty: 'beginner',
    module: 'Foundations',
    order: 3,
    estimatedMinutes: 15,
    notes: [
      'forEach doesn\'t support break/continue',
      'for...in iterates over keys (not recommended for arrays)',
      'for...of iterates over values (modern, clean)',
      'Traditional for loop gives full control'
    ],
    tips: [
      'Use for...of for arrays (modern and clean)',
      'Use forEach for side effects with arrays',
      'Avoid infinite loops by ensuring condition changes',
      'Use break to exit early, continue to skip iteration'
    ],
    codeExamples: [
      {
        title: 'For Loop',
        description: 'Count from 1 to 5',
        code: `for (let i = 1; i <= 5; i++) {
    console.log(i);
}`,
        input: '',
        expectedOutput: `1
2
3
4
5`,
        order: 1
      },
      {
        title: 'Array forEach',
        description: 'Iterate over array elements',
        code: `const colors = ["red", "green", "blue"];

colors.forEach(color => {
    console.log(color);
});`,
        input: '',
        expectedOutput: `red
green
blue`,
        order: 2
      }
    ],
    isPreGenerated: true,
    tags: ['loops', 'control-flow'],
    createdBy: null,
    isAIgenerated: false,
    isPublished: true,
  },
  {
    title: 'JavaScript Functions',
    description: 'Create reusable code with functions',
    content: `## Functions - Main Concept for JavaScript

Functions are reusable blocks of code that perform specific tasks.

### Declaration Methods:
1. **Function Declaration**: \`function name() { }\` — hoisted
2. **Function Expression**: \`const name = function() { }\` — not hoisted
3. **Arrow Functions**: \`const name = () => { }\` — modern ES6+ syntax

### Key Concepts:
- **Parameters**: Inputs to the function
- **Return statement**: Outputs from the function
- **Default parameters**: Provide default values
- **Rest parameters**: Accept multiple arguments`,
    language: 'javascript',
    concept: 'Functions',
    difficulty: 'beginner',
    module: 'Foundations',
    order: 4,
    estimatedMinutes: 15,
    notes: [
      'Arrow functions are concise syntax (ES6+)',
      'Parameters are optional',
      'Functions are first-class objects in JavaScript',
      'Arrow functions don\'t have their own "this"'
    ],
    tips: [
      'Use descriptive function names in camelCase',
      'Keep functions focused and single-purpose',
      'Consider default parameters for optional args',
      'Arrow functions are great for callbacks and map/filter'
    ],
    codeExamples: [
      {
        title: 'Function Declaration',
        description: 'Simple function to add two numbers',
        code: `function add(a, b) {
    return a + b;
}

console.log(add(5, 3));`,
        input: '',
        expectedOutput: '8',
        order: 1
      },
      {
        title: 'Arrow Function',
        description: 'Concise arrow function syntax',
        code: `const multiply = (a, b) => a * b;

console.log(multiply(4, 5));`,
        input: '',
        expectedOutput: '20',
        order: 2
      }
    ],
    isPreGenerated: true,
    tags: ['functions', 'code-organization'],
    createdBy: null,
    isAIgenerated: false,
    isPublished: true,
  }
];

export default preGeneratedTutorials;
