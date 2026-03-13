import type { ComponentProps } from 'react';
import type { Feather } from '@expo/vector-icons';

type FeatherIcon = ComponentProps<typeof Feather>['name'];

export interface Agent {
  id: string;
  name: string;
  tagline: string;
  icon: FeatherIcon;
  color: string;
  colorLight: string;
  suggestions: { label: string; prompt: string }[];
}

export const AGENTS: Agent[] = [
  {
    id: 'builder',
    name: 'Builder',
    tagline: 'Creates apps, sites & tools',
    icon: 'layers',
    color: '#1A6B4A',
    colorLight: 'rgba(26, 107, 74, 0.08)',
    suggestions: [
      { label: 'Weather app', prompt: 'Build me a beautiful weather app with a 5-day forecast, current conditions with animated icons, and a clean modern UI' },
      { label: 'Landing page', prompt: 'Build me a stunning SaaS landing page for a productivity tool called "FlowState" with hero section, features, pricing cards, and testimonials' },
      { label: 'Dashboard', prompt: 'Build me an analytics dashboard with revenue charts, user metrics, conversion rates, and a clean dark theme' },
      { label: 'Portfolio site', prompt: 'Build me a sleek personal portfolio website with a hero section, project gallery, about me section, and contact form' },
    ],
  },
  {
    id: 'strategist',
    name: 'Strategist',
    tagline: 'Business plans & growth',
    icon: 'trending-up',
    color: '#8B5CF6',
    colorLight: 'rgba(139, 92, 246, 0.08)',
    suggestions: [
      { label: 'Business plan', prompt: 'Help me create a comprehensive business plan for a mobile-first fintech startup targeting Gen Z' },
      { label: 'Go-to-market', prompt: 'Create a detailed go-to-market strategy for launching an AI-powered personal finance app' },
      { label: 'Competitive analysis', prompt: 'Do a competitive analysis of the top 5 project management tools and identify market gaps I can exploit' },
      { label: 'Revenue model', prompt: 'Help me design a revenue model and pricing strategy for a B2B SaaS platform' },
    ],
  },
  {
    id: 'writer',
    name: 'Writer',
    tagline: 'Content, copy & storytelling',
    icon: 'pen-tool',
    color: '#E67E22',
    colorLight: 'rgba(230, 126, 34, 0.08)',
    suggestions: [
      { label: 'Blog post', prompt: 'Write a compelling long-form blog post about the future of AI in creative industries' },
      { label: 'Sales copy', prompt: 'Write high-converting landing page copy for an online course about building wealth in your 20s' },
      { label: 'Email sequence', prompt: 'Create a 5-email welcome sequence for a premium newsletter about tech and entrepreneurship' },
      { label: 'Social content', prompt: 'Create a week of engaging social media content (LinkedIn + Twitter) for a startup founder building in public' },
    ],
  },
  {
    id: 'coder',
    name: 'Code',
    tagline: 'Programming & architecture',
    icon: 'terminal',
    color: '#0EA5E9',
    colorLight: 'rgba(14, 165, 233, 0.08)',
    suggestions: [
      { label: 'Debug my code', prompt: 'I need help debugging and optimizing my code. Ask me to paste it and I\'ll share what I\'m working on.' },
      { label: 'System design', prompt: 'Help me design the architecture for a real-time collaborative document editor like Google Docs' },
      { label: 'API design', prompt: 'Design a RESTful API for a social media platform with users, posts, comments, and real-time notifications' },
      { label: 'Code review', prompt: 'I want to learn best practices for writing clean, maintainable code. Give me a masterclass on code quality principles with examples' },
    ],
  },
  {
    id: 'designer',
    name: 'Designer',
    tagline: 'UI/UX, branding & visuals',
    icon: 'figma',
    color: '#EC4899',
    colorLight: 'rgba(236, 72, 153, 0.08)',
    suggestions: [
      { label: 'Color palette', prompt: 'Create a complete brand color palette for a premium wellness app. Include primary, secondary, accent colors with hex codes, and show me how they work together' },
      { label: 'UI mockup', prompt: 'Build me a beautiful mobile app UI mockup for a meditation and mindfulness app with a calming, premium aesthetic' },
      { label: 'Design system', prompt: 'Help me create a design system foundation: typography scale, spacing system, component guidelines, and visual principles' },
      { label: 'Redesign critique', prompt: 'Walk me through a UX review framework and the key principles of great mobile UI design' },
    ],
  },
  {
    id: 'analyst',
    name: 'Analyst',
    tagline: 'Research, data & insights',
    icon: 'search',
    color: '#14B8A6',
    colorLight: 'rgba(20, 184, 166, 0.08)',
    suggestions: [
      { label: 'Market research', prompt: 'Do a comprehensive market analysis of the AI chatbot industry — market size, key players, trends, and opportunities' },
      { label: 'Data breakdown', prompt: 'Help me create a framework for analyzing customer churn. What metrics should I track and how should I segment the analysis?' },
      { label: 'Trend report', prompt: 'Write an in-depth analysis of the top 10 technology trends that will shape business in the next 3 years' },
      { label: 'Decision framework', prompt: 'Help me build a decision matrix for choosing between building in-house vs buying a SaaS solution for our CRM needs' },
    ],
  },
];

export const DEFAULT_AGENT = AGENTS[0];

export function getAgent(id: string): Agent {
  return AGENTS.find(a => a.id === id) || DEFAULT_AGENT;
}
