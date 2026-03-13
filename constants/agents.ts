import type { ComponentProps } from 'react';
import type { Feather } from '@expo/vector-icons';

type FeatherIcon = ComponentProps<typeof Feather>['name'];

export interface AgentHandoff {
  agentId: string;
  label: string;
  description: string;
}

export interface Agent {
  id: string;
  name: string;
  tagline: string;
  icon: FeatherIcon;
  color: string;
  colorLight: string;
  suggestions: { label: string; prompt: string }[];
  handoffs: AgentHandoff[];
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
    handoffs: [
      { agentId: 'seo', label: 'Optimize SEO', description: 'Run an SEO audit on your app' },
      { agentId: 'branding', label: 'Create branding', description: 'Design a brand identity' },
      { agentId: 'designer', label: 'Refine design', description: 'Get UI/UX feedback' },
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
    handoffs: [
      { agentId: 'builder', label: 'Build it', description: 'Turn this plan into an app' },
      { agentId: 'branding', label: 'Build brand', description: 'Create brand identity from strategy' },
      { agentId: 'content-machine', label: 'Create content', description: 'Generate marketing content' },
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
    handoffs: [
      { agentId: 'seo', label: 'Optimize for search', description: 'SEO-optimize your content' },
      { agentId: 'content-machine', label: 'Scale content', description: 'Create social posts from this' },
      { agentId: 'strategist', label: 'Strategy check', description: 'Align content with business goals' },
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
    handoffs: [
      { agentId: 'builder', label: 'Make it visual', description: 'Turn code into a full app' },
      { agentId: 'seo-optimizer', label: 'Optimize performance', description: 'Speed up your code' },
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
    handoffs: [
      { agentId: 'builder', label: 'Build this design', description: 'Turn mockup into a working app' },
      { agentId: 'branding', label: 'Full brand kit', description: 'Expand into complete brand identity' },
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
    handoffs: [
      { agentId: 'strategist', label: 'Build strategy', description: 'Turn insights into a plan' },
      { agentId: 'content-machine', label: 'Share findings', description: 'Create content from analysis' },
    ],
  },
  {
    id: 'branding',
    name: 'Branding',
    tagline: 'Brand identity & visual systems',
    icon: 'award',
    color: '#D946EF',
    colorLight: 'rgba(217, 70, 239, 0.08)',
    suggestions: [
      { label: 'Brand kit', prompt: 'Create a complete brand identity kit for a premium coffee subscription startup called "Ritual" — logo concepts, color palette, typography, and brand voice guidelines' },
      { label: 'Color system', prompt: 'Design a professional color system for a health & wellness app. Include primary, secondary, accent colors with hex codes, usage rules, and accessibility contrast ratios' },
      { label: 'Brand refresh', prompt: 'I need to modernize my brand. Walk me through a brand audit framework and create updated visual identity recommendations for a 10-year-old consulting firm' },
      { label: 'Style guide', prompt: 'Build a comprehensive brand style guide covering logo usage, typography scale, iconography, photography style, and tone of voice for a direct-to-consumer skincare brand' },
    ],
    handoffs: [
      { agentId: 'builder', label: 'Build with brand', description: 'Create an app using these brand assets' },
      { agentId: 'designer', label: 'Apply to UI', description: 'Design interfaces with this brand' },
      { agentId: 'content-machine', label: 'Brand content', description: 'Create on-brand marketing' },
    ],
  },
  {
    id: 'design-thinker',
    name: 'Thinker',
    tagline: 'Creative problem solving',
    icon: 'cpu',
    color: '#6366F1',
    colorLight: 'rgba(99, 102, 241, 0.08)',
    suggestions: [
      { label: 'Design sprint', prompt: 'Run me through a design thinking sprint for reimagining the airport check-in experience. Cover empathize, define, ideate, prototype, and test phases' },
      { label: 'User personas', prompt: 'Help me create detailed user personas for a meal planning app. Include demographics, pain points, goals, behaviors, and journey maps' },
      { label: 'Problem reframe', prompt: 'I\'m struggling with low user retention in my app. Help me reframe this problem using design thinking and generate 10 innovative solution concepts' },
      { label: 'Innovation workshop', prompt: 'Design a structured innovation workshop agenda for my team to generate new product ideas in the remote work tools space' },
    ],
    handoffs: [
      { agentId: 'builder', label: 'Prototype it', description: 'Build a working prototype' },
      { agentId: 'designer', label: 'Design it', description: 'Create polished UI designs' },
    ],
  },
  {
    id: 'seo',
    name: 'SEO Pro',
    tagline: 'Search optimization & rankings',
    icon: 'bar-chart',
    color: '#059669',
    colorLight: 'rgba(5, 150, 105, 0.08)',
    suggestions: [
      { label: 'SEO audit', prompt: 'Do a comprehensive SEO audit for an e-commerce website. Cover technical SEO, on-page optimization, content gaps, backlink analysis, and provide a prioritized action plan' },
      { label: 'Keyword strategy', prompt: 'Build a keyword research strategy for a B2B SaaS company in the project management space. Include primary, secondary, and long-tail keywords with search volume estimates' },
      { label: 'Content plan', prompt: 'Create a 3-month SEO content calendar with 12 blog post topics optimized for search. Include target keywords, search intent, and content outlines for each' },
      { label: 'Technical SEO', prompt: 'Walk me through a technical SEO checklist — site speed, mobile optimization, schema markup, crawlability, indexation issues, and Core Web Vitals improvements' },
    ],
    handoffs: [
      { agentId: 'content-machine', label: 'Create content', description: 'Write SEO-optimized content' },
      { agentId: 'builder', label: 'Fix technical SEO', description: 'Implement SEO improvements' },
      { agentId: 'programmatic-seo', label: 'Scale pages', description: 'Generate pages at scale' },
    ],
  },
  {
    id: 'programmatic-seo',
    name: 'Page Gen',
    tagline: 'SEO pages at scale',
    icon: 'database',
    color: '#16A34A',
    colorLight: 'rgba(22, 163, 74, 0.08)',
    suggestions: [
      { label: 'Landing pages', prompt: 'Help me create a programmatic SEO strategy to generate 100+ landing pages targeting "[service] in [city]" keywords. Include template structure, dynamic content, and internal linking plan' },
      { label: 'Product pages', prompt: 'Design a scalable template system for generating SEO-optimized product comparison pages. I need a structure that works for thousands of product combinations' },
      { label: 'Directory site', prompt: 'Plan a programmatic SEO directory website. Help me design the data schema, page templates, URL structure, and automated content generation strategy' },
      { label: 'Blog at scale', prompt: 'Create a framework for generating 50+ SEO blog posts from a data set. Include title templates, content outlines, internal linking strategy, and schema markup' },
    ],
    handoffs: [
      { agentId: 'builder', label: 'Build pages', description: 'Generate the page templates' },
      { agentId: 'seo', label: 'Audit SEO', description: 'Validate SEO quality' },
    ],
  },
  {
    id: 'content-machine',
    name: 'Content',
    tagline: 'Social media & marketing content',
    icon: 'send',
    color: '#F59E0B',
    colorLight: 'rgba(245, 158, 11, 0.08)',
    suggestions: [
      { label: 'Social calendar', prompt: 'Create a 2-week social media content calendar for Instagram, LinkedIn, and Twitter for a tech startup launching a new AI product. Include post copy, hashtags, and posting times' },
      { label: 'Newsletter', prompt: 'Write a professional weekly newsletter edition about the latest trends in AI and productivity tools. Include an intro, 3 curated stories with commentary, and a CTA' },
      { label: 'Ad copy', prompt: 'Write 5 variations of Facebook/Instagram ad copy for a premium online course about personal finance. Include headlines, body copy, and CTAs optimized for conversions' },
      { label: 'Content repurpose', prompt: 'I have a 2000-word blog post about remote work productivity. Help me repurpose it into 10 LinkedIn posts, 5 tweets, 2 email snippets, and 1 infographic outline' },
    ],
    handoffs: [
      { agentId: 'seo', label: 'SEO check', description: 'Optimize content for search' },
      { agentId: 'designer', label: 'Visual content', description: 'Create graphics for this content' },
    ],
  },
  {
    id: 'file-converter',
    name: 'Converter',
    tagline: 'File format transformations',
    icon: 'refresh-cw',
    color: '#64748B',
    colorLight: 'rgba(100, 116, 139, 0.08)',
    suggestions: [
      { label: 'JSON to CSV', prompt: 'Help me convert JSON data to CSV format. I\'ll paste my JSON and you transform it into a clean, properly formatted CSV with headers' },
      { label: 'Data formatter', prompt: 'I need to transform data between formats. Help me convert between JSON, CSV, XML, YAML, and Markdown tables — I\'ll provide the source data' },
      { label: 'SQL generator', prompt: 'Help me convert a spreadsheet structure into SQL CREATE TABLE and INSERT statements. I\'ll describe my columns and data' },
      { label: 'API response', prompt: 'Help me transform raw API response data into a clean, structured format. I\'ll paste the response and tell you the output format I need' },
    ],
    handoffs: [
      { agentId: 'coder', label: 'Process data', description: 'Write code to automate this conversion' },
    ],
  },
  {
    id: 'github-finder',
    name: 'GitHub',
    tagline: 'Open source solutions & code',
    icon: 'github',
    color: '#1F2937',
    colorLight: 'rgba(31, 41, 55, 0.08)',
    suggestions: [
      { label: 'Find libraries', prompt: 'Find me the best open-source React component libraries for building a dashboard with charts, tables, and data visualization in 2024' },
      { label: 'Stack comparison', prompt: 'Compare the top 5 open-source authentication solutions for a Node.js app — features, stars, maintenance activity, and which to choose' },
      { label: 'Project starter', prompt: 'Find me the best open-source starter templates and boilerplates for building a full-stack SaaS application with Next.js and Stripe' },
      { label: 'Tool discovery', prompt: 'What are the best open-source AI/ML tools and frameworks for building a text classification system? Compare options with pros and cons' },
    ],
    handoffs: [
      { agentId: 'coder', label: 'Integrate it', description: 'Help integrate this library' },
      { agentId: 'builder', label: 'Build with it', description: 'Create an app using this library' },
    ],
  },
  {
    id: 'qa-tester',
    name: 'QA Tester',
    tagline: 'Tests & validates your apps',
    icon: 'check-square',
    color: '#059669',
    colorLight: 'rgba(5, 150, 105, 0.08)',
    suggestions: [
      { label: 'Full QA audit', prompt: 'Run a complete quality assurance audit on my latest project — check accessibility, responsiveness, performance, SEO, and code quality' },
      { label: 'Accessibility check', prompt: 'Check my app for accessibility issues — ARIA labels, color contrast, keyboard navigation, screen reader compatibility, and alt text' },
      { label: 'Mobile test', prompt: 'Test my app for mobile responsiveness — check breakpoints, touch targets, font sizes, viewport issues, and scrolling behavior' },
      { label: 'Performance review', prompt: 'Analyze my app for performance — check image optimization, CSS/JS efficiency, render blocking, lazy loading, and animation performance' },
    ],
    handoffs: [
      { agentId: 'builder', label: 'Fix issues', description: 'Apply the QA fixes automatically' },
      { agentId: 'seo-optimizer', label: 'Optimize further', description: 'Deep performance optimization' },
    ],
  },
  {
    id: 'seo-optimizer',
    name: 'Optimizer',
    tagline: 'App & page optimization',
    icon: 'sliders',
    color: '#0891B2',
    colorLight: 'rgba(8, 145, 178, 0.08)',
    suggestions: [
      { label: 'Page speed', prompt: 'Analyze and provide a detailed optimization plan for improving my web app\'s page speed, Core Web Vitals, and overall performance score' },
      { label: 'Meta tags', prompt: 'Generate optimized meta tags, Open Graph tags, Twitter cards, and structured data (JSON-LD) for my website. I\'ll describe my site and pages' },
      { label: 'Conversion audit', prompt: 'Do a conversion rate optimization audit for my landing page. Cover above-the-fold content, CTAs, trust signals, page speed, and mobile experience' },
      { label: 'App store SEO', prompt: 'Help me optimize my mobile app listing for the App Store and Google Play — title, subtitle, description, keywords, and screenshot strategy' },
    ],
    handoffs: [
      { agentId: 'builder', label: 'Implement fixes', description: 'Apply these optimizations' },
      { agentId: 'seo', label: 'Full SEO audit', description: 'Deep-dive SEO analysis' },
    ],
  },
  {
    id: 'website-cloner',
    name: 'Cloner',
    tagline: 'Website recreation & inspiration',
    icon: 'copy',
    color: '#7C3AED',
    colorLight: 'rgba(124, 58, 237, 0.08)',
    suggestions: [
      { label: 'Clone a site', prompt: 'Help me recreate the design and layout of a modern SaaS landing page like Linear or Vercel. Build a complete HTML page with the same premium aesthetic' },
      { label: 'Design system', prompt: 'Analyze the design patterns used by top tech company websites (Stripe, Notion, Figma) and build me a landing page that combines the best elements' },
      { label: 'Redesign', prompt: 'I want to redesign my outdated website. Describe your current site and I\'ll create a modern, professional version with current design trends' },
      { label: 'Page rebuild', prompt: 'Build me a pixel-perfect recreation of a modern pricing page with toggle billing, feature comparison table, and FAQ accordion — inspired by the best SaaS sites' },
    ],
    handoffs: [
      { agentId: 'builder', label: 'Customize it', description: 'Modify the cloned design' },
      { agentId: 'branding', label: 'Re-brand it', description: 'Apply your brand to this design' },
    ],
  },
];

export const DEFAULT_AGENT = AGENTS[0];

export function getAgent(id: string): Agent {
  return AGENTS.find(a => a.id === id) || DEFAULT_AGENT;
}
