export interface Template {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  colorLight: string;
  templates: Template[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'landing',
    name: 'Landing Pages',
    description: 'High-converting pages for products & services',
    icon: 'globe',
    color: '#1A6B4A',
    colorLight: 'rgba(26, 107, 74, 0.08)',
    templates: [
      {
        id: 'saas-landing',
        label: 'SaaS Product',
        prompt: 'Build a stunning SaaS landing page for a project management tool called "Orbit" with a glassmorphic hero section, animated feature cards with hover effects, a pricing table with 3 tiers, customer testimonials carousel, and a gradient CTA section. Use Inter font from Google Fonts, a deep purple-to-blue gradient palette, and smooth scroll animations.',
        icon: 'layers',
      },
      {
        id: 'app-landing',
        label: 'Mobile App',
        prompt: 'Build a beautiful mobile app landing page for a fitness tracking app called "Pulse" with a phone mockup hero, animated stats counter section, feature showcase with alternating image-text layout, app store download buttons, and a dark mode design with neon green accents. Include smooth fade-in animations on scroll.',
        icon: 'smartphone',
      },
      {
        id: 'agency-landing',
        label: 'Creative Agency',
        prompt: 'Build a premium creative agency landing page with a full-screen video-style hero, portfolio grid with hover reveal effects, team section with glassmorphic cards, client logo marquee, and a contact form. Use a monochromatic black-and-white palette with gold accent colors and elegant serif typography.',
        icon: 'briefcase',
      },
      {
        id: 'product-launch',
        label: 'Product Launch',
        prompt: 'Build a product launch countdown landing page for a new tech gadget with a 3D-style hero product showcase, animated countdown timer, email signup with glassmorphic input, key features with animated icons, and early-bird pricing. Use a futuristic dark theme with cyan gradients.',
        icon: 'zap',
      },
    ],
  },
  {
    id: 'dashboards',
    name: 'Dashboards',
    description: 'Analytics, admin panels & data visualization',
    icon: 'bar-chart-2',
    color: '#0EA5E9',
    colorLight: 'rgba(14, 165, 233, 0.08)',
    templates: [
      {
        id: 'analytics-dash',
        label: 'Analytics',
        prompt: 'Build a professional analytics dashboard with a dark sidebar navigation, KPI cards with sparkline charts, a large area chart for revenue trends, a donut chart for traffic sources, a data table with sorting, and a real-time activity feed. Use a dark theme with blue accent colors, glassmorphic card backgrounds, and smooth CSS transitions.',
        icon: 'trending-up',
      },
      {
        id: 'finance-dash',
        label: 'Finance',
        prompt: 'Build a personal finance dashboard with account balance cards, spending category breakdown with animated progress bars, recent transactions list with status badges, monthly budget tracker, and a savings goal widget. Use a clean light theme with emerald green accents and modern card-based layout.',
        icon: 'dollar-sign',
      },
      {
        id: 'social-dash',
        label: 'Social Media',
        prompt: 'Build a social media analytics dashboard with follower growth charts, engagement rate cards, top-performing posts grid, audience demographics pie charts, and a content calendar view. Use a vibrant gradient color scheme with purple-to-pink accents on a dark background.',
        icon: 'heart',
      },
      {
        id: 'project-dash',
        label: 'Project Manager',
        prompt: 'Build a project management dashboard with a kanban-style board, team member avatars with status indicators, project timeline/gantt view, task completion progress rings, and upcoming deadlines list. Use a modern light theme with indigo accents and smooth drag-and-drop styled cards.',
        icon: 'clipboard',
      },
    ],
  },
  {
    id: 'portfolios',
    name: 'Portfolios',
    description: 'Personal sites & creative showcases',
    icon: 'user',
    color: '#EC4899',
    colorLight: 'rgba(236, 72, 153, 0.08)',
    templates: [
      {
        id: 'dev-portfolio',
        label: 'Developer',
        prompt: 'Build a sleek developer portfolio with a terminal-style hero animation, project cards with tech stack badges, a skills section with animated progress bars, GitHub-style contribution graph, and a contact section. Use a dark theme with green terminal accents and monospace typography for code elements.',
        icon: 'terminal',
      },
      {
        id: 'designer-portfolio',
        label: 'Designer',
        prompt: 'Build an elegant designer portfolio with a full-screen hero with large typography, a masonry project gallery with hover overlays, an about section with a large photo, a dribbble-style shot grid, and testimonials. Use a minimalist light theme with black typography and subtle pastel accent colors.',
        icon: 'figma',
      },
      {
        id: 'photo-portfolio',
        label: 'Photographer',
        prompt: 'Build a stunning photography portfolio with a full-bleed hero image, a lightbox-style gallery grid, category filters, an about section with split layout, and booking/contact form. Use a dark background to make photos pop, with minimal UI chrome and elegant serif typography.',
        icon: 'camera',
      },
      {
        id: 'writer-portfolio',
        label: 'Writer',
        prompt: 'Build a writer/journalist portfolio with a clean editorial-style hero, featured articles with large thumbnails, a publication list with logos, a bio section, and newsletter signup. Use elegant serif fonts, generous whitespace, and a warm cream-and-charcoal color scheme.',
        icon: 'pen-tool',
      },
    ],
  },
  {
    id: 'tools',
    name: 'Tools & Utilities',
    description: 'Interactive calculators, converters & more',
    icon: 'tool',
    color: '#8B5CF6',
    colorLight: 'rgba(139, 92, 246, 0.08)',
    templates: [
      {
        id: 'calculator',
        label: 'Calculator',
        prompt: 'Build a beautiful scientific calculator with a glassmorphic design, animated button presses, history panel that slides in, mode toggle for basic/scientific, and responsive grid layout. Use a dark gradient background with soft colored buttons and smooth transitions.',
        icon: 'hash',
      },
      {
        id: 'pomodoro',
        label: 'Pomodoro Timer',
        prompt: 'Build a Pomodoro timer app with a large circular progress ring, animated countdown, work/break mode toggle, session counter, and customizable durations. Use a calming gradient background that shifts between work (warm) and break (cool) modes with smooth CSS transitions.',
        icon: 'clock',
      },
      {
        id: 'weather',
        label: 'Weather App',
        prompt: 'Build a beautiful weather app with animated weather icons (sun, clouds, rain), current conditions card with glassmorphic effect, 5-day forecast row, hourly temperature chart, and UV/humidity/wind detail cards. Use a dynamic gradient background and smooth transitions. Include realistic mock data for San Francisco.',
        icon: 'cloud',
      },
      {
        id: 'notes',
        label: 'Notes App',
        prompt: 'Build a modern notes app with a sidebar note list, markdown preview, rich text toolbar, search functionality, and category tags. Use a clean minimal design with a warm light theme, subtle shadows, and smooth sidebar transitions.',
        icon: 'file-text',
      },
    ],
  },
  {
    id: 'games',
    name: 'Games',
    description: 'Interactive games & fun experiences',
    icon: 'play',
    color: '#E67E22',
    colorLight: 'rgba(230, 126, 34, 0.08)',
    templates: [
      {
        id: 'memory-game',
        label: 'Memory Match',
        prompt: 'Build a memory card matching game with a 4x4 grid of cards with emoji faces, smooth flip animations using CSS transforms, move counter, timer, best score tracker, and a win celebration with confetti animation. Use a playful gradient background with rounded colorful cards.',
        icon: 'grid',
      },
      {
        id: 'quiz-game',
        label: 'Trivia Quiz',
        prompt: 'Build a trivia quiz game with animated question cards, multiple choice answers with correct/incorrect feedback animations, progress bar, score tracker, timer per question, and a results screen with stats. Use a vibrant purple-to-blue gradient theme with glassmorphic cards.',
        icon: 'help-circle',
      },
      {
        id: 'snake-game',
        label: 'Snake Game',
        prompt: 'Build a classic snake game with a neon retro aesthetic, smooth movement, score display, high score tracking, speed increase as you eat, and game over screen with restart. Use a dark background with neon green snake and glowing food items.',
        icon: 'maximize',
      },
      {
        id: 'typing-game',
        label: 'Typing Speed',
        prompt: 'Build a typing speed test with falling words, WPM counter, accuracy tracker, difficulty levels, and a results chart. Use a clean dark theme with cyan highlights for the current word and smooth animations for words appearing and disappearing.',
        icon: 'type',
      },
    ],
  },
  {
    id: 'storefronts',
    name: 'Storefronts',
    description: 'E-commerce pages & product showcases',
    icon: 'shopping-bag',
    color: '#14B8A6',
    colorLight: 'rgba(20, 184, 166, 0.08)',
    templates: [
      {
        id: 'fashion-store',
        label: 'Fashion Store',
        prompt: 'Build a luxury fashion e-commerce page with a full-screen hero banner, product grid with hover zoom effects, quick-view modal, size/color selectors, shopping cart sidebar, and a newsletter section. Use an elegant black-and-white palette with gold accents and serif typography.',
        icon: 'shopping-bag',
      },
      {
        id: 'food-menu',
        label: 'Restaurant Menu',
        prompt: 'Build a digital restaurant menu with category tabs, food items with photos and descriptions, dietary badges (vegan, gluten-free), a cart/order summary, and featured specials section. Use warm earthy tones with elegant typography and appetizing card designs.',
        icon: 'coffee',
      },
      {
        id: 'product-page',
        label: 'Product Page',
        prompt: 'Build a single product showcase page for premium wireless headphones with an image gallery carousel, color variant selector, feature highlights with icons, comparison table, customer reviews with star ratings, and add-to-cart button with animation. Use a sleek modern design with dark mode.',
        icon: 'headphones',
      },
      {
        id: 'digital-store',
        label: 'Digital Products',
        prompt: 'Build a digital product marketplace for design templates with a search/filter bar, product cards with preview thumbnails, price badges, rating stars, author info, and a featured collection hero. Use a clean modern design with subtle gradients and rounded corners.',
        icon: 'download',
      },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional sites for companies & teams',
    icon: 'briefcase',
    color: '#2563EB',
    colorLight: 'rgba(37, 99, 235, 0.08)',
    templates: [
      {
        id: 'consulting-firm',
        label: 'Consulting Firm',
        prompt: 'Build a premium consulting firm website with a bold hero section with a background video-style gradient, services grid with hover card flips, case studies with before/after metrics, team bios with social links, and a contact form with service selector dropdown. Use a navy blue and white palette with gold accents, DM Sans typography, and polished animations.',
        icon: 'award',
      },
      {
        id: 'real-estate',
        label: 'Real Estate',
        prompt: 'Build a luxury real estate listing page with a full-bleed property image gallery, property details with icon cards (beds, baths, sqft), interactive mortgage calculator, neighborhood map placeholder, agent contact card, and similar listings grid. Use an elegant dark theme with marble-white cards and gold accents.',
        icon: 'home',
      },
      {
        id: 'law-firm',
        label: 'Law Firm',
        prompt: 'Build a professional law firm website with a distinguished hero section, practice areas with icon cards, attorney profiles with credentials, client testimonials, case results statistics, and consultation request form. Use a classic navy and silver palette with serif headings and sans-serif body text.',
        icon: 'shield',
      },
      {
        id: 'startup-landing',
        label: 'Startup Pitch',
        prompt: 'Build a startup pitch page for an AI company with a bold animated headline, problem/solution sections with icon illustrations, traction metrics with animated counters, team section with glassmorphic cards, investor logos marquee, and a CTA to request demo. Use a modern dark gradient with vibrant purple-to-cyan accents.',
        icon: 'rocket',
      },
    ],
  },
  {
    id: 'internal-tools',
    name: 'Internal Tools',
    description: 'Admin panels, CRMs & team utilities',
    icon: 'settings',
    color: '#7C3AED',
    colorLight: 'rgba(124, 58, 237, 0.08)',
    templates: [
      {
        id: 'crm-dashboard',
        label: 'CRM Dashboard',
        prompt: 'Build a CRM dashboard with a pipeline view showing deal stages as columns, contact cards with avatar/name/company/value, drag-and-drop styled cards between stages, deal value totals per stage, search and filter bar, and a new deal modal form. Use a clean light theme with indigo accents and modern card design.',
        icon: 'users',
      },
      {
        id: 'inventory-tracker',
        label: 'Inventory Tracker',
        prompt: 'Build an inventory management system with a product table with sortable columns, stock level indicators (low/medium/high with color coding), category filters, add/edit product modal, search bar, and export to CSV button. Use a professional light theme with emerald accents and clean data table design.',
        icon: 'package',
      },
      {
        id: 'booking-system',
        label: 'Booking System',
        prompt: 'Build an appointment booking system with a weekly calendar view, time slot grid with available/booked indicators, booking form with service/date/time selection, upcoming appointments list, and a day detail sidebar. Use a warm cream and teal palette with smooth transitions and clean typography.',
        icon: 'calendar',
      },
      {
        id: 'employee-directory',
        label: 'Team Directory',
        prompt: 'Build an employee directory with a searchable card grid, department filter tabs, employee detail modal with contact info/skills/bio, org chart view toggle, and team statistics cards. Use a friendly light theme with blue accents, rounded avatars, and smooth card hover effects.',
        icon: 'user-check',
      },
    ],
  },
];
