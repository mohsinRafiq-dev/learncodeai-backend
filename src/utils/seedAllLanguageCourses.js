import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import CourseLesson from "../models/CourseLesson.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Certificate from "../models/Certificate.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";

const COURSE_BLUEPRINTS = [
  {
    language: "javascript",
    title: "JavaScript Developer Path: Fundamentals to Modern Web Apps",
    shortDescription: "Build strong JavaScript foundations and ship real browser applications.",
    description:
      "A complete JavaScript path covering syntax, functions, arrays, objects, async workflows, and DOM app building.",
    thumbnail:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
    tags: ["javascript", "web", "dom", "async"],
    sections: [
      {
        title: "JavaScript Core",
        description: "Variables, functions, arrays, objects and control flow.",
        lessons: [
          {
            title: "Variables, Types and Operators",
            description: "Use let/const, primitives, and common operators.",
            content:
              "<h2>JavaScript Basics</h2><p>Learn let/const, strings, numbers, booleans, and objects.</p>",
            codeExamples: [
              {
                title: "Basic variables",
                description: "Declaring and using variables",
                code: "const name = 'Alex';\nlet score = 10;\nscore += 5;\nconsole.log(name, score);",
                expectedOutput: "Alex 15",
                order: 1,
              },
            ],
          },
          {
            title: "Functions and Array Methods",
            description: "Write reusable functions and process arrays.",
            content:
              "<h2>Functions</h2><p>Create reusable logic with function declarations and arrow functions.</p>",
            codeExamples: [
              {
                title: "Map and filter",
                description: "Transform and filter arrays",
                code: "const nums = [1,2,3,4];\nconst evenSquares = nums.filter(n => n % 2 === 0).map(n => n*n);\nconsole.log(evenSquares);",
                expectedOutput: "[4, 16]",
                order: 1,
              },
            ],
          },
        ],
        quiz: {
          title: "JavaScript Core Quiz",
          description: "Assess core JavaScript understanding.",
          passingScore: 70,
          questions: [
            {
              type: "multiple-choice",
              question: "Which keyword creates a block-scoped variable?",
              options: [
                { text: "var", isCorrect: false },
                { text: "let", isCorrect: true },
                { text: "function", isCorrect: false },
                { text: "const", isCorrect: false },
              ],
              points: 2,
            },
            {
              type: "true-false",
              question: "Array.prototype.map returns a new array.",
              options: [
                { text: "true", isCorrect: true },
                { text: "false", isCorrect: false },
              ],
              points: 2,
            },
          ],
        },
      },
      {
        title: "DOM and Async",
        description: "Manipulate UI and call APIs with async/await.",
        lessons: [
          {
            title: "DOM Selection and Events",
            description: "Read and update page content with events.",
            content:
              "<h2>DOM Basics</h2><p>Select elements and handle click/input events to build interactive pages.</p>",
          },
          {
            title: "Fetch API and Async/Await",
            description: "Consume APIs and handle asynchronous operations.",
            content:
              "<h2>Async JavaScript</h2><p>Use fetch with async/await and proper error handling.</p>",
          },
        ],
        quiz: {
          title: "DOM and Async Quiz",
          description: "Validate practical front-end skills.",
          passingScore: 70,
          questions: [
            {
              type: "multiple-choice",
              question: "Which method is used to query one DOM element by CSS selector?",
              options: [
                { text: "getElement", isCorrect: false },
                { text: "querySelector", isCorrect: true },
                { text: "selectOne", isCorrect: false },
                { text: "getNode", isCorrect: false },
              ],
              points: 2,
            },
            {
              type: "short-answer",
              question: "Write the keyword pair used to handle promises in modern JS.",
              acceptableAnswers: ["async await", "async/await", "await async"],
              caseSensitive: false,
              points: 2,
            },
          ],
        },
      },
      {
        title: "JavaScript Expert Patterns",
        description: "Master design patterns, performance, and advanced concepts.",
        lessons: [
          {
            title: "Closures and Prototypes",
            description: "Deep dive into JS internals.",
            content: "<h2>Expert JS</h2><p>Understand memory, execution context, and prototypal inheritance to write expert-level JavaScript.</p>",
          },
          {
            title: "Performance and Web APIs",
            description: "Optimize web apps for the real world.",
            content: "<h2>Performance Optimization</h2><p>Learn to debounce, throttle, and use Web Workers to handle heavy workloads.</p>",
          }
        ],
        quiz: {
          title: "Expert JS Quiz",
          description: "Validate expert JS skills.",
          passingScore: 80,
          questions: [
            {
              type: "true-false",
              question: "Closures retain access to their outer scope even after the outer function has returned.",
              options: [
                { text: "true", isCorrect: true },
                { text: "false", isCorrect: false },
              ],
              points: 2,
            },
          ],
        },
      },
    ],
  },
  {
    language: "python",
    title: "Python Programming Track: Fundamentals to Practical Automation",
    shortDescription: "Master Python basics, data structures, and automation workflows.",
    description:
      "Learn Python syntax, functions, collections, files, and practical scripts to automate daily tasks.",
    thumbnail:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
    tags: ["python", "automation", "scripting", "data"],
    sections: [
      {
        title: "Python Foundations",
        description: "Syntax, variables, loops and functions.",
        lessons: [
          {
            title: "Variables, Types and Input",
            description: "Use Python primitives and read input.",
            content:
              "<h2>Python Basics</h2><p>Understand dynamic typing, strings, numbers, and booleans.</p>",
          },
          {
            title: "Functions and Loops",
            description: "Build reusable logic with loops and functions.",
            content:
              "<h2>Control Flow</h2><p>Use if/elif/else, for/while loops, and function definitions.</p>",
          },
        ],
        quiz: {
          title: "Python Foundations Quiz",
          description: "Test Python fundamentals.",
          passingScore: 70,
          questions: [
            {
              type: "multiple-choice",
              question: "Which keyword is used to define a function in Python?",
              options: [
                { text: "function", isCorrect: false },
                { text: "def", isCorrect: true },
                { text: "fn", isCorrect: false },
                { text: "lambda", isCorrect: false },
              ],
              points: 2,
            },
            {
              type: "true-false",
              question: "Python lists are mutable.",
              options: [
                { text: "true", isCorrect: true },
                { text: "false", isCorrect: false },
              ],
              points: 2,
            },
          ],
        },
      },
      {
        title: "Files and Automation",
        description: "Work with files and automate repetitive tasks.",
        lessons: [
          {
            title: "File Read and Write",
            description: "Use context managers for safe file operations.",
            content:
              "<h2>File I/O</h2><p>Read and write text files with open() and with-statements.</p>",
          },
          {
            title: "Simple Automation Scripts",
            description: "Combine loops, files and conditions for automation.",
            content:
              "<h2>Automation</h2><p>Use Python scripts to rename files, parse logs, and clean datasets.</p>",
          },
        ],
        quiz: {
          title: "Python Automation Quiz",
          description: "Assess practical scripting skills.",
          passingScore: 70,
          questions: [
            {
              type: "multiple-choice",
              question: "Which mode opens a file for appending text?",
              options: [
                { text: "r", isCorrect: false },
                { text: "w", isCorrect: false },
                { text: "a", isCorrect: true },
                { text: "x", isCorrect: false },
              ],
              points: 2,
            },
            {
              type: "short-answer",
              question: "Name the Python keyword used to handle exceptions.",
              acceptableAnswers: ["try", "try except", "except"],
              caseSensitive: false,
              points: 2,
            },
          ],
        },
      },
      {
        title: "Advanced Python Mastery",
        description: "Expert level Python concepts like generators, decorators, and OOP.",
        lessons: [
          {
            title: "Decorators and Generators",
            description: "Master advanced functional concepts.",
            content: "<h2>Advanced Python</h2><p>Write your own decorators and handle infinite sequences using yield and generators.</p>",
          },
          {
            title: "Object-Oriented Architecture",
            description: "Build robust systems with classes and inheritance.",
            content: "<h2>OOP in Python</h2><p>Implement Dunder methods, inheritance, and encapsulation for scalable codebases.</p>",
          }
        ],
        quiz: {
          title: "Python Expert Quiz",
          description: "Test your Python mastery.",
          passingScore: 80,
          questions: [
            {
              type: "multiple-choice",
              question: "Which keyword is used to create a generator in Python?",
              options: [
                { text: "return", isCorrect: false },
                { text: "generate", isCorrect: false },
                { text: "yield", isCorrect: true },
                { text: "export", isCorrect: false },
              ],
              points: 2,
            },
          ],
        },
      },
    ],
  },
  {
    language: "cpp",
    title: "C++ Development Path: Performance and Problem Solving",
    shortDescription: "Learn modern C++ fundamentals and write efficient programs.",
    description:
      "Build a strong C++ foundation with syntax, STL containers, memory basics, and algorithmic thinking.",
    thumbnail:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800",
    tags: ["cpp", "stl", "algorithms", "performance"],
    sections: [
      {
        title: "C++ Basics",
        description: "Types, input/output, control flow and functions.",
        lessons: [
          {
            title: "Syntax and Data Types",
            description: "Understand core C++ syntax and primitive data types.",
            content:
              "<h2>C++ Basics</h2><p>Write your first C++ program and use iostream for input/output.</p>",
          },
          {
            title: "Functions and Parameters",
            description: "Create reusable code with function declarations.",
            content:
              "<h2>Functions</h2><p>Pass values to functions and return computed results.</p>",
          },
        ],
        quiz: {
          title: "C++ Basics Quiz",
          description: "Validate C++ fundamentals.",
          passingScore: 70,
          questions: [
            {
              type: "multiple-choice",
              question: "Which header provides std::cout?",
              options: [
                { text: "<stdio.h>", isCorrect: false },
                { text: "<iostream>", isCorrect: true },
                { text: "<string>", isCorrect: false },
                { text: "<vector>", isCorrect: false },
              ],
              points: 2,
            },
            {
              type: "true-false",
              question: "C++ is a statically typed language.",
              options: [
                { text: "true", isCorrect: true },
                { text: "false", isCorrect: false },
              ],
              points: 2,
            },
          ],
        },
      },
      {
        title: "STL and Problem Solving",
        description: "Use vectors, maps, and algorithm patterns.",
        lessons: [
          {
            title: "Vectors and Iteration",
            description: "Store and process dynamic collections.",
            content:
              "<h2>STL Vector</h2><p>Use std::vector for dynamic arrays and iteration.</p>",
          },
          {
            title: "Maps and Common Patterns",
            description: "Count frequency and solve typical coding tasks.",
            content:
              "<h2>STL Map</h2><p>Use std::map / std::unordered_map for frequency counting and lookup.</p>",
          },
        ],
        quiz: {
          title: "C++ STL Quiz",
          description: "Check STL and algorithm readiness.",
          passingScore: 70,
          questions: [
            {
              type: "multiple-choice",
              question: "Which container provides key-value storage?",
              options: [
                { text: "vector", isCorrect: false },
                { text: "map", isCorrect: true },
                { text: "stack", isCorrect: false },
                { text: "queue", isCorrect: false },
              ],
              points: 2,
            },
            {
              type: "short-answer",
              question: "Name the C++ keyword for dynamic memory allocation.",
              acceptableAnswers: ["new"],
              caseSensitive: false,
              points: 2,
            },
          ],
        },
      },
      {
        title: "Modern C++ and Expert Techniques",
        description: "Master smart pointers, move semantics, and templates.",
        lessons: [
          {
            title: "Smart Pointers & Memory Safety",
            description: "Eliminate memory leaks entirely.",
            content: "<h2>Memory Management</h2><p>Understand unique_ptr, shared_ptr, and RAII principles for memory-safe C++ code.</p>",
          },
          {
            title: "Templates & Metaprogramming",
            description: "Write generic, highly reusable code.",
            content: "<h2>Templates</h2><p>Learn to use C++ templates to create type-safe generic functions and classes.</p>",
          }
        ],
        quiz: {
          title: "C++ Expert Quiz",
          description: "Validate advanced C++ knowledge.",
          passingScore: 80,
          questions: [
            {
              type: "multiple-choice",
              question: "Which smart pointer implies exclusive ownership of an object?",
              options: [
                { text: "std::shared_ptr", isCorrect: false },
                { text: "std::unique_ptr", isCorrect: true },
                { text: "std::weak_ptr", isCorrect: false },
                { text: "std::auto_ptr", isCorrect: false },
              ],
              points: 2,
            },
          ],
        },
      },
    ],
  },
];

const cleanupLanguageCourses = async (language) => {
  const existingCourses = await Course.find({ language }).select("_id");
  const courseIds = existingCourses.map((c) => c._id);
  if (!courseIds.length) return;

  const sectionDocs = await CourseSection.find({ course: { $in: courseIds } }).select("_id");
  const sectionIds = sectionDocs.map((s) => s._id);

  await CourseEnrollment.deleteMany({ course: { $in: courseIds } });
  await Certificate.deleteMany({ course: { $in: courseIds } });
  await CourseLesson.deleteMany({ section: { $in: sectionIds } });
  await Quiz.deleteMany({ $or: [{ course: { $in: courseIds } }, { section: { $in: sectionIds } }] });
  await CourseSection.deleteMany({ course: { $in: courseIds } });
  await Course.deleteMany({ _id: { $in: courseIds } });
};

const createCourseFromBlueprint = async (admin, blueprint) => {
  const course = await Course.create({
    title: blueprint.title,
    description: blueprint.description,
    shortDescription: blueprint.shortDescription,
    language: blueprint.language,
    category: "programming-language",
    difficulty: "beginner",
    instructor: admin._id,
    estimatedHours: 24,
    certificateTemplate: "excellence",
    tags: blueprint.tags,
    isPublished: true,
    thumbnail: blueprint.thumbnail,
  });

  const sectionIds = [];
  let lessonCount = 0;

  for (let sIndex = 0; sIndex < blueprint.sections.length; sIndex++) {
    const sectionData = blueprint.sections[sIndex];
    const section = await CourseSection.create({
      course: course._id,
      title: sectionData.title,
      description: sectionData.description,
      order: sIndex + 1,
      estimatedHours: 10,
    });

    const lessonIds = [];
    for (let lIndex = 0; lIndex < sectionData.lessons.length; lIndex++) {
      const lessonData = sectionData.lessons[lIndex];
      const lesson = await CourseLesson.create({
        section: section._id,
        title: lessonData.title,
        description: lessonData.description,
        content: lessonData.content,
        order: lIndex + 1,
        duration: 30,
        difficulty: "beginner",
        estimatedHours: 1,
        codeExamples: lessonData.codeExamples || [],
        tips: ["Practice this lesson in the code editor after reading."],
      });

      lessonIds.push(lesson._id);
      lessonCount += 1;
    }

    const sectionQuiz = await Quiz.create({
      title: sectionData.quiz.title,
      description: sectionData.quiz.description,
      type: "section-quiz",
      course: course._id,
      section: section._id,
      language: blueprint.language,
      difficulty: "beginner",
      questions: sectionData.quiz.questions,
      passingScore: sectionData.quiz.passingScore,
      isPublished: true,
      maxRetakes: 5,
    });

    section.lessons = lessonIds;
    section.sectionQuiz = sectionQuiz._id;
    await section.save();
    sectionIds.push(section._id);
  }

  const finalQuiz = await Quiz.create({
    title: `${blueprint.language.toUpperCase()} Final Certification Quiz`,
    description: `Final assessment for ${blueprint.title}`,
    type: "final-quiz",
    course: course._id,
    language: blueprint.language,
    difficulty: "intermediate",
    questions: [
      {
        type: "multiple-choice",
        question: `What is the primary goal of writing clean ${blueprint.language} code?`,
        options: [
          { text: "Only to make code shorter", isCorrect: false },
          { text: "To improve readability, maintainability, and reliability", isCorrect: true },
          { text: "To avoid all comments", isCorrect: false },
          { text: "Only to pass tests", isCorrect: false },
        ],
        points: 3,
      },
      {
        type: "short-answer",
        question: "Name one best practice you learned in this course.",
        acceptableAnswers: ["modular code", "error handling", "testing", "readable naming", "documentation"],
        caseSensitive: false,
        points: 2,
      },
    ],
    passingScore: 70,
    isPublished: true,
    maxRetakes: 5,
  });

  course.sections = sectionIds;
  course.finalQuiz = finalQuiz._id;
  course.totalSections = sectionIds.length;
  course.totalLessons = lessonCount;
  await course.save();

  return course;
};

const seedAllLanguageCourses = async () => {
  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    throw new Error("Admin user not found. Please create an admin user before seeding courses.");
  }

  for (const blueprint of COURSE_BLUEPRINTS) {
    await cleanupLanguageCourses(blueprint.language);
    const course = await createCourseFromBlueprint(admin, blueprint);
    console.log(`✅ Seeded ${blueprint.language.toUpperCase()} course: ${course.title}`);
  }

  console.log("🎉 Seeded complete course data for JavaScript, Python, and C++.");
};

export default seedAllLanguageCourses;
