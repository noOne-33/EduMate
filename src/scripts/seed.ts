
import 'dotenv/config';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Category from '@/models/Category';
import Lecture from '@/models/Lecture';
import Assignment from '@/models/Assignment';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import { courses as seedCourses } from '@/lib/courses';
import mongoose from 'mongoose';

async function seedDatabase() {
  console.log('Connecting to database...');
  await dbConnect();
  console.log('Database connected.');

  try {
    console.log('Clearing existing course-related data (users and enrollments will be preserved)...');
    
    // Clear only the collections managed by this seed script
    await Course.deleteMany({});
    await Category.deleteMany({});
    await Lecture.deleteMany({});
    await Assignment.deleteMany({});
    await Quiz.deleteMany({});
    await Question.deleteMany({});

    console.log('Seeding fresh data...');
    
    // 1. Seed Categories from courses
    const categoryNames = [...new Set(seedCourses.map(c => c.category))];
    const categoriesToInsert = categoryNames.map(name => ({ name }));
    const categories = await Category.insertMany(categoriesToInsert);
    console.log(`${categories.length} categories seeded.`);
    
    // 2. Seed Courses
    const coursesToInsert = seedCourses.map(({ id, ...course }) => ({
        ...course,
        status: 'active'
    }));
    const insertedCourses = await Course.insertMany(coursesToInsert);
    console.log(`${insertedCourses.length} courses seeded.`);

    let webDevCourseId = null;

    // 3. Seed Lectures and Assignments for each course
    for (const course of insertedCourses) {
        if (course.title === 'Web Development Bootcamp') {
            webDevCourseId = course._id;
        }
        // Seed 3 lectures
        for (let i = 1; i <= 3; i++) {
            await Lecture.create({
                course: course._id,
                title: `Lecture ${i}: Introduction to ${course.title}`,
                type: 'youtube',
                content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                order: i,
            });
        }
        console.log(`Seeded 3 lectures for "${course.title}".`);

        // Seed 2 assignments
        for (let i = 1; i <= 2; i++) {
            await Assignment.create({
                course: course._id,
                assignmentNumber: i,
                name: `Assignment ${i}: ${course.title} Basics`,
                description: `This is the description for assignment ${i}.`,
                instructions: `Follow these instructions carefully for assignment ${i}.`
            });
        }
        console.log(`Seeded 2 assignments for "${course.title}".`);
    }
    
    // 4. Seed a Quiz for a specific course
    if (webDevCourseId) {
        const quiz = await Quiz.create({
            course: webDevCourseId,
            title: 'HTML & CSS Basics Quiz',
            description: 'Test your knowledge of the fundamental building blocks of the web.'
        });
        console.log(`Seeded 1 quiz for "Web Development Bootcamp".`);

        await Question.create([
            {
                quiz: quiz._id,
                questionText: 'What does HTML stand for?',
                options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyperlink and Text Markup Language'],
                correctAnswer: 0
            },
            {
                quiz: quiz._id,
                questionText: 'Which CSS property is used to change the background color of an element?',
                options: ['color', 'bgcolor', 'background-color'],
                correctAnswer: 2
            },
             {
                quiz: quiz._id,
                questionText: 'What is the correct HTML for creating a hyperlink?',
                options: ['<link href="url">', '<a href="url">Link</a>', '<href>url</href>'],
                correctAnswer: 1
            }
        ]);
        console.log(`Seeded 3 questions for the quiz.`);
    }


    console.log('Database seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    console.log('Closing database connection...');
    await mongoose.disconnect();
    console.log('Connection closed.');
  }
}

seedDatabase();
