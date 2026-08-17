export const site = {
  name: "Akhil Kumar S",

  /**
   * The initial spelled out. Footer only — `name` stays canonical for the page
   * title, the JSON-LD and the OG tags, so both spellings are on the page and
   * both are findable. Kept in proper case even though the footer renders it
   * lower — the casing that search engines and screen readers get should be the
   * real one, and CSS does the styling.
   */
  fullName: "Akhil Kumar Santhosh",

  /**
   * Hero only. The full name wraps to two lines at display size and reads worse
   * for it. `name` stays canonical everywhere that matters for search — the
   * page title, the JSON-LD, and the footer.
   */
  shortName: "Akhil",
  role: "Software engineer",
  location: "Kollam, Kerala",
  url: "https://akhilkumars.com",

  lede:
    "I spend most of my time on the parts of an application nobody sees. The API layer, the database, the pipeline that ships it. Sometimes the part people do see.",

  /**
   * The hero's "Currently:" line. The whole point of it is that it's specific
   * and current, so it dates fast by design — keep it honest or drop it.
   * Rendered as "Currently: {now} @ {company}".
   */
  now: "shipping a new pipeline",

  /** Meta description. Kept under 155 characters. */
  description:
    "Software engineer at RideSense. Backend, infrastructure and frontend — Node, Postgres, AWS, React. Based in Kollam, Kerala.",

  about: [
    "I'm a full stack developer, working as a software engineer at RideSense, where we build an app for motorcyclists. Most of my time goes on the API layer, the AWS setup, and the deployment pipeline, and I built the web app that lets people follow a ride live from a browser. Postgres and DynamoDB underneath, Lambda and AppSync in front, Docker and CI/CD to get it out the door.",
    "I started building things in 2023 and taught myself by shipping whole applications rather than pieces of them — payments, real-time video, auth, admin tooling, all of it end to end. That's still how I learn: pick the part I don't understand and build the thing that needs it.",
    "Outside work it's the gym, long rides, and a fair amount of time alone.",
  ],

  email: "imakhilkumars@gmail.com",
  github: "https://github.com/Akhil-Kumar-2001",
  linkedin: "https://www.linkedin.com/in/meakhil",

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

/**
 * The role, not the product. RideSense the company belongs here; RideSense the
 * app belongs in src/content/work. Keeping that line clean is what stops this
 * section and the work section saying the same thing twice.
 */
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

export type Bucket = "daily" | "comfortable" | "shipped with" | "learning";

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
      { name: "Socket.IO", bucket: "shipped with" },
      { name: "WebRTC", bucket: "shipped with" },
      { name: "NestJS", bucket: "shipped with" },
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
      { name: "React", bucket: "comfortable" },
      { name: "Next.js", bucket: "comfortable" },
      { name: "Redux / Zustand", bucket: "comfortable" },
      { name: "CSS", bucket: "comfortable" },
      { name: "Astro", bucket: "shipped with" },
      { name: "Mapbox", bucket: "shipped with" },
    ],
  },
];
