# EduMate - Online Learning Platform

EduMate is a modern, feature-rich online learning platform built with Next.js and MongoDB. It provides a seamless experience for students, instructors, and administrators to manage and engage with educational content. The platform leverages AI for personalized recommendations and includes a complete course management and enrollment system.

## ✨ Key Features

- **Role-Based Access Control**: Separate dashboards and permissions for Students, Instructors, and Admins.
- **Complete Course Lifecycle**: Admins can create, edit, and manage courses, instructors, and categories. Instructors can manage their assigned course content.
- **Student Enrollment**: A secure payment and enrollment workflow for students to join courses.
- **Rich Course Content**: Instructors can add lectures (YouTube, PDF, URL), assignments, and quizzes.
- **Student Progress Tracking**: Instructors can view student assignment submissions, grade them, and track overall progress.
- **Interactive Quizzes**: Create quizzes with multiple-choice questions to assess student understanding.
- **Certificate Generation**: Students can download a verifiable PDF certificate upon course completion.
- **AI-Powered Recommendations**: Personalized course suggestions for students based on their activity.
- **Administrative Oversight**: Comprehensive admin dashboard with analytics on revenue, enrollments, and user activity.
- **Chatbot Support**: An integrated chatbot to assist users with frequently asked questions.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [ShadCN UI](https://ui.shadcn.com/) components
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/)
- **Generative AI**: [Google's Genkit]
- **PDF Generation**: `jsPDF` and `html2canvas`

## 🛠️ Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A MongoDB database instance (local or cloud-hosted, e.g., [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/noOne-33/EduMate.git
    cd edumate
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    Create a file named `.env` in the root of the project and add the following variables:

    ```env
    # Your MongoDB connection string
    MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

    # A strong, secret key for signing JWTs (e.g., generate one with `openssl rand -base64 32`)
    JWT_SECRET=your-super-secret-key
    ```

### Running the Application

1.  **Seed the database:**
    This script will clear and populate the database with initial sample data for courses, categories, lectures, and assignments.
    ```bash
    npm run db:seed
    ```
    *Note: This is a destructive operation for the collections it manages. It will preserve `users` and `enrollments`.*

2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:9005](http://localhost:9005).

##  NPM Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts a production server.
- `npm run lint`: Runs ESLint to check for code quality.
- `npm run db:seed`: Clears and seeds the database with initial data.
- `npm run db:make-admin`: Assigns the 'admin' role to a specific user (edit email in `scripts/make-admin.ts`).
