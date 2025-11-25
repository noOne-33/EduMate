import AdminBillingClient from '@/components/admin-billing-client';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';

async function getEnrollments() {
  await dbConnect();

  // The following lines are the fix. By referencing the models, we ensure
  // that their schemas are registered with Mongoose before we try to populate them.
  // This is a common requirement in serverless environments.
  User.schema;
  Course.schema;

  try {
    // We populate user and course to get their names/titles
    const enrollments = await Enrollment.find({})
      .populate('user', 'name email')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(enrollments));
  } catch (error) {
    console.error('Failed to fetch enrollments:', error);
    return [];
  }
}

export default async function AdminBillingPage() {
  const enrollments = await getEnrollments();
  return <AdminBillingClient enrollments={enrollments} />;
}
