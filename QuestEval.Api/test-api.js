// QuestEval API Testing Script
// Este script prueba todos los endpoints de la API

const BASE_URL = 'http://localhost:5122';

// Utility functions
async function makeRequest(method, endpoint, body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json().catch(() => null);
        
        return {
            status: response.status,
            ok: response.ok,
            data
        };
    } catch (error) {
        return {
            status: 0,
            ok: false,
            error: error.message
        };
    }
}

function logTest(testName, passed, details = '') {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}`);
    if (details) console.log(`   ${details}`);
}

// Test data
const testData = {
    validCriterion: {
        name: "Code Quality",
        description: "Evaluates code quality and maintainability",
        maxScore: 100
    },
    invalidCriterion: {
        name: "AB",  // Too short
        description: "Short",  // Too short
        maxScore: 2000  // Out of range
    },
    validGroup: {
        name: "Software Engineering 2024",
        accessCode: "SE2024ABC"
    },
    validProject: {
        name: "E-commerce Platform",
        description: "A complete e-commerce solution with payment integration",
        groupId: "507f1f77bcf86cd799439011",  // Will be replaced with real ID
        status: "Active"
    },
    validUser: {
        email: `test${Date.now()}@example.com`,
        password: "SecurePass123!",
        fullName: "Test User",
        role: "Alumno"
    }
};

// CRITERIA TESTS
async function testCriteriaEndpoints() {
    console.log('\n=== TESTING CRITERIA ENDPOINTS ===\n');
    
    let criterionId = null;

    // Test 1: POST valid criterion
    const createResp = await makeRequest('POST', '/api/Criteria', testData.validCriterion);
    logTest('POST /api/Criteria - Valid request', createResp.status === 201,
        `Status: ${createResp.status}`);
    if (createResp.ok) criterionId = createResp.data.id;

    // Test 2: POST with missing fields
    const missingFieldsResp = await makeRequest('POST', '/api/Criteria', {});
    logTest('POST /api/Criteria - Missing fields returns 400',
        missingFieldsResp.status === 400,
        `Status: ${missingFieldsResp.status}`);

    // Test 3: POST with invalid data
    const invalidResp = await makeRequest('POST', '/api/Criteria', testData.invalidCriterion);
    logTest('POST /api/Criteria - Invalid data returns 400',
        invalidResp.status === 400,
        `Status: ${invalidResp.status}`);

    // Test 4: GET all criteria
    const getAllResp = await makeRequest('GET', '/api/Criteria');
    logTest('GET /api/Criteria - Returns list',
        getAllResp.ok && Array.isArray(getAllResp.data),
        `Found ${getAllResp.data?.length || 0} criteria`);

    if (criterionId) {
        // Test 5: GET by valid ID
        const getByIdResp = await makeRequest('GET', `/api/Criteria/${criterionId}`);
        logTest('GET /api/Criteria/{id} - Valid ID',
            getByIdResp.ok,
            `Status: ${getByIdResp.status}`);

        // Test 6: PUT valid update
        const updateData = { ...testData.validCriterion,name: "Updated Code Quality" };
        const updateResp = await makeRequest('PUT', `/api/Criteria/${criterionId}`, updateData);
        logTest('PUT /api/Criteria/{id} - Valid update',
            updateResp.status === 204,
            `Status: ${updateResp.status}`);
    }

    // Test 7: GET with invalid ID format
    const invalidIdResp = await makeRequest('GET', '/api/Criteria/invalid-id');
    logTest('GET /api/Criteria/{id} - Invalid ID format returns error',
        !invalidIdResp.ok,
        `Status: ${invalidIdResp.status}`);

    // Test 8: GET with non-existent ID
    const notFoundResp = await makeRequest('GET', '/api/Criteria/507f1f77bcf86cd799439000');
    logTest('GET /api/Criteria/{id} - Non-existent ID returns 404',
        notFoundResp.status === 404,
        `Status: ${notFoundResp.status}`);

    // Test 9: POST with MaxScore = 1 (edge case)
    const edgeCaseResp = await makeRequest('POST', '/api/Criteria', {
        ...testData.validCriterion,
        maxScore: 1
    });
    logTest('POST /api/Criteria - Edge case maxScore=1',
        edgeCaseResp.ok,
        `Status: ${edgeCaseResp.status}`);

    // Test 10: POST with MaxScore = 1000 (edge case)
    const edgeCase2Resp = await makeRequest('POST', '/api/Criteria', {
        ...testData.validCriterion,
        maxScore: 1000
    });
    logTest('POST /api/Criteria - Edge case maxScore=1000',
        edgeCase2Resp.ok,
        `Status: ${edgeCase2Resp.status}`);
}

// GROUPS TESTS
async function testGroupsEndpoints() {
    console.log('\n=== TESTING GROUPS ENDPOINTS ===\n');
    
    let groupId = null;

    // Test 1: POST valid group
    const createResp = await makeRequest('POST', '/api/Groups', testData.validGroup);
    logTest('POST /api/Groups - Valid request', createResp.status === 201,
        `Status: ${createResp.status}`);
    if(createResp.ok) groupId = createResp.data.id;

    // Test 2: POST with missing data
    const missingResp = await makeRequest('POST', '/api/Groups', {});
    logTest('POST /api/Groups - Missing data returns 400',
        missingResp.status === 400);

    // Test 3: POST with short access code
    const shortCodeResp = await makeRequest('POST', '/api/Groups', {
        name: "Test Group",
        accessCode: "ABC"  // Too short
    });
    logTest('POST /api/Groups - Short access code returns 400',
        shortCodeResp.status === 400);

    // Test 4: POST with invalid access code characters
    const invalidCodeResp = await makeRequest('POST', '/api/Groups', {
        name: "Test Group",
        accessCode: "ABC-123!"  // Invalid characters
    });
    logTest('POST /api/Groups - Invalid access code characters returns 400',
        invalidCodeResp.status === 400);

    // Test 5: GET all groups
    const getAllResp = await makeRequest('GET', '/api/Groups');
    logTest('GET /api/Groups - Returns list',
        getAllResp.ok && Array.isArray(getAllResp.data),
        `Found ${getAllResp.data?.length || 0} groups`);

    if (groupId) {
        // Test 6: GET by ID
        const getByIdResp = await makeRequest('GET', `/api/Groups/${groupId}`);
        logTest('GET /api/Groups/{id} - Valid ID',
            getByIdResp.ok);

        // Test 7: PUT valid update
        const updateResp = await makeRequest('PUT', `/api/Groups/${groupId}`, {
            name: "Updated Group Name",
            accessCode: "UPDATED123"
        });
        logTest('PUT /api/Groups/{id} - Valid update',
            updateResp.status === 204);
    }

    // Test 8: GET with invalid ID
    const invalidIdResp = await makeRequest('GET', '/api/Groups/invalid');
    logTest('GET /api/Groups/{id} - Invalid ID format',
        !invalidIdResp.ok);

    // Test 9: PUT with non-existent ID
    const notFoundResp = await makeRequest('PUT', '/api/Groups/507f1f77bcf86cd799439000', testData.validGroup);
    logTest('PUT /api/Groups/{id} - Non-existent ID returns 404',
        notFoundResp.status === 404);

    // Test 10: POST duplicate access code (if supported)
    const duplicateResp = await makeRequest('POST', '/api/Groups', testData.validGroup);
    logTest('POST /api/Groups - Duplicate access code handling',
        duplicateResp.status === 201 || duplicateResp.status === 409,
        `Status: ${duplicateResp.status}`);
}

// USERS TESTS
async function testUsersEndpoints() {
    console.log('\n=== TESTING USERS ENDPOINTS ===\n');

    // Test 1: POST valid registration
    const registerResp = await makeRequest('POST', '/api/Users/register', testData.validUser);
    logTest('POST /api/Users/register - Valid registration',
        registerResp.status === 201,
        `Status: ${registerResp.status}`);

    // Test 2: POST with invalid email
    const invalidEmailResp = await makeRequest('POST', '/api/Users/register', {
        ...testData.validUser,
        email: "invalid-email"
    });
    logTest('POST /api/Users/register - Invalid email returns 400',
        invalidEmailResp.status === 400);

    // Test 3: POST with short password
    const shortPassResp = await makeRequest('POST', '/api/Users/register', {
        ...testData.validUser,
        password: "12345"  // Too short
    });
    logTest('POST /api/Users/register - Short password returns 400',
        shortPassResp.status === 400);

    // Test 4: POST duplicate email
    const duplicateResp = await makeRequest('POST', '/api/Users/register', testData.validUser);
    logTest('POST /api/Users/register - Duplicate email returns 400',
        duplicateResp.status === 400);

    // Test 5: POST login with valid credentials
    const loginResp = await makeRequest('POST', '/api/Users/login', {
        email: testData.validUser.email,
        password: testData.validUser.password
    });
    logTest('POST /api/Users/login - Valid credentials',
        loginResp.ok,
        `Status: ${loginResp.status}`);

    // Test 6: POST login with invalid credentials
    const invalidLoginResp = await makeRequest('POST', '/api/Users/login', {
        email: testData.validUser.email,
        password: "WrongPassword123!"
    });
    logTest('POST /api/Users/login - Invalid credentials returns 401',
        invalidLoginResp.status === 401);

    // Test 7: POST login with non-existent email
    const notFoundLoginResp = await makeRequest('POST', '/api/Users/login', {
        email: "nonexistent@example.com",
        password: "password123"
    });
    logTest('POST /api/Users/login - Non-existent email returns 401',
        notFoundLoginResp.status === 401);

    // Test 8: GET all users
    const getAllResp = await makeRequest('GET', '/api/Users');
    logTest('GET /api/Users - Returns list',
        getAllResp.ok && Array.isArray(getAllResp.data));

    // Test 9: POST with invalid role
    const invalidRoleResp = await makeRequest('POST', '/api/Users/register', {
        ...testData.validUser,
        email: `newuser${Date.now()}@example.com`,
        role: "InvalidRole"
    });
    logTest('POST /api/Users/register - Invalid role returns 400',
        invalidRoleResp.status === 400);

    // Test 10: POST registration with missing fields
    const missingFieldsResp = await makeRequest('POST', '/api/Users/register', {
        email: "test@example.com"
        // Missing password and fullName
    });
    logTest('POST /api/Users/register - Missing fields returns 400',
        missingFieldsResp.status === 400);
}

// Run all tests
async function runAllTests() {
    console.log('========================================');
    console.log('  QUEST_EVAL API COMPREHENSIVE TESTS');
    console.log('========================================');
    
    await testCriteriaEndpoints();
    await testGroupsEndpoints();
    await testUsersEndpoints();
    
    console.log('\n========================================');
    console.log('  TESTS COMPLETED');
    console.log('========================================\n');
}

runAllTests();
