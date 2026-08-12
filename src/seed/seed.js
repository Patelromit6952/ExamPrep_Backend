// /**
//  * Seeds the database with:
//  * - 1 admin user
//  * - 1 student user
//  * - 1 sample exam (published)
//  * - 1 section
//  * - 5 sample questions
//  *
//  * Usage:
//  *   npm run seed            -> insert seed data (clears prior seed data first)
//  *   npm run seed:destroy    -> remove all seed-created data
//  */
// import dotenv from "dotenv";
// dotenv.config();

// import mongoose from "mongoose";
// import connectDB from "../config/db.js";
// import User from "../models/User.js";
// import Exam from "../models/Exam.js";
// import Section from "../models/Section.js";
// import Question from "../models/Question.js";
// import Attempt from "../models/Attempt.js";
// import AttemptAnswer from "../models/AttemptAnswer.js";

// const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@examprep.in";
// const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
// const STUDENT_EMAIL = process.env.SEED_STUDENT_EMAIL || "student@examprep.in";
// const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || "Student@12345";

// const destroy = async () => {
//   await Promise.all([
//     AttemptAnswer.deleteMany({}),
//     Attempt.deleteMany({}),
//     Question.deleteMany({}),
//     Section.deleteMany({}),
//     Exam.deleteMany({}),
//     User.deleteMany({ email: { $in: [ADMIN_EMAIL, STUDENT_EMAIL] } }),
//   ]);
//   console.log("All seed data removed.");
// };

// const seed = async () => {
//   await destroy();

//   const admin = await User.create({
//     name: "Platform Admin",
//     email: ADMIN_EMAIL,
//     password: ADMIN_PASSWORD,
//     role: "admin",
//   });

//   const student = await User.create({
//     name: "Demo Student",
//     email: STUDENT_EMAIL,
//     password: STUDENT_PASSWORD,
//     role: "student",
//   });

//   const exam = await Exam.create({
//     title: "SSC CGL Tier 1 - General Awareness Mock Test 1",
//     description:
//       "A short practice mock test covering general awareness topics commonly seen in SSC CGL Tier 1 prelims.",
//     category: "SSC",
//     durationMinutes: 15,
//     totalMarks: 10,
//     negativeMarks: 0.5,
//     instructions: [
//       "This test contains 5 questions, each carrying 2 marks.",
//       "There is a negative marking of 0.5 marks for every wrong answer.",
//       "Unanswered questions carry no negative marks.",
//       "The timer starts as soon as you begin the test and cannot be paused.",
//       "The test will auto-submit when the time expires.",
//       "Use the question palette to navigate between questions and mark questions for review.",
//     ],
//     isPublished: true,
//     createdBy: admin._id,
//   });

//   const section = await Section.create({
//     examId: exam._id,
//     title: "General Awareness",
//     order: 0,
//   });

//   const questionsData = [
//     {
//       questionText: "Who is known as the 'Father of the Indian Constitution'?",
//       options: [
//         { id: "optA", text: "Mahatma Gandhi" },
//         { id: "optB", text: "Dr. B. R. Ambedkar" },
//         { id: "optC", text: "Jawaharlal Nehru" },
//         { id: "optD", text: "Sardar Vallabhbhai Patel" },
//       ],
//       correctOptionId: "optB",
//       marks: 2,
//       topic: "Indian Polity",
//       difficulty: "easy",
//       explanation:
//         "Dr. B. R. Ambedkar chaired the Drafting Committee of the Constituent Assembly and is widely regarded as the chief architect of the Indian Constitution.",
//     },
//     {
//       questionText: "The Reserve Bank of India was established in which year?",
//       options: [
//         { id: "optA", text: "1935" },
//         { id: "optB", text: "1947" },
//         { id: "optC", text: "1950" },
//         { id: "optD", text: "1969" },
//       ],
//       correctOptionId: "optA",
//       marks: 2,
//       topic: "Economy",
//       difficulty: "medium",
//       explanation: "The RBI was established on April 1, 1935, under the Reserve Bank of India Act, 1934.",
//     },
//     {
//       questionText: "Which river is known as the 'Sorrow of Bihar'?",
//       options: [
//         { id: "optA", text: "Ganga" },
//         { id: "optB", text: "Kosi" },
//         { id: "optC", text: "Son" },
//         { id: "optD", text: "Gandak" },
//       ],
//       correctOptionId: "optB",
//       marks: 2,
//       topic: "Geography",
//       difficulty: "medium",
//       explanation: "The Kosi river is called the 'Sorrow of Bihar' due to its frequent and devastating floods.",
//     },
//     {
//       questionText: "The 2024 Summer Olympics were held in which city?",
//       options: [
//         { id: "optA", text: "Tokyo" },
//         { id: "optB", text: "Los Angeles" },
//         { id: "optC", text: "Paris" },
//         { id: "optD", text: "London" },
//       ],
//       correctOptionId: "optC",
//       marks: 2,
//       topic: "Current Affairs",
//       difficulty: "easy",
//       explanation: "Paris, France hosted the 2024 Summer Olympics.",
//     },
//     {
//       questionText: "Which fundamental right guarantees equality before the law in the Indian Constitution?",
//       options: [
//         { id: "optA", text: "Article 14" },
//         { id: "optB", text: "Article 19" },
//         { id: "optC", text: "Article 21" },
//         { id: "optD", text: "Article 32" },
//       ],
//       correctOptionId: "optA",
//       marks: 2,
//       topic: "Indian Polity",
//       difficulty: "hard",
//       explanation: "Article 14 guarantees equality before the law and equal protection of the laws to all persons.",
//     },
//   ];

//   const questions = await Question.insertMany(
//     questionsData.map((q) => ({ ...q, examId: exam._id, sectionId: section._id }))
//   );

//   console.log("Seed complete:");
//   console.log(`  Admin:   ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
//   console.log(`  Student: ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`);
//   console.log(`  Exam:    "${exam.title}" (${questions.length} questions)`);
// };

// const run = async () => {
//   await connectDB();

//   const shouldDestroyOnly = process.argv.includes("--destroy");

//   try {
//     if (shouldDestroyOnly) {
//       await destroy();
//     } else {
//       await seed();
//     }
//   } catch (err) {
//     console.error("Seed failed:", err);
//     process.exitCode = 1;
//   } finally {
//     await mongoose.connection.close();
//   }
// };

// run();

/**
 * Seeds the database with:
 * - 1 admin user
 * - 1 student user
 * - 1 sample exam (published)
 * - 1 section
 * - 5 sample questions
 *
 * Usage:
 *   npm run seed            -> insert seed data (clears prior seed data first)
 *   npm run seed:destroy    -> remove all seed-created data
 */
/**
 * Seeds the database with:
 * - 1 admin user
 * - 1 student user
 * - 1 sample exam (published)
 * - 1 section
 * - 5 sample questions
 *
 * Usage:
 *   npm run seed            -> insert seed data (clears prior seed data first)
 *   npm run seed:destroy    -> remove all seed-created data
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Exam from "../models/Exam.js";
import Section from "../models/Section.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import AttemptAnswer from "../models/AttemptAnswer.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@examprep.in";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
const STUDENT_EMAIL = process.env.SEED_STUDENT_EMAIL || "student@examprep.in";
const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || "Student@12345";

const destroy = async () => {
  await Promise.all([
    AttemptAnswer.deleteMany({}),
    Attempt.deleteMany({}),
    Question.deleteMany({}),
    Section.deleteMany({}),
    Exam.deleteMany({}),
    Plan.deleteMany({}),
    Subscription.deleteMany({}),
    User.deleteMany({ email: { $in: [ADMIN_EMAIL, STUDENT_EMAIL] } }),
  ]);
  console.log("All seed data removed.");
};

const seed = async () => {
  await destroy();

  // Demo accounts are pre-verified so they can log in immediately without
  // going through the OTP email flow (which needs real Gmail credentials).
  const admin = await User.create({
    name: "Platform Admin",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
    isEmailVerified: true,
  });

  const student = await User.create({
    name: "Demo Student",
    email: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
    role: "student",
    isEmailVerified: true,
  });

  const plans = await Plan.insertMany([
    {
      name: "Monthly",
      description: "Full access to every premium mock test for 30 days.",
      price: 149,
      currency: "INR",
      durationDays: 30,
      features: ["Unlimited premium mock tests", "Topic-wise performance analytics", "Email support"],
    },
    {
      name: "Quarterly",
      description: "3 months of full access at a discounted rate.",
      price: 399,
      currency: "INR",
      durationDays: 90,
      features: [
        "Unlimited premium mock tests",
        "Topic-wise performance analytics",
        "Priority email support",
        "Save ~11% vs monthly",
      ],
    },
    {
      name: "Yearly",
      description: "Best value - a full year of unlimited practice.",
      price: 1299,
      currency: "INR",
      durationDays: 365,
      features: [
        "Unlimited premium mock tests",
        "Topic-wise performance analytics",
        "Priority email support",
        "Save ~27% vs monthly",
      ],
    },
  ]);

  const exam = await Exam.create({
    title: "SSC CGL Tier 1 - General Awareness Mock Test 1",
    description:
      "A short practice mock test covering general awareness topics commonly seen in SSC CGL Tier 1 prelims.",
    category: "SSC",
    durationMinutes: 15,
    totalMarks: 10,
    negativeMarks: 0.5,
    instructions: [
      "This test contains 5 questions, each carrying 2 marks.",
      "There is a negative marking of 0.5 marks for every wrong answer.",
      "Unanswered questions carry no negative marks.",
      "The timer starts as soon as you begin the test and cannot be paused.",
      "The test will auto-submit when the time expires.",
      "Use the question palette to navigate between questions and mark questions for review.",
    ],
    isPublished: true,
    createdBy: admin._id,
  });

  const section = await Section.create({
    examId: exam._id,
    title: "General Awareness",
    order: 0,
  });

  const questionsData = [
    {
      questionText: "Who is known as the 'Father of the Indian Constitution'?",
      options: [
        { id: "optA", text: "Mahatma Gandhi" },
        { id: "optB", text: "Dr. B. R. Ambedkar" },
        { id: "optC", text: "Jawaharlal Nehru" },
        { id: "optD", text: "Sardar Vallabhbhai Patel" },
      ],
      correctOptionId: "optB",
      marks: 2,
      topic: "Indian Polity",
      difficulty: "easy",
      explanation:
        "Dr. B. R. Ambedkar chaired the Drafting Committee of the Constituent Assembly and is widely regarded as the chief architect of the Indian Constitution.",
    },
    {
      questionText: "The Reserve Bank of India was established in which year?",
      options: [
        { id: "optA", text: "1935" },
        { id: "optB", text: "1947" },
        { id: "optC", text: "1950" },
        { id: "optD", text: "1969" },
      ],
      correctOptionId: "optA",
      marks: 2,
      topic: "Economy",
      difficulty: "medium",
      explanation: "The RBI was established on April 1, 1935, under the Reserve Bank of India Act, 1934.",
    },
    {
      questionText: "Which river is known as the 'Sorrow of Bihar'?",
      options: [
        { id: "optA", text: "Ganga" },
        { id: "optB", text: "Kosi" },
        { id: "optC", text: "Son" },
        { id: "optD", text: "Gandak" },
      ],
      correctOptionId: "optB",
      marks: 2,
      topic: "Geography",
      difficulty: "medium",
      explanation: "The Kosi river is called the 'Sorrow of Bihar' due to its frequent and devastating floods.",
    },
    {
      questionText: "The 2024 Summer Olympics were held in which city?",
      options: [
        { id: "optA", text: "Tokyo" },
        { id: "optB", text: "Los Angeles" },
        { id: "optC", text: "Paris" },
        { id: "optD", text: "London" },
      ],
      correctOptionId: "optC",
      marks: 2,
      topic: "Current Affairs",
      difficulty: "easy",
      explanation: "Paris, France hosted the 2024 Summer Olympics.",
    },
    {
      questionText: "Which fundamental right guarantees equality before the law in the Indian Constitution?",
      options: [
        { id: "optA", text: "Article 14" },
        { id: "optB", text: "Article 19" },
        { id: "optC", text: "Article 21" },
        { id: "optD", text: "Article 32" },
      ],
      correctOptionId: "optA",
      marks: 2,
      topic: "Indian Polity",
      difficulty: "hard",
      explanation: "Article 14 guarantees equality before the law and equal protection of the laws to all persons.",
    },
  ];

  const questions = await Question.insertMany(
    questionsData.map((q) => ({ ...q, examId: exam._id, sectionId: section._id }))
  );

  console.log("Seed complete:");
  console.log(`  Admin:   ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Student: ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`);
  console.log(`  Exam:    "${exam.title}" (${questions.length} questions)`);
  console.log(`  Plans:   ${plans.map((p) => p.name).join(", ")}`);
};

const run = async () => {
  await connectDB();

  const shouldDestroyOnly = process.argv.includes("--destroy");

  try {
    if (shouldDestroyOnly) {
      await destroy();
    } else {
      await seed();
    }
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();