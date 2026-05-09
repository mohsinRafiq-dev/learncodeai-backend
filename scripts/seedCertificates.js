import connectDB from "../src/config/database.js";
import User from "../src/models/User.js";
import Course from "../src/models/Course.js";
import CourseEnrollment from "../src/models/CourseEnrollment.js";
import Certificate from "../src/models/Certificate.js";

const TARGET_CERTIFICATES = Number.parseInt(process.argv[2] || "6", 10);

const randomScore = () => 75 + Math.floor(Math.random() * 25);

const buildCertificateNumber = (userId) =>
  `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}-${userId
    .toString()
    .slice(-6)}`;

const ensureEnrollmentCompletion = async (enrollment, score) => {
  if (enrollment.status !== "completed") {
    enrollment.status = "completed";
  }

  if (!enrollment.completionDate) {
    enrollment.completionDate = new Date();
  }

  if (!enrollment.overallProgress || enrollment.overallProgress < 100) {
    enrollment.overallProgress = 100;
  }

  enrollment.certificateIssued = true;

  if (!enrollment.finalQuizScore || enrollment.finalQuizScore.passed !== true) {
    enrollment.finalQuizScore = {
      quizId: enrollment.finalQuizScore?.quizId || null,
      score,
      maxScore: 100,
      attemptCount: Math.max(enrollment.finalQuizScore?.attemptCount || 0, 1),
      lastAttemptAt: new Date(),
      passed: true,
    };
  }

  await enrollment.save();
};

const createApprovedCertificate = async ({ userId, courseId, enrollmentId, score }) => {
  const existing = await Certificate.findOne({ user: userId, course: courseId });
  if (existing) {
    return { certificate: existing, created: false };
  }

  const certificate = await Certificate.create({
    user: userId,
    course: courseId,
    enrollment: enrollmentId,
    certificateNumber: buildCertificateNumber(userId),
    finalScore: score,
    template: "standard",
    isValid: true,
    approvalStatus: "approved",
    approvalDate: new Date(),
  });

  await CourseEnrollment.findByIdAndUpdate(enrollmentId, {
    certificateIssued: true,
    certificate: certificate._id,
    status: "completed",
    completionDate: new Date(),
    overallProgress: 100,
  });

  await User.findByIdAndUpdate(userId, {
    $addToSet: { certificates: certificate._id },
  });

  return { certificate, created: true };
};

const run = async () => {
  try {
    await connectDB();

    const activeUsers = await User.find({ role: "user", accountStatus: "active" })
      .select("_id name email")
      .limit(50);

    if (!activeUsers.length) {
      console.log("No active users found. Create/activate users first.");
      process.exit(0);
    }

    const publishedCourses = await Course.find({ isPublished: true, isArchived: false })
      .select("_id title")
      .limit(20);

    if (!publishedCourses.length) {
      console.log("No published courses found. Run seed:courses and publish courses first.");
      process.exit(0);
    }

    let createdCount = 0;
    let reusedCount = 0;

    for (const user of activeUsers) {
      for (const course of publishedCourses) {
        if (createdCount >= TARGET_CERTIFICATES) {
          break;
        }

        let enrollment = await CourseEnrollment.findOne({
          user: user._id,
          course: course._id,
        });

        const score = randomScore();

        if (!enrollment) {
          enrollment = await CourseEnrollment.create({
            user: user._id,
            course: course._id,
            status: "completed",
            completionDate: new Date(),
            certificateIssued: true,
            overallProgress: 100,
            finalQuizScore: {
              quizId: null,
              score,
              maxScore: 100,
              attemptCount: 1,
              lastAttemptAt: new Date(),
              passed: true,
            },
            lastAccessedAt: new Date(),
          });
        } else {
          await ensureEnrollmentCompletion(enrollment, score);
        }

        const { created } = await createApprovedCertificate({
          userId: user._id,
          courseId: course._id,
          enrollmentId: enrollment._id,
          score,
        });

        if (created) {
          createdCount += 1;
          console.log(
            `Created certificate for ${user.email} | ${course.title}`
          );
        } else {
          reusedCount += 1;
        }
      }

      if (createdCount >= TARGET_CERTIFICATES) {
        break;
      }
    }

    const totalCertificates = await Certificate.countDocuments();

    console.log("\nCertificate seed summary:");
    console.log(`Requested new certificates: ${TARGET_CERTIFICATES}`);
    console.log(`New certificates created: ${createdCount}`);
    console.log(`Existing certificates reused: ${reusedCount}`);
    console.log(`Total certificates in DB: ${totalCertificates}`);

    process.exit(0);
  } catch (error) {
    console.error("Certificate seeding failed:", error);
    process.exit(1);
  }
};

run();
