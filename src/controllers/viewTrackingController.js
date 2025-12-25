import Tutorial from "../models/Tutorial.js";
import Course from "../models/Course.js";

/**
 * Increment tutorial view count
 */
export const incrementTutorialView = async (req, res) => {
  try {
    const { tutorialId } = req.params;

    const tutorial = await Tutorial.findByIdAndUpdate(
      tutorialId,
      { $inc: { viewCount: 1 } },
      { 
        new: true, 
        select: "viewCount",
        timestamps: false // Prevent updatedAt from being modified
      }
    );

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: "Tutorial not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "View tracked successfully",
      data: {
        viewCount: tutorial.viewCount
      }
    });
  } catch (error) {
    console.error("Error tracking tutorial view:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track tutorial view",
      error: error.message
    });
  }
};

/**
 * Increment course view count
 */
export const incrementCourseView = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByIdAndUpdate(
      courseId,
      { $inc: { viewCount: 1 } },
      { 
        new: true, 
        select: "viewCount",
        timestamps: false // Prevent updatedAt from being modified
      }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "View tracked successfully",
      data: {
        viewCount: course.viewCount
      }
    });
  } catch (error) {
    console.error("Error tracking course view:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track course view",
      error: error.message
    });
  }
};

/**
 * Get most viewed tutorials
 */
export const getMostViewedTutorials = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const tutorials = await Tutorial.find({ isPublished: true })
      .sort({ viewCount: -1 })
      .limit(limit)
      .select("title language concept difficulty viewCount createdAt")
      .populate("createdBy", "name");

    res.status(200).json({
      success: true,
      data: tutorials
    });
  } catch (error) {
    console.error("Error fetching most viewed tutorials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch most viewed tutorials",
      error: error.message
    });
  }
};

/**
 * Get most viewed courses
 */
export const getMostViewedCourses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const courses = await Course.find({ isPublished: true, isArchived: false })
      .sort({ viewCount: -1 })
      .limit(limit)
      .select("title language category difficulty viewCount enrollmentCount createdAt")
      .populate("instructor", "name");

    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error("Error fetching most viewed courses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch most viewed courses",
      error: error.message
    });
  }
};

/**
 * Get most viewed content (combined tutorials and courses)
 */
export const getMostViewedContent = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Fetch tutorials
    const tutorials = await Tutorial.find({ isPublished: true })
      .sort({ viewCount: -1 })
      .limit(limit)
      .select("title language viewCount createdAt")
      .populate("createdBy", "name")
      .lean();

    // Fetch courses
    const courses = await Course.find({ isPublished: true, isArchived: false })
      .sort({ viewCount: -1 })
      .limit(limit)
      .select("title language viewCount createdAt")
      .populate("instructor", "name")
      .lean();

    // Add type field
    const tutorialsWithType = tutorials.map(t => ({ ...t, type: "tutorial", views: t.viewCount }));
    const coursesWithType = courses.map(c => ({ ...c, type: "course", views: c.viewCount }));

    // Combine and sort
    const combined = [...tutorialsWithType, ...coursesWithType]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: combined
    });
  } catch (error) {
    console.error("Error fetching most viewed content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch most viewed content",
      error: error.message
    });
  }
};

