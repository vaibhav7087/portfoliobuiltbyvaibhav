export const profile = {
  name: "Vaibhav Kadam",
  firstName: "Vaibhav",
  role: "AI Engineer & Full-Stack Developer",
  prompt: "vaibhav@portfolio ~ $ whoami",
  intro:
    "I build agentic systems that actually ship — multi-agent orchestration on LangGraph with evals, feedback loops, and guardrails — plus the full-stack products around them. Co-founder & Technical Lead at Bylance.",
  bio: [
    "I design multi-agent LLM systems — LangGraph graphs coordinating OpenAI and Anthropic models through search, validation, and self-correction loops, judged by evals rather than vibes.",
    "At Bylance I'm building multi-tenant WhatsApp automation on serverless infrastructure. Previously: AI Engineering & Full-Stack intern at Eldea Solutions, shipping agent workflows and production web properties.",
  ],
  email: "vaibhavkadam7010@gmail.com",
  github: "https://github.com/vaibhav7087",
  linkedin: "https://www.linkedin.com/in/vaibhav-kadam-78307a289/",
  companySite: "https://eldeasolutions.com",
  siteUrl: "https://builtbyvaibhav.bylance.in",
  resumePath: "/resume.pdf",
} as const;

export const education = [
  {
    school: "Chhatrapati Shivaji Maharaj Institute of Technology (CSMIT)",
    short: "CSMIT, Shedung",
    degree: "BE, Computer Engineering — 2nd year, diploma lateral entry",
    dates: "2025 – 2028 (expected)",
  },
  {
    school: "Bharati Vidyapeeth Institute of Technology (BVIT)",
    short: "BVIT, Kharghar",
    degree: "Diploma in Computer Engineering",
    dates: "2022 – 2025",
  },
];

export const stack = [
  {
    category: "AI & Agents",
    lead: true,
    items: [
      "LangGraph",
      "LangChain",
      "OpenAI API",
      "Anthropic Claude",
      "Evals",
      "Agent orchestration",
      "Gemini",
      "Ollama",
    ],
  },
  {
    category: "Data",
    items: ["PostgreSQL", "Supabase", "SQL", "Prisma", "MongoDB", "MySQL"],
  },
  {
    category: "Backend & Infra",
    items: [
      "Node.js",
      "FastAPI",
      "Python",
      "Cloudflare Workers",
      "Cloudflare Queues",
      "D1",
      "Pages",
      "Vercel",
      "REST APIs",
    ],
  },
  {
    category: "Frontend",
    items: ["ReactJS", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "HTML/CSS"],
  },
  {
    category: "Tools",
    items: ["Git", "GitHub", "Postman", "Figma"],
  },
];

export const experience = [
  {
    company: "Eldea Solutions",
    role: "AI Engineering & Full-Stack Development Intern",
    type: "Internship",
    dates: "Jan – Jul 2026",
    bullets: [
      "Designed and developed AI-based multi-agent systems using LangGraph, integrating LLMs (Gemini, DeepSeek) for orchestration, search, and validation workflows.",
      "Managed domain and deployment infrastructure on Cloudflare Pages.",
      "Front-end design, UI/UX improvements, and refactoring of client web properties.",
      "Lead management and client communication via WhatsApp Business tools (Interakt).",
    ],
  },
  {
    company: "Bylance",
    role: "Co-founder & Technical Lead",
    type: "Full-time",
    dates: "2026 – Present",
    bullets: [
      "Built CureSlot: a serverless WhatsApp appointment-booking bot for clinics (Cloudflare Workers, D1, Queues, Meta WhatsApp Cloud API).",
      "Building the multi-tenant WhatsApp automation platform for small and mid-scale businesses.",
      "Early stage — first client pilots in progress.",
    ],
  },
];

export const achievements = [
  {
    result: "Won",
    variant: "won" as const,
    title: "Smart India Hackathon 2026 — Institute Round",
    sub: "Advancing to the next round",
  },
  {
    result: "2nd Runner-Up",
    variant: "runner" as const,
    title: "Eureka! Pitching Competition",
    sub: "Pitched an internal automation tool to a judging panel",
  },
];
