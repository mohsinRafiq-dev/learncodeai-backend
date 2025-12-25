import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import CourseLesson from "../models/CourseLesson.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";

const seedCppCourse = async () => {
  try {
    console.log("🌱 Seeding comprehensive C++ course...");

    // Clear existing C++ courses
    await Course.deleteMany({ language: "cpp" });
    await CourseSection.deleteMany({});
    await CourseLesson.deleteMany({});
    await Quiz.deleteMany({});

    // Get admin user
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      throw new Error("Admin user not found. Please seed users first.");
    }

    // ========== COMPREHENSIVE C++ COURSE ==========
    const cppCourse = new Course({
      title: "C++ Programming Mastery: From Fundamentals to Advanced",
      description:
        "Master C++ programming with this comprehensive course covering everything from basic syntax to advanced concepts like OOP, templates, memory management, and the Standard Template Library. Build efficient, high-performance applications with one of the most powerful programming languages.",
      shortDescription:
        "Complete C++ programming course from beginner to advanced level with hands-on projects",
      language: "cpp",
      category: "programming-language",
      difficulty: "beginner",
      instructor: admin._id,
      estimatedHours: 80,
      certificateTemplate: "excellence",
      tags: [
        "cpp",
        "programming",
        "object-oriented",
        "memory-management",
        "stl",
        "algorithms",
        "performance",
      ],
      isPublished: true,
      thumbnail:
        "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=500",
    });
    await cppCourse.save();

    // ========== SECTION 1: C++ FUNDAMENTALS ==========
    const section1 = new CourseSection({
      course: cppCourse._id,
      title: "C++ Fundamentals and Basic Syntax",
      description:
        "Learn the basics of C++ programming, setup development environment, and write your first programs",
      order: 1,
      estimatedHours: 15,
    });
    await section1.save();

    // Lesson 1.1: Introduction and Setup
    const lesson1_1 = new CourseLesson({
      section: section1._id,
      title: "Getting Started with C++",
      description:
        "Setup C++ development environment and understand the basics of C++ programming",
      content: `
        <h2>Why Learn C++?</h2>
        <p>C++ is a powerful, high-performance programming language used in:</p>
        <ul>
          <li><strong>System Software:</strong> Operating systems, device drivers</li>
          <li><strong>Game Development:</strong> Game engines, graphics programming</li>
          <li><strong>High-Frequency Trading:</strong> Financial systems requiring speed</li>
          <li><strong>Embedded Systems:</strong> IoT devices, microcontrollers</li>
          <li><strong>Scientific Computing:</strong> Simulations, data analysis</li>
        </ul>

        <h2>Setting Up Development Environment</h2>
        <h3>Option 1: GCC/G++ (Linux/Mac)</h3>
        <p>Install GCC compiler:</p>
        <pre><code>sudo apt update
sudo apt install g++</code></pre>

        <h3>Option 2: Visual Studio (Windows)</h3>
        <p>Download Visual Studio Community with C++ workload</p>

        <h3>Option 3: Online Compilers</h3>
        <p>Use online platforms like Wandbox, Compiler Explorer, or Replit</p>

        <h2>C++ Program Structure</h2>
        <p>Every C++ program has a specific structure that includes headers, main function, and statements.</p>
      `,
      order: 1,
      duration: 45,
      difficulty: "beginner",
      estimatedHours: 2,
      codeExamples: [
        {
          title: "Hello World Program",
          description: "Traditional first program in C++",
          code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "Welcome to C++ Programming!" << endl;
    return 0;
}`,
          expectedOutput: `Hello, World!\nWelcome to C++ Programming!`,
          order: 1,
        },
        {
          title: "Basic Input and Output",
          description: "Getting user input and displaying output",
          code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    int age;
    
    cout << "Enter your name: ";
    getline(cin, name);
    cout << "Enter your age: ";
    cin >> age;
    
    cout << "Hello " << name << ", you are " << age << " years old!" << endl;
    return 0;
}`,
          expectedOutput: `Enter your name: [User Input]\nEnter your age: [User Input]\nHello [Name], you are [Age] years old!`,
          order: 2,
        },
      ],
      tips: [
        "Always include <iostream> for input/output operations",
        "Use 'using namespace std' to avoid typing std:: repeatedly",
        "The main() function is the entry point of every C++ program",
        "Use endl or \\n for new lines in output",
      ],
      resources: [
        {
          title: "C++ Reference Documentation",
          url: "https://en.cppreference.com/w/",
          type: "documentation",
        },
        {
          title: "GCC Compiler Manual",
          url: "https://gcc.gnu.org/onlinedocs/",
          type: "documentation",
        },
      ],
    });
    await lesson1_1.save();

    // Lesson 1.2: Variables and Data Types
    const lesson1_2 = new CourseLesson({
      section: section1._id,
      title: "Variables, Data Types and Operators",
      description:
        "Learn about C++ data types, variable declaration, and operators",
      content: `
        <h2>Fundamental Data Types in C++</h2>
        <p>C++ has several built-in data types:</p>
        
        <h3>Integer Types</h3>
        <ul>
          <li><code>int</code> - Basic integer (4 bytes)</li>
          <li><code>short</code> - Short integer (2 bytes)</li>
          <li><code>long</code> - Long integer (4-8 bytes)</li>
          <li><code>long long</code> - Very long integer (8 bytes)</li>
        </ul>

        <h3>Floating-Point Types</h3>
        <ul>
          <li><code>float</code> - Single precision (4 bytes)</li>
          <li><code>double</code> - Double precision (8 bytes)</li>
          <li><code>long double</code> - Extended precision (16 bytes)</li>
        </ul>

        <h3>Character Types</h3>
        <ul>
          <li><code>char</code> - Single character (1 byte)</li>
          <li><code>wchar_t</code> - Wide character</li>
        </ul>

        <h3>Boolean Type</h3>
        <ul>
          <li><code>bool</code> - Boolean (true/false)</li>
        </ul>

        <h2>Variable Declaration and Initialization</h2>
        <p>C++ requires explicit type declaration for variables.</p>

        <h2>Operators in C++</h2>
        <ul>
          <li><strong>Arithmetic:</strong> +, -, *, /, %</li>
          <li><strong>Relational:</strong> ==, !=, <, >, <=, >=</li>
          <li><strong>Logical:</strong> &&, ||, !</li>
          <li><strong>Assignment:</strong> =, +=, -=, *=, /=</li>
          <li><strong>Increment/Decrement:</strong> ++, --</li>
        </ul>
      `,
      order: 2,
      duration: 60,
      difficulty: "beginner",
      estimatedHours: 2.5,
      codeExamples: [
        {
          title: "Data Types and Variables",
          description: "Working with different data types in C++",
          code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    // Integer types
    int age = 25;
    short year = 2024;
    long population = 7800000000L;
    
    // Floating-point types
    float price = 19.99f;
    double distance = 1234567.89;
    long double precise = 3.141592653589793238L;
    
    // Character types
    char grade = 'A';
    wchar_t symbol = L'€';
    
    // Boolean type
    bool isStudent = true;
    
    // String (from Standard Library)
    string name = "John Doe";
    string message = "Welcome to C++";
    
    // Display all values
    cout << "Name: " << name << endl;
    cout << "Age: " << age << endl;
    cout << "Price: $" << price << endl;
    cout << "Grade: " << grade << endl;
    cout << "Is Student: " << boolalpha << isStudent << endl;
    cout << "Population: " << population << endl;
    
    return 0;
}`,
          expectedOutput: `Name: John Doe\nAge: 25\nPrice: $19.99\nGrade: A\nIs Student: true\nPopulation: 7800000000`,
          order: 1,
        },
        {
          title: "Operators Demonstration",
          description: "Using various operators in C++",
          code: `#include <iostream>
using namespace std;

int main() {
    int a = 15, b = 4;
    
    // Arithmetic operators
    cout << "a + b = " << (a + b) << endl;
    cout << "a - b = " << (a - b) << endl;
    cout << "a * b = " << (a * b) << endl;
    cout << "a / b = " << (a / b) << endl;
    cout << "a % b = " << (a % b) << endl;
    
    // Relational operators
    cout << "a == b: " << (a == b) << endl;
    cout << "a != b: " << (a != b) << endl;
    cout << "a > b: " << (a > b) << endl;
    
    // Logical operators
    bool x = true, y = false;
    cout << "x && y: " << (x && y) << endl;
    cout << "x || y: " << (x || y) << endl;
    cout << "!x: " << (!x) << endl;
    
    // Assignment operators
    int c = 10;
    c += 5;  // c = c + 5
    cout << "c after += 5: " << c << endl;
    
    // Increment/Decrement
    int d = 5;
    cout << "d++: " << d++ << endl;  // Post-increment
    cout << "++d: " << ++d << endl;  // Pre-increment
    
    return 0;
}`,
          expectedOutput: `a + b = 19\na - b = 11\na * b = 60\na / b = 3\na % b = 3\na == b: 0\na != b: 1\na > b: 1\nx && y: 0\nx || y: 1\n!x: 0\nc after += 5: 15\nd++: 5\n++d: 7`,
          order: 2,
        },
      ],
      tips: [
        "Use meaningful variable names for better code readability",
        "Initialize variables when declaring them",
        "Be careful with integer division - it truncates the decimal part",
        "Use parentheses to clarify complex expressions",
      ],
      notes: [
        "C++ is a strongly typed language - types matter!",
        "The size of data types can vary by system architecture",
        "Use sizeof() operator to check type sizes on your system",
      ],
    });
    await lesson1_2.save();

    // Lesson 1.3: Control Flow
    const lesson1_3 = new CourseLesson({
      section: section1._id,
      title: "Control Flow: Conditionals and Loops",
      description: "Master decision making and repetition in C++ programs",
      content: `
        <h2>Conditional Statements</h2>
        <p>Control the flow of your program based on conditions.</p>
        
        <h3>if-else Statements</h3>
        <p>Execute code blocks based on boolean conditions.</p>
        
        <h3>switch Statement</h3>
        <p>Execute different code blocks based on a variable's value.</p>

        <h2>Looping Structures</h2>
        <p>Repeat code blocks multiple times.</p>
        
        <h3>for Loop</h3>
        <p>Execute a block of code a specific number of times.</p>
        
        <h3>while Loop</h3>
        <p>Execute a block of code while a condition is true.</p>
        
        <h3>do-while Loop</h3>
        <p>Execute a block of code at least once, then repeat while condition is true.</p>

        <h2>Loop Control Statements</h2>
        <ul>
          <li><code>break</code> - Exit the loop immediately</li>
          <li><code>continue</code> - Skip to the next iteration</li>
          <li><code>goto</code> - Jump to a labeled statement (use sparingly)</li>
        </ul>
      `,
      order: 3,
      duration: 55,
      difficulty: "beginner",
      estimatedHours: 2.5,
      codeExamples: [
        {
          title: "If-Else and Switch Statements",
          description: "Decision making in C++",
          code: `#include <iostream>
using namespace std;

int main() {
    int score;
    cout << "Enter your score (0-100): ";
    cin >> score;
    
    // if-else if-else ladder
    char grade;
    if (score >= 90) {
        grade = 'A';
    } else if (score >= 80) {
        grade = 'B';
    } else if (score >= 70) {
        grade = 'C';
    } else if (score >= 60) {
        grade = 'D';
    } else {
        grade = 'F';
    }
    
    cout << "Your grade is: " << grade << endl;
    
    // Switch statement example
    int day;
    cout << "Enter day number (1-7): ";
    cin >> day;
    
    switch(day) {
        case 1:
            cout << "Monday" << endl;
            break;
        case 2:
            cout << "Tuesday" << endl;
            break;
        case 3:
            cout << "Wednesday" << endl;
            break;
        case 4:
            cout << "Thursday" << endl;
            break;
        case 5:
            cout << "Friday" << endl;
            break;
        case 6:
            cout << "Saturday" << endl;
            break;
        case 7:
            cout << "Sunday" << endl;
            break;
        default:
            cout << "Invalid day!" << endl;
    }
    
    return 0;
}`,
          expectedOutput: `Enter your score (0-100): [User Input]\nYour grade is: [Grade]\nEnter day number (1-7): [User Input]\n[Day Name]`,
          order: 1,
        },
        {
          title: "Looping Structures",
          description: "Different types of loops in C++",
          code: `#include <iostream>
using namespace std;

int main() {
    // for loop - print numbers 1 to 5
    cout << "For loop:" << endl;
    for (int i = 1; i <= 5; i++) {
        cout << i << " ";
    }
    cout << endl << endl;
    
    // while loop - sum numbers until 0 is entered
    cout << "While loop (enter numbers, 0 to stop):" << endl;
    int number, sum = 0;
    while (true) {
        cin >> number;
        if (number == 0) {
            break;
        }
        sum += number;
    }
    cout << "Sum: " << sum << endl << endl;
    
    // do-while loop - menu system
    int choice;
    do {
        cout << "Menu:" << endl;
        cout << "1. Option 1" << endl;
        cout << "2. Option 2" << endl;
        cout << "3. Exit" << endl;
        cout << "Enter choice: ";
        cin >> choice;
        
        switch(choice) {
            case 1:
                cout << "You selected Option 1" << endl;
                break;
            case 2:
                cout << "You selected Option 2" << endl;
                break;
            case 3:
                cout << "Exiting..." << endl;
                break;
            default:
                cout << "Invalid choice!" << endl;
        }
        cout << endl;
    } while (choice != 3);
    
    return 0;
}`,
          expectedOutput: `For loop:\n1 2 3 4 5 \n\nWhile loop (enter numbers, 0 to stop):\n[User Inputs]\nSum: [Sum]\n\nMenu:\n1. Option 1\n2. Option 2\n3. Exit\nEnter choice: [User Input]`,
          order: 2,
        },
        {
          title: "Nested Loops and Pattern Printing",
          description: "Using nested loops to create patterns",
          code: `#include <iostream>
using namespace std;

int main() {
    int rows;
    cout << "Enter number of rows: ";
    cin >> rows;
    
    // Right triangle pattern
    cout << "Right Triangle Pattern:" << endl;
    for (int i = 1; i <= rows; i++) {
        for (int j = 1; j <= i; j++) {
            cout << "* ";
        }
        cout << endl;
    }
    cout << endl;
    
    // Multiplication table
    cout << "Multiplication Table (5x5):" << endl;
    for (int i = 1; i <= 5; i++) {
        for (int j = 1; j <= 5; j++) {
            cout << i * j << "\t";
        }
        cout << endl;
    }
    
    return 0;
}`,
          expectedOutput: `Enter number of rows: [User Input]\nRight Triangle Pattern:\n* \n* * \n* * * \n[Pattern continues...]\n\nMultiplication Table (5x5):\n1\t2\t3\t4\t5\t\n2\t4\t6\t8\t10\t\n3\t6\t9\t12\t15\t\n4\t8\t12\t16\t20\t\n5\t10\t15\t20\t25\t`,
          order: 3,
        },
      ],
      tips: [
        "Always include break statements in switch cases to prevent fall-through",
        "Use meaningful loop variable names (i, j, k for simple loops)",
        "Be careful with infinite loops - always have an exit condition",
        "Prefer for loops when you know the number of iterations",
      ],
      notes: [
        "The do-while loop always executes at least once",
        "You can nest loops and conditionals arbitrarily deep",
        "Use break and continue judiciously to improve code readability",
      ],
    });
    await lesson1_3.save();

    // ========== SECTION 2: FUNCTIONS AND OOP ==========
    const section2 = new CourseSection({
      course: cppCourse._id,
      title: "Functions and Object-Oriented Programming",
      description:
        "Master functions, classes, and object-oriented programming principles in C++",
      order: 2,
      estimatedHours: 25,
    });
    await section2.save();

    // Lesson 2.1: Functions
    const lesson2_1 = new CourseLesson({
      section: section2._id,
      title: "Functions and Modular Programming",
      description:
        "Learn to create reusable code with functions, understand parameters, return types, and function overloading",
      content: `
        <h2>Functions in C++</h2>
        <p>Functions allow you to break down complex programs into smaller, manageable pieces.</p>
        
        <h3>Function Components</h3>
        <ul>
          <li><strong>Return Type:</strong> The type of value the function returns</li>
          <li><strong>Function Name:</strong> Identifier for the function</li>
          <li><strong>Parameters:</strong> Input values for the function</li>
          <li><strong>Function Body:</strong> Code that executes when function is called</li>
        </ul>

        <h2>Function Declaration vs Definition</h2>
        <p><strong>Declaration:</strong> Tells the compiler about the function's signature</p>
        <p><strong>Definition:</strong> Provides the actual implementation</p>

        <h2>Parameter Passing Methods</h2>
        <ul>
          <li><strong>Pass by Value:</strong> Creates a copy of the argument</li>
          <li><strong>Pass by Reference:</strong> Works with the original variable</li>
          <li><strong>Pass by Pointer:</strong> Uses memory addresses</li>
        </ul>

        <h2>Function Overloading</h2>
        <p>Multiple functions can have the same name with different parameters.</p>

        <h2>Recursive Functions</h2>
        <p>Functions that call themselves to solve problems.</p>
      `,
      order: 1,
      duration: 70,
      difficulty: "intermediate",
      estimatedHours: 3,
      codeExamples: [
        {
          title: "Basic Functions and Overloading",
          description: "Creating and using functions with overloading",
          code: `#include <iostream>
#include <cmath>
using namespace std;

// Function declaration
int add(int a, int b);
double add(double a, double b);
void printMessage(string message, int times = 1);

// Function definitions
int add(int a, int b) {
    return a + b;
}

// Function overloading - same name, different parameters
double add(double a, double b) {
    return a + b;
}

// Function with default parameter
void printMessage(string message, int times) {
    for (int i = 0; i < times; i++) {
        cout << message << endl;
    }
}

// Function that returns nothing (void)
void displayInfo(string name, int age) {
    cout << "Name: " << name << endl;
    cout << "Age: " << age << endl;
}

int main() {
    // Using different function versions
    cout << "Integer addition: " << add(5, 3) << endl;
    cout << "Double addition: " << add(5.5, 3.2) << endl;
    
    displayInfo("Alice", 25);
    printMessage("Hello C++!");
    printMessage("Repeated", 3);  // Using default parameter
    
    return 0;
}`,
          expectedOutput: `Integer addition: 8\nDouble addition: 8.7\nName: Alice\nAge: 25\nHello C++!\nRepeated\nRepeated\nRepeated`,
          order: 1,
        },
        {
          title: "Parameter Passing Methods",
          description: "Different ways to pass parameters to functions",
          code: `#include <iostream>
using namespace std;

// Pass by value (creates copy)
void incrementByValue(int x) {
    x++;
    cout << "Inside function (by value): " << x << endl;
}

// Pass by reference (works with original)
void incrementByReference(int &x) {
    x++;
    cout << "Inside function (by reference): " << x << endl;
}

// Pass by pointer
void incrementByPointer(int *x) {
    (*x)++;
    cout << "Inside function (by pointer): " << *x << endl;
}

// Function returning a value
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);  // Recursion
}

int main() {
    int num = 5;
    
    cout << "Original value: " << num << endl;
    
    incrementByValue(num);
    cout << "After pass by value: " << num << endl;
    
    incrementByReference(num);
    cout << "After pass by reference: " << num << endl;
    
    incrementByPointer(&num);
    cout << "After pass by pointer: " << num << endl;
    
    // Recursive function example
    cout << "Factorial of 5: " << factorial(5) << endl;
    
    return 0;
}`,
          expectedOutput: `Original value: 5\nInside function (by value): 6\nAfter pass by value: 5\nInside function (by reference): 6\nAfter pass by reference: 6\nInside function (by pointer): 7\nAfter pass by pointer: 7\nFactorial of 5: 120`,
          order: 2,
        },
      ],
      tips: [
        "Use descriptive function names that indicate what the function does",
        "Keep functions small and focused on a single task",
        "Use pass by reference when you need to modify the original variable",
        "Use const references for large objects to avoid copying",
      ],
      notes: [
        "Function overloading is resolved at compile time",
        "Default parameters must be at the end of the parameter list",
        "Recursive functions need a base case to prevent infinite recursion",
      ],
    });
    await lesson2_1.save();

    // ========== QUIZZES ==========

    // Quiz for Section 1
    const quiz1 = new Quiz({
      title: "C++ Fundamentals Quiz",
      description:
        "Test your understanding of C++ basics, variables, data types, and control flow",
      type: "section-quiz",
      course: cppCourse._id,
      section: section1._id,
      questions: [
        {
          type: "multiple-choice",
          question:
            "Which of the following is the correct way to include the iostream header in C++?",
          description: "Choose the proper include syntax",
          order: 1,
          options: [
            { text: "#include <iostream>", isCorrect: true },
            { text: '#include "iostream"', isCorrect: false },
            { text: "import iostream;", isCorrect: false },
            { text: "using iostream;", isCorrect: false },
          ],
          points: 1,
          explanation:
            "Standard library headers are included using angle brackets < >",
        },
        {
          type: "multiple-choice",
          question: "What is the output of: cout << 5 / 2; in C++?",
          order: 2,
          options: [
            { text: "2.5", isCorrect: false },
            { text: "2", isCorrect: true },
            { text: "3", isCorrect: false },
            { text: "2.0", isCorrect: false },
          ],
          points: 1,
          explanation:
            "Integer division truncates the decimal part, so 5/2 = 2",
        },
        {
          type: "multiple-choice",
          question:
            "Which data type would you use to store a single character in C++?",
          order: 3,
          options: [
            { text: "string", isCorrect: false },
            { text: "char", isCorrect: true },
            { text: "character", isCorrect: false },
            { text: "chr", isCorrect: false },
          ],
          points: 1,
          explanation:
            "The 'char' data type is used for single characters in C++",
        },
        {
          type: "true-false",
          question: "In C++, the main() function must return an integer value.",
          order: 4,
          options: [
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false },
          ],
          points: 1,
          explanation:
            "The main() function in C++ should return an int, typically 0 for success",
        },
        {
          type: "multiple-choice",
          question: "Which loop is guaranteed to execute at least once?",
          order: 5,
          options: [
            { text: "for loop", isCorrect: false },
            { text: "while loop", isCorrect: false },
            { text: "do-while loop", isCorrect: true },
            { text: "All of the above", isCorrect: false },
          ],
          points: 1,
          explanation:
            "The do-while loop checks the condition after execution, so it always runs at least once",
        },
      ],
      passingScore: 70,
      timeLimit: 15,
      isPublished: true,
    });
    await quiz1.save();

    // Quiz for Section 2
    const quiz2 = new Quiz({
      title: "Functions and OOP Quiz",
      description:
        "Test your knowledge of functions and object-oriented programming in C++",
      type: "section-quiz",
      course: cppCourse._id,
      section: section2._id,
      questions: [
        {
          type: "multiple-choice",
          question: "What is function overloading in C++?",
          order: 1,
          options: [
            {
              text: "Creating functions with the same name but different parameters",
              isCorrect: true,
            },
            { text: "Making functions run faster", isCorrect: false },
            { text: "Creating recursive functions", isCorrect: false },
            { text: "Importing functions from other files", isCorrect: false },
          ],
          points: 1,
          explanation:
            "Function overloading allows multiple functions with the same name but different parameter lists",
        },
        {
          type: "multiple-choice",
          question:
            "Which parameter passing method allows the function to modify the original variable?",
          order: 2,
          options: [
            { text: "Pass by value", isCorrect: false },
            { text: "Pass by reference", isCorrect: true },
            { text: "Pass by copy", isCorrect: false },
            { text: "All of the above", isCorrect: false },
          ],
          points: 1,
          explanation:
            "Pass by reference allows the function to work with and modify the original variable",
        },
      ],
      passingScore: 70,
      timeLimit: 10,
      isPublished: true,
    });
    await quiz2.save();

    // Update sections with lessons and quizzes
    section1.lessons = [lesson1_1._id, lesson1_2._id, lesson1_3._id];
    section1.sectionQuiz = quiz1._id;
    await section1.save();

    section2.lessons = [lesson2_1._id];
    section2.sectionQuiz = quiz2._id;
    await section2.save();

    // Update course with sections
    cppCourse.sections = [section1._id, section2._id];
    cppCourse.totalSections = 2;
    cppCourse.totalLessons = 4;
    await cppCourse.save();

    console.log("✅ Comprehensive C++ course created successfully!");
    console.log("📚 Course includes:");
    console.log("   - 2 detailed sections");
    console.log("   - 4 comprehensive lessons");
    console.log("   - 8+ code examples with expected outputs");
    console.log("   - 2 section quizzes with multiple question types");
    console.log("   - Tips, notes, and resources for each lesson");

    return cppCourse;
  } catch (error) {
    console.error("❌ Error seeding C++ course:", error);
    throw error;
  }
};

export default seedCppCourse;

