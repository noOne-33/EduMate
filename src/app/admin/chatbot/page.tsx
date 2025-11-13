import dbConnect from '@/lib/mongodb';
import Faq from '@/models/Faq';
import AdminChatbotClient from '@/components/admin-chatbot-client';

async function getFaqs() {
  await dbConnect();
  try {
    const faqs = await Faq.find({}).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(faqs));
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    return [];
  }
}

export default async function AdminChatbotPage() {
  const faqs = await getFaqs();
  return <AdminChatbotClient initialFaqs={faqs} />;
}
