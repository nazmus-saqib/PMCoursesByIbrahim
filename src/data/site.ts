export interface Cohort {
  id: string;
  startDate: string;
  endDate: string;
  timezone: string;
  label?: string;
}

export type CourseId =
  "project-management" | "agile" | "prince2" | "it-service-management";

export interface Course {
  id: CourseId;
  name: string;
  eyebrow: string;
  shortDescription: string;
  description: string;
  category: string;
  color: string;
  duration: string;
  audience: string;
  outcomes: string[];
  modules: string[];
  format: string;
  level: string;
  priceLabel: string;
  cohorts: Cohort[];
  note?: string;
}

// Add verified profile details and contact information here before publishing.
// Course dates use ISO 8601 strings; use an IANA timezone, such as Europe/London.
export const site = {
  name: "Ibrahim Hossain",
  firstName: "Ibrahim",
  brand: "Learn X",
  role: "PMP trainer",
  tagline: "Learn with purpose. Lead with confidence.",
  description:
    "Live, practical training in project management, Agile, PRINCE2, and ITIL with Ibrahim Hossain. Build skills you can bring to your next project.",
  bio: "I’m Ibrahim Hossain, a PMP trainer with 10 years of experience. I help professionals make sense of complex project challenges and turn learning into practical, confident action. My approach connects the principles of project management with the decisions, conversations, and responsibilities you face at work.",
  email: "saqib.bd.ca@gmail.com",
  // Preferred domain only; availability, purchase, and connection are pending.
  preferredDomain: "learnx.ca",
  timezone: "",
  linkedinUrl: "",
  enrollmentNotice:
    "Register your interest to discuss the next available class. Your place is confirmed only after the schedule, fees, and course details are agreed.",
};

export const courses: Course[] = [
  {
    id: "project-management",
    name: "Project Management",
    eyebrow: "PLAN WITH PURPOSE",
    shortDescription:
      "Turn ambitious ideas into clear plans, aligned teams, and meaningful results.",
    description:
      "Develop a practical understanding of how projects move from an initial idea to delivery. Explore the tools and conversations that help you define scope, manage uncertainty, and keep stakeholders informed.",
    category: "Project delivery",
    color: "lime",
    duration: "Schedule announced soon",
    audience:
      "Aspiring project managers, project coordinators, team leads, and professionals who contribute to projects.",
    outcomes: [
      "Define project goals, scope, deliverables, and measures of success.",
      "Build a workable plan for tasks, resources, and dependencies.",
      "Identify risks early and communicate with stakeholders clearly.",
      "Track progress and make informed decisions as a project changes.",
    ],
    modules: [
      "Project foundations and the delivery lifecycle",
      "Scope, planning, scheduling, and resources",
      "Risk, stakeholder engagement, and communication",
      "Monitoring, change, and project closure",
    ],
    format: "Live online",
    level: "Foundations to practical application",
    priceLabel: "Enquire for fees",
    cohorts: [],
  },
  {
    id: "agile",
    name: "Agile",
    eyebrow: "ADAPT AND DELIVER",
    shortDescription:
      "Build better ways of working through collaboration, feedback, and continuous improvement.",
    description:
      "Explore Agile principles and how teams use short delivery cycles to learn and improve. Understand how to prioritise valuable work, make progress visible, and respond constructively when requirements evolve.",
    category: "Adaptive delivery",
    color: "lavender",
    duration: "Schedule announced soon",
    audience:
      "Project and product professionals, team members, and managers exploring adaptive ways of working.",
    outcomes: [
      "Explain Agile values and choose where they can support your work.",
      "Break larger goals into smaller, prioritised pieces of value.",
      "Use feedback and retrospectives to improve team delivery.",
      "Recognise the roles and practices used in common Agile approaches.",
    ],
    modules: [
      "Agile values, principles, and mindset",
      "Team collaboration and common delivery frameworks",
      "Prioritisation, backlogs, and iterative planning",
      "Feedback, review, and continuous improvement",
    ],
    format: "Live online",
    level: "Foundations to practical application",
    priceLabel: "Enquire for fees",
    cohorts: [],
  },
  {
    id: "prince2",
    name: "PRINCE2",
    eyebrow: "BRING STRUCTURE TO DELIVERY",
    shortDescription:
      "Understand a structured approach to projects, with clear responsibilities and informed decisions.",
    description:
      "Explore the principles and management practices behind PRINCE2. Learn how a structured project approach supports business justification, clear accountability, and control throughout delivery.",
    category: "Project governance",
    color: "peach",
    duration: "Schedule announced soon",
    audience:
      "Project managers, coordinators, governance professionals, and anyone working in a structured project environment.",
    outcomes: [
      "Understand the principles that underpin the PRINCE2 method.",
      "Recognise project roles and the decisions they are responsible for.",
      "Connect business justification, planning, risk, and progress control.",
      "Consider how a structured method can be tailored to a project.",
    ],
    modules: [
      "PRINCE2 principles and the project environment",
      "Project organisation and management responsibilities",
      "Management practices and project controls",
      "The project lifecycle and tailoring the method",
    ],
    format: "Live online",
    level: "Course level confirmed on enquiry",
    priceLabel: "Enquire for fees",
    cohorts: [],
    note: "The course edition, qualification level, and any exam arrangements will be confirmed before enrollment.",
  },
  {
    id: "it-service-management",
    name: "ITIL",
    eyebrow: "CONNECT TECHNOLOGY AND VALUE",
    shortDescription:
      "Understand how well-managed IT services support people, organisations, and business outcomes.",
    description:
      "Explore ITIL concepts and their role in creating value through IT services. Understand how service teams handle requests, resolve disruption, manage change, and continually improve the experience they provide.",
    category: "Service delivery",
    color: "sky",
    duration: "Schedule announced soon",
    audience:
      "IT professionals, service desk teams, operations staff, and managers involved in delivering technology services.",
    outcomes: [
      "Explain service management concepts in a business context.",
      "Recognise how service practices support a reliable user experience.",
      "Understand the relationship between incidents, problems, and change.",
      "Identify opportunities to improve service quality and value.",
    ],
    modules: [
      "Service management foundations and business value",
      "Service relationships and the user experience",
      "Requests, incidents, problems, and change",
      "Measurement and continual improvement",
    ],
    format: "Live online",
    level: "Course level confirmed on enquiry",
    priceLabel: "Enquire for fees",
    cohorts: [],
    note: "The ITIL edition, qualification level, detailed curriculum, and any exam arrangements will be confirmed before enrollment.",
  },
];

export const process = [
  {
    number: "01",
    title: "Find your next step",
    description:
      "Explore the courses and choose the skills that fit your role, goals, and next challenge.",
  },
  {
    number: "02",
    title: "Register your interest",
    description:
      "Share your course choice and learning goals. No payment is required to send a request.",
  },
  {
    number: "03",
    title: "Plan your learning",
    description:
      "Confirm the class dates, format, fees, and course details before committing to a place.",
  },
];

export const faqs = [
  {
    question: "Who are these courses for?",
    answer:
      "The courses support professionals building skills in project delivery, team collaboration, and IT service management. Each course lists its intended audience. Include your current role and goals when you register your interest so we can discuss the right fit.",
  },
  {
    question: "When does the next class start?",
    answer:
      "Upcoming start and end dates will be published here when a class is scheduled. If no date is listed, register your interest to ask about the next available class. A request does not reserve a confirmed seat.",
  },
  {
    question: "How are classes delivered?",
    answer:
      "The courses shown here are offered as live online classes. Session times, duration, and joining arrangements are confirmed for each class before enrollment.",
  },
  {
    question: "Are exams or certifications included?",
    answer:
      "Exam arrangements, qualification levels, and any included materials depend on the specific course. These details will be confirmed before enrollment. Do not assume that an exam or certification is included in a course fee.",
  },
  {
    question: "Can an organisation arrange training for a team?",
    answer:
      "Yes, organisations can enquire about live training for their teams. Choose a course and mention your team size, learning objectives, and preferred timing in the registration form so the requirements can be discussed.",
  },
  {
    question: "Do I need to pay when I register?",
    answer:
      "No. The form records an expression of interest. Fees, available dates, and payment arrangements are agreed separately before your place is confirmed.",
  },
];
