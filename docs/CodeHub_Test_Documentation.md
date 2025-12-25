# CodeHub Backend Test Documentation

## Unit Tests

### Unit Testing 1: User Model Validation

**Testing Objective:** To ensure the User model schema, validations, password hashing, and instance methods work correctly with valid and invalid inputs.

| Test Case                            | Attribute and Value                             | Objective                                   | Expected Result                         | Status |
| ------------------------------------ | ----------------------------------------------- | ------------------------------------------- | --------------------------------------- | ------ |
| should create a user with valid data | username: 'testuser', email: 'test@example.com' | Validate user creation with required fields | User created successfully               | Pass   |
| should hash password before saving   | password: 'password123'                         | Ensure password is hashed using bcrypt      | Password stored as hash, not plain text | Pass   |
| should validate required fields      | email: null                                     | Enforce schema requirements                 | Validation error for missing email      | Pass   |
| should validate email format         | email: 'invalid-email'                          | Check email regex validation                | Validation error for invalid format     | Pass   |
| should validate password length      | password: 'short' (5 chars)                     | Enforce minimum password length             | Validation error for short password     | Pass   |
| should validate username uniqueness  | username: 'duplicateuser'                       | Prevent duplicate usernames                 | Unique constraint error                 | Pass   |
| should validate role enum            | role: 'invalidrole'                             | Restrict role to allowed values             | Validation error for invalid role       | Pass   |
| should set default role to user      | role: undefined                                 | Apply default role on creation              | Role set to "user"                      | Pass   |
| should set timestamps on creation    | createdAt: auto-generated                       | Add creation timestamp                      | createdAt field populated               | Pass   |
| should update updatedAt on save      | updatedAt: auto-updated                         | Update modification timestamp               | updatedAt field updated                 | Pass   |
| should validate firstName length     | firstName: 'A' (1 char)                         | Enforce minimum firstName length            | Validation error for short name         | Pass   |
| should validate lastName length      | lastName: 'B' (1 char)                          | Enforce minimum lastName length             | Validation error for short name         | Pass   |
| should validate phone format         | phone: 'invalid-phone'                          | Check phone number format                   | Validation error for invalid phone      | Pass   |
| should validate dateOfBirth format   | dateOfBirth: 'invalid-date'                     | Check date format                           | Validation error for invalid date       | Pass   |
| should validate gender enum          | gender: 'invalidgender'                         | Restrict gender to allowed values           | Validation error for invalid gender     | Pass   |
| should validate address structure    | address.city: 'TestCity'                        | Validate nested address fields              | Address saved correctly                 | Pass   |
| should validate education array      | education.degree: 'Bachelor'                    | Validate education subdocuments             | Education array saved                   | Pass   |
| should validate experience array     | experience.company: 'TestCompany'               | Validate experience subdocuments            | Experience array saved                  | Pass   |
| should validate skills array         | skills: ['JavaScript']                          | Validate skills as array of strings         | Skills array saved                      | Pass   |
| should validate certifications array | certifications.title: 'CertTitle'               | Validate certifications subdocuments        | Certifications array saved              | Pass   |
| should validate socialLinks object   | socialLinks.github: 'https://github.com/user'   | Validate social links                       | Social links saved                      | Pass   |
| should validate preferences object   | preferences.theme: 'dark'                       | Validate user preferences                   | Preferences saved                       | Pass   |
| should validate lastLogin update     | lastLogin: new Date()                           | Update last login timestamp                 | lastLogin field updated                 | Pass   |
| should validate OTP generation       | otp: auto-generated                             | Generate OTP for verification               | OTP field populated                     | Pass   |
| should validate OTP expiry           | otpExpiry: future date                          | Set OTP expiration                          | otpExpiry set correctly                 | Pass   |
| should validate email verification   | isEmailVerified: false → true                   | Toggle email verification status            | Status updated                          | Pass   |
| should validate account status       | isActive: true                                  | Control account activation                  | Account active by default               | Pass   |

### Unit Testing 2: Tutorial Model Validation

**Testing Objective:** To ensure the Tutorial model schema and validations work correctly with valid and invalid inputs.

| Test Case                                | Attribute and Value    | Objective                             | Expected Result                          | Status |
| ---------------------------------------- | ---------------------- | ------------------------------------- | ---------------------------------------- | ------ |
| should create a tutorial with valid data | title: 'Test Tutorial' | Validate tutorial creation            | Tutorial created successfully            | Pass   |
| should validate required fields          | description: null      | Enforce schema requirements           | Validation error for missing description | Pass   |
| should validate difficulty enum          | difficulty: 'invalid'  | Restrict difficulty to allowed values | Validation error for invalid difficulty  | Pass   |
| should validate tags array               | tags: ['JavaScript']   | Validate tags as array                | Tags saved correctly                     | Pass   |

### Unit Testing 3: Course Model Validation

**Testing Objective:** To ensure the Course model schema and validations work correctly with valid and invalid inputs.

| Test Case                              | Attribute and Value         | Objective                        | Expected Result                          | Status |
| -------------------------------------- | --------------------------- | -------------------------------- | ---------------------------------------- | ------ |
| should create a course with valid data | title: 'Test Course'        | Validate course creation         | Course created successfully              | Pass   |
| should validate required fields        | description: null           | Enforce schema requirements      | Validation error for missing description | Pass   |
| should validate level enum             | level: 'invalid'            | Restrict level to allowed values | Validation error for invalid level       | Pass   |
| should validate sections array         | sections.title: 'Section 1' | Validate nested sections         | Sections saved correctly                 | Pass   |

### Unit Testing 4: Authentication Controller Functionality

**Testing Objective:** To ensure user authentication, registration, email verification, and authorization work correctly with valid and invalid credentials/inputs.

| Test Case                                       | Attribute and Value                                | Objective                  | Expected Result          | Status |
| ----------------------------------------------- | -------------------------------------------------- | -------------------------- | ------------------------ | ------ |
| should signup user successfully                 | email: 'test@example.com'                          | Register new user          | User created, email sent | Pass   |
| should handle signup with existing email        | email: 'existing@example.com'                      | Prevent duplicate email    | Error for existing email | Pass   |
| should handle signup with invalid data          | password: 'short'                                  | Validate input data        | Validation error         | Pass   |
| should signin user successfully                 | email: 'test@example.com', password: 'password123' | Authenticate user          | JWT token returned       | Pass   |
| should handle signin with wrong password        | password: 'wrongpass'                              | Reject invalid credentials | Authentication error     | Pass   |
| should handle signin with non-existent email    | email: 'nonexistent@example.com'                   | Handle unknown user        | User not found error     | Pass   |
| should verify email successfully                | token: valid JWT                                   | Confirm email              | User verified            | Pass   |
| should handle verify email with invalid token   | token: 'invalid'                                   | Reject bad token           | Verification error       | Pass   |
| should protect route with valid token           | Authorization header: 'Bearer validtoken'          | Allow access               | Route accessible         | Pass   |
| should reject protect route with invalid token  | Authorization header: 'Bearer invalid'             | Deny access                | Unauthorized error       | Pass   |
| should reject protect route without token       | Authorization header: null                         | Require authentication     | Unauthorized error       | Pass   |
| should send password reset OTP                  | email: 'test@example.com'                          | Initiate reset             | OTP sent                 | Pass   |
| should handle password reset with invalid email | email: 'invalid@example.com'                       | Handle unknown email       | Error response           | Pass   |
| should verify password reset OTP                | otp: '123456'                                      | Validate OTP               | OTP verified             | Fail   |
| should handle password reset with invalid OTP   | otp: 'invalid'                                     | Reject bad OTP             | Verification error       | Fail   |
| should reset password successfully              | newPassword: 'newpass123'                          | Update password            | Password changed         | Fail   |
| should handle password reset with expired OTP   | otpExpiry: past date                               | Check expiration           | Error for expired OTP    | Fail   |
| should logout user                              | token: valid JWT                                   | Invalidate session         | Logout successful        | Pass   |
| should refresh token                            | refreshToken: valid token                          | Issue new token            | New JWT returned         | Pass   |
| should handle refresh with invalid token        | refreshToken: 'invalid'                            | Reject bad refresh         | Error response           | Pass   |
| should get current user                         | user ID: valid ID                                  | Retrieve user data         | User object returned     | Pass   |
| should update user profile                      | firstName: 'Updated'                               | Modify profile             | Profile updated          | Pass   |
| should handle update with invalid data          | email: 'invalid'                                   | Validate updates           | Validation error         | Pass   |
| should delete user account                      | user ID: valid ID                                  | Remove account             | User deleted             | Pass   |
| should handle delete non-existent user          | user ID: invalid ID                                | Handle missing user        | Error response           | Pass   |
| should check admin role                         | role: 'admin'                                      | Verify admin access        | Access granted           | Pass   |
| should reject non-admin access                  | role: 'user'                                       | Deny non-admin             | Access denied            | Pass   |
| should handle OAuth signup                      | provider: 'google'                                 | Social login               | User created via OAuth   | Pass   |
| should handle OAuth signin                      | provider: 'google'                                 | Social auth                | Existing user logged in  | Pass   |
| should validate signup input                    | email: 'invalid-email'                             | Input validation           | Error for bad format     | Pass   |
| should validate signin input                    | password: 'short'                                  | Input validation           | Error for short password | Pass   |
| should handle rate limiting                     | request count: > limit                             | Prevent abuse              | Rate limit error         | Pass   |

### Unit Testing 5: Tutorial Controller Functionality

**Testing Objective:** To ensure tutorial retrieval, filtering, and user save/unsave operations work correctly with valid and invalid inputs.

| Test Case                                  | Attribute and Value          | Objective               | Expected Result         | Status |
| ------------------------------------------ | ---------------------------- | ----------------------- | ----------------------- | ------ |
| should get all tutorials                   | query params: {}             | Retrieve tutorials      | List of tutorials       | Pass   |
| should get tutorials with filters          | difficulty: 'beginner'       | Filter results          | Filtered list           | Pass   |
| should get tutorial by ID                  | id: valid ObjectId           | Fetch single tutorial   | Tutorial object         | Pass   |
| should handle get tutorial with invalid ID | id: 'invalid'                | Handle bad ID           | Error response          | Pass   |
| should save tutorial for user              | tutorialId: valid ID         | Add to saved list       | Tutorial saved          | Pass   |
| should handle save duplicate tutorial      | tutorialId: already saved    | Prevent duplicates      | Error for duplicate     | Pass   |
| should unsave tutorial for user            | tutorialId: valid ID         | Remove from saved       | Tutorial unsaved        | Pass   |
| should get saved tutorials                 | user ID: valid ID            | Retrieve saved list     | List of saved tutorials | Pass   |
| should handle get saved with no tutorials  | user ID: valid ID (no saves) | Handle empty list       | Empty array             | Pass   |
| should validate tutorial save input        | tutorialId: null             | Input validation        | Validation error        | Pass   |
| should handle unauthorized save            | auth token: null             | Require login           | Unauthorized error      | Pass   |
| should handle tutorial not found           | id: non-existent ID          | Handle missing tutorial | Not found error         | Pass   |
| should paginate tutorials                  | page: 1, limit: 10           | Paginate results        | Paginated list          | Pass   |

### Unit Testing 6: Course Controller Functionality

**Testing Objective:** To ensure course management, enrollment, and progress tracking work correctly with valid and invalid inputs.

| Test Case                                       | Attribute and Value        | Objective             | Expected Result     | Status |
| ----------------------------------------------- | -------------------------- | --------------------- | ------------------- | ------ |
| should get all courses                          | query params: {}           | Retrieve courses      | List of courses     | Pass   |
| should get courses with filters                 | level: 'intermediate'      | Filter results        | Filtered list       | Pass   |
| should get course by ID                         | id: valid ObjectId         | Fetch single course   | Course object       | Pass   |
| should handle get course with invalid ID        | id: 'invalid'              | Handle bad ID         | Error response      | Pass   |
| should enroll user in course                    | courseId: valid ID         | Add enrollment        | Enrollment created  | Pass   |
| should handle duplicate enrollment              | courseId: already enrolled | Prevent duplicates    | Error for duplicate | Pass   |
| should update course progress                   | progress: 50               | Update progress       | Progress saved      | Pass   |
| should handle update progress with invalid data | progress: 150              | Validate progress     | Validation error    | Pass   |
| should get user enrollments                     | user ID: valid ID          | Retrieve enrollments  | List of enrollments | Pass   |
| should get course progress                      | courseId: valid ID         | Fetch progress        | Progress object     | Pass   |
| should validate enrollment input                | courseId: null             | Input validation      | Validation error    | Pass   |
| should handle unauthorized enrollment           | auth token: null           | Require login         | Unauthorized error  | Pass   |
| should handle course not found                  | id: non-existent ID        | Handle missing course | Not found error     | Pass   |
| should paginate courses                         | page: 1, limit: 10         | Paginate results      | Paginated list      | Pass   |
| should get course statistics                    | courseId: valid ID         | Retrieve stats        | Stats object        | Pass   |

### Unit Testing 7: Profile Controller Functionality

**Testing Objective:** To ensure user profile management and progress tracking work correctly with valid and invalid inputs.

| Test Case                              | Attribute and Value  | Objective             | Expected Result     | Status |
| -------------------------------------- | -------------------- | --------------------- | ------------------- | ------ |
| should get user profile                | user ID: valid ID    | Retrieve profile      | Profile object      | Pass   |
| should update user profile             | firstName: 'Updated' | Modify profile        | Profile updated     | Pass   |
| should handle update with invalid data | email: 'invalid'     | Validate updates      | Validation error    | Pass   |
| should get course progress             | courseId: valid ID   | Fetch progress        | Progress data       | Pass   |
| should get dashboard stats             | user ID: valid ID    | Retrieve stats        | Stats object        | Pass   |
| should upload profile picture          | file: valid image    | Save picture          | Picture uploaded    | Pass   |
| should handle invalid file upload      | file: invalid type   | Validate file         | Upload error        | Pass   |
| should delete profile picture          | picture ID: valid ID | Remove picture        | Picture deleted     | Pass   |
| should get user achievements           | user ID: valid ID    | Retrieve achievements | Achievements list   | Pass   |
| should update user preferences         | theme: 'dark'        | Modify preferences    | Preferences updated | Pass   |
| should validate profile input          | firstName: ''        | Input validation      | Validation error    | Pass   |
| should handle unauthorized access      | auth token: null     | Require login         | Unauthorized error  | Pass   |
| should handle user not found           | user ID: invalid ID  | Handle missing user   | Not found error     | Pass   |

### Unit Testing 8: Contact Controller Functionality

**Testing Objective:** To ensure contact form submission and admin management work correctly with valid and invalid inputs.

| Test Case                                 | Attribute and Value                                         | Objective            | Expected Result    | Status |
| ----------------------------------------- | ----------------------------------------------------------- | -------------------- | ------------------ | ------ |
| should submit contact form                | name: 'Test', email: 'test@example.com', message: 'Message' | Save contact         | Contact created    | Pass   |
| should handle submit with invalid data    | email: 'invalid'                                            | Validate input       | Validation error   | Pass   |
| should get all contacts (admin)           | role: 'admin'                                               | Retrieve contacts    | List of contacts   | Pass   |
| should handle get contacts unauthorized   | role: 'user'                                                | Deny non-admin       | Unauthorized error | Pass   |
| should update contact status              | status: 'resolved'                                          | Modify status        | Status updated     | Pass   |
| should handle update with invalid status  | status: 'invalid'                                           | Validate status      | Validation error   | Pass   |
| should delete contact                     | contact ID: valid ID                                        | Remove contact       | Contact deleted    | Pass   |
| should handle delete non-existent contact | contact ID: invalid ID                                      | Handle missing       | Not found error    | Pass   |
| should send contact email                 | email: 'test@example.com'                                   | Send notification    | Email sent         | Pass   |
| should handle email send failure          | email service: down                                         | Handle error         | Error response     | Pass   |
| should validate contact input             | message: ''                                                 | Input validation     | Validation error   | Pass   |
| should paginate contacts                  | page: 1, limit: 10                                          | Paginate results     | Paginated list     | Pass   |
| should filter contacts by status          | status: 'pending'                                           | Filter results       | Filtered list      | Pass   |
| should get contact by ID                  | id: valid ID                                                | Fetch single contact | Contact object     | Pass   |
| should handle get contact with invalid ID | id: 'invalid'                                               | Handle bad ID        | Error response     | Pass   |

### Unit Testing 9: Admin Middleware Functionality

**Testing Objective:** To ensure admin access control middleware works correctly with valid and invalid roles.

| Test Case                    | Attribute and Value | Objective          | Expected Result    | Status |
| ---------------------------- | ------------------- | ------------------ | ------------------ | ------ |
| should allow admin access    | role: 'admin'       | Grant admin access | Access allowed     | Pass   |
| should deny non-admin access | role: 'user'        | Block non-admin    | Access denied      | Pass   |
| should handle missing user   | user: null          | Handle no user     | Unauthorized error | Pass   |

### Unit Testing 10: Code Executor Service Functionality

**Testing Objective:** To ensure code execution configuration and session management work correctly with valid and invalid inputs.

| Test Case                                 | Attribute and Value           | Objective        | Expected Result  | Status |
| ----------------------------------------- | ----------------------------- | ---------------- | ---------------- | ------ |
| should get language config for JavaScript | language: 'javascript'        | Retrieve config  | Config object    | Pass   |
| should get language config for Python     | language: 'python'            | Retrieve config  | Config object    | Pass   |
| should get language config for C++        | language: 'cpp'               | Retrieve config  | Config object    | Pass   |
| should handle invalid language            | language: 'invalid'           | Handle unknown   | Error response   | Pass   |
| should generate session ID                | sessionId: auto-generated     | Create unique ID | ID returned      | Pass   |
| should execute JavaScript code            | code: 'console.log(\'test\')' | Run code         | Execution result | Pass   |
| should handle execution error             | code: 'invalid syntax'        | Handle errors    | Error response   | Pass   |

### Unit Testing 11: Admin Controller Functionality

**Testing Objective:** To ensure admin dashboard and management functionality work correctly (placeholder for future tests).

| Test Case                          | Attribute and Value | Objective                    | Expected Result      | Status |
| ---------------------------------- | ------------------- | ---------------------------- | -------------------- | ------ |
| should have admin controller tests | N/A                 | Placeholder for future tests | Test framework ready | Pass   |

## Functional Tests

### Functional Testing 1: Admin Operations End-to-End Workflows

**Testing Objective:** To ensure admin functionalities like user management, analytics, and tutorial control work seamlessly across the full application stack with valid and invalid inputs.

| Test case No. | Test case/Test script                                | Attribute and value                                                 | Expected result                           | Actual result                                                                 | Result |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| 1             | should allow admin to suspend user                   | accountStatus: 'active' → 'suspended', reason: 'Violation of terms' | User blocked from login, then reactivated | User login blocked with 403 error, then reactivated successfully              | Pass   |
| 2             | should show analytics dashboard to admin             | role: 'admin', stats: totalUsers/totalTutorials/etc.                | Stats object with counts and analytics    | Returned stats object with totalUsers: number, totalTutorials: number, etc.   | Pass   |
| 3             | should allow admin to manage user roles              | role: 'user' → 'admin' → 'user'                                     | Role changes applied correctly            | Role updated to 'admin', then back to 'user' in database                      | Pass   |
| 4             | should prevent non-admin from accessing admin routes | role: 'user', endpoint: '/api/admin/stats'                          | Unauthorized error for non-admins         | 403 error with 'Admin access required' message                                | Pass   |
| 5             | should allow admin to manage tutorials               | tutorialId: valid ID, action: update/delete                         | Tutorial modified/deleted successfully    | Tutorial title updated to 'Updated Admin Test Tutorial', then deleted from DB | Pass   |
| 6             | should allow admin to search and view user details   | query: 'Regular', userId: valid ID                                  | User data returned accurately             | Search returned 1+ users, details showed email and name matching DB           | Pass   |
| 7             | should prevent admin from demoting themselves        | role: 'admin', action: self-demote                                  | Error prevents self-demotion              | 400 error with 'Cannot demote yourself' message                               | Pass   |

### Functional Testing 2: Authentication End-to-End Workflows

**Testing Objective:** To ensure the complete authentication flow, including registration, login, password reset, and session management, works correctly with valid and invalid credentials/inputs.

| Test case No. | Test case/Test script                                 | Attribute and value                                                           | Expected result                       | Actual result                                                                      | Result |
| ------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| 1             | should complete full user registration and login flow | email: 'functionaltest@example.com', password: 'password123'                  | User created, verified, and logged in | User created with isEmailVerified: true, login returned JWT token                  | Pass   |
| 2             | should handle password reset from start to finish     | email: 'passwordreset@example.com', otp: generated, newPassword: 'newpass123' | Password updated successfully         | OTP verified, password hashed and updated in DB, login with new password succeeded | Pass   |
| 3             | should maintain session across requests               | token: valid JWT, requests: 3                                                 | All requests succeed with same token  | All 3 /api/auth/me requests returned user data without errors                      | Pass   |
| 4             | should handle logout properly                         | token: valid JWT, action: logout                                              | Token invalidated (JWT stateless)     | Logout returned success, subsequent requests would fail if token expired           | Pass   |
| 5             | should handle concurrent login attempts               | email: 'concurrenttest@example.com', logins: 5                                | All logins succeed independently      | All 5 logins returned unique JWT tokens, each valid for /api/auth/me               | Pass   |

### Functional Testing 3: Code Execution End-to-End Workflows

**Testing Objective:** To ensure code execution across languages, error handling, and input processing works correctly with valid and invalid code/inputs.

| Test case No. | Test case/Test script                   | Attribute and value                                    | Expected result                | Actual result                                                                                        | Result |
| ------------- | --------------------------------------- | ------------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------- | ------ |
| 1             | should execute code successfully        | code: 'print("Hello, World!")', language: 'python'     | Output returned correctly      | Returned output: 'Hello, World!\n', executionTime: 150ms, status: 'success'                          | Pass   |
| 2             | should show error for invalid code      | code: 'print("Hello World"', language: 'python'        | Error message displayed        | Returned error: 'SyntaxError: invalid syntax\n', status: 'error'                                     | Pass   |
| 3             | should handle code execution with input | code: input-reading script, input: 'Alice\n25'         | Input processed in output      | Returned output: 'Hello, Alice!\nYour age is 25\n', status: 'success'                                | Pass   |
| 4             | should reject unsupported languages     | language: 'ruby', code: 'console.log("Hello")'         | Error for unsupported language | 400 error with 'Unsupported language' and list of supported languages                                | Pass   |
| 5             | should handle execution timeout         | code: infinite loop, timeout: 30s                      | Timeout error returned         | Returned error: 'Execution timeout: Code execution took longer than 30 seconds\n', status: 'timeout' | Pass   |
| 6             | should validate required parameters     | code: missing, language: missing                       | Validation error               | 400 error with 'Code and language are required' message                                              | Pass   |
| 7             | should execute different language codes | language: 'javascript'/'cpp', code: respective scripts | Correct output per language    | JS: 'Hello from JavaScript!\n', C++: 'Hello from C++!\n'                                             | Pass   |
| 8             | should handle service execution errors  | service: mocked error, code: 'print("test")'           | Internal error response        | 500 error with 'Code execution failed' and Docker error details                                      | Pass   |

### Functional Testing 4: Course Management End-to-End Workflows

**Testing Objective:** To ensure course enrollment, progress tracking, and browsing work correctly with valid and invalid course/inputs.

| Test case No. | Test case/Test script                          | Attribute and value                                  | Expected result                             | Actual result                                                                | Result |
| ------------- | ---------------------------------------------- | ---------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- | ------ |
| 1             | should enroll user in course from UI           | courseId: valid ID, user: enrolled                   | User enrolled, progress initialized         | Enrollment created in DB, user appeared in enrolled courses list             | Pass   |
| 2             | should update progress after lesson completion | lessonId: valid ID, sectionId: valid ID              | Lesson marked complete, progress calculated | Lesson isCompleted: true, sectionProgress updated with completedAt timestamp | Pass   |
| 3             | should prevent duplicate enrollment            | courseId: already enrolled                           | Duplicate error                             | 400 error with 'already enrolled' message                                    | Pass   |
| 4             | should handle course browsing and filtering    | language: 'python', category: 'programming-language' | Filtered results returned                   | Python courses returned, all with language: 'python'                         | Pass   |
| 5             | should track enrollment count accurately       | enrollments: 2 users                                 | Enrollment count incremented                | Course enrollmentCount increased from 0 to 2 in DB                           | Pass   |

### Functional Testing 5: Tutorial Management End-to-End Workflows

**Testing Objective:** To ensure tutorial browsing, saving, unsaving, and progress tracking work correctly with valid and invalid tutorial/inputs.

| Test case No. | Test case/Test script                         | Attribute and value                                | Expected result                  | Actual result                                                        | Result |
| ------------- | --------------------------------------------- | -------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------- | ------ |
| 1             | should display tutorials by selected language | language: 'python'/'javascript'                    | Tutorials grouped by language    | Python tutorials grouped under concepts, all with language: 'python' | Pass   |
| 2             | should allow user to save tutorial            | tutorialId: valid ID, action: save                 | Tutorial added to saved list     | UserSavedTutorial created in DB, appeared in saved list              | Pass   |
| 3             | should allow user to unsave tutorial          | tutorialId: valid ID, action: unsave               | Tutorial removed from saved list | UserSavedTutorial deleted, saved list became empty                   | Pass   |
| 4             | should handle multiple saved tutorials        | tutorialIds: 2 IDs, actions: save/unsave           | List updated correctly           | Saved list had 2 items, then 1 after unsaving one                    | Pass   |
| 5             | should filter tutorials by concept            | language: 'python', concept: 'Variables'           | Matching tutorials returned      | Tutorials returned with concept containing 'variables'               | Pass   |
| 6             | should handle tutorial progress tracking      | tutorialId: valid ID, isCompleted: true, rating: 5 | Progress saved with metadata     | Progress updated with isCompleted: true, rating: 5, completedAt set  | Pass   |

## Business Tests (Decision Table Based Testing)

Business tests use Decision Table Based Testing technique to systematically test business rules defined in Functional Requirements (FRs) and Use Cases. Each decision table contains conditions (inputs) and actions (outputs) in a compact tabular form to model complex logic.

### Business Testing 1: Admin Operations Business Rules

**Decision Table: Admin Role Access Control**

| Conditions           | Rule 1 (Admin User) | Rule 2 (Regular User) |
| -------------------- | ------------------- | --------------------- |
| User role is 'admin' | Y                   | N                     |
| **Actions**          |                     |                       |
| Grant admin access   | X                   |                       |
| Deny admin access    |                     | X                     |

**Decision Table: User Account Status Management**

| Conditions                     | Rule 1 (Active → Suspend) | Rule 2 (Suspended → Reactivate) |
| ------------------------------ | ------------------------- | ------------------------------- |
| Current account status         | active                    | suspended                       |
| Admin action requested         | suspend                   | reactivate                      |
| **Actions**                    |                           |                                 |
| Update status to suspended     | X                         |                                 |
| Update status to active        |                           | X                               |
| Send suspension notification   | X                         |                                 |
| Send reactivation notification |                           | X                               |

**Decision Table: Course Publication Management**

| Conditions               | Rule 1 (Publish Draft) | Rule 2 (Unpublish Course) |
| ------------------------ | ---------------------- | ------------------------- |
| Course status            | draft                  | published                 |
| Admin action             | publish                | unpublish                 |
| **Actions**              |                        |                           |
| Set isPublished to true  | X                      |                           |
| Set isPublished to false |                        | X                         |
| Update course visibility | X                      | X                         |

**Decision Table: User Statistics Calculation**

| Conditions               | Rule 1 (Active User) | Rule 2 (Suspended User) | Rule 3 (Unverified User) | Rule 4 (Admin User) |
| ------------------------ | -------------------- | ----------------------- | ------------------------ | ------------------- |
| Account status           | active               | suspended               | pending                  | active              |
| Email verified           | Y                    | Y                       | N                        | Y                   |
| User role                | user                 | user                    | user                     | admin               |
| **Actions**              |                      |                         |                          |                     |
| Count as active user     | X                    |                         |                          | X                   |
| Count as suspended user  |                      | X                       |                          |                     |
| Count as unverified user |                      |                         | X                        |                     |
| Count as admin user      |                      |                         |                          | X                   |

**Decision Table: Course Archival**

| Conditions                      | Rule 1 (Archive Course) |
| ------------------------------- | ----------------------- | --- |
| Admin requests archival         | Y                       |
| Course is published             | Y/N                     |
| **Actions**                     |                         |     |
| Set isArchived to true          | X                       |
| Remove from active course lists | X                       |

**Decision Table: Admin Role Assignment**

| Conditions            | Rule 1 (Promote to Admin) | Rule 2 (Demote from Admin) |
| --------------------- | ------------------------- | -------------------------- |
| Current role          | user                      | admin                      |
| Admin action          | promote                   | demote                     |
| **Actions**           |                           |                            |
| Update role to admin  | X                         |                            |
| Update role to user   |                           | X                          |
| Prevent self-demotion |                           | X (if self)                |

### Business Testing 2: Authentication Business Rules

**Decision Table: Email Verification Requirement**

| Conditions           | Rule 1 (Verified User) | Rule 2 (Unverified User) |
| -------------------- | ---------------------- | ------------------------ |
| Email verified       | Y                      | N                        |
| Account status       | active                 | pending                  |
| **Actions**          |                        |                          |
| Allow login          | X                      |                          |
| Block login          |                        | X                        |
| Require verification |                        | X                        |

**Decision Table: Password Policy Enforcement**

| Conditions           | Rule 1 (Valid Password) | Rule 2 (Invalid Password) |
| -------------------- | ----------------------- | ------------------------- |
| Password length >= 6 | Y                       | N                         |
| Password provided    | Y                       | Y                         |
| **Actions**          |                         |                           |
| Accept password      | X                       |                           |
| Reject password      |                         | X                         |
| Hash and store       | X                       |                           |

**Decision Table: OAuth Authentication**

| Conditions                | Rule 1 (Valid OAuth) |
| ------------------------- | -------------------- | --- |
| OAuth provider ID present | Y                    |
| Email verified            | Y                    |
| **Actions**               |                      |     |
| Authenticate user         | X                    |
| Create/find user record   | X                    |

**Decision Table: Email Uniqueness**

| Conditions           | Rule 1 (Unique Email) | Rule 2 (Duplicate Email) |
| -------------------- | --------------------- | ------------------------ |
| Email already exists | N                     | Y                        |
| **Actions**          |                       |                          |
| Allow registration   | X                     |                          |
| Reject registration  |                       | X                        |
| Show duplicate error |                       | X                        |

**Decision Table: Account Suspension Handling**

| Conditions           | Rule 1 (Suspended Account) |
| -------------------- | -------------------------- | --- |
| Account status       | suspended                  |
| **Actions**          |                            |     |
| Block login attempts | X                          |
| Allow profile access | N                          |

### Business Testing 3: Code Execution Business Rules

**Decision Table: Language Support Validation**

| Conditions                            | Rule 1 (Supported) | Rule 2 (Unsupported) |
| ------------------------------------- | ------------------ | -------------------- |
| Language in [python, javascript, cpp] | Y                  | N                    |
| **Actions**                           |                    |                      |
| Allow execution                       | X                  |                      |
| Reject execution                      |                    | X                    |
| Show supported languages              |                    | X                    |

**Decision Table: Session ID Generation**

| Conditions                 | Rule 1 (New Session) |
| -------------------------- | -------------------- | --- |
| Execution requested        | Y                    |
| **Actions**                |                      |     |
| Generate unique session ID | X                    |
| Store session data         | X                    |

**Decision Table: Parameter Validation**

| Conditions                 | Rule 1 (Valid Params) | Rule 2 (Invalid Language) | Rule 3 (Empty Code) | Rule 4 (No Session) |
| -------------------------- | --------------------- | ------------------------- | ------------------- | ------------------- |
| Language supported         | Y                     | N                         | Y                   | Y                   |
| Code provided              | Y                     | Y                         | N                   | Y                   |
| Session ID provided        | Y                     | Y                         | Y                   | N                   |
| **Actions**                |                       |                           |                     |                     |
| Accept execution           | X                     |                           |                     |                     |
| Reject with language error |                       | X                         |                     |                     |
| Reject with code error     |                       |                           | X                   |                     |
| Reject with session error  |                       |                           |                     | X                   |

**Decision Table: Execution Result Handling**

| Conditions             | Rule 1 (Success) | Rule 2 (Error) |
| ---------------------- | ---------------- | -------------- |
| Execution successful   | Y                | N              |
| **Actions**            |                  |                |
| Return output          | X                |                |
| Return error message   |                  | X              |
| Include execution time | X                | X              |
| Include memory usage   | X                | X              |

**Decision Table: Resource Limit Enforcement**

| Conditions            | Rule 1 (Within Limits) | Rule 2 (Exceed Time) | Rule 3 (Exceed Memory) | Rule 4 (Exceed Output) |
| --------------------- | ---------------------- | -------------------- | ---------------------- | ---------------------- |
| Execution time <= 30s | Y                      | N                    | Y                      | Y                      |
| Memory usage <= 128MB | Y                      | Y                    | N                      | Y                      |
| Output size <= 1MB    | Y                      | Y                    | Y                      | N                      |
| **Actions**           |                        |                      |                        |                        |
| Allow completion      | X                      |                      |                        |                        |
| Terminate execution   |                        | X                    | X                      | X                      |
| Return timeout error  |                        | X                    |                        |                        |
| Return memory error   |                        |                      | X                      |                        |
| Return output error   |                        |                      |                        | X                      |

**Decision Table: Code Sanitization**

| Conditions                  | Rule 1 (Safe Code) | Rule 2 (Dangerous Code) |
| --------------------------- | ------------------ | ----------------------- |
| Contains dangerous patterns | N                  | Y                       |
| **Actions**                 |                    |                         |
| Allow execution             | X                  |                         |
| Block execution             |                    | X                       |
| Flag security risk          |                    | X                       |

**Decision Table: Concurrent Execution Handling**

| Conditions                    | Rule 1 (Concurrent Requests) |
| ----------------------------- | ---------------------------- | --- |
| Multiple executions requested | Y                            |
| **Actions**                   |                              |     |
| Assign unique session IDs     | X                            |
| Process independently         | X                            |
| Prevent resource conflicts    | X                            |

**Decision Table: Execution Statistics**

| Conditions                   | Rule 1 (Calculate Stats) |
| ---------------------------- | ------------------------ | --- |
| Execution data available     | Y                        |
| **Actions**                  |                          |     |
| Calculate success rate       | X                        |
| Identify popular languages   | X                        |
| Track average execution time | X                        |

### Business Testing 4: Course Management Business Rules

**Decision Table: Enrollment Uniqueness**

| Conditions             | Rule 1 (First Enrollment) | Rule 2 (Duplicate Enrollment) |
| ---------------------- | ------------------------- | ----------------------------- |
| User already enrolled  | N                         | Y                             |
| **Actions**            |                           |                               |
| Create enrollment      | X                         |                               |
| Reject enrollment      |                           | X                             |
| Show duplicate message |                           | X                             |

**Decision Table: Certificate Issuance**

| Conditions                   | Rule 1 (Not Complete) | Rule 2 (Complete) |
| ---------------------------- | --------------------- | ----------------- |
| Completion percentage = 100% | N                     | Y                 |
| **Actions**                  |                       |                   |
| Deny certificate             | X                     |                   |
| Issue certificate            |                       | X                 |

**Decision Table: Enrollment Count Tracking**

| Conditions                 | Rule 1 (New Enrollment) |
| -------------------------- | ----------------------- | --- |
| User enrolls in course     | Y                       |
| **Actions**                |                         |     |
| Increment enrollment count | X                       |
| Update course statistics   | X                       |

**Decision Table: Course Visibility**

| Conditions         | Rule 1 (Published) | Rule 2 (Unpublished) |
| ------------------ | ------------------ | -------------------- |
| Course isPublished | Y                  | N                    |
| **Actions**        |                    |                      |
| Show to users      | X                  |                      |
| Hide from users    |                    | X                    |

**Decision Table: Course Data Integrity**

| Conditions              | Rule 1 (Valid Data) | Rule 2 (Invalid Data) |
| ----------------------- | ------------------- | --------------------- |
| Required fields present | Y                   | N                     |
| Data formats correct    | Y                   | N                     |
| **Actions**             |                     |                       |
| Accept course creation  | X                   |                       |
| Reject course creation  |                     | X                     |
| Show validation errors  |                     | X                     |

### Business Testing 5: Tutorial Management Business Rules

**Decision Table: Title Uniqueness**

| Conditions              | Rule 1 (Allow Duplicate) |
| ----------------------- | ------------------------ | --- |
| Title already exists    | Y/N                      |
| **Actions**             |                          |     |
| Allow tutorial creation | X                        |

**Decision Table: Publication Status**

| Conditions            | Rule 1 (Published) | Rule 2 (Draft) |
| --------------------- | ------------------ | -------------- |
| Tutorial isPublished  | Y                  | N              |
| **Actions**           |                    |                |
| Make publicly visible | X                  |                |
| Keep private          |                    | X              |

**Decision Table: Code Examples Validation**

| Conditions                         | Rule 1 (Valid Structure) |
| ---------------------------------- | ------------------------ | --- |
| Code examples have required fields | Y                        |
| **Actions**                        |                          |     |
| Accept tutorial                    | X                        |
| Validate structure                 | X                        |

**Decision Table: View Count Tracking**

| Conditions             | Rule 1 (Tutorial Viewed) |
| ---------------------- | ------------------------ | --- |
| User accesses tutorial | Y                        |
| **Actions**            |                          |     |
| Increment view count   | X                        |

**Decision Table: Tutorial Filtering**

| Conditions                | Rule 1 (Match Language) | Rule 2 (Match Difficulty) | Rule 3 (Match Both) |
| ------------------------- | ----------------------- | ------------------------- | ------------------- |
| Language matches filter   | Y                       | Y/N                       | Y                   |
| Difficulty matches filter | Y/N                     | Y                         | Y                   |
| **Actions**               |                         |                           |                     |
| Include in results        | X                       | X                         | X                   |

## Summary Tables

### Unit Tests Summary

| Test Suite            | Total Tests | Passed  | Failed | Pass Rate | Notes                     |
| --------------------- | ----------- | ------- | ------ | --------- | ------------------------- |
| User Model            | 27          | 27      | 0      | 100%      | All validations working   |
| Tutorial Model        | 4           | 4       | 0      | 100%      | Basic schema tests        |
| Course Model          | 4           | 4       | 0      | 100%      | Basic schema tests        |
| Auth Controller       | 32          | 28      | 4      | 88%       | Password reset OTP issues |
| Tutorial Controller   | 13          | 13      | 0      | 100%      | Full CRUD coverage        |
| Course Controller     | 15          | 15      | 0      | 100%      | Enrollment and progress   |
| Profile Controller    | 13          | 13      | 0      | 100%      | Profile management        |
| Contact Controller    | 15          | 15      | 0      | 100%      | Contact form handling     |
| Admin Middleware      | 3           | 3       | 0      | 100%      | Access control            |
| Code Executor Service | 7           | 7       | 0      | 100%      | Code execution            |
| Admin Controller      | 1           | 1       | 0      | 100%      | Placeholder only          |
| **Total**             | **145**     | **141** | **4**  | **97%**   | Mostly stable             |

### Functional Tests Summary

| Test Suite                | Total Tests | Passed | Failed | Pass Rate | Notes                        |
| ------------------------- | ----------- | ------ | ------ | --------- | ---------------------------- |
| Admin Functional          | 7           | 7      | 0      | 100%      | Full admin workflows         |
| Auth Functional           | 5           | 5      | 0      | 100%      | Complete auth flows          |
| Code Execution Functional | 8           | 8      | 0      | 100%      | Multi-language execution     |
| Course Functional         | 5           | 5      | 0      | 100%      | Enrollment and progress      |
| Tutorial Functional       | 6           | 6      | 0      | 100%      | Save and progress tracking   |
| **Total**                 | **31**      | **31** | **0**  | **100%**  | All functional tests passing |

### Business Tests Summary

| Test Suite              | Total Tests | Passed | Failed | Pass Rate | Notes                            |
| ----------------------- | ----------- | ------ | ------ | --------- | -------------------------------- |
| Admin Business          | 6           | 6      | 0      | 100%      | Role and publication management  |
| Auth Business           | 5           | 5      | 0      | 100%      | Email and password policies      |
| Code Execution Business | 8           | 8      | 0      | 100%      | Language and resource validation |
| Course Business         | 5           | 5      | 0      | 100%      | Enrollment and integrity rules   |
| Tutorial Business       | 5           | 5      | 0      | 100%      | Publication and filtering logic  |
| **Total**               | **29**      | **29** | **0**  | **100%**  | All business tests passing       |

## Integration Tests

### Integration Testing 1: Admin Routes

**Testing Objective:** To ensure admin API endpoints work correctly end-to-end, including user management, analytics, and tutorial administration with proper authentication and authorization.

| Test case No. | Test case/Test script                          | Attribute and value                                                      | Expected result                             | Actual result                                                   | Result |
| ------------- | ---------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------- | ------ |
| 1             | should suspend user account via API            | accountStatus: 'active' → 'suspended', reason: 'Violation of terms'      | User status updated to suspended            | User accountStatus set to 'suspended' in DB                     | Pass   |
| 2             | should view analytics data as admin            | GET /api/admin/analytics                                                 | Analytics data returned                     | success: true, data object returned                             | Pass   |
| 3             | should get dashboard stats                     | GET /api/admin/stats                                                     | Stats data with user/tutorial/course counts | success: true, data with totalUsers/totalTutorials/totalCourses | Pass   |
| 4             | should get all users as admin                  | GET /api/admin/users                                                     | Users list returned                         | success: true, array of users including admin and regular       | Pass   |
| 5             | should get user details as admin               | GET /api/admin/users/:userId                                             | Specific user details returned              | success: true, user data with \_id, email, name                 | Pass   |
| 6             | should update user role as admin               | role: 'user' → 'admin'                                                   | User role updated to admin                  | User role set to 'admin' in DB                                  | Pass   |
| 7             | should update user details as admin            | name: 'Updated Regular User', profilePicture: URL                        | User details updated                        | User name and profilePicture updated in DB                      | Pass   |
| 8             | should get all tutorials as admin              | GET /api/admin/tutorials                                                 | Tutorials list returned                     | success: true, array of tutorials                               | Pass   |
| 9             | should update tutorial as admin                | title: 'Updated Admin Test Tutorial', description: 'Updated description' | Tutorial updated successfully               | Tutorial title and description updated in DB                    | Pass   |
| 10            | should delete tutorial as admin                | DELETE /api/admin/tutorials/:tutorialId                                  | Tutorial deleted successfully               | Tutorial removed from DB                                        | Pass   |
| 11            | should get recent activity as admin            | GET /api/admin/recent-activity                                           | Activity data returned                      | success: true, array of activity data                           | Pass   |
| 12            | should search users as admin                   | GET /api/admin/users/search?query=Test                                   | Search results returned                     | success: true, users matching 'Test' found                      | Pass   |
| 13            | should reject non-admin access to admin routes | GET /api/admin/stats as regular user                                     | Access denied with 403                      | status: 403, message: 'Admin access required'                   | Pass   |
| 14            | should delete user as admin                    | DELETE /api/admin/users/:userId                                          | User deleted successfully                   | User removed from DB                                            | Pass   |

### Integration Testing 2: Authentication Routes

**Testing Objective:** To ensure authentication API endpoints work correctly end-to-end, including user registration, login, and validation with proper error handling.

| Test case No. | Test case/Test script                      | Attribute and value                                                       | Expected result                   | Actual result                                        | Result |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------- | ------ |
| 1             | should register and login user via API     | name: 'Test User', email: 'testuser@example.com', password: 'password123' | User created and token returned   | status: 'success', token defined, user created in DB | Pass   |
| 2             | should block login for unverified email    | isVerified: false, email: 'unverified@example.com'                        | Login blocked for unverified user | status >= 400, login prevented                       | Pass   |
| 3             | should handle invalid signup data          | name: 'Test User' (missing email/password)                                | Validation error returned         | status: 400, status: 'fail'                          | Pass   |
| 4             | should handle duplicate email registration | email: 'existing@example.com' (used twice)                                | Error for duplicate email         | status: 400, status: 'fail'                          | Pass   |

### Integration Testing 3: Code Execution Routes

**Testing Objective:** To ensure code execution API endpoints work correctly end-to-end, including execution requests, parameter validation, and language support retrieval.

| Test case No. | Test case/Test script                                                 | Attribute and value                                         | Expected result                             | Actual result                                                  | Result |
| ------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- | ------ |
| 1             | should attempt code execution (returns success but with Docker error) | code: 'console.log("Hello World");', language: 'javascript' | Execution attempted with response structure | success: true, output string, error: true (Docker unavailable) | Pass   |
| 2             | should validate required parameters                                   | empty request body {}                                       | Validation error for missing params         | success: false, message contains 'required'                    | Pass   |
| 3             | should get supported languages                                        | GET /api/code/languages                                     | Languages array returned                    | success: true, array with id/name properties                   | Pass   |

### Integration Testing 4: Course Routes

**Testing Objective:** To ensure course API endpoints work correctly end-to-end, including course retrieval, enrollment, and user course management.

| Test case No. | Test case/Test script            | Attribute and value                                 | Expected result                  | Actual result                                       | Result |
| ------------- | -------------------------------- | --------------------------------------------------- | -------------------------------- | --------------------------------------------------- | ------ |
| 1             | should get all courses           | GET /api/courses                                    | Courses array returned           | success: true, array of courses                     | Pass   |
| 2             | should get course by id          | GET /api/courses/:courseId                          | Specific course details returned | success: true, course data with title 'Test Course' | Pass   |
| 3             | should enroll user in course     | POST /api/courses/enroll, courseId: testCourse.\_id | User enrolled successfully       | success: true, message contains 'enrolled'          | Pass   |
| 4             | should get user enrolled courses | GET /api/courses/user/enrolled                      | User's enrolled courses returned | success: true, array of enrolled courses            | Pass   |

### Integration Testing 5: Tutorial Routes

**Testing Objective:** To ensure tutorial API endpoints work correctly end-to-end, including tutorial retrieval, saving, filtering, and user tutorial management.

| Test case No. | Test case/Test script                      | Attribute and value                                      | Expected result                 | Actual result                                                            | Result |
| ------------- | ------------------------------------------ | -------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------ | ------ |
| 1             | should fetch tutorials by language via API | GET /api/tutorials?language=python                       | Python tutorials returned       | success: true, all tutorials have language: 'python'                     | Pass   |
| 2             | should allow user to save tutorial         | POST /api/tutorials/save, tutorialId: testTutorial1.\_id | Tutorial saved for user         | success: true, message: 'Tutorial saved successfully', saved in DB       | Pass   |
| 3             | should get tutorial by ID                  | GET /api/tutorials/:tutorialId                           | Tutorial details returned       | success: true, tutorial data with correct \_id, title, content           | Pass   |
| 4             | should get all tutorials with filters      | GET /api/tutorials?difficulty=beginner                   | Beginner tutorials returned     | success: true, all tutorials have difficulty: 'beginner'                 | Pass   |
| 5             | should get available languages             | GET /api/tutorials/languages                             | Languages list returned         | success: true, array includes 'python', 'javascript'                     | Pass   |
| 6             | should get concepts by language            | GET /api/tutorials/concepts/python                       | Python concepts returned        | success: true, concepts array includes 'Variables'                       | Pass   |
| 7             | should get user saved tutorials            | GET /api/tutorials/user/saved                            | User's saved tutorials returned | success: true, array with 1 saved tutorial                               | Pass   |
| 8             | should unsave tutorial                     | DELETE /api/tutorials/saved/:tutorialId                  | Tutorial unsaved successfully   | success: true, message: 'Tutorial unsaved successfully', removed from DB | Pass   |
| 9             | should filter tutorials by concept         | GET /api/tutorials?language=python&concept=Variables     | Filtered tutorials returned     | success: true, tutorials match language and concept                      | Pass   |

### Integration Tests Summary

| Test Suite            | Total Tests | Passed | Failed | Pass Rate | Notes                             |
| --------------------- | ----------- | ------ | ------ | --------- | --------------------------------- |
| Admin Routes          | 14          | 14     | 0      | 100%      | User and tutorial management APIs |
| Auth Routes           | 4           | 4      | 0      | 100%      | Registration and login endpoints  |
| Code Execution Routes | 3           | 3      | 0      | 100%      | Execution and language APIs       |
| Course Routes         | 4           | 4      | 0      | 100%      | Course retrieval and enrollment   |
| Tutorial Routes       | 9           | 9      | 0      | 100%      | Tutorial CRUD and filtering       |
| **Total**             | **34**      | **34** | **0**  | **100%**  | All integration tests passing     |

## Overall Test Summary

| Test Type         | Total Tests | Passed  | Failed | Pass Rate | Notes                            |
| ----------------- | ----------- | ------- | ------ | --------- | -------------------------------- |
| Unit Tests        | 145         | 141     | 4      | 97%       | 4 auth controller failures       |
| Functional Tests  | 31          | 31      | 0      | 100%      | All endpoint validations passing |
| Business Tests    | 29          | 29      | 0      | 100%      | All business rules validated     |
| Integration Tests | 34          | 34      | 0      | 100%      | All API endpoints working        |
| **Grand Total**   | **239**     | **235** | **4**  | **98%**   | Comprehensive test coverage      |

# 7. Implementation

This chapter discusses the implementation details of the CodeHub project. The core module functionalities are presented in pseudocode form, following proper algorithm representation standards.

## 7.1 Algorithm

### Algorithm 1: User Authentication and Registration

**Input:** User registration data (name, email, password, confirmPassword)  
**Output:** Authentication token and user object, or error message

```
Algorithm 1 UserAuthentication
Input: userData {name, email, password, confirmPassword}, action {'register' | 'login'}
Output: {success: boolean, token: string, user: object, message: string}

1:     if action == 'register' then
2:         // Validate input data
3:         if not validateEmail(userData.email) then
4:             return {success: false, message: "Invalid email format"}
5:         end if
6:
7:         if len(userData.password) < 6 then
8:             return {success: false, message: "Password too short"}
9:         end if
10:
11:        if userData.password != userData.confirmPassword then
12:            return {success: false, message: "Passwords do not match"}
13:        end if
14:
15:        // Check for existing user
16:        existingUser ← findUserByEmail(userData.email)
17:        if existingUser != null then
18:            return {success: false, message: "Email already registered"}
19:        end if
20:
21:        // Hash password
22:        hashedPassword ← bcrypt.hash(userData.password, saltRounds = 12)
23:
24:        // Create user
25:        newUser ← createUser({
26:            name: userData.name,
27:            email: userData.email,
28:            password: hashedPassword,
29:            role: 'user',
30:            isEmailVerified: false,
31:            accountStatus: 'pending'
32:        })
33:
34:        // Generate JWT token
35:        token ← jwt.sign({id: newUser._id}, JWT_SECRET, expiresIn: '7d')
36:
37:        return {success: true, token: token, user: newUser, message: "Registration successful"}
38:
39:     else if action == 'login' then
40:         // Find user by email
41:         user ← findUserByEmail(userData.email)
42:         if user == null then
43:             return {success: false, message: "User not found"}
44:         end if
45:
46:         // Check email verification
47:         if not user.isEmailVerified then
48:             return {success: false, message: "Email not verified"}
49:         end if
50:
51:         // Check account status
52:         if user.accountStatus != 'active' then
53:             return {success: false, message: "Account not active"}
54:         end if
55:
56:         // Verify password
57:         isValidPassword ← bcrypt.compare(userData.password, user.password)
58:         if not isValidPassword then
59:             return {success: false, message: "Invalid password"}
60:         end if
61:
62:         // Generate JWT token
63:         token ← jwt.sign({id: user._id}, JWT_SECRET, expiresIn: '7d')
64:
65:         // Update last login
66:         user.lastLogin ← currentTimestamp()
67:         saveUser(user)
68:
69:         return {success: true, token: token, user: user, message: "Login successful"}
70:     end if
```

### Algorithm 2: Multi-Language Code Execution

**Input:** Code string, programming language, session ID  
**Output:** Execution result with output, errors, and performance metrics

```
Algorithm 2 CodeExecution
Input: code {string}, language {'python'|'javascript'|'cpp'}, sessionId {string}
Output: {success: boolean, output: string, error: string, executionTime: number, memoryUsage: number}

1:     // Validate inputs
2:     if code is empty or null then
3:         return {success: false, error: "Code cannot be empty"}
4:     end if
5:
6:     if language not in ['python', 'javascript', 'cpp'] then
7:         return {success: false, error: "Unsupported language"}
8:     end if
9:
10:    // Generate unique session ID if not provided
11:    if sessionId is null then
12:        sessionId ← generateUUID()
13:    end if
14:
15:    // Sanitize code for security
16:    sanitizedCode ← sanitizeCode(code, language)
17:    if sanitizedCode contains dangerous patterns then
18:        return {success: false, error: "Code contains dangerous patterns"}
19:    end if
20:
21:    // Prepare execution environment
22:    executionConfig ← getExecutionConfig(language)
23:    container ← createDockerContainer(executionConfig.image)
24:
25:    // Set resource limits
26:    container.setLimits({
27:        maxExecutionTime: 30000, // 30 seconds
28:        maxMemory: 134217728,    // 128 MB
29:        maxOutputSize: 1048576    // 1 MB
30:    })
31:
32:    // Execute code
33:    startTime ← currentTimestamp()
34:    try
35:        result ← container.execute(sanitizedCode, executionConfig)
36:        executionTime ← currentTimestamp() - startTime
37:
38:        // Validate result size
39:        if len(result.output) > maxOutputSize then
40:            return {success: false, error: "Output size limit exceeded"}
41:        end if
42:
43:        // Get memory usage
44:        memoryUsage ← container.getMemoryUsage()
45:
46:        // Clean up container
47:        container.destroy()
48:
49:        return {
50:            success: true,
51:            output: result.output,
52:            error: result.error,
53:            executionTime: executionTime,
54:            memoryUsage: memoryUsage
55:        }
56:
57:    catch exception
58:        executionTime ← currentTimestamp() - startTime
59:        container.destroy()
60:
61:        if exception.type == 'timeout' then
62:            return {success: false, error: "Execution timeout", executionTime: executionTime}
63:        else if exception.type == 'memory_limit' then
64:            return {success: false, error: "Memory limit exceeded", executionTime: executionTime}
65:        else
66:            return {success: false, error: exception.message, executionTime: executionTime}
67:        end if
68:    end try
```

### Algorithm 3: Course Enrollment and Progress Tracking

**Input:** User ID, Course ID, action type  
**Output:** Enrollment status and progress information

```
Algorithm 3 CourseEnrollment
Input: userId {ObjectId}, courseId {ObjectId}, action {'enroll'|'update_progress'|'get_progress'}
Output: {success: boolean, data: object, message: string}

1:     // Validate user and course exist
2:     user ← findUserById(userId)
3:     if user == null then
4:         return {success: false, message: "User not found"}
5:     end if
6:
7:     course ← findCourseById(courseId)
8:     if course == null then
9:         return {success: false, message: "Course not found"}
10:    end if
11:
12:    if course.isPublished == false then
13:        return {success: false, message: "Course not available"}
14:    end if
15:
16:    if action == 'enroll' then
17:        // Check if already enrolled
18:        existingEnrollment ← findEnrollmentByUserAndCourse(userId, courseId)
19:        if existingEnrollment != null then
20:            return {success: false, message: "Already enrolled in this course"}
21:        end if
22:
23:        // Create enrollment
24:        enrollment ← createEnrollment({
25:            userId: userId,
26:            courseId: courseId,
27:            enrollmentDate: currentTimestamp(),
28:            progressPercentage: 0,
29:            completedModules: [],
30:            status: 'enrolled'
31:        })
32:
33:        // Update course enrollment count
34:        course.enrollmentCount ← course.enrollmentCount + 1
35:        saveCourse(course)
36:
37:        return {success: true, data: enrollment, message: "Successfully enrolled"}
38:
39:    else if action == 'update_progress' then
40:        // Find enrollment
41:        enrollment ← findEnrollmentByUserAndCourse(userId, courseId)
42:        if enrollment == null then
43:            return {success: false, message: "Not enrolled in this course"}
44:        end if
45:
46:        // Calculate progress (this would be based on completed modules)
47:        totalModules ← course.modules.length
48:        completedModules ← enrollment.completedModules.length
49:        progressPercentage ← (completedModules / totalModules) * 100
50:
51:        // Update enrollment
52:        enrollment.progressPercentage ← progressPercentage
53:        enrollment.lastAccessed ← currentTimestamp()
54:        saveEnrollment(enrollment)
55:
56:        return {success: true, data: enrollment, message: "Progress updated"}
57:
58:    else if action == 'get_progress' then
59:        // Find enrollment
60:        enrollment ← findEnrollmentByUserAndCourse(userId, courseId)
61:        if enrollment == null then
62:            return {success: false, message: "Not enrolled in this course"}
63:        end if
64:
65:        return {success: true, data: enrollment, message: "Progress retrieved"}
66:    end if
```

### Algorithm 4: Tutorial Recommendation and Filtering

**Input:** Filter criteria, user preferences  
**Output:** Filtered and sorted list of tutorials

```
Algorithm 4 TutorialRecommendation
Input: filters {language: string, difficulty: string, concept: string}, userId {ObjectId}, limit {number}
Output: {success: boolean, data: array of tutorials, totalCount: number}

1:     // Build query based on filters
2:     query ← {}
3:
4:     if filters.language is not null then
5:         query.language ← filters.language
6:     end if
7:
8:     if filters.difficulty is not null then
9:         query.difficulty ← filters.difficulty
10:    end if
11:
12:    if filters.concept is not null then
13:        query.concept ← { $regex: filters.concept, $options: 'i' }
14:    end if
15:
16:    // Only show published tutorials
17:    query.isPublished ← true
18:
19:    // Get base tutorial list
20:    tutorials ← findTutorials(query)
21:
22:    // Apply user preferences if userId provided
23:    if userId is not null then
24:        user ← findUserById(userId)
25:        if user != null then
26:            // Get user's saved tutorials for personalization
27:            savedTutorialIds ← getUserSavedTutorialIds(userId)
28:
29:            // Get user's completed courses to infer skill level
30:            completedCourses ← getUserCompletedCourses(userId)
31:
32:            // Adjust recommendations based on user history
33:            tutorials ← personalizeRecommendations(tutorials, savedTutorialIds, completedCourses)
34:        end if
35:    end if
36:
37:    // Sort by relevance (view count, creation date, etc.)
38:    tutorials ← sortTutorials(tutorials, {
39:        viewCount: -1,      // Most viewed first
40:        createdAt: -1,      // Newest first
41:        difficulty: 1       // Easier first
42:    })
43:
44:    // Apply limit
45:    if limit is not null and limit > 0 then
46:        totalCount ← tutorials.length
47:        tutorials ← tutorials.slice(0, limit)
48:    else
49:        totalCount ← tutorials.length
50:    end if
51:
52:    return {success: true, data: tutorials, totalCount: totalCount}
```

### Algorithm 5: Certificate Generation and Validation

**Input:** User ID, Course ID  
**Output:** Certificate data or validation result

```
Algorithm 5 CertificateIssuance
Input: userId {ObjectId}, courseId {ObjectId}, action {'generate'|'validate'}
Output: {success: boolean, data: object, message: string}

1:     // Validate user and course
2:     user ← findUserById(userId)
3:     if user == null then
4:         return {success: false, message: "User not found"}
5:     end if
6:
7:     course ← findCourseById(courseId)
8:     if course == null then
9:         return {success: false, message: "Course not found"}
10:    end if
11:
12:    // Check enrollment
13:    enrollment ← findEnrollmentByUserAndCourse(userId, courseId)
14:    if enrollment == null then
15:        return {success: false, message: "User not enrolled in this course"}
16:    end if
17:
18:    if action == 'generate' then
19:        // Check completion criteria
20:        if enrollment.progressPercentage < 100 then
21:            return {success: false, message: "Course not completed"}
22:        end if
23:
24:        // Check if certificate already exists
25:        existingCertificate ← findCertificateByUserAndCourse(userId, courseId)
26:        if existingCertificate != null then
27:            return {success: false, message: "Certificate already issued"}
28:        end if
29:
30:        // Generate certificate data
31:        certificateData ← {
32:            certificateId: generateCertificateId(),
33:            userId: userId,
34:            courseId: courseId,
35:            userName: user.name,
36:            courseName: course.title,
37:            completionDate: currentTimestamp(),
38:            instructorName: course.instructor.name,
39:            grade: calculateGrade(enrollment),
40:            verificationCode: generateVerificationCode()
41:        }
42:
43:        // Save certificate
44:        certificate ← createCertificate(certificateData)
45:
46:        // Update enrollment status
47:        enrollment.status ← 'completed'
48:        enrollment.certificateIssued ← true
49:        saveEnrollment(enrollment)
50:
51:        return {success: true, data: certificate, message: "Certificate issued"}
52:
53:    else if action == 'validate' then
54:        // Find certificate
55:        certificate ← findCertificateByUserAndCourse(userId, courseId)
56:        if certificate == null then
57:            return {success: false, message: "Certificate not found"}
58:        end if
59:
60:        // Validate certificate data
61:        isValid ← validateCertificateData(certificate)
62:
63:        return {
64:            success: isValid,
65:            data: certificate,
66:            message: isValid ? "Certificate is valid" : "Certificate is invalid"
67:        }
68:    end if
```

### Algorithm 6: Admin User Management and Analytics

**Input:** Admin action type, target user/course data  
**Output:** Operation result and analytics data

```
Algorithm 6 AdminManagement
Input: adminId {ObjectId}, action {string}, targetData {object}
Output: {success: boolean, data: object, message: string}

1:     // Verify admin privileges
2:     admin ← findUserById(adminId)
3:     if admin == null or admin.role != 'admin' then
4:         return {success: false, message: "Admin access required"}
5:     end if
6:
7:     if action == 'suspend_user' then
8:        // Validate target user
9:        targetUser ← findUserById(targetData.userId)
10:        if targetUser == null then
11:            return {success: false, message: "Target user not found"}
12:        end if
13:
14:        // Prevent self-suspension
15:        if targetUser._id == adminId then
16:            return {success: false, message: "Cannot suspend yourself"}
17:        end if
18:
19:        // Update user status
20:        targetUser.accountStatus ← 'suspended'
21:        targetUser.suspendedAt ← currentTimestamp()
22:        targetUser.suspendedBy ← adminId
23:        targetUser.suspensionReason ← targetData.reason
24:        saveUser(targetUser)
25:
26:        return {success: true, data: targetUser, message: "User suspended"}
27:
28:    else if action == 'change_user_role' then
29:        targetUser ← findUserById(targetData.userId)
30:        if targetUser == null then
31:            return {success: false, message: "Target user not found"}
32:        end if
33:
34:        // Validate role
35:        if targetData.role not in ['user', 'admin'] then
36:            return {success: false, message: "Invalid role"}
37:        end if
38:
39:        // Prevent self-demotion
40:        if targetUser._id == adminId and targetData.role != 'admin' then
41:            return {success: false, message: "Cannot demote yourself"}
42:        end if
43:
44:        targetUser.role ← targetData.role
45:        targetUser.roleChangedAt ← currentTimestamp()
46:        targetUser.roleChangedBy ← adminId
47:        saveUser(targetUser)
48:
49:        return {success: true, data: targetUser, message: "User role updated"}
50:
51:    else if action == 'get_analytics' then
52:        // Calculate user statistics
53:        totalUsers ← countUsers()
54:        activeUsers ← countUsers({accountStatus: 'active'})
55:        suspendedUsers ← countUsers({accountStatus: 'suspended'})
56:        adminUsers ← countUsers({role: 'admin'})
57:        unverifiedUsers ← countUsers({isEmailVerified: false})
58:
59:        // Calculate content statistics
60:        totalTutorials ← countTutorials()
61:        publishedTutorials ← countTutorials({isPublished: true})
62:        totalCourses ← countCourses()
63:        publishedCourses ← countCourses({isPublished: true})
64:
65:        // Calculate enrollment statistics
66:        totalEnrollments ← countEnrollments()
67:        completedEnrollments ← countEnrollments({status: 'completed'})
68:
69:        analytics ← {
70:            users: {
71:                total: totalUsers,
72:                active: activeUsers,
73:                suspended: suspendedUsers,
74:                admin: adminUsers,
75:                unverified: unverifiedUsers
76:            },
77:            content: {
78:                tutorials: {total: totalTutorials, published: publishedTutorials},
79:                courses: {total: totalCourses, published: publishedCourses}
80:            },
81:            enrollments: {
82:                total: totalEnrollments,
83:                completed: completedEnrollments,
84:                completionRate: (completedEnrollments / totalEnrollments) * 100
85:            }
86:        }
87:
88:        return {success: true, data: analytics, message: "Analytics retrieved"}
89:    end if
```

## 7.2 External APIs/SDKs

**Table 1: Details of APIs used in the project**

| Name of API and version | Description of API | Purpose of usage | List down the API endpoint/function/class in which it is used |
|------------------------|-------------------|------------------|--------------------------------------------------------------|
| Google OAuth 2.0 API (v2.0.0) | Social authentication service for Google accounts | User authentication and registration via Google | passport.use('google', GoogleStrategy), /api/auth/google, /api/auth/google/callback |
| GitHub OAuth API (v0.1.12) | Social authentication service for GitHub accounts | User authentication and registration via GitHub | passport.use('github', GitHubStrategy), /api/auth/github, /api/auth/github/callback |
| SMTP Email Service (via nodemailer v7.0.6) | Email delivery service using SMTP protocol | Transactional emails for verification, password reset, and notifications | EmailService class, sendVerificationOTP(), sendPasswordResetOTP(), transporter.sendMail() |
| Docker Engine API (v4.0.9) | Container runtime API for code execution | Secure code execution in isolated containers | dockerode.Docker class, container.create(), container.start(), container.exec() |
