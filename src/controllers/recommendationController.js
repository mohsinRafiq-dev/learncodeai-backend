import Course from "../models/Course.js";
import Tutorial from "../models/Tutorial.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Progress from "../models/Progress.js";

// Difficulty progression map
const NEXT_DIFFICULTY = {
  beginner: "intermediate",
  intermediate: "advanced",
};

// Category learning path order
const CATEGORY_PATH = [
  "programming-language",
  "data-structures",
  "algorithms",
  "web-development",
  "other",
];

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user's enrolled courses and tutorial progress
    const [enrollments, tutorialProgress] = await Promise.all([
      CourseEnrollment.find({ user: userId })
        .populate("course", "language category difficulty title")
        .lean(),
      Progress.find({ user: userId })
        .populate("tutorial", "language category difficulty title")
        .lean(),
    ]);

    const completedEnrollments = enrollments.filter((e) => e.status === "completed");
    const inProgressEnrollments = enrollments.filter((e) => e.status !== "completed");

    // Collect languages and categories the user has engaged with
    const learnedLanguages = new Set(
      completedEnrollments.map((e) => e.course?.language).filter(Boolean)
    );
    const inProgressLanguages = new Set(
      inProgressEnrollments.map((e) => e.course?.language).filter(Boolean)
    );
    const completedCourseIds = new Set(completedEnrollments.map((e) => e.course?._id?.toString()));
    const enrolledCourseIds = new Set(enrollments.map((e) => e.course?._id?.toString()));

    // Determine completed difficulty per language
    const maxDifficultyPerLanguage = {};
    for (const e of completedEnrollments) {
      if (!e.course) continue;
      const { language, difficulty } = e.course;
      const current = maxDifficultyPerLanguage[language];
      const order = ["beginner", "intermediate", "advanced"];
      if (!current || order.indexOf(difficulty) > order.indexOf(current)) {
        maxDifficultyPerLanguage[language] = difficulty;
      }
    }

    // Determine completed categories
    const completedCategories = new Set(
      completedEnrollments.map((e) => e.course?.category).filter(Boolean)
    );

    // ── Strategy 1: Next difficulty in learned languages ──
    const nextDifficultyPromises = [...learnedLanguages].map(async (lang) => {
      const currentDiff = maxDifficultyPerLanguage[lang];
      const nextDiff = NEXT_DIFFICULTY[currentDiff];
      if (!nextDiff) return [];
      return Course.find({
        language: lang,
        difficulty: nextDiff,
        isPublished: true,
        _id: { $nin: [...enrolledCourseIds] },
      })
        .select("title language category difficulty shortDescription thumbnail estimatedHours")
        .limit(2)
        .lean();
    });

    // ── Strategy 2: Next category in the learning path ──
    const nextCategoryIdx = CATEGORY_PATH.findIndex((c) => !completedCategories.has(c));
    const nextCategory = nextCategoryIdx >= 0 ? CATEGORY_PATH[nextCategoryIdx] : null;
    const categoryCoursesPromise = nextCategory
      ? Course.find({
          category: nextCategory,
          isPublished: true,
          _id: { $nin: [...enrolledCourseIds] },
        })
          .select("title language category difficulty shortDescription thumbnail estimatedHours")
          .sort({ difficulty: 1 })
          .limit(3)
          .lean()
      : Promise.resolve([]);

    // ── Strategy 3: New languages (not started yet) ──
    const allLanguages = ["python", "javascript", "cpp"];
    const untouchedLanguages = allLanguages.filter(
      (l) => !learnedLanguages.has(l) && !inProgressLanguages.has(l)
    );
    const newLangPromises = untouchedLanguages.slice(0, 2).map((lang) =>
      Course.findOne({ language: lang, difficulty: "beginner", isPublished: true })
        .select("title language category difficulty shortDescription thumbnail estimatedHours")
        .lean()
    );

    // ── Strategy 4: Tutorials in languages already learned ──
    const viewedTutorialIds = new Set(
      tutorialProgress.map((p) => p.tutorial?._id?.toString()).filter(Boolean)
    );
    const tutorialsPromise =
      learnedLanguages.size > 0
        ? Tutorial.find({
            language: { $in: [...learnedLanguages] },
            isPublished: true,
            _id: { $nin: [...viewedTutorialIds] },
          })
            .select("title language category difficulty description")
            .limit(3)
            .lean()
        : Promise.resolve([]);

    // Resolve all
    const [nextDiffResults, categoryResults, newLangResults, tutorials] = await Promise.all([
      Promise.all(nextDifficultyPromises).then((r) => r.flat()),
      categoryCoursesPromise,
      Promise.all(newLangPromises).then((r) => r.filter(Boolean)),
      tutorialsPromise,
    ]);

    // De-duplicate courses
    const seenIds = new Set();
    const dedup = (items) =>
      items.filter((item) => {
        if (!item || seenIds.has(item._id.toString())) return false;
        seenIds.add(item._id.toString());
        return true;
      });

    const recommendedCourses = [
      ...dedup(nextDiffResults).map((c) => ({ ...c, reason: `Next step in ${c.language}` })),
      ...dedup(categoryResults).map((c) => ({ ...c, reason: `Explore ${c.category.replace("-", " ")}` })),
      ...dedup(newLangResults).map((c) => ({ ...c, reason: `Try a new language` })),
    ].slice(0, 6);

    const recommendedTutorials = tutorials.slice(0, 3).map((t) => ({
      ...t,
      reason: `Deepen your ${t.language} knowledge`,
    }));

    // Continue-in-progress courses
    const continueItems = inProgressEnrollments
      .filter((e) => e.course)
      .slice(0, 2)
      .map((e) => ({
        _id: e.course._id,
        title: e.course.title,
        language: e.course.language,
        difficulty: e.course.difficulty,
        overallProgress: e.overallProgress || 0,
        reason: "Continue where you left off",
      }));

    res.status(200).json({
      success: true,
      data: {
        continueCourses: continueItems,
        recommendedCourses,
        recommendedTutorials,
      },
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ success: false, message: "Failed to load recommendations", error: error.message });
  }
};

export default { getRecommendations };
