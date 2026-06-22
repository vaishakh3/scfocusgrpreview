import type { Applicant, Reviewer } from "@/lib/types";

export const sampleReviewers: Reviewer[] = [
  { id: "admin", name: "Admin" },
  { id: "vaishakh", name: "Vaishakh" },
  { id: "robin", name: "Robin" },
  { id: "aleena", name: "Aleena" },
  { id: "mrudul", name: "Mrudul" },
];

export const sampleApplicants: Applicant[] = [
  {
    id: "sample-001",
    sourceRow: null,
    submittedAt: "2026-06-20T11:55:23+05:30",
    name: "Applicant 001",
    email: "applicant001@example.com",
    phone: "9000000001",
    branch: "Computer Science and Engineering",
    yearLevel: "3rd year",
    college: "Sample Engineering College",
    interestStatement:
      "I want to contribute to software initiatives that connect sensor data with useful student-facing tools. If selected, I would help with dashboards, workshops, and open-source project work.",
    volunteeringExperience:
      "Student branch web team member. Helped coordinate technical workshops and wrote post-event reports.",
    linkedinUrl: "https://www.linkedin.com/in/sample-applicant-001",
    dataQualityFlags: [],
    assignedReviewerId: "vaishakh",
  },
  {
    id: "sample-002",
    sourceRow: null,
    submittedAt: "2026-06-20T12:13:20+05:30",
    name: "Applicant 002",
    email: "applicant002@example.com",
    phone: "9000000002",
    branch: "Electronics and Communication",
    yearLevel: "2nd year",
    college: "Government Engineering College",
    interestStatement:
      "I am interested in the overlap between embedded systems and software. I would like to support hands-on sessions and learn from mentors while contributing consistently.",
    volunteeringExperience:
      "Volunteered for an IEEE technical event and assisted with registration, venue coordination, and participant support.",
    linkedinUrl: "https://www.linkedin.com/in/sample-applicant-002",
    dataQualityFlags: [],
    assignedReviewerId: "robin",
  },
  {
    id: "sample-003",
    sourceRow: null,
    submittedAt: "2026-06-20T12:17:16+05:30",
    name: "Applicant 003",
    email: "applicant003@example.com",
    phone: "9000000003",
    branch: "Artificial Intelligence and Data Science",
    yearLevel: "2nd year",
    college: "Technology Institute",
    interestStatement:
      "The focus group matches my interest in AI, data processing, and real-world software. I would contribute to project reviews, content, and beginner-friendly activities.",
    volunteeringExperience:
      "Documentation lead for a student association and content contributor for multiple technical events.",
    linkedinUrl: "https://www.linkedin.com/in/sample-applicant-003",
    dataQualityFlags: [],
    assignedReviewerId: "aleena",
  },
  {
    id: "sample-004",
    sourceRow: null,
    submittedAt: "2026-06-20T14:56:38+05:30",
    name: "Applicant 004",
    email: "applicant004@example.com",
    phone: "9000000004",
    branch: "Electrical and Electronics Engineering",
    yearLevel: "3rd year",
    college: "Model College of Engineering",
    interestStatement:
      "I have hardware experience and want to strengthen my software side. I can help bridge hardware-focused students into software tools and sensor applications.",
    volunteeringExperience:
      "Technical lead in a campus club and active participant in hackathons and hardware prototyping events.",
    linkedinUrl: "https://www.linkedin.com/in/sample-applicant-004",
    dataQualityFlags: [],
    assignedReviewerId: "mrudul",
  },
  {
    id: "sample-005",
    sourceRow: null,
    submittedAt: "2026-06-22T13:45:55+05:30",
    name: "Applicant 005",
    email: "invalid-email",
    phone: "9000000005",
    branch: "Computer Science",
    yearLevel: "1st year",
    college: "Sample College of Engineering",
    interestStatement:
      "I would like to improve my technical skills and participate in group activities.",
    volunteeringExperience: "No previous volunteering experience yet.",
    linkedinUrl: null,
    dataQualityFlags: ["invalid_email"],
    assignedReviewerId: "vaishakh",
  },
  {
    id: "sample-006",
    sourceRow: null,
    submittedAt: "2026-06-22T20:09:26+05:30",
    name: "Applicant 006",
    email: "applicant006@example.com",
    phone: "9000000006",
    branch: "Computer Science",
    yearLevel: "3rd year",
    college: "College of Engineering",
    interestStatement:
      "I like software most when it solves real-world problems. I would like to work on practical solutions that connect physical sensors with digital systems.",
    volunteeringExperience:
      "Volunteered for startup and technology summits, and served on a campus creative content team.",
    linkedinUrl: "https://www.linkedin.com/in/sample-applicant-006",
    dataQualityFlags: [],
    assignedReviewerId: "robin",
  },
];
