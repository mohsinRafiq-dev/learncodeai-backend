import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Adjust for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Certificate from './src/models/Certificate.js';
import User from './src/models/User.js';
import Course from './src/models/Course.js';
import CourseEnrollment from './src/models/CourseEnrollment.js';

async function seedCertificates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/LearnCodeAI');
    console.log('✅ Connected to MongoDB');

    // Get all users and courses
    const users = await User.find().limit(5);
    const courses = await Course.find().limit(3);

    if (users.length === 0 || courses.length === 0) {
      console.log('⚠️ Need at least one user and one course to seed certificates.');
      process.exit(1);
    }

    console.log(`Seeding certificates for ${users.length} users and ${courses.length} courses...`);

    let count = 0;
    for (const user of users) {
      for (const course of courses) {
        // Ensure enrollment exists
        let enrollment = await CourseEnrollment.findOne({ user: user._id, course: course._id });
        if (!enrollment) {
            enrollment = new CourseEnrollment({
                user: user._id,
                course: course._id,
                status: 'completed',
                overallProgress: 100,
                certificateIssued: true
            });
            await enrollment.save();
        }

        // Check if certificate already exists
        const exists = await Certificate.findOne({ user: user._id, course: course._id });
        if (!exists) {
          const cert = new Certificate({
            user: user._id,
            course: course._id,
            enrollment: enrollment._id,
            certificateNumber: `CERT-${Date.now()}-${user._id.toString().slice(-6)}`,
            finalScore: Math.floor(Math.random() * 20) + 80, // 80-100
            template: 'standard',
            isValid: true,
            approvalStatus: 'approved',
            approvalDate: new Date(Date.now() - Math.random() * 10000000000), // Random past date
          });
          await cert.save();
          
          enrollment.certificate = cert._id;
          await enrollment.save();
          
          count++;
        }
      }
    }

    console.log(`✅ Successfully seeded ${count} certificates!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding certificates:', err);
    process.exit(1);
  }
}

seedCertificates();
