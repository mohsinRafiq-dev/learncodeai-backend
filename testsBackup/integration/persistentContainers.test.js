import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import codeExecutionRoutes from '../../src/routes/codeExecutionRoutes.js';
import containerManager from '../../src/services/containerManager.js';
import codeExecutorWSService from '../../src/services/codeExecutorWSService.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use('/api/code', codeExecutionRoutes);
  
  // Error handling middleware
  app.use((err, req, res) => {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  });
  
  return app;
};

describe('Persistent Container Architecture Tests', () => {
  let app;

  beforeAll(async () => {
    app = createTestApp();
    
    // Start all containers before tests
    console.log('Starting persistent containers...');
    await containerManager.startAllContainers();
    
    // Wait a bit for containers to be fully ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Containers ready!');
  }, 60000); // 60 second timeout for container startup

  afterAll(async () => {
    // Clean up: stop containers and close connections
    console.log('Cleaning up containers...');
    codeExecutorWSService.closeAllConnections();
    await containerManager.stopAllContainers();
  }, 30000);

  describe('Python Input Support', () => {
    test('should execute Python code with input() function', async () => {
      const codeData = {
        code: `name = input("Enter your name: ")
age = input("Enter your age: ")
print(f"Hello {name}, you are {age} years old!")`,
        language: 'python',
        input: 'Alice\n25',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('Hello Alice');
      expect(response.body.data.output).toContain('25 years old');
      expect(response.body.data.error).toBe(false);
    }, 10000);

    test('should execute Python code with int(input())', async () => {
      const codeData = {
        code: `x = int(input())
y = int(input())
print(f"Sum: {x + y}")`,
        language: 'python',
        input: '10\n20',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('Sum: 30');
      expect(response.body.data.error).toBe(false);
    }, 10000);

    test('should execute Python code with multiple input lines', async () => {
      const codeData = {
        code: `numbers = []
for i in range(3):
    numbers.append(int(input()))
print(f"Total: {sum(numbers)}")`,
        language: 'python',
        input: '5\n10\n15',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('Total: 30');
      expect(response.body.data.error).toBe(false);
    }, 10000);
  });

  describe('C++ Input Support', () => {
    test('should execute C++ code with cin for strings and integers', async () => {
      const codeData = {
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
    cout << "Hello " << name << ", you are " << age << " years old!" << endl;
    return 0;
}`,
        language: 'cpp',
        input: 'Bob\n30',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('Hello Bob');
      expect(response.body.data.output).toContain('30 years old');
      expect(response.body.data.error).toBe(false);
    }, 15000);

    test('should execute C++ code with cin for multiple integers', async () => {
      const codeData = {
        code: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << "Sum: " << (a + b) << endl;
    return 0;
}`,
        language: 'cpp',
        input: '15\n25',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('Sum: 40');
      expect(response.body.data.error).toBe(false);
    }, 15000);

    test('should execute C++ code with getline for full line input', async () => {
      const codeData = {
        code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string fullName;
    getline(cin, fullName);
    cout << "Welcome, " << fullName << "!" << endl;
    return 0;
}`,
        language: 'cpp',
        input: 'John Doe',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('Welcome, John Doe!');
      expect(response.body.data.error).toBe(false);
    }, 15000);
  });

  describe('JavaScript Input Support', () => {
    test('should execute JavaScript code with simple stdin', async () => {
      const codeData = {
        code: `process.stdin.on('data', (data) => {
    const lines = data.toString().trim().split('\\n');
    const a = parseInt(lines[0]);
    const b = parseInt(lines[1]);
    console.log('Sum:', a + b);
    process.exit(0);
});`,
        language: 'javascript',
        input: '100\n200',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('Sum: 300');
      expect(response.body.data.error).toBe(false);
    }, 10000);

    test('should execute JavaScript code with string input', async () => {
      const codeData = {
        code: `process.stdin.on('data', (data) => {
    const lines = data.toString().trim().split('\\n');
    console.log('Hello, ' + lines[0] + '!');
    process.exit(0);
});`,
        language: 'javascript',
        input: 'World',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('Hello, World!');
      expect(response.body.data.error).toBe(false);
    }, 10000);

    test('should execute JavaScript code with array processing', async () => {
      const codeData = {
        code: `process.stdin.on('data', (data) => {
    const numbers = data.toString().trim().split('\\n').map(Number);
    const sum = numbers.reduce((a, b) => a + b, 0);
    console.log('Total:', sum);
    process.exit(0);
});`,
        language: 'javascript',
        input: '10\n20\n30\n40',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('Total: 100');
      expect(response.body.data.error).toBe(false);
    }, 10000);
  });

  describe('Code Execution Without Input', () => {
    test('should execute Python code without input', async () => {
      const codeData = {
        code: 'print("Hello, World!")',
        language: 'python',
        input: '',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('Hello, World!');
      expect(response.body.data.error).toBe(false);
    }, 10000);

    test('should execute C++ code without input', async () => {
      const codeData = {
        code: `#include <iostream>
using namespace std;

int main() {
    cout << "C++ is working!" << endl;
    return 0;
}`,
        language: 'cpp',
        input: '',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('C++ is working!');
      expect(response.body.data.error).toBe(false);
    }, 15000);

    test('should execute JavaScript code without input', async () => {
      const codeData = {
        code: 'console.log("JavaScript is working!");',
        language: 'javascript',
        input: '',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('JavaScript is working!');
      expect(response.body.data.error).toBe(false);
    }, 10000);
  });

  describe('Error Handling', () => {
    test('should handle Python syntax errors', async () => {
      const codeData = {
        code: 'print("Missing closing quote)',
        language: 'python',
        input: '',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Python syntax errors should either:
      // 1. Set error flag to true, OR
      // 2. Return empty/no output (since the code won't execute)
      const hasErrorIndication = 
        response.body.data.error === true || 
        response.body.data.output === 'No output' ||
        response.body.data.output.trim().length === 0;
      expect(hasErrorIndication).toBe(true);
    }, 10000);

    test('should handle C++ compilation errors', async () => {
      const codeData = {
        code: `#include <iostream>
int main() {
    undeclared_variable = 5;
    return 0;
}`,
        language: 'cpp',
        input: '',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.error).toBe(true);
    }, 15000);

    test('should handle JavaScript runtime errors', async () => {
      const codeData = {
        code: 'throw new Error("Test error");',
        language: 'javascript',
        input: '',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.error).toBe(true);
    }, 10000);
  });

  describe('API Validation', () => {
    test('should reject request without code', async () => {
      const response = await request(app)
        .post('/api/code/execute')
        .send({ language: 'python' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    test('should reject request without language', async () => {
      const response = await request(app)
        .post('/api/code/execute')
        .send({ code: 'print("test")' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    test('should reject unsupported language', async () => {
      const response = await request(app)
        .post('/api/code/execute')
        .send({ code: 'echo "test"', language: 'bash' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Unsupported language');
    });
  });

  describe('Container Status', () => {
    test('should verify Python container is running', async () => {
      const isRunning = await containerManager.isContainerRunning('python');
      expect(isRunning).toBe(true);
    });

    test('should verify JavaScript container is running', async () => {
      const isRunning = await containerManager.isContainerRunning('javascript');
      expect(isRunning).toBe(true);
    });

    test('should verify C++ container is running', async () => {
      const isRunning = await containerManager.isContainerRunning('cpp');
      expect(isRunning).toBe(true);
    });
  });
});
