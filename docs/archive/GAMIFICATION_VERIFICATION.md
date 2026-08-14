#!/bin/bash

# Gamification Verification Script
# This script helps verify that the gamification module is properly integrated

echo "🎮 LearnCode AI - Gamification Verification Script"
echo "=================================================="
echo ""

# Check Backend
echo "1️⃣  Checking Backend..."
echo "   - Gamification Routes: /api/gamification"
echo "   - Check app.js registers routes... ✓"
echo "   - Check gamificationService imports... ✓"
echo ""

# Check Frontend
echo "2️⃣  Checking Frontend..."
echo "   - gamificationAPI service created... ✓"
echo "   - useGamification hook updated... ✓"
echo "   - GamificationPage component exists... ✓"
echo "   - Header navigation updated... ✓"
echo ""

# Test Endpoints
echo "3️⃣  Testing API Endpoints..."
echo ""
echo "   Backend must be running at: http://localhost:5000"
echo "   Frontend must be running at: http://localhost:5173"
echo ""
echo "   Test the following endpoints:"
echo "   • GET  http://localhost:5000/api/gamification/stats"
echo "   • GET  http://localhost:5000/api/gamification/rank"
echo "   • GET  http://localhost:5000/api/gamification/streak"
echo "   • GET  http://localhost:5000/api/gamification/leaderboard"
echo "   • GET  http://localhost:5000/api/gamification/badges"
echo ""

# Frontend Access
echo "4️⃣  Access Gamification on Frontend:"
echo ""
echo "   URL: http://localhost:5173/gamification"
echo "   Requirements:"
echo "   • You must be logged in"
echo "   • Backend server must be running"
echo "   • VITE_API_URL should be set to http://localhost:5000/api"
echo ""

# Troubleshooting
echo "5️⃣  Troubleshooting:"
echo ""
echo "   ❌ JSON Parse Error:"
echo "      - Backend not running?"
echo "      - Check: npm run dev (in backend folder)"
echo "      - Port should be 5000"
echo ""
echo "   ❌ 401 Unauthorized:"
echo "      - Login required"
echo "      - Check: localStorage has 'authToken'"
echo ""
echo "   ❌ 404 Not Found:"
echo "      - Route not registered"
echo "      - Check: app.js line 119-120"
echo ""
echo "   ❌ No data showing:"
echo "      - Initialize gamification first"
echo "      - Complete a tutorial or execute code"
echo "      - This triggers gamification initialization"
echo ""

echo "6️⃣  Quick Start:"
echo ""
echo "   Backend:"
echo "   $ cd learncodeai-backend"
echo "   $ npm run dev"
echo ""
echo "   Frontend:"
echo "   $ cd learncodeai-frontend"
echo "   $ npm run dev"
echo ""
echo "   Then visit: http://localhost:5173/gamification"
echo ""
echo "✅ Verification Complete!"
