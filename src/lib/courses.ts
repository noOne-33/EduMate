export type Course = {
  id: string;
  title: string;
  instructor: string;
  description: string;
  category: string;
  imageId: string;
  duration: string;
  rating: number;
  price: number;
};

export const courses: Course[] = [
  {
    id: '1',
    title: 'Web Development Bootcamp',
    instructor: 'Angela Yu',
    description: 'Become a Full-Stack Web Developer with just one course. HTML, CSS, Javascript, Node, React, MongoDB and more!',
    category: 'Development',
    imageId: 'course-1',
    duration: '62.5 hours',
    rating: 4.7,
    price: 1500,
  },
  {
    id: '2',
    title: 'The Ultimate Drawing Course',
    instructor: 'Jaysen Arts',
    description: 'Learn the #1 most important building block of all art, drawing. This course will teach you how to draw like a pro!',
    category: 'Design',
    imageId: 'course-2',
    duration: '11 hours',
    rating: 4.6,
    price: 1200,
  },
  {
    id: '3',
    title: 'Pianoforall - Incredible New Way To Learn Piano',
    instructor: 'Robin Hall',
    description: 'Learn Piano in WEEKS not years. Play-By-Ear & learn to Read Music. Pop, Blues, Jazz, Ballads, Improvisation, Classical.',
    category: 'Music',
    imageId: 'course-3',
    duration: '23 hours',
    rating: 4.5,
    price: 2000,
  },
  {
    id: '4',
    title: 'The Complete Digital Marketing Course',
    instructor: 'Rob Percival',
    description: 'Master Digital Marketing: Strategy, Social Media Marketing, SEO, YouTube, Email, Facebook Marketing, Analytics & More!',
    category: 'Marketing',
    imageId: 'course-4',
    duration: '83.5 hours',
    rating: 4.6,
    price: 2500,
  },
  {
    id: '5',
    title: 'Writing With Flair: How To Become An Exceptional Writer',
    instructor: 'Shani Raja',
    description: 'Ex-Wall Street Journal editor teaches you how to write with style, punch and precision.',
    category: 'Writing',
    imageId: 'course-5',
    duration: '7 hours',
    rating: 4.7,
    price: 900,
  },
  {
    id: '6',
    title: 'Photography Masterclass: A Complete Guide to Photography',
    instructor: 'Phil Ebiner',
    description: 'The Best Online Professional Photography Class: How to Take Amazing Photos for Beginners & Advanced Photographers.',
    category: 'Photography',
    imageId: 'course-6',
    duration: '23.5 hours',
    rating: 4.7,
    price: 1800,
  },
];
