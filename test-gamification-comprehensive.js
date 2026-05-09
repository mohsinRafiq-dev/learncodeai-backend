import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';
let authToken = null;
let testUserId = null;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

const log = (msg, type = 'info') => {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warn: '⚠️',
    test: '🧪',
    fire: '🔥',
    trophy: '🏆',
  };
  console.log(`${icons[type]} ${msg}`);
};

async function testGamification() {
  try {
    log('Starting Comprehensive Gamification Test Suite', 'test');
    log('='.repeat(60), 'info');

    // Step 1: Create or login test user
    log('\n📝 Step 1: Setting up test user', 'info');
    try {
      // Try to login with existing test user
      const loginRes = await api.post('/auth/login', {
        email: 'gamification-test@learncode.ai',
        password: 'TestPassword123!',
      });
      
      if (loginRes.data.success) {
        authToken = loginRes.data.token;
        testUserId = loginRes.data.user._id;
        log(`Logged in as existing user: ${testUserId}`, 'success');
      }
    } catch (err) {
      // Create new test user
      const signupRes = await api.post('/auth/signup', {
        username: 'gamificationtest',
        email: 'gamification-test@learncode.ai',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
      });
      
      if (signupRes.data.success) {
        authToken = signupRes.data.token;
        testUserId = signupRes.data.user._id;
        log(`Created new test user: ${testUserId}`, 'success');
      }
    }

    // Step 2: Check initial gamification stats
    log('\n📊 Step 2: Checking initial gamification stats', 'info');
    const statsRes = await api.get('/gamification/stats');
    const stats = statsRes.data.data;
    log(`Total Points: ${stats.totalPoints}`, 'info');
    log(`Level: ${stats.level}`, 'info');
    log(`Badges: ${stats.badges.length}/10`, 'info');

    // Step 3: Check streak status
    log('\n🔥 Step 3: Checking streak status', 'info');
    const streakRes = await api.get('/gamification/streak');
    const streak = streakRes.data.data;
    log(`Current Streak: ${streak.currentStreak} days`, 'info');
    log(`Longest Streak: ${streak.longestStreak} days`, 'info');
    log(`Last Activity: ${streak.lastActivityDate ? new Date(streak.lastActivityDate).toLocaleDateString() : 'Never'}`, 'info');

    // Step 4: Award points for tutorial completion
    log('\n📚 Step 4: Simulating tutorial completion (50 points)', 'info');
    await api.post('/gamification/points/add', {
      points: 50,
      reason: 'tutorial_completed',
      relatedId: 'tutorial-test-123',
    });
    log('Tutorial points awarded', 'success');

    // Step 5: Award points for code execution
    log('\n💻 Step 5: Simulating code execution (15 points)', 'info');
    await api.post('/gamification/points/add', {
      points: 15,
      reason: 'code_executed',
      relatedId: null,
    });
    log('Code execution points awarded', 'success');

    // Step 6: Update streak after activity
    log('\n🔄 Step 6: Updating streak', 'info');
    const updateStreakRes = await api.put('/gamification/streak/update');
    const updatedStreak = updateStreakRes.data.data;
    log(`Streak updated to: ${updatedStreak.currentStreak} days`, 'success');

    // Step 7: Check updated stats
    log('\n📊 Step 7: Checking updated stats', 'info');
    const updatedStatsRes = await api.get('/gamification/stats');
    const updatedStats = updatedStatsRes.data.data;
    log(`Total Points: ${updatedStats.totalPoints} (was ${stats.totalPoints})`, 'info');
    log(`Level: ${updatedStats.level} (was ${stats.level})`, 'info');
    log(`Badges: ${updatedStats.badges.length}/10`, 'info');

    // Step 8: Check user rank
    log('\n🏅 Step 8: Checking user rank', 'info');
    const rankRes = await api.get('/gamification/rank');
    const rank = rankRes.data.data;
    log(`Your rank: #${rank.rank || 'N/A'}`, 'info');

    // Step 9: Get leaderboard
    log('\n🏆 Step 9: Getting top 5 users on leaderboard', 'info');
    const leaderboardRes = await api.get('/gamification/leaderboard?limit=5');
    const leaderboard = leaderboardRes.data.data;
    log(`Top users: ${leaderboard.length}`, 'info');
    leaderboard.forEach((user, idx) => {
      log(`  ${idx + 1}. ${user.user?.username || 'Unknown'} - ${user.totalPoints} points`, 'info');
    });

    // Step 10: Get badges status
    log('\n🎖️ Step 10: Checking badge status', 'info');
    const badgesRes = await api.get('/gamification/badges');
    const badges = badgesRes.data.data;
    log(`Badges fetched: ${badges.length}`, 'info');
    badges.slice(0, 3).forEach((badge) => {
      log(`  - ${badge.name}: ${badge.description}`, 'info');
    });

    // Step 11: Get achievements progress
    log('\n📈 Step 11: Getting achievements progress', 'info');
    const achievementsRes = await api.get('/gamification/achievements/progress');
    const achievements = achievementsRes.data.data;
    log(`Total Points: ${achievements.totalPoints}`, 'info');
    log(`Level: ${achievements.level}`, 'info');
    log(`Courses Completed: ${achievements.statistics.coursesCompleted}`, 'info');
    log(`Tutorials Completed: ${achievements.statistics.tutorialsCompleted}`, 'info');

    // Step 12: Manual streak refresh (for testing)
    log('\n🔄 Step 12: Manual streak refresh', 'info');
    const refreshRes = await api.get('/gamification/streak/refresh/now');
    log('Streak refreshed manually', 'success');

    // Summary
    log('\n' + '='.repeat(60), 'info');
    log('✨ Comprehensive Gamification Test Complete!', 'success');
    log('='.repeat(60), 'info');
    log('\n📋 RESULTS SUMMARY:', 'info');
    log(`Test User ID: ${testUserId}`, 'info');
    log(`Points Earned: ${updatedStats.totalPoints}`, 'success');
    log(`Current Level: ${updatedStats.level}`, 'success');
    log(`Current Streak: ${updatedStreak.currentStreak} days`, 'fire');
    log(`Badges Unlocked: ${updatedStats.badges.length}/10`, 'trophy');

  } catch (error) {
    log(`Test failed: ${error.message}`, 'error');
    if (error.response?.data) {
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
    }
  }
}

// Run the test
testGamification();
