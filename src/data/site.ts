export const site = {
  name: "Akhil Kumar S",

  /** Footer only; `name` stays canonical for the title, JSON-LD and OG tags, so
      both spellings are findable. Proper case here, lower-cased by CSS. */
  fullName: "Akhil Kumar Santhosh",

  /** Hero only; the full name wraps to two lines at display size. `name` stays
      canonical for the title and JSON-LD. */
  shortName: "Akhil",
  role: "Software engineer",
  location: "Kollam, Kerala",
  url: "https://akhilkumars.com",

  lede:
    "I spend most of my time on the parts of an application nobody sees. The API layer, the database, the pipeline that ships it. Sometimes the part people do see.",

  /** Hero's "Currently:" line. Dates fast by design — keep it true or delete it. */
  now: "shipping a new pipeline",

  /** Meta description. Kept under 155 characters. */
  description:
    "Software engineer at RideSense. Backend, infrastructure and frontend — Node, Postgres, AWS, React. Based in Kollam, Kerala.",

  about: [
    "I’m currently working as a Software Engineer at RideSense, where I work on building and improving a product for motorcyclists.",
    "My path into software wasn’t a traditional one. Before moving into software, I worked as a lift technician with Mitsubishi Electric and TKE. I started building things in 2023 and taught myself by building complete applications and learning along the way.",
    "I enjoy figuring out how things work, solving problems, and turning ideas into something real. I learn best by building, finding something I don’t understand, and figuring it out along the way.",
    "Outside work it’s the gym, long rides, and a fair amount of time alone.",
  ],

  email: "imakhilkumars@gmail.com",
  github: "https://github.com/Akhil-Kumar-2001",
  linkedin: "https://www.linkedin.com/in/meakhil",
  instagram: "https://www.instagram.com/im.akhilkumar.s",

  /* Google Drive link. Works, but see the README — hosting the PDF at /cv.pdf
     yourself is better: no sign-in prompt, no permission failures, and it stays
     on your own domain. */
  cv: "https://drive.google.com/file/d/1bFyee5Rd5Laax53qGLxibvTxTXM0koWt",
};

export type Role = {
  company: string;
  title: string;
  period: string;
  location: string;
  arrangement: "remote" | "onsite" | "hybrid";
  url?: string;
  /** Marks the current role — gets the accent dot on the timeline. */
  current?: boolean;
  summary: string;
};

/** The role, not the product — the app belongs in src/content/work. Keeps this
    section and the work section from saying the same thing twice. */
export const experience: Role[] = [
  {
    company: "RideSense",
    title: "Software engineer",
    period: "Oct 2025 — present",
    location: "Bengaluru, Karnataka, India",
    arrangement: "remote",
    url: "https://ridesense.in",
    current: true,
    summary:
      "I own the API layer, the AWS setup, and the deployment pipeline, and I built the web app for live ride tracking. It's a live product with users on both app stores, so changes go out on a release cycle the rest of the team works to. I write the documentation for the parts I own, and I stay with that code long enough to maintain the decisions in it.",
  },
  {
    company: "Brototype",
    title: "Full stack developer intern",
    period: "Feb 2024 — 2025",
    location: "Trivandrum, Kazhakoottam, India",
    arrangement: "onsite",
    summary:
      "Full stack development. Alongside it I built SipSavvy and Elevio end to end, teaching myself by shipping complete applications rather than following tutorials.",
  },
];

export type Bucket =
  | "daily"
  | "comfortable"
  | "shipped with"
  | "shipped with Elevio"
  | "shipped with RideSense"
  | "learning";

export type Skill = { name: string; bucket: Bucket };

export const stack: { group: string; skills: Skill[] }[] = [
  {
    group: "backend",
    skills: [
      { name: "Node", bucket: "daily" },
      { name: "Express", bucket: "daily" },
      { name: "TypeScript", bucket: "daily" },
      { name: "REST API design", bucket: "daily" },
      { name: "JWT auth", bucket: "daily" },
      { name: "Socket.IO", bucket: "shipped with Elevio" },
      { name: "WebRTC", bucket: "shipped with Elevio" },
      { name: "NestJS", bucket: "daily" },
    ],
  },
  {
    group: "data",
    skills: [
      { name: "PostgreSQL", bucket: "daily" },
      { name: "MongoDB", bucket: "daily" },
      { name: "DynamoDB", bucket: "comfortable" },
      { name: "Redis / Valkey", bucket: "comfortable" },
    ],
  },
  {
    group: "infrastructure",
    skills: [
      { name: "AWS EC2", bucket: "daily" },
      { name: "AWS S3", bucket: "daily" },
      { name: "AWS Lambda", bucket: "comfortable" },
      { name: "AWS AppSync", bucket: "comfortable" },
      { name: "Docker", bucket: "comfortable" },
      { name: "CI/CD pipelines", bucket: "comfortable" },
      { name: "Vercel", bucket: "comfortable" },
    ],
  },
  {
    group: "frontend",
    skills: [
      { name: "React", bucket: "daily" },
      { name: "Next.js", bucket: "daily" },
      { name: "Redux / Zustand", bucket: "daily" },
      { name: "CSS", bucket: "daily" },
      { name: "Astro", bucket: "shipped with RideSense" },
      { name: "Mapbox", bucket: "shipped with RideSense" },
    ],
  },
];
