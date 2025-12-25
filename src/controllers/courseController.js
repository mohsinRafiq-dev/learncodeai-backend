import mongoose from "mongoose";
import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import CourseLesson from "../models/CourseLesson.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Quiz from "../models/Quiz.js";
import Certificate from "../models/Certificate.js";

// ========== PUBLIC ROUTES ==========

// Get all published courses with filters
export const getAllCourses = async (req, res) => {
  try {
    const { language, category, difficulty, page = 1, limit = 10 } = req.query;

    const filter = { isPublished: true, isArchived: false };

    if (language) filter.language = language.toLowerCase();
    if (category) filter.category = category.toLowerCase();
    if (difficulty) filter.difficulty = difficulty.toLowerCase();

    const skip = (page - 1) * limit;

    const courses = await Course.find(filter)
      .populate("instructor", "name email profilePicture")
      .populate("sections", "title order")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: error.message,
    });
  }
};

// Get single course with all details
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate("instructor", "name email profilePicture")
      .populate({
        path: "sections",
        populate: [
          { path: "lessons" },
          { path: "sectionQuiz" }
        ],
      })
      .populate("finalQuiz");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if user is enrolled (if authenticated)
    let enrollment = null;
    if (req.user) {
      enrollment = await CourseEnrollment.findOne({
        user: req.user._id,
        course: id,
      });
    }

    res.status(200).json({
      success: true,
      data: course,
      enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching course",
      error: error.message,
    });
  }
};

// Get course by language
export const getCoursesByLanguage = async (req, res) => {
  try {
    const { language } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const courses = await Course.find({
      language: language.toLowerCase(),
      isPublished: true,
      isArchived: false,
    })
      .populate("instructor", "name email profilePicture")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments({
      language: language.toLowerCase(),
      isPublished: true,
      isArchived: false,
    });

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: error.message,
    });
  }
};

// ========== ENROLLMENT ROUTES (Protected) ==========

// Enroll user in a course
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    // Create enrollment
    const enrollment = new CourseEnrollment({
      user: userId,
      course: courseId,
      sectionProgress: [],
    });

    await enrollment.save();

    // Update course enrollment count
    course.enrollmentCount = (course.enrollmentCount || 0) + 1;
    await course.save();

    res.status(201).json({
      success: true,
      message: "Successfully enrolled in course",
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error enrolling in course",
      error: error.message,
    });
  }
};

// Get user's enrolled courses
export const getUserEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status = "active", page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const filter = { user: userId };
    if (status) filter.status = status;

    const enrollments = await CourseEnrollment.find(filter)
      .populate({
        path: "course",
        populate: "instructor",
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ enrollmentDate: -1 });

    const total = await CourseEnrollment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: enrollments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching enrolled courses",
      error: error.message,
    });
  }
};

// Get course enrollment details for user
export const getEnrollmentDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    })
      .populate({
        path: "course",
        populate: ["instructor", "sections"],
      })
      .populate("certificate");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // Calculate progress information
    const course = enrollment.course;
    let totalLessons = 0;
    let completedLessons = 0;

    for (const section of course.sections) {
      const sectionLesson = await CourseLesson.countDocuments({
        section: section._id,
      });
      totalLessons += sectionLesson;

      const userSectionProgress = enrollment.sectionProgress.find(
        (sp) => sp.section.toString() === section._id.toString()
      );

      if (userSectionProgress) {
        completedLessons += userSectionProgress.lessons.filter(
          (lp) => lp.isCompleted
        ).length;
      }
    }

    res.status(200).json({
      success: true,
      data: enrollment,
      progress: {
        completedLessons,
        totalLessons,
        overallProgress: enrollment.overallProgress,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching enrollment details",
      error: error.message,
    });
  }
};

// Mark lesson as completed
export const completeLessonProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sectionId, lessonId, timeSpentMinutes = 0 } = req.body;
    const userId = req.user._id;

    // First, check if enrollment exists
    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // Check if section progress exists
    const sectionExists = enrollment.sectionProgress.some(
      (sp) => sp.section.toString() === sectionId
    );

    if (!sectionExists) {
      // Add new section progress with lesson
      await CourseEnrollment.updateOne(
        { user: userId, course: courseId },
        {
          $push: {
            sectionProgress: {
              section: sectionId,
              lessons: [{
                lesson: lessonId,
                isCompleted: true,
                completedAt: new Date(),
                timeSpentMinutes: timeSpentMinutes,
              }],
              isCompleted: false,
              lastAccessedAt: new Date(),
              timeSpentMinutes: timeSpentMinutes,
            },
          },
          $set: {
            lastAccessedAt: new Date(),
          },
          $inc: {
            totalTimeSpentMinutes: timeSpentMinutes,
          },
        }
      );
    } else {
      // Check if lesson progress exists
      const sectionProgress = enrollment.sectionProgress.find(
        (sp) => sp.section.toString() === sectionId
      );

      const lessonExists = sectionProgress.lessons.some(
        (lp) => lp.lesson.toString() === lessonId
      );

      if (!lessonExists) {
        // Add new lesson progress
        await CourseEnrollment.updateOne(
          {
            user: userId,
            course: courseId,
            "sectionProgress.section": sectionId,
          },
          {
            $push: {
              "sectionProgress.$.lessons": {
                lesson: lessonId,
                isCompleted: true,
                completedAt: new Date(),
                timeSpentMinutes: timeSpentMinutes,
              },
            },
            $set: {
              "sectionProgress.$.lastAccessedAt": new Date(),
              lastAccessedAt: new Date(),
            },
            $inc: {
              "sectionProgress.$.timeSpentMinutes": timeSpentMinutes,
              totalTimeSpentMinutes: timeSpentMinutes,
            },
          }
        );
      } else {
        // Update existing lesson progress
        const existingLesson = sectionProgress.lessons.find(
          (lp) => lp.lesson.toString() === lessonId
        );
        const previousTime = existingLesson.timeSpentMinutes || 0;
        const timeDifference = timeSpentMinutes - previousTime;

        await CourseEnrollment.updateOne(
          {
            user: userId,
            course: courseId,
            "sectionProgress.section": sectionId,
            "sectionProgress.lessons.lesson": lessonId,
          },
          {
            $set: {
              "sectionProgress.$[sp].lessons.$[lp].isCompleted": true,
              "sectionProgress.$[sp].lessons.$[lp].completedAt": new Date(),
              "sectionProgress.$[sp].lessons.$[lp].timeSpentMinutes": timeSpentMinutes,
              "sectionProgress.$[sp].lastAccessedAt": new Date(),
              lastAccessedAt: new Date(),
            },
            $inc: {
              "sectionProgress.$[sp].timeSpentMinutes": timeDifference,
              totalTimeSpentMinutes: timeDifference,
            },
          },
          {
            arrayFilters: [
              { "sp.section": sectionId },
              { "lp.lesson": lessonId },
            ],
          }
        );
      }
    }

    // Recalculate overall progress
    const updatedEnrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    const course = await Course.findById(courseId).populate("sections");
    let totalLessons = 0;
    let completedLessons = 0;

    for (const section of course.sections) {
      const sectionLesson = await CourseLesson.countDocuments({
        section: section._id,
      });
      totalLessons += sectionLesson;

      const userSectionProgress = updatedEnrollment.sectionProgress.find(
        (sp) => sp.section.toString() === section._id.toString()
      );

      if (userSectionProgress) {
        completedLessons += userSectionProgress.lessons.filter(
          (lp) => lp.isCompleted
        ).length;
      }
    }

    const overallProgress = Math.round((completedLessons / totalLessons) * 100);

    await CourseEnrollment.updateOne(
      { user: userId, course: courseId },
      { $set: { overallProgress } }
    );

    // Return updated enrollment
    const finalEnrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    res.status(200).json({
      success: true,
      message: "Lesson marked as completed",
      data: finalEnrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating lesson progress",
      error: error.message,
    });
  }
};

export default {
  getAllCourses,
  getCourseById,
  getCoursesByLanguage,
  enrollInCourse,
  getUserEnrolledCourses,
  getEnrollmentDetails,
  completeLessonProgress,
};

