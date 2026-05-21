// Seed runner for the 3 comprehensive courses (Python, JavaScript, C++).
// Reads the blueprints in seedData/*Course.js and writes Course + CourseSection +
// CourseLesson + Quiz documents. Safe to re-run — wipes existing courses for
// the same languages first.

import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import CourseLesson from "../models/CourseLesson.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";

import pythonCourse from "./seedData/pythonCourse.js";
import javascriptCourse from "./seedData/javascriptCourse.js";
import cppCourse from "./seedData/cppCourse.js";

const BLUEPRINTS = [pythonCourse, javascriptCourse, cppCourse];

const ensureInstructor = async () => {
  let user = await User.findOne({ role: "admin" });
  if (user) return user;
  user = await User.findOne();
  if (user) {
    console.log(`ℹ️  No admin user found — using ${user.email} as instructor.`);
    return user;
  }
  throw new Error(
    "No users in the database. Register at least one user before seeding courses."
  );
};

const seedOneCourse = async (blueprint, instructor) => {
  const { sections, finalQuiz, ...courseData } = blueprint;

  // Wipe any existing course (and its sections, lessons, section quizzes,
  // final quiz) for this language + title — keeps re-runs idempotent.
  const existing = await Course.find({
    language: blueprint.language,
    title: blueprint.title,
  });
  for (const c of existing) {
    const oldSections = await CourseSection.find({ course: c._id });
    const sectionIds = oldSections.map((s) => s._id);
    await CourseLesson.deleteMany({ section: { $in: sectionIds } });
    await Quiz.deleteMany({ section: { $in: sectionIds } });
    if (c.finalQuiz) await Quiz.deleteOne({ _id: c.finalQuiz });
    await CourseSection.deleteMany({ course: c._id });
    await Course.deleteOne({ _id: c._id });
  }

  // Create the course shell first — sections need a course id.
  const course = await Course.create({
    ...courseData,
    instructor: instructor._id,
    sections: [],
    isPublished: true,
  });

  const sectionIds = [];
  let totalLessons = 0;

  for (const sectionData of sections) {
    const { lessons, quiz, ...sectionFields } = sectionData;

    const section = await CourseSection.create({
      ...sectionFields,
      course: course._id,
      lessons: [],
    });

    const lessonIds = [];
    for (const lesson of lessons) {
      const created = await CourseLesson.create({
        ...lesson,
        section: section._id,
      });
      lessonIds.push(created._id);
      totalLessons++;
    }
    section.lessons = lessonIds;

    if (quiz) {
      const q = await Quiz.create({
        ...quiz,
        type: "section-quiz",
        course: course._id,
        section: section._id,
        language: blueprint.language,
        difficulty: blueprint.difficulty,
        isPublished: true,
      });
      section.sectionQuiz = q._id;
    }

    await section.save();
    sectionIds.push(section._id);
  }

  if (finalQuiz) {
    const fq = await Quiz.create({
      ...finalQuiz,
      type: "final-quiz",
      course: course._id,
      language: blueprint.language,
      difficulty: blueprint.difficulty,
      isPublished: true,
    });
    course.finalQuiz = fq._id;
  }

  course.sections = sectionIds;
  course.totalSections = sectionIds.length;
  course.totalLessons = totalLessons;
  await course.save();

  console.log(
    `   ✓ ${blueprint.language.padEnd(11)} — ${course.title} ` +
      `(${sectionIds.length} sections, ${totalLessons} lessons)`
  );
};

const seedAllCourses = async () => {
  console.log("🌱 Seeding courses...");
  const instructor = await ensureInstructor();

  for (const blueprint of BLUEPRINTS) {
    await seedOneCourse(blueprint, instructor);
  }

  const total = await Course.countDocuments({ isPublished: true });
  console.log(`\n✅ ${total} published courses live.`);
};

export default seedAllCourses;
