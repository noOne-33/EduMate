import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import AdminCategoryClient from '@/components/admin-category-client';

async function getCategories() {
  await dbConnect();
  try {
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories();
  return <AdminCategoryClient categories={categories} />;
}
