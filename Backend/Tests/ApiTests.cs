using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Backend.Tests
{
    /// <summary>
    /// Comprehensive API Testing Suite for QuestEval
    /// Run this in the Test Explorer or as a unit test project
    /// </summary>
    public class ApiTestsData
    {
        private static readonly HttpClient _client = new HttpClient();
        private const string BaseUrl = "http://localhost:5122";

        // Test data
        private readonly Dictionary<string, object> _validCriterion = new()
        {
            { "name", "Code Quality" },
            { "description", "Evaluates code quality and maintainability" },
            { "maxScore", 100 }
        };

        private readonly Dictionary<string, object> _invalidCriterion = new()
        {
            { "name", "AB" }, // Too short
            { "description", "Short" }, // Too short
            { "maxScore", 2000 } // Out of range
        };

        private readonly Dictionary<string, object> _validGroup = new()
        {
            { "name", "Software Engineering 2024" },
            { "accessCode", "SE2024ABC" }
        };

        private readonly Dictionary<string, object> _validProject = new()
        {
            { "name", "E-commerce Platform" },
            { "description", "A complete e-commerce solution with payment integration" },
            { "groupId", "507f1f77bcf86cd799439011" },
            { "status", "Active" }
        };

        private readonly Dictionary<string, object> _validUser = new()
        {
            { "email", $"test{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}@example.com" },
            { "password", "SecurePass123!" },
            { "fullName", "Test User" },
            { "role", "Alumno" }
        };

        /// <summary>
        /// Makes an HTTP request to the API
        /// </summary>
        private async Task<(int StatusCode, T? Data)> MakeRequestAsync<T>(
            string method,
            string endpoint,
            object? body = null)
        {
            var requestUri = new Uri(BaseUrl + endpoint);
            HttpRequestMessage? request = null;

            try
            {
                request = new HttpRequestMessage(new HttpMethod(method), requestUri);
                request.Headers.Add("Content-Type", "application/json");

                if (body != null)
                {
                    var json = JsonSerializer.Serialize(body);
                    request.Content = new StringContent(json, Encoding.UTF8, "application/json");
                }

                var response = await _client.SendAsync(request);
                T? data = default;

                try
                {
                    var content = await response.Content.ReadAsStringAsync();
                    data = JsonSerializer.Deserialize<T>(content);
                }
                catch { /* Ignore JSON parsing errors */ }

                return ((int)response.StatusCode, data);
            }
            finally
            {
                request?.Dispose();
            }
        }

        /// <summary>
        /// Logs test results
        /// </summary>
        private void LogTest(string testName, bool passed, string details = "")
        {
            var icon = passed ? "✅" : "❌";
            Console.WriteLine($"{icon} {testName}");
            if (!string.IsNullOrEmpty(details))
            {
                Console.WriteLine($"   {details}");
            }
        }

        /// <summary>
        /// Tests all Criteria endpoints
        /// </summary>
        public async Task TestCriteriaEndpointsAsync()
        {
            Console.WriteLine("\n=== TESTING CRITERIA ENDPOINTS ===\n");

            string? criterionId = null;

            // Test 1: POST valid criterion
            var (status1, data1) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Criteria",
                _validCriterion);
            LogTest("POST /api/Criteria - Valid request", status1 == 201, $"Status: {status1}");
            // criterionId = data1?.id?.ToString();

            // Test 2: POST with missing fields
            var (status2, _) = await MakeRequestAsync<dynamic>("POST", "/api/Criteria", new { });
            LogTest("POST /api/Criteria - Missing fields returns 400",
                status2 == 400,
                $"Status: {status2}");

            // Test 3: POST with invalid data
            var (status3, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Criteria",
                _invalidCriterion);
            LogTest("POST /api/Criteria - Invalid data returns 400",
                status3 == 400,
                $"Status: {status3}");

            // Test 4: GET all criteria
            var (status4, _) = await MakeRequestAsync<dynamic>("GET", "/api/Criteria");
            LogTest("GET /api/Criteria - Returns list",
                status4 == 200,
                $"Status: {status4}");

            if (criterionId != null)
            {
                // Test 5: GET by valid ID
                var (status5, _) = await MakeRequestAsync<dynamic>(
                    "GET",
                    $"/api/Criteria/{criterionId}");
                LogTest("GET /api/Criteria/{id} - Valid ID",
                    status5 == 200,
                    $"Status: {status5}");

                // Test 6: PUT valid update
                var updateData = new Dictionary<string, object>(_validCriterion)
                {
                    { "name", "Updated Code Quality" }
                };
                var (status6, _) = await MakeRequestAsync<dynamic>(
                    "PUT",
                    $"/api/Criteria/{criterionId}",
                    updateData);
                LogTest("PUT /api/Criteria/{id} - Valid update",
                    status6 == 204,
                    $"Status: {status6}");
            }

            // Test 7: GET with invalid ID format
            var (status7, _) = await MakeRequestAsync<dynamic>("GET", "/api/Criteria/invalid-id");
            LogTest("GET /api/Criteria/{id} - Invalid ID format returns error",
                status7 != 200,
                $"Status: {status7}");

            // Test 8: GET with non-existent ID
            var (status8, _) = await MakeRequestAsync<dynamic>(
                "GET",
                "/api/Criteria/507f1f77bcf86cd799439000");
            LogTest("GET /api/Criteria/{id} - Non-existent ID returns 404",
                status8 == 404,
                $"Status: {status8}");

            // Test 9: POST with MaxScore = 1 (edge case)
            var edgeCase1 = new Dictionary<string, object>(_validCriterion)
            {
                { "maxScore", 1 }
            };
            var (status9, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Criteria",
                edgeCase1);
            LogTest("POST /api/Criteria - Edge case maxScore=1",
                status9 == 201,
                $"Status: {status9}");

            // Test 10: POST with MaxScore = 1000 (edge case)
            var edgeCase2 = new Dictionary<string, object>(_validCriterion)
            {
                { "maxScore", 1000 }
            };
            var (status10, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Criteria",
                edgeCase2);
            LogTest("POST /api/Criteria - Edge case maxScore=1000",
                status10 == 201,
                $"Status: {status10}");
        }

        /// <summary>
        /// Tests all Groups endpoints
        /// </summary>
        public async Task TestGroupsEndpointsAsync()
        {
            Console.WriteLine("\n=== TESTING GROUPS ENDPOINTS ===\n");

            string? groupId = null;

            // Test 1: POST valid group
            var (status1, data1) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Groups",
                _validGroup);
            LogTest("POST /api/Groups - Valid request", status1 == 201, $"Status: {status1}");
            // groupId = data1?.id?.ToString();

            // Test 2: POST with missing data
            var (status2, _) = await MakeRequestAsync<dynamic>("POST", "/api/Groups", new { });
            LogTest("POST /api/Groups - Missing data returns 400", status2 == 400);

            // Test 3: POST with short access code
            var (status3, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Groups",
                new { name = "Test Group", accessCode = "ABC" });
            LogTest("POST /api/Groups - Short access code returns 400", status3 == 400);

            // Test 4: POST with invalid access code characters
            var (status4, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Groups",
                new { name = "Test Group", accessCode = "ABC-123!" });
            LogTest("POST /api/Groups - Invalid access code characters returns 400", status4 == 400);

            // Test 5: GET all groups
            var (status5, _) = await MakeRequestAsync<dynamic>("GET", "/api/Groups");
            LogTest("GET /api/Groups - Returns list",
                status5 == 200,
                $"Status: {status5}");

            if (groupId != null)
            {
                // Test 6: GET by ID
                var (status6, _) = await MakeRequestAsync<dynamic>(
                    "GET",
                    $"/api/Groups/{groupId}");
                LogTest("GET /api/Groups/{id} - Valid ID", status6 == 200);

                // Test 7: PUT valid update
                var (status7, _) = await MakeRequestAsync<dynamic>(
                    "PUT",
                    $"/api/Groups/{groupId}",
                    new { name = "Updated Group Name", accessCode = "UPDATED123" });
                LogTest("PUT /api/Groups/{id} - Valid update", status7 == 204);
            }

            // Test 8: GET with invalid ID
            var (status8, _) = await MakeRequestAsync<dynamic>("GET", "/api/Groups/invalid");
            LogTest("GET /api/Groups/{id} - Invalid ID format", status8 != 200);

            // Test 9: PUT with non-existent ID
            var (status9, _) = await MakeRequestAsync<dynamic>(
                "PUT",
                "/api/Groups/507f1f77bcf86cd799439000",
                _validGroup);
            LogTest("PUT /api/Groups/{id} - Non-existent ID returns 404", status9 == 404);

            // Test 10: POST duplicate access code handling
            var (status10, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Groups",
                _validGroup);
            LogTest("POST /api/Groups - Duplicate access code handling",
                status10 == 201 || status10 == 409,
                $"Status: {status10}");
        }

        /// <summary>
        /// Tests all Users endpoints
        /// </summary>
        public async Task TestUsersEndpointsAsync()
        {
            Console.WriteLine("\n=== TESTING USERS ENDPOINTS ===\n");

            // Test 1: POST valid registration
            var (status1, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Users/register",
                _validUser);
            LogTest("POST /api/Users/register - Valid registration",
                status1 == 201,
                $"Status: {status1}");

            // Test 2: POST with invalid email
            var invalidEmail = new Dictionary<string, object>(_validUser as Dictionary<string, object>)
            {
                { "email", "invalid-email" }
            };
            var (status2, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Users/register",
                invalidEmail);
            LogTest("POST /api/Users/register - Invalid email returns 400", status2 == 400);

            // Test 3: POST with short password
            var shortPass = new Dictionary<string, object>(_validUser as Dictionary<string, object>)
            {
                { "password", "12345" }
            };
            var (status3, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Users/register",
                shortPass);
            LogTest("POST /api/Users/register - Short password returns 400", status3 == 400);

            // Test 4: POST duplicate email
            var (status4, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Users/register",
                _validUser);
            LogTest("POST /api/Users/register - Duplicate email returns 400", status4 == 400);

            // Test 5: POST login with valid credentials
            var (status5, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Users/login",
                new
                {
                    email = _validUser["email"],
                    password = _validUser["password"]
                });
            LogTest("POST /api/Users/login - Valid credentials",
                status5 == 200,
                $"Status: {status5}");

            // Test 6: POST login with invalid credentials
            var (status6, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Users/login",
                new
                {
                    email = _validUser["email"],
                    password = "WrongPassword123!"
                });
            LogTest("POST /api/Users/login - Invalid credentials returns 401", status6 == 401);

            // Test 7: POST login with non-existent email
            var (status7, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Users/login",
                new { email = "nonexistent@example.com", password = "password123" });
            LogTest("POST /api/Users/login - Non-existent email returns 401", status7 == 401);

            // Test 8: GET all users
            var (status8, _) = await MakeRequestAsync<dynamic>("GET", "/api/Users");
            LogTest("GET /api/Users - Returns list", status8 == 200);

            // Test 9: POST with invalid role
            var invalidRole = new Dictionary<string, object>(_validUser as Dictionary<string, object>)
            {
                { "email", $"newuser{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}@example.com" },
                { "role", "InvalidRole" }
            };
            var (status9, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Users/register",
                invalidRole);
            LogTest("POST /api/Users/register - Invalid role returns 400", status9 == 400);

            // Test 10: POST registration with missing fields
            var (status10, _) = await MakeRequestAsync<dynamic>(
                "POST",
                "/api/Users/register",
                new { email = "test@example.com" });
            LogTest("POST /api/Users/register - Missing fields returns 400", status10 == 400);
        }

        /// <summary>
        /// Runs all tests
        /// </summary>
        public async Task RunAllTestsAsync()
        {
            Console.WriteLine("========================================");
            Console.WriteLine("  QUEST_EVAL API COMPREHENSIVE TESTS");
            Console.WriteLine("========================================");

            await TestCriteriaEndpointsAsync();
            await TestGroupsEndpointsAsync();
            await TestUsersEndpointsAsync();

            Console.WriteLine("\n========================================");
            Console.WriteLine("  TESTS COMPLETED");
            Console.WriteLine("========================================\n");
        }
    }
}
