import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect('mongodb://localhost:27017/LearnCodeAI');
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.log('No admin found');
    process.exit(1);
  }
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'your-super-secret-jwt-key', { expiresIn: '1d' });
  const res = await fetch('http://localhost:5000/api/admin/certificates', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Status:', res.status);
  console.log(await res.text());
  process.exit(0);
}
run();
