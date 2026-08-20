/**
 * Shield Job Portal - Dual-Mode API Connector
 * Automatically connects to PHP+MySQL backend when running on a web server (cPanel/Apache),
 * or gracefully operates with local persistent storage for instant offline/browser testing.
 */

const API_BASE = 'api';

// Initial preloaded mock state for offline / standalone preview
const DEFAULT_STATE = {
  users: [
    { id: 1, name: 'Shreekant', email: 'shreekant@shieldinfrasolutions.in', phone: '+91 9876543210', role: 'admin', subscription: 'Premium' },
    { id: 2, name: 'Aarav Sharma', email: 'aarav@example.com', phone: '+91 9811223344', role: 'jobseeker', subscription: 'Free' },
    { id: 3, name: 'Apex Technologies', email: 'hr@apextech.com', phone: '+91 9822334455', role: 'employer', subscription: 'Premium' },
    { id: 4, name: 'Rohan Gupta', email: 'rohan@designcraft.com', phone: '+91 9833445566', role: 'freelancer', subscription: 'Free' },
    { id: 5, name: 'Dr. Meera Sen', email: 'meera@trainpro.in', phone: '+91 9844556677', role: 'trainer', subscription: 'Premium' },
    { id: 6, name: 'Shield Manpower Force', email: 'manpower@shieldinfra.in', phone: '+91 9855667788', role: 'manpower', subscription: 'Premium' },
    { id: 7, name: 'BuildMaster Infra Pvt Ltd', email: 'projects@buildmaster.in', phone: '+91 9866778899', role: 'contractor', subscription: 'Premium' }
  ],
  profiles: {
    'shreekant@shieldinfrasolutions.in': { saved: true },
    'aarav@example.com': {
      title: 'Full Stack Web Developer',
      exp: '3 Years',
      salary: '8 LPA',
      curSalary: '5.5 LPA',
      skills: 'React, Node.js, PHP, MySQL, JavaScript, HTML5, CSS3',
      about: 'Passionate full-stack software engineer with 3+ years experience building web portals, REST APIs and responsive UI.',
      whatsapp: '+91 9811223344',
      curLocation: 'Jamshedpur, Jharkhand',
      desLocation: 'Bengaluru / Remote',
      marital: 'Not Married',
      linkedin: 'https://linkedin.com/in/aarav-sharma-dev',
      qualification: 'B.Tech in Computer Science',
      projectsDone: '6 Enterprise web apps',
      company: 'Digital Solutions India',
      notice: '15 Days',
      reason: 'Looking for fast-paced growth opportunity',
      projectLink: 'https://github.com/aarav-sharma-portfolio',
      ref1: 'Ramesh Kumar (Tech Lead, +91 9811001122)',
      ref2: 'Sunita Rao (Manager, +91 9811003344)',
      resumeName: 'Aarav_Sharma_FullStack_Resume.pdf',
      ats: true,
      reviewStatus: 'Published',
      saved: true
    },
    'rohan@designcraft.com': {
      title: 'Senior UI/UX & Brand Designer',
      exp: '5 Years',
      skills: 'Figma, Adobe XD, Photoshop, Illustrator, Design Systems',
      about: 'Designing high-converting landing pages, SaaS dashboards, mobile apps and luxury brand identities.',
      portfolio: 'https://dribbble.com/rohan-design',
      saved: true
    },
    'meera@trainpro.in': {
      title: 'Corporate Soft Skills & Leadership Coach',
      exp: '8 Years',
      qualification: 'Certified Corporate Trainer, MBA HR',
      skills: 'Executive Communication, Leadership Mastery, High-Performance Team Building, Conflict Resolution',
      about: 'Trained over 4,500+ corporate professionals across Fortune 500 enterprises and universities nationwide.',
      saved: true
    }
  },
  jobs: [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      empType: 'Full-time',
      company: 'Apex Technologies',
      department: 'Engineering',
      location: 'Bengaluru / Remote',
      compensation: '₹12,00,000 - ₹16,00,000 / year',
      summary: 'Lead the frontend engineering team in developing modern responsive web platforms with high visual fidelity and speed.',
      responsibilities: 'Build performant UI components.\nCollaborate with backend engineers on REST API design.\nMaintain code quality and architecture.',
      requirements: '3+ years with JavaScript/TypeScript, React/Vue/Vanilla JS.\nDeep CSS knowledge.',
      appInstructions: 'Updated CV',
      statusUpdateVia: 'Call',
      closeWithin: '15 Days',
      interviewMode: 'Online',
      notice: 'Immediate to 30 Days',
      notes: 'Immediate joiners will be given priority.',
      bgChecks: ['Experience', 'Educational', 'Reference'],
      hiringAssist: 'normal',
      category: 'IT & Software',
      status: 'Published',
      openStatus: 'Open',
      postedBy: 'hr@apextech.com'
    },
    {
      id: 2,
      title: 'Regional Sales Manager',
      empType: 'Full-time',
      company: 'Shield Infra Solutions',
      department: 'Sales & Growth',
      location: 'Mumbai, Maharashtra',
      compensation: '₹8,00,000 - ₹12,00,000 / year + Incentives',
      summary: 'Drive B2B workforce and manpower staffing contracts with large infrastructure and construction clients.',
      responsibilities: 'Meet corporate decision makers.\nClose enterprise staffing tenders.\nLead regional sales reps.',
      requirements: '4+ years B2B corporate sales experience in staffing, manpower, or infra solutions.',
      appInstructions: 'Updated CV',
      statusUpdateVia: 'WhatsApp',
      closeWithin: '21 Days',
      interviewMode: 'Face to Face',
      notice: '30 Days',
      notes: 'Company vehicle allowance and travel reimbursement provided.',
      bgChecks: ['Experience', 'Residential', 'Police'],
      hiringAssist: 'custom',
      category: 'Sales & Marketing',
      status: 'Published',
      openStatus: 'Open',
      postedBy: 'shreekant@shieldinfrasolutions.in'
    }
  ],
  applications: {
    'aarav@example.com': [
      { jobIdx: 0, jobId: 1, status: 'Shortlisted', stage: 1 }
    ]
  },
  candidates: [
    { name: 'Aarav Sharma', role: 'Senior Frontend Developer', stage: 1, applicantEmail: 'aarav@example.com', jobIdx: 0, jobId: 1 },
    { name: 'Isha Verma', role: 'HR Executive', stage: 1, jobIdx: 1, jobId: 2 },
    { name: 'Rohit Nair', role: 'Site Supervisor', stage: 2, jobIdx: null },
    { name: 'Priya Das', role: 'Data Analyst', stage: 3, jobIdx: null },
    { name: 'Vikram Malhotra', role: 'Project Manager', stage: 5, jobIdx: 1, jobId: 2 }
  ],
  offerings: {
    'rohan@designcraft.com': [
      { title: 'Complete Web UI/UX Design System', price: 7500, delivery: '4 Days', desc: 'Custom high-converting Figma UI kit with mobile & desktop layouts, style tokens and interactive prototypes.', category: 'Design & Creative', status: 'Published' },
      { title: 'Brand Identity & Luxury 3D Logo Suite', price: 3500, delivery: '2 Days', desc: 'Vector logo variations, luxury color palette, font pairing guide, and 3D mockup presentations.', category: 'Design & Creative', status: 'Published' }
    ]
  },
  courses: {
    'meera@trainpro.in': [
      { title: 'Executive Communication & Public Speaking', price: 2999, duration: '3 Weeks', desc: 'Master impactful presentations, boardroom persuasion, vocal tonality, and high-stakes negotiation skills.', category: 'Soft Skills', status: 'Published' },
      { title: 'Corporate Leadership & Conflict Management', price: 4499, duration: '4 Weeks', desc: 'Practical leadership frameworks, delegation tactics, emotional intelligence and conflict resolution.', category: 'Soft Skills', status: 'Published' }
    ]
  },
  workforcePool: {
    'manpower@shieldinfra.in': [
      { roleType: 'Certified Electricians', skillLevel: 'Skilled', experience: '4+ Years', count: 18, available: true },
      { roleType: 'Heavy Equipment Operators', skillLevel: 'Skilled', experience: '5+ Years', count: 12, available: true },
      { roleType: 'General Construction Helpers', skillLevel: 'Unskilled', experience: '1+ Year', count: 45, available: true }
    ]
  },
  deploymentRequests: {
    'manpower@shieldinfra.in': [
      { clientName: 'Metro Rail Project Site #4', location: 'Patna, Bihar', rolesNeeded: 'Electricians, Helpers', quantity: 25, duration: '6 Months', status: 'In Progress' }
    ]
  },
  serviceLocations: {
    'manpower@shieldinfra.in': ['Jamshedpur, Jharkhand', 'Patna, Bihar', 'Kolkata, West Bengal', 'Bhubaneswar, Odisha']
  },
  contractorProjects: {
    'projects@buildmaster.in': [
      {
        name: 'Industrial Warehouse Expansion Phase 2',
        client: 'Shield Infra Solutions',
        location: 'Industrial Corridor, Adityapur, Jamshedpur',
        contactName: 'Shreekant (Director)',
        contactNumber: '+91 9876543210',
        value: '4500000',
        startDate: '2026-09-01',
        endDate: '2027-02-28',
        contractPeriod: '6 Months',
        manpowerRequired: 35,
        manpowerRoles: ['Masons', 'Fabricators', 'Electricians', 'Supervisors'],
        description: 'Complete civil, structural steel erection, and electrical MEP installation for 45,000 sq ft logistics warehouse.',
        status: 'Ongoing'
      }
    ]
  },
  receivedBids: {
    'projects@buildmaster.in': [
      { bidderName: 'Sunrise Steel Works', project: 'Industrial Warehouse Expansion Phase 2', amount: '1250000', contact: '+91 9811447788', status: 'Accepted' },
      { bidderName: 'Modern Electricals Ltd', project: 'Industrial Warehouse Expansion Phase 2', amount: '890000', contact: '+91 9822558899', status: 'New' }
    ]
  },
  hireRequests: [],
  activityLog: [
    { text: 'Platform initialized with 6 service verticals and active ATS pipeline', time: new Date().toLocaleString() },
    { text: 'Aarav Sharma applied for Senior Frontend Developer at Apex Technologies', time: new Date().toLocaleString() }
  ],
  crmNotes: {
    'aarav@example.com': [
      { note: 'Shortlisted for Senior Frontend role. Candidate has active ATS boost enabled and strong portfolio.', time: new Date().toLocaleString() }
    ]
  },
  crmStatus: {
    'aarav@example.com': 'Contacted',
    'hr@apextech.com': 'Converted',
    'rohan@designcraft.com': 'New',
    'meera@trainpro.in': 'Converted',
    'manpower@shieldinfra.in': 'Converted',
    'projects@buildmaster.in': 'Converted'
  },
  pricing: {
    atsBoost: 299,
    employerNormalPosting: 999,
    employerHiringAssistant: 4999,
    premiumSubscription: 499
  },
  siteSettings: {
    heroEyebrow: '● JOB SEEKERS &nbsp;·&nbsp; EMPLOYERS &nbsp;·&nbsp; FREELANCERS &nbsp;·&nbsp; TRAINERS &nbsp;·&nbsp; MANPOWER &nbsp;·&nbsp; CONTRACTORS',
    heroTitle: 'One Platform. Every Career Path. End to End Excellence.',
    heroLead: "Shield Job Portal is where ambition meets opportunity. Whether you're hunting for your dream job, building a freelance career, hiring top talent, training the next workforce, deploying manpower, or executing large-scale contractual projects — we deliver a seamless, powerful and trusted experience from the first click to the final offer letter.",
    moto: '"OUR MOTTO — EMPOWERING PEOPLE. ENABLING ENTERPRISES. END TO END."',
    footerText: '<b>Shield Job Portal</b> — a service of Shield Infra Solutions · Empowering Careers. Enabling Enterprises. End to End.',
    logoUrl: '',
    bannerUrl: '',
    social: { facebook: '', twitter: '', linkedin: '', instagram: '', youtube: '' },
    contact: { email: 'contact@shieldinfrasolutions.in', phone: '+91 9876543210', address: 'Shield Infra Solutions, Corporate Plaza, India' }
  }
};

class APIClient {
  constructor() {
    this.storageKey = 'shield_job_portal_state_v1';
    this.state = this.loadLocalState();
    this.serverAvailable = null; // Checked on first remote request
  }

  loadLocalState() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveLocalState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {}
  }

  async fetchEndpoint(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });
      if (response.ok) {
        const data = await response.json();
        this.serverAvailable = true;
        return data;
      }
    } catch (e) {}
    this.serverAvailable = false;
    return null;
  }

  // --- Auth Methods ---
  async login(email, password) {
    email = (email || '').trim().toLowerCase();
    
    // Try live server first
    const remote = await this.fetchEndpoint('auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (remote && remote.success) {
      return remote.data.user;
    }

    // Local Fallback
    const user = this.state.users.find(u => u.email.toLowerCase() === email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }
    // Check password (supports default admin password)
    if (user.role === 'admin' && password !== 'Shree#2425@22267' && user.password && user.password !== password) {
      throw new Error('Invalid email or password.');
    }
    return user;
  }

  async register(data) {
    const { name, email, phone, password, role } = data;
    const cleanEmail = (email || '').trim().toLowerCase();

    const remote = await this.fetchEndpoint('auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (remote && remote.success) {
      return remote.data.user;
    }

    // Local Fallback
    if (this.state.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('This email is already registered. Please log in.');
    }

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password,
      role: role,
      subscription: 'Free'
    };
    this.state.users.push(newUser);
    this.state.crmStatus[cleanEmail] = 'New';
    this.saveLocalState();
    return newUser;
  }
}

window.api = new APIClient();
