import { Course, InstituteProfile, AdFormat, Student, Invoice, PaymentReceipt } from '../types';

export const INSTITUTE_PROFILE: InstituteProfile = {
  name: 'Cortexx AI Institute',
  tagline: 'Where Thinking Meets Technology',
  phone: '+91 7984691082',
  email: 'info.cortexx@gmail.com',
  address: 'Gujarat, India',
  upiId: '7984691082@upi',
  website: 'https://cortexx.ai',
};

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-practical-ai-01',
    name: '1-Month Practical AI Course',
    duration: '1 Month',
    mode: '100% Online',
    fee: 6000,
    certificateIncluded: true,
    description: 'Master the next generation of artificial intelligence through hands-on, live practical projects from productivity tools to autonomous AI agents.',
    modules: [
      '01. AI Tools & Productivity',
      '02. Prompt Engineering',
      '03. AI Image Generation',
      '04. AI Video Generation',
      '05. AI Voice & Audio',
      '06. AI Content Creation',
      '07. AI Automation',
      '08. AI Agents',
      '09. AI for Business & Marketing',
      '10. Real-World Projects',
    ],
  },
  {
    id: 'course-practical-ai-foundation-02',
    name: 'Practical AI Foundation Course',
    duration: '1 Month',
    mode: '100% Online',
    fee: 5000,
    certificateIncluded: true,
    description: 'Core practical AI training covering tools, prompt engineering, generative image and video, voice synthesis, automation, business marketing, and real-world projects.',
    modules: [
      '01. AI Tools & Productivity',
      '02. Prompt Engineering',
      '03. AI Image Generation',
      '04. AI Video Generation',
      '05. AI Voice & Audio',
      '06. AI Content Creation',
      '07. AI Automation',
      '08. AI for Business & Marketing',
      '09. Real-World Projects',
    ],
  },
];

export const AD_FORMATS: AdFormat[] = [
  {
    id: 'iab-med-rect',
    name: 'Medium Rectangle',
    category: 'iab',
    width: 300,
    height: 250,
    aspectRatio: '6:5',
    description: 'IAB standard high-performing desktop & mobile sidebar unit',
  },
  {
    id: 'iab-leaderboard',
    name: 'Leaderboard',
    category: 'iab',
    width: 728,
    height: 90,
    aspectRatio: '8:1',
    description: 'IAB standard horizontal header & footer banner',
  },
  {
    id: 'iab-skyscraper',
    name: 'Wide Skyscraper',
    category: 'iab',
    width: 160,
    height: 600,
    aspectRatio: '4:15',
    description: 'IAB standard tall vertical margin display',
  },
  {
    id: 'iab-large-rect',
    name: 'Large Rectangle',
    category: 'iab',
    width: 336,
    height: 280,
    aspectRatio: '6:5',
    description: 'High visibility in-article Google Display Network unit',
  },
  {
    id: 'iab-billboard',
    name: 'Billboard Banner',
    category: 'iab',
    width: 970,
    height: 250,
    aspectRatio: '3.88:1',
    description: 'IAB premium top-of-page high impact showcase',
  },
  {
    id: 'social-square',
    name: 'Social Square (Feed)',
    category: 'social',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    description: 'Instagram, LinkedIn & Facebook square promotional card',
  },
  {
    id: 'social-story',
    name: 'Story / Reel / Shorts',
    category: 'social',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    description: 'Full-screen vertical mobile ad for Instagram Stories & TikTok',
  },
  {
    id: 'social-landscape',
    name: 'Landscape / Link Preview',
    category: 'social',
    width: 1200,
    height: 628,
    aspectRatio: '1.91:1',
    description: 'Twitter / X, LinkedIn & Facebook Sponsored Post banner',
  },
];

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_RECEIPTS: PaymentReceipt[] = [];

