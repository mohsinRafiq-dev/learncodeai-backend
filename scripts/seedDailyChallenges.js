import dotenv from "dotenv";
dotenv.config();

import connectDB from "../src/config/database.js";
import { DailyChallenge } from "../src/models/DailyChallenge.js";

const challenges = [
  // ─── Python ───────────────────────────────────────────────
  {
    offset: 0,
    title: "Sum of Two Numbers",
    description: "Read two integers from input (space-separated) and print their sum.",
    language: "python",
    difficulty: "beginner",
    starterCode: "a, b = map(int, input().split())\n# your code here",
    solution: "a, b = map(int, input().split())\nprint(a + b)",
    testCases: [
      { input: "3 5", expectedOutput: "8" },
      { input: "10 -4", expectedOutput: "6" },
      { input: "0 0", expectedOutput: "0" },
    ],
    points: 30,
    bonusPointsForStreak: 15,
  },
  {
    offset: 1,
    title: "Reverse a String",
    description: "Read a string and print it reversed.",
    language: "python",
    difficulty: "beginner",
    starterCode: "s = input()\n# your code here",
    solution: "s = input()\nprint(s[::-1])",
    testCases: [
      { input: "hello", expectedOutput: "olleh" },
      { input: "abcde", expectedOutput: "edcba" },
      { input: "racecar", expectedOutput: "racecar" },
    ],
    points: 30,
    bonusPointsForStreak: 15,
  },
  {
    offset: 2,
    title: "Count Vowels",
    description: "Read a string and print the number of vowels (a, e, i, o, u — case-insensitive).",
    language: "python",
    difficulty: "beginner",
    starterCode: "s = input()\n# your code here",
    solution: "s = input()\nprint(sum(1 for c in s.lower() if c in 'aeiou'))",
    testCases: [
      { input: "Hello World", expectedOutput: "3" },
      { input: "rhythm", expectedOutput: "0" },
      { input: "AEIOUaeiou", expectedOutput: "10" },
    ],
    points: 40,
    bonusPointsForStreak: 20,
  },
  {
    offset: 3,
    title: "FizzBuzz",
    description: "Given N, print numbers 1–N. Print Fizz for multiples of 3, Buzz for 5, FizzBuzz for both.",
    language: "python",
    difficulty: "beginner",
    starterCode: "n = int(input())\n# your code here",
    solution: "n = int(input())\nfor i in range(1, n+1):\n    if i%15==0: print('FizzBuzz')\n    elif i%3==0: print('Fizz')\n    elif i%5==0: print('Buzz')\n    else: print(i)",
    testCases: [
      { input: "5", expectedOutput: "1\n2\nFizz\n4\nBuzz" },
      { input: "15", expectedOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz" },
    ],
    points: 40,
    bonusPointsForStreak: 20,
  },
  {
    offset: 4,
    title: "Fibonacci Sequence",
    description: "Given N, print the first N Fibonacci numbers separated by spaces.",
    language: "python",
    difficulty: "intermediate",
    starterCode: "n = int(input())\n# your code here",
    solution: "n = int(input())\na, b = 0, 1\nresult = []\nfor _ in range(n):\n    result.append(str(a))\n    a, b = b, a+b\nprint(' '.join(result))",
    testCases: [
      { input: "5", expectedOutput: "0 1 1 2 3" },
      { input: "8", expectedOutput: "0 1 1 2 3 5 8 13" },
      { input: "1", expectedOutput: "0" },
    ],
    points: 50,
    bonusPointsForStreak: 25,
  },
  {
    offset: 5,
    title: "Palindrome Check",
    description: "Read a string. Print True if it is a palindrome, False otherwise (case-insensitive, ignore spaces).",
    language: "python",
    difficulty: "beginner",
    starterCode: "s = input()\n# your code here",
    solution: "s = input()\ncleaned = s.lower().replace(' ', '')\nprint(cleaned == cleaned[::-1])",
    testCases: [
      { input: "racecar", expectedOutput: "True" },
      { input: "hello", expectedOutput: "False" },
      { input: "A man a plan a canal Panama", expectedOutput: "True" },
    ],
    points: 40,
    bonusPointsForStreak: 20,
  },
  {
    offset: 6,
    title: "Factorial",
    description: "Given N, print N! (factorial). N will be between 0 and 12.",
    language: "python",
    difficulty: "beginner",
    starterCode: "n = int(input())\n# your code here",
    solution: "import math\nn = int(input())\nprint(math.factorial(n))",
    testCases: [
      { input: "5", expectedOutput: "120" },
      { input: "0", expectedOutput: "1" },
      { input: "10", expectedOutput: "3628800" },
    ],
    points: 35,
    bonusPointsForStreak: 15,
  },
  {
    offset: 7,
    title: "Second Largest Element",
    description: "Given N integers on one line (space-separated), print the second largest unique value.",
    language: "python",
    difficulty: "intermediate",
    starterCode: "nums = list(map(int, input().split()))\n# your code here",
    solution: "nums = list(map(int, input().split()))\nprint(sorted(set(nums))[-2])",
    testCases: [
      { input: "3 1 4 1 5 9 2 6", expectedOutput: "6" },
      { input: "10 5 20", expectedOutput: "10" },
      { input: "7 7 5 3", expectedOutput: "5" },
    ],
    points: 50,
    bonusPointsForStreak: 25,
  },
  {
    offset: 8,
    title: "Word Frequency",
    description: "Read a sentence. Print each unique word and its count, sorted alphabetically, one per line as 'word: count'.",
    language: "python",
    difficulty: "intermediate",
    starterCode: "sentence = input()\n# your code here",
    solution: "from collections import Counter\nsentence = input()\nwords = sentence.lower().split()\nfor word, cnt in sorted(Counter(words).items()):\n    print(f'{word}: {cnt}')",
    testCases: [
      { input: "the cat sat on the mat", expectedOutput: "cat: 1\nmat: 1\non: 1\nsat: 1\nthe: 2" },
      { input: "hello hello world", expectedOutput: "hello: 2\nworld: 1" },
    ],
    points: 55,
    bonusPointsForStreak: 25,
  },
  {
    offset: 9,
    title: "Prime Check",
    description: "Given N, print 'Prime' if N is prime, else 'Not Prime'.",
    language: "python",
    difficulty: "beginner",
    starterCode: "n = int(input())\n# your code here",
    solution: "n = int(input())\nif n < 2:\n    print('Not Prime')\nelse:\n    print('Not Prime' if any(n%i==0 for i in range(2, int(n**0.5)+1)) else 'Prime')",
    testCases: [
      { input: "7", expectedOutput: "Prime" },
      { input: "9", expectedOutput: "Not Prime" },
      { input: "2", expectedOutput: "Prime" },
    ],
    points: 40,
    bonusPointsForStreak: 20,
  },
  // ─── JavaScript ──────────────────────────────────────────
  {
    offset: 10,
    title: "Sum of Array",
    description: "Read space-separated integers and print their sum.",
    language: "javascript",
    difficulty: "beginner",
    starterCode: "const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(' ').map(Number);\n// your code here",
    solution: "const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(' ').map(Number);\nconsole.log(nums.reduce((a,b)=>a+b,0));",
    testCases: [
      { input: "1 2 3 4 5", expectedOutput: "15" },
      { input: "10 -3 7", expectedOutput: "14" },
      { input: "0", expectedOutput: "0" },
    ],
    points: 35,
    bonusPointsForStreak: 15,
  },
  {
    offset: 11,
    title: "Capitalize Words",
    description: "Read a sentence and print it with every word capitalized.",
    language: "javascript",
    difficulty: "beginner",
    starterCode: "const line = require('fs').readFileSync('/dev/stdin','utf8').trim();\n// your code here",
    solution: "const line = require('fs').readFileSync('/dev/stdin','utf8').trim();\nconsole.log(line.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '));",
    testCases: [
      { input: "hello world", expectedOutput: "Hello World" },
      { input: "the quick brown fox", expectedOutput: "The Quick Brown Fox" },
    ],
    points: 35,
    bonusPointsForStreak: 15,
  },
  {
    offset: 12,
    title: "Remove Duplicates",
    description: "Read space-separated integers. Print them in the same order with duplicates removed.",
    language: "javascript",
    difficulty: "beginner",
    starterCode: "const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(' ');\n// your code here",
    solution: "const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(' ');\nconsole.log([...new Set(nums)].join(' '));",
    testCases: [
      { input: "1 2 2 3 4 4 5", expectedOutput: "1 2 3 4 5" },
      { input: "7 7 7", expectedOutput: "7" },
      { input: "1 2 3", expectedOutput: "1 2 3" },
    ],
    points: 40,
    bonusPointsForStreak: 20,
  },
  {
    offset: 13,
    title: "Anagram Check",
    description: "Read two words on separate lines. Print 'Anagram' if they are anagrams, else 'Not Anagram'.",
    language: "javascript",
    difficulty: "intermediate",
    starterCode: "const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst a = lines[0], b = lines[1];\n// your code here",
    solution: "const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst sort = s => s.toLowerCase().split('').sort().join('');\nconsole.log(sort(lines[0]) === sort(lines[1]) ? 'Anagram' : 'Not Anagram');",
    testCases: [
      { input: "listen\nsilent", expectedOutput: "Anagram" },
      { input: "hello\nworld", expectedOutput: "Not Anagram" },
      { input: "Astronomer\nMoon starer", expectedOutput: "Not Anagram" },
    ],
    points: 50,
    bonusPointsForStreak: 25,
  },
  {
    offset: 14,
    title: "Flatten Nested Array",
    description: "Given a JSON array (possibly nested), print all numbers in order, one per line.",
    language: "javascript",
    difficulty: "intermediate",
    starterCode: "const arr = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim());\n// your code here",
    solution: "const arr = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim());\nconst flat = (a) => a.reduce((acc,v)=>Array.isArray(v)?acc.concat(flat(v)):[...acc,v],[]);\nconsole.log(flat(arr).join('\\n'));",
    testCases: [
      { input: "[1,[2,[3,4]],5]", expectedOutput: "1\n2\n3\n4\n5" },
      { input: "[[1,2],[3,[4,5]]]", expectedOutput: "1\n2\n3\n4\n5" },
    ],
    points: 60,
    bonusPointsForStreak: 30,
  },
  {
    offset: 15,
    title: "Count Occurrences",
    description: "Read a string on the first line, then a character on the second. Print how many times the character appears (case-insensitive).",
    language: "javascript",
    difficulty: "beginner",
    starterCode: "const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\n// your code here",
    solution: "const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst [str, ch] = lines;\nconsole.log(str.toLowerCase().split('').filter(c=>c===ch.toLowerCase()).length);",
    testCases: [
      { input: "Hello World\nl", expectedOutput: "3" },
      { input: "Mississippi\ns", expectedOutput: "4" },
    ],
    points: 35,
    bonusPointsForStreak: 15,
  },
  // ─── C++ ─────────────────────────────────────────────────
  {
    offset: 16,
    title: "Max of Three",
    description: "Read three integers. Print the largest.",
    language: "cpp",
    difficulty: "beginner",
    starterCode: "#include<iostream>\nusing namespace std;\nint main(){\n    int a,b,c;\n    cin>>a>>b>>c;\n    // your code here\n}",
    solution: "#include<iostream>\nusing namespace std;\nint main(){\n    int a,b,c;\n    cin>>a>>b>>c;\n    cout<<max({a,b,c})<<endl;\n}",
    testCases: [
      { input: "3 7 2", expectedOutput: "7" },
      { input: "-1 -5 -2", expectedOutput: "-1" },
      { input: "5 5 5", expectedOutput: "5" },
    ],
    points: 35,
    bonusPointsForStreak: 15,
  },
  {
    offset: 17,
    title: "Sum of Digits",
    description: "Given an integer N, print the sum of its digits.",
    language: "cpp",
    difficulty: "beginner",
    starterCode: "#include<iostream>\n#include<string>\nusing namespace std;\nint main(){\n    string n; cin>>n;\n    // your code here\n}",
    solution: "#include<iostream>\n#include<string>\nusing namespace std;\nint main(){\n    string n; cin>>n;\n    int s=0;\n    for(char c:n) s+=c-'0';\n    cout<<s<<endl;\n}",
    testCases: [
      { input: "1234", expectedOutput: "10" },
      { input: "9999", expectedOutput: "36" },
      { input: "0", expectedOutput: "0" },
    ],
    points: 40,
    bonusPointsForStreak: 20,
  },
  {
    offset: 18,
    title: "Binary to Decimal",
    description: "Given a binary string, print its decimal equivalent.",
    language: "cpp",
    difficulty: "intermediate",
    starterCode: "#include<iostream>\n#include<string>\nusing namespace std;\nint main(){\n    string b; cin>>b;\n    // your code here\n}",
    solution: "#include<iostream>\n#include<string>\nusing namespace std;\nint main(){\n    string b; cin>>b;\n    long long d=0, p=1;\n    for(int i=b.size()-1;i>=0;i--){\n        if(b[i]=='1') d+=p;\n        p*=2;\n    }\n    cout<<d<<endl;\n}",
    testCases: [
      { input: "1010", expectedOutput: "10" },
      { input: "11111111", expectedOutput: "255" },
      { input: "0", expectedOutput: "0" },
    ],
    points: 50,
    bonusPointsForStreak: 25,
  },
  {
    offset: 19,
    title: "Count Even and Odd",
    description: "Given N numbers, print 'even: X odd: Y' where X and Y are counts.",
    language: "cpp",
    difficulty: "beginner",
    starterCode: "#include<iostream>\nusing namespace std;\nint main(){\n    int n; cin>>n;\n    // your code here\n}",
    solution: "#include<iostream>\nusing namespace std;\nint main(){\n    int n,e=0,o=0,x;\n    cin>>n;\n    for(int i=0;i<n;i++){cin>>x;if(x%2==0)e++;else o++;}\n    cout<<\"even: \"<<e<<\" odd: \"<<o<<endl;\n}",
    testCases: [
      { input: "5\n1 2 3 4 5", expectedOutput: "even: 2 odd: 3" },
      { input: "4\n2 4 6 8", expectedOutput: "even: 4 odd: 0" },
    ],
    points: 40,
    bonusPointsForStreak: 20,
  },
  // ─── Python (intermediate / advanced) ────────────────────
  {
    offset: 20,
    title: "Two Sum",
    description: "Given a list of integers and a target T (last number), print the indices of two numbers that add up to T (0-indexed, space-separated, lower index first).",
    language: "python",
    difficulty: "intermediate",
    starterCode: "data = list(map(int, input().split()))\ntarget = data[-1]\nnums = data[:-1]\n# your code here",
    solution: "data = list(map(int, input().split()))\ntarget = data[-1]\nnums = data[:-1]\nseen = {}\nfor i,v in enumerate(nums):\n    if target-v in seen:\n        print(seen[target-v], i)\n        break\n    seen[v] = i",
    testCases: [
      { input: "2 7 11 15 9", expectedOutput: "0 1" },
      { input: "3 2 4 6", expectedOutput: "1 2" },
    ],
    points: 60,
    bonusPointsForStreak: 30,
  },
  {
    offset: 21,
    title: "Longest Common Prefix",
    description: "Read N strings (one per line, first line is N). Print their longest common prefix, or 'none' if there isn't one.",
    language: "python",
    difficulty: "intermediate",
    starterCode: "n = int(input())\nwords = [input() for _ in range(n)]\n# your code here",
    solution: "n = int(input())\nwords = [input() for _ in range(n)]\nif not words:\n    print('none')\nelse:\n    prefix = words[0]\n    for w in words[1:]:\n        while not w.startswith(prefix):\n            prefix = prefix[:-1]\n        if not prefix:\n            break\n    print(prefix if prefix else 'none')",
    testCases: [
      { input: "3\nflower\nflow\nflight", expectedOutput: "fl" },
      { input: "3\ndog\nracecar\ncar", expectedOutput: "none" },
      { input: "2\ninterested\ninterval", expectedOutput: "inter" },
    ],
    points: 60,
    bonusPointsForStreak: 30,
  },
  {
    offset: 22,
    title: "Stack: Valid Parentheses",
    description: "Given a string of brackets, print 'Valid' if they are balanced, else 'Invalid'.",
    language: "python",
    difficulty: "intermediate",
    starterCode: "s = input()\n# your code here",
    solution: "s = input()\nstack = []\nmatching = {')':'(',']':'[','}':'{'}\nfor c in s:\n    if c in '([{':\n        stack.append(c)\n    elif c in ')]}':\n        if not stack or stack[-1] != matching[c]:\n            print('Invalid')\n            exit()\n        stack.pop()\nprint('Valid' if not stack else 'Invalid')",
    testCases: [
      { input: "()[]{}", expectedOutput: "Valid" },
      { input: "(]", expectedOutput: "Invalid" },
      { input: "{[]}", expectedOutput: "Valid" },
    ],
    points: 60,
    bonusPointsForStreak: 30,
  },
  {
    offset: 23,
    title: "Caesar Cipher",
    description: "Read a string then a shift value N. Print the string encrypted with Caesar cipher (letters only, preserve case).",
    language: "python",
    difficulty: "intermediate",
    starterCode: "text = input()\nn = int(input())\n# your code here",
    solution: "text = input()\nn = int(input()) % 26\nresult = ''\nfor c in text:\n    if c.isalpha():\n        base = ord('A') if c.isupper() else ord('a')\n        result += chr((ord(c) - base + n) % 26 + base)\n    else:\n        result += c\nprint(result)",
    testCases: [
      { input: "Hello\n3", expectedOutput: "Khoor" },
      { input: "xyz\n3", expectedOutput: "abc" },
      { input: "Attack at dawn\n13", expectedOutput: "Nggnpx ng qnja" },
    ],
    points: 55,
    bonusPointsForStreak: 25,
  },
  {
    offset: 24,
    title: "Matrix Transpose",
    description: "Read R C, then an R×C matrix. Print its transpose.",
    language: "python",
    difficulty: "intermediate",
    starterCode: "r, c = map(int, input().split())\nmatrix = [list(map(int, input().split())) for _ in range(r)]\n# your code here",
    solution: "r, c = map(int, input().split())\nmatrix = [list(map(int, input().split())) for _ in range(r)]\nfor j in range(c):\n    print(' '.join(str(matrix[i][j]) for i in range(r)))",
    testCases: [
      { input: "2 3\n1 2 3\n4 5 6", expectedOutput: "1 4\n2 5\n3 6" },
      { input: "3 3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "1 4 7\n2 5 8\n3 6 9" },
    ],
    points: 65,
    bonusPointsForStreak: 30,
  },
  {
    offset: 25,
    title: "Merge Sort Count",
    description: "Read N integers. Print the number of inversions (pairs i<j where arr[i]>arr[j]).",
    language: "python",
    difficulty: "advanced",
    starterCode: "n = int(input())\narr = list(map(int, input().split()))\n# your code here",
    solution: "n = int(input())\narr = list(map(int, input().split()))\ndef merge_count(a):\n    if len(a)<=1: return a,0\n    mid=len(a)//2\n    L,lc=merge_count(a[:mid])\n    R,rc=merge_count(a[mid:])\n    merged,count=[],lc+rc\n    i=j=0\n    while i<len(L) and j<len(R):\n        if L[i]<=R[j]: merged.append(L[i]);i+=1\n        else: merged.append(R[j]);count+=len(L)-i;j+=1\n    merged+=L[i:]+R[j:]\n    return merged,count\n_,c=merge_count(arr)\nprint(c)",
    testCases: [
      { input: "5\n2 4 1 3 5", expectedOutput: "3" },
      { input: "3\n3 2 1", expectedOutput: "3" },
      { input: "4\n1 2 3 4", expectedOutput: "0" },
    ],
    points: 80,
    bonusPointsForStreak: 40,
  },
  {
    offset: 26,
    title: "Longest Increasing Subsequence",
    description: "Read N integers. Print the length of the longest strictly increasing subsequence.",
    language: "python",
    difficulty: "advanced",
    starterCode: "import bisect\nn = int(input())\narr = list(map(int, input().split()))\n# your code here",
    solution: "import bisect\nn = int(input())\narr = list(map(int, input().split()))\ntails=[]\nfor x in arr:\n    pos=bisect.bisect_left(tails,x)\n    if pos==len(tails): tails.append(x)\n    else: tails[pos]=x\nprint(len(tails))",
    testCases: [
      { input: "6\n10 9 2 5 3 7", expectedOutput: "3" },
      { input: "5\n3 10 2 1 20", expectedOutput: "3" },
      { input: "4\n1 2 3 4", expectedOutput: "4" },
    ],
    points: 80,
    bonusPointsForStreak: 40,
  },
  {
    offset: 27,
    title: "Binary Search",
    description: "Given a sorted list and a target (last number), print the 0-based index of the target, or -1 if not found.",
    language: "python",
    difficulty: "intermediate",
    starterCode: "data = list(map(int, input().split()))\ntarget = data[-1]\narr = data[:-1]\n# your code here",
    solution: "data = list(map(int, input().split()))\ntarget = data[-1]\narr = data[:-1]\nlo, hi = 0, len(arr)-1\nans = -1\nwhile lo <= hi:\n    mid = (lo+hi)//2\n    if arr[mid] == target: ans=mid; break\n    elif arr[mid] < target: lo=mid+1\n    else: hi=mid-1\nprint(ans)",
    testCases: [
      { input: "1 3 5 7 9 7", expectedOutput: "3" },
      { input: "1 2 3 4 5 6", expectedOutput: "-1" },
      { input: "10 20 30 10", expectedOutput: "0" },
    ],
    points: 50,
    bonusPointsForStreak: 25,
  },
  {
    offset: 28,
    title: "Bubble Sort",
    description: "Read N integers. Print them sorted in ascending order (space-separated).",
    language: "cpp",
    difficulty: "beginner",
    starterCode: "#include<iostream>\n#include<vector>\nusing namespace std;\nint main(){\n    int n; cin>>n;\n    vector<int> v(n);\n    for(auto &x:v) cin>>x;\n    // your code here (implement bubble sort)\n}",
    solution: "#include<iostream>\n#include<vector>\nusing namespace std;\nint main(){\n    int n; cin>>n;\n    vector<int> v(n);\n    for(auto &x:v) cin>>x;\n    for(int i=0;i<n-1;i++)\n        for(int j=0;j<n-i-1;j++)\n            if(v[j]>v[j+1]) swap(v[j],v[j+1]);\n    for(int i=0;i<n;i++) cout<<v[i]<<(i<n-1?' ':'\\n');\n}",
    testCases: [
      { input: "5\n64 34 25 12 22", expectedOutput: "12 22 25 34 64" },
      { input: "3\n3 1 2", expectedOutput: "1 2 3" },
    ],
    points: 45,
    bonusPointsForStreak: 20,
  },
  {
    offset: 29,
    title: "String Compression",
    description: "Read a string. Print its run-length encoded form (e.g. 'aaabbc' → 'a3b2c1'). If encoding is longer, print the original.",
    language: "javascript",
    difficulty: "intermediate",
    starterCode: "const s = require('fs').readFileSync('/dev/stdin','utf8').trim();\n// your code here",
    solution: "const s = require('fs').readFileSync('/dev/stdin','utf8').trim();\nlet res='', i=0;\nwhile(i<s.length){\n    let j=i;\n    while(j<s.length && s[j]===s[i]) j++;\n    res+=s[i]+(j-i);\n    i=j;\n}\nconsole.log(res.length<s.length?res:s);",
    testCases: [
      { input: "aaabbc", expectedOutput: "a3b2c1" },
      { input: "abcd", expectedOutput: "abcd" },
      { input: "aabbccdd", expectedOutput: "aabbccdd" },
    ],
    points: 55,
    bonusPointsForStreak: 25,
  },
];

const runSeed = async () => {
  await connectDB();
  console.log("📡 Connected to database");

  const today = new Date();
  let created = 0, skipped = 0;

  for (const ch of challenges) {
    const date = new Date(today);
    date.setDate(today.getDate() + ch.offset);
    const dateStr = date.toISOString().slice(0, 10);

    const { offset: _off, ...data } = ch;
    const existing = await DailyChallenge.findOne({ date: dateStr });
    if (existing) {
      skipped++;
      continue;
    }
    await DailyChallenge.create({ ...data, date: dateStr });
    created++;
  }

  console.log(`✅ Done — created: ${created}, skipped (already exist): ${skipped}`);
  process.exit(0);
};

runSeed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
