import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import AdminUserList from '@/components/admin-user-list';
import type { IUser } from '@/models/User';

async function getUsers() {
  await dbConnect();
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(users)) as IUser[];
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  return <AdminUserList users={users} />;
}
