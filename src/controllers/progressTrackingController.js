import CourseEnrollment from "../models/CourseEnrollment.js";
import UserGamification from "../models/UserGamification.js";
import Streak from "../models/Streak.js";
import Certificate from "../models/Certificate.js";
import Progress from "../models/Progress.js";
import Course from "../models/Course.js";
import CourseLesson from "../models/CourseLesson.js";
import Quiz from "../models/Quiz.js";

class ProgressTrackingController {
  // Get comprehensive progress dashboard data
  async getDashboard(req, res) {
    try {
      const userId = req.user._id;

      // Fetch all data in parallel
      const [
        enrollments,
        gamification,
        streak,
        tutorialProgress,
        certificates,
      ] = await Promise.all([
        CourseEnrollment.find({ user: userId }).populate({
          path: "course",
          select: "title language difficulty duration sections category",
          populate: { path: "sections", select: "title order lessons" },
        }),
        UserGamification.findOne({ user: userId }),
        Streak.findOne({ user: userId }),
        Progress.find({ user: userId }).populate(
          "tutorial",
          "title language difficulty concept"
        ),
        Certificate.find({ user: userId, approvalStatus: "approved" }).populate(
          "course",
          "title language"
        ),
      ]);

      // Calculate course progress details
      let totalLessonsCompleted = 0;
      let totalLessons = 0;
      let totalTimeSpentMinutes = 0;
      let completedCourses = 0;
      let activeCourses = 0;

      const courseProgressList = [];

      for (const enrollment of enrollments) {
        const course = enrollment.course;
        if (!course) continue;

        let courseTotalLessons = 0;
        let courseCompletedLessons = 0;
        let courseTimeSpent = enrollment.totalTimeSpentMinutes || 0;

        // Count total lessons from sections
        if (course.sections) {
          for (const section of course.sections) {
            const lessonCount = await CourseLesson.countDocuments({
              section: section._id,
            });
            courseTotalLessons += lessonCount;
          }
        }

        // Count completed lessons from enrollment
        if (enrollment.sectionProgress) {
          for (const sp of enrollment.sectionProgress) {
            courseCompletedLessons += sp.lessons
              ? sp.lessons.filter((l) => l.isCompleted).length
              : 0;
          }
        }

        totalLessonsCompleted += courseCompletedLessons;
        totalLessons += courseTotalLessons;
        totalTimeSpentMinutes += courseTimeSpent;

        if (enrollment.status === "completed") {
          completedCourses++;
        } else if (enrollment.status === "active") {
          activeCourses++;
        }

        courseProgressList.push({
          courseId: course._id,
          title: course.title,
          language: course.language,
          difficulty: course.difficulty,
          category: course.category,
          status: enrollment.status,
          overallProgress: enrollment.overallProgress || 0,
          completedLessons: courseCompletedLessons,
          totalLessons: courseTotalLessons,
          timeSpentMinutes: courseTimeSpent,
          enrolledAt: enrollment.createdAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          completionDate: enrollment.completionDate,
        });
      }

      // Calculate tutorial stats
      const completedTutorials = tutorialProgress.filter(
        (p) => p.completionPercent === 100
      ).length;
      const tutorialTimeSpent = tutorialProgress.reduce(
        (acc, p) => acc + (p.timeSpentMinutes || 0),
        0
      );

      // Build response
      const dashboard = {
        overview: {
          totalLessonsCompleted,
          totalLessons,
          lessonsCompletionPercent:
            totalLessons > 0
              ? Math.round((totalLessonsCompleted / totalLessons) * 100)
              : 0,
          totalTimeSpentMinutes:
            totalTimeSpentMinutes +
            tutorialTimeSpent +
            (gamification?.statistics?.totalTimeSpentMinutes || 0),
          totalCoursesEnrolled: enrollments.length,
          completedCourses,
          activeCourses,
          completedTutorials,
          totalTutorials: tutorialProgress.length,
          certificatesEarned: certificates.length,
          codeExecutions: gamification?.statistics?.codeExecutions || 0,
          quizzesCompleted: gamification?.statistics?.quizzesCompleted || 0,
        },
        courseProgress: courseProgressList,
        tutorialProgress: tutorialProgress.map((p) => ({
          tutorialId: p.tutorial?._id,
          title: p.tutorial?.title,
          language: p.tutorial?.language,
          difficulty: p.tutorial?.difficulty,
          concept: p.tutorial?.concept,
          completionPercent: p.completionPercent,
          timeSpentMinutes: p.timeSpentMinutes,
          lastAccessed: p.lastAccessed,
        })),
        streak: {
          currentStreak: streak?.currentStreak || 0,
          longestStreak: streak?.longestStreak || 0,
          totalStreakDays: streak?.totalStreakDays || 0,
          lastActivityDate: streak?.lastActivityDate,
        },
        gamification: {
          level: gamification?.level || 1,
          totalPoints: gamification?.totalPoints || 0,
          experiencePoints: gamification?.experiencePoints || 0,
          badgesEarned: gamification?.badges?.length || 0,
        },
        certificates: certificates.map((c) => ({
          id: c._id,
          courseName: c.course?.title,
          courseLanguage: c.course?.language,
          certificateNumber: c.certificateNumber,
          finalScore: c.finalScore,
          issuedDate: c.approvalDate || c.issuedDate,
        })),
      };

      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      console.error("Error fetching progress dashboard:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching progress dashboard",
        error: error.message,
      });
    }
  }

  // Get performance analytics (strengths/weaknesses)
  async getPerformanceAnalytics(req, res) {
    try {
      const userId = req.user._id;

      // Fetch enrollments with quiz data
      const enrollments = await CourseEnrollment.find({ user: userId }).populate(
        {
          path: "course",
          select: "title language category difficulty sections",
          populate: { path: "sections", select: "title sectionQuiz order" },
        }
      );

      const gamification = await UserGamification.findOne({ user: userId });

      // Analyze quiz performance by language/category
      const languagePerformance = {};
      const categoryPerformance = {};
      const quizScores = [];

      for (const enrollment of enrollments) {
        const course = enrollment.course;
        if (!course) continue;

        const lang = course.language || "unknown";
        const cat = course.category || "general";

        // Initialize
        if (!languagePerformance[lang]) {
          languagePerformance[lang] = {
            totalQuizzes: 0,
            totalScore: 0,
            coursesEnrolled: 0,
            coursesCompleted: 0,
            lessonsCompleted: 0,
            timeSpentMinutes: 0,
          };
        }
        if (!categoryPerformance[cat]) {
          categoryPerformance[cat] = {
            totalQuizzes: 0,
            totalScore: 0,
            coursesEnrolled: 0,
            coursesCompleted: 0,
          };
        }

        languagePerformance[lang].coursesEnrolled++;
        categoryPerformance[cat].coursesEnrolled++;

        if (enrollment.status === "completed") {
          languagePerformance[lang].coursesCompleted++;
          categoryPerformance[cat].coursesCompleted++;
        }

        languagePerformance[lang].timeSpentMinutes +=
          enrollment.totalTimeSpentMinutes || 0;

        // Count completed lessons
        if (enrollment.sectionProgress) {
          for (const sp of enrollment.sectionProgress) {
            const completed = sp.lessons
              ? sp.lessons.filter((l) => l.isCompleted).length
              : 0;
            languagePerformance[lang].lessonsCompleted += completed;

            // Collect quiz scores
            if (sp.sectionQuizScore && sp.sectionQuizScore.score !== undefined) {
              quizScores.push({
                score: sp.sectionQuizScore.score,
                language: lang,
                category: cat,
                passed: sp.sectionQuizScore.passed,
                courseName: course.title,
              });
              languagePerformance[lang].totalQuizzes++;
              languagePerformance[lang].totalScore +=
                sp.sectionQuizScore.score;
              categoryPerformance[cat].totalQuizzes++;
              categoryPerformance[cat].totalScore +=
                sp.sectionQuizScore.score;
            }
          }
        }

        // Final quiz score
        if (
          enrollment.finalQuizScore &&
          enrollment.finalQuizScore.score !== undefined
        ) {
          quizScores.push({
            score: enrollment.finalQuizScore.score,
            language: lang,
            category: cat,
            passed: enrollment.finalQuizScore.passed,
            courseName: course.title,
            isFinal: true,
          });
          languagePerformance[lang].totalQuizzes++;
          languagePerformance[lang].totalScore +=
            enrollment.finalQuizScore.score;
          categoryPerformance[cat].totalQuizzes++;
          categoryPerformance[cat].totalScore +=
            enrollment.finalQuizScore.score;
        }
      }

      // Calculate averages and determine strengths/weaknesses
      const strengths = [];
      const weaknesses = [];

      for (const [lang, data] of Object.entries(languagePerformance)) {
        const avgScore =
          data.totalQuizzes > 0
            ? Math.round(data.totalScore / data.totalQuizzes)
            : null;
        const completionRate =
          data.coursesEnrolled > 0
            ? Math.round((data.coursesCompleted / data.coursesEnrolled) * 100)
            : 0;

        const entry = {
          language: lang,
          averageQuizScore: avgScore,
          completionRate,
          coursesEnrolled: data.coursesEnrolled,
          coursesCompleted: data.coursesCompleted,
          lessonsCompleted: data.lessonsCompleted,
          totalQuizzes: data.totalQuizzes,
          timeSpentMinutes: data.timeSpentMinutes,
        };

        if (avgScore !== null && avgScore >= 70) {
          strengths.push(entry);
        } else if (avgScore !== null && avgScore < 70) {
          weaknesses.push(entry);
        } else if (completionRate >= 50) {
          strengths.push(entry);
        } else {
          weaknesses.push(entry);
        }
      }

      // Sort by score
      strengths.sort(
        (a, b) => (b.averageQuizScore || 0) - (a.averageQuizScore || 0)
      );
      weaknesses.sort(
        (a, b) => (a.averageQuizScore || 0) - (b.averageQuizScore || 0)
      );

      // Overall stats
      const totalQuizzes = quizScores.length;
      const averageScore =
        totalQuizzes > 0
          ? Math.round(
              quizScores.reduce((acc, q) => acc + q.score, 0) / totalQuizzes
            )
          : 0;
      const passRate =
        totalQuizzes > 0
          ? Math.round(
              (quizScores.filter((q) => q.passed).length / totalQuizzes) * 100
            )
          : 0;

      // Points history for trend chart (last 30 entries)
      const pointsHistory = gamification?.pointsHistory
        ? gamification.pointsHistory
            .slice(-30)
            .map((p) => ({
              date: p.date,
              points: p.points,
              reason: p.reason,
            }))
        : [];

      res.status(200).json({
        success: true,
        data: {
          overallStats: {
            totalQuizzes,
            averageScore,
            passRate,
            totalPoints: gamification?.totalPoints || 0,
            level: gamification?.level || 1,
          },
          strengths,
          weaknesses,
          languagePerformance: Object.entries(languagePerformance).map(
            ([lang, data]) => ({
              language: lang,
              ...data,
              averageScore:
                data.totalQuizzes > 0
                  ? Math.round(data.totalScore / data.totalQuizzes)
                  : null,
            })
          ),
          categoryPerformance: Object.entries(categoryPerformance).map(
            ([cat, data]) => ({
              category: cat,
              ...data,
              averageScore:
                data.totalQuizzes > 0
                  ? Math.round(data.totalScore / data.totalQuizzes)
                  : null,
            })
          ),
          quizScores: quizScores.slice(-20), // Last 20 quiz scores
          pointsHistory,
        },
      });
    } catch (error) {
      console.error("Error fetching performance analytics:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching performance analytics",
        error: error.message,
      });
    }
  }

  // Export progress report as JSON (frontend converts to CSV/PDF)
  async exportProgressReport(req, res) {
    try {
      const userId = req.user._id;
      const { format = "json" } = req.query;

      // Fetch all data
      const [enrollments, gamification, streak, tutorialProgress, certificates] =
        await Promise.all([
          CourseEnrollment.find({ user: userId }).populate(
            "course",
            "title language difficulty category"
          ),
          UserGamification.findOne({ user: userId }),
          Streak.findOne({ user: userId }),
          Progress.find({ user: userId }).populate(
            "tutorial",
            "title language difficulty"
          ),
          Certificate.find({ user: userId, approvalStatus: "approved" }).populate(
            "course",
            "title language"
          ),
        ]);

      const userName = req.user.name || "User";
      const reportDate = new Date().toISOString();

      // Build detailed report
      const report = {
        reportTitle: "LearnCode AI - Progress Report",
        generatedAt: reportDate,
        userName,

        summary: {
          totalCoursesEnrolled: enrollments.length,
          completedCourses: enrollments.filter(
            (e) => e.status === "completed"
          ).length,
          activeCourses: enrollments.filter((e) => e.status === "active")
            .length,
          completedTutorials: tutorialProgress.filter(
            (p) => p.completionPercent === 100
          ).length,
          totalTutorials: tutorialProgress.length,
          certificatesEarned: certificates.length,
          totalPoints: gamification?.totalPoints || 0,
          level: gamification?.level || 1,
          currentStreak: streak?.currentStreak || 0,
          longestStreak: streak?.longestStreak || 0,
          codeExecutions: gamification?.statistics?.codeExecutions || 0,
          quizzesCompleted: gamification?.statistics?.quizzesCompleted || 0,
          totalTimeSpentMinutes: enrollments.reduce(
            (acc, e) => acc + (e.totalTimeSpentMinutes || 0),
            0
          ),
        },

        courses: enrollments.map((e) => ({
          title: e.course?.title || "Unknown",
          language: e.course?.language || "N/A",
          difficulty: e.course?.difficulty || "N/A",
          category: e.course?.category || "N/A",
          status: e.status,
          progress: `${e.overallProgress || 0}%`,
          timeSpentMinutes: e.totalTimeSpentMinutes || 0,
          enrolledDate: e.createdAt,
          completionDate: e.completionDate || null,
        })),

        tutorials: tutorialProgress.map((p) => ({
          title: p.tutorial?.title || "Unknown",
          language: p.tutorial?.language || "N/A",
          difficulty: p.tutorial?.difficulty || "N/A",
          completion: `${p.completionPercent || 0}%`,
          timeSpentMinutes: p.timeSpentMinutes || 0,
          lastAccessed: p.lastAccessed,
        })),

        certificates: certificates.map((c) => ({
          course: c.course?.title || "Unknown",
          certificateNumber: c.certificateNumber,
          score: `${c.finalScore}%`,
          issuedDate: c.approvalDate || c.issuedDate,
        })),

        pointsBreakdown: {
          courseCompletion:
            gamification?.pointsBreakdown?.courseCompletion || 0,
          tutorialCompletion:
            gamification?.pointsBreakdown?.tutorialCompletion || 0,
          codeExecution:
            gamification?.pointsBreakdown?.codeExecution || 0,
          quizCompletion:
            gamification?.pointsBreakdown?.quizCompletion || 0,
          streakBonus: gamification?.pointsBreakdown?.streakBonus || 0,
        },
      };

      if (format === "csv") {
        // Generate CSV
        let csv =
          "LearnCode AI Progress Report\n" +
          `Generated: ${new Date(reportDate).toLocaleDateString()}\n` +
          `User: ${userName}\n\n`;

        // Summary
        csv += "--- SUMMARY ---\n";
        csv += `Total Courses Enrolled,${report.summary.totalCoursesEnrolled}\n`;
        csv += `Completed Courses,${report.summary.completedCourses}\n`;
        csv += `Active Courses,${report.summary.activeCourses}\n`;
        csv += `Completed Tutorials,${report.summary.completedTutorials}\n`;
        csv += `Certificates Earned,${report.summary.certificatesEarned}\n`;
        csv += `Total Points,${report.summary.totalPoints}\n`;
        csv += `Level,${report.summary.level}\n`;
        csv += `Current Streak,${report.summary.currentStreak} days\n`;
        csv += `Longest Streak,${report.summary.longestStreak} days\n`;
        csv += `Code Executions,${report.summary.codeExecutions}\n`;
        csv += `Quizzes Completed,${report.summary.quizzesCompleted}\n`;
        csv += `Total Time Spent,${report.summary.totalTimeSpentMinutes} minutes\n\n`;

        // Courses
        csv += "--- COURSES ---\n";
        csv += "Title,Language,Difficulty,Status,Progress,Time Spent (min),Enrolled Date\n";
        report.courses.forEach((c) => {
          csv += `"${c.title}",${c.language},${c.difficulty},${c.status},${c.progress},${c.timeSpentMinutes},${c.enrolledDate ? new Date(c.enrolledDate).toLocaleDateString() : "N/A"}\n`;
        });
        csv += "\n";

        // Tutorials
        csv += "--- TUTORIALS ---\n";
        csv += "Title,Language,Difficulty,Completion,Time Spent (min)\n";
        report.tutorials.forEach((t) => {
          csv += `"${t.title}",${t.language},${t.difficulty},${t.completion},${t.timeSpentMinutes}\n`;
        });
        csv += "\n";

        // Certificates
        csv += "--- CERTIFICATES ---\n";
        csv += "Course,Certificate Number,Score,Issued Date\n";
        report.certificates.forEach((c) => {
          csv += `"${c.course}",${c.certificateNumber},${c.score},${c.issuedDate ? new Date(c.issuedDate).toLocaleDateString() : "N/A"}\n`;
        });

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="progress_report_${Date.now()}.csv"`
        );
        return res.send(csv);
      }

      // Default: JSON
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error("Error exporting progress report:", error);
      res.status(500).json({
        success: false,
        message: "Error exporting progress report",
        error: error.message,
      });
    }
  }
}

export default new ProgressTrackingController();
