import dbConnect from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import AdminBillingClient from '@/components/admin-billing-client';
import type { IEnrollment } from '@/models/Enrollment';
import User from '@/models/User';
import Course from '@/models/Course';

async function getEnrollments() {
  await dbConnect();
  try {
    // We populate user and course to get their names/titles
    const enrollments = await Enrollment.find({})
      .populate('user', 'name email')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(enrollments));
  } catch (error) {
    console.error("Failed to fetch enrollments:", error);
    return [];
  }
}

export default async function AdminBillingPage() {
  const enrollments = await getEnrollments();
  return <AdminBillingClient enrollments={enrollments} />;
}
