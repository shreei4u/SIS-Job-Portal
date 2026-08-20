/**
 * Shield Job Portal - Core Application Controller
 * Handles Audio synthesis, Speech synthesis, State synchronization,
 * Role-Based Dashboards, ATS Kanban Pipeline, CRM Analytics, and Dynamic Site Configuration.
 */

// ============ AUDIO SYNTHESIZER & SPEECH ============
let actx;
function ctx() {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return actx;
}

function playClick() {
  try {
    const c = ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    o.frequency.value = 520;
    g.gain.setValueAtTime(0.06, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.09);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.09);
  } catch (e) {}
}

function playApplyThankYou() {
  try {
    const c = ctx();
    const notes = [659.25, 783.99];
    notes.forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = c.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + 0.44);
    });

    if ('speechSynthesis' in window) {
      const msg = "Thank you for applying. Your profile is currently under review, and you can check its status anytime in the My Applications section.";
      const speak = () => {
        const u = new SpeechSynthesisUtterance(msg);
        u.rate = 0.93;
        u.pitch = 1.2;
        u.volume = 0.85;
        const voices = window.speechSynthesis.getVoices();
        const female = voices.find(v => /female|zira|samantha|victoria|susan|karen|moira|tessa|fiona|google uk english female|google us english/i.test(v.name));
        if (female) u.voice = female;
        window.speechSynthesis.speak(u);
      };
      if (window.speechSynthesis.getVoices().length) {
        speak();
      } else {
        window.speechSynthesis.onvoiceschanged = speak;
      }
    }
  } catch (e) {}
}

function playThankYou() {
  try {
    const c = ctx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = c.currentTime + i * 0.14;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + 0.34);
    });

    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Thank you for registration');
      u.rate = 1;
      u.pitch = 1;
      u.volume = 0.9;
      window.speechSynthesis.speak(u);
    }
  } catch (e) {}
}

// Global click event listeners for 3D buttons
document.addEventListener('click', function(e) {
  if (e.target.closest('.btn3d') || e.target.closest('.card-face .icon-close') || e.target.closest('.kcard button')) {
    playClick();
  }
});

document.addEventListener('change', function(e) {
  if (e.target.matches('#bgCheckGroup input[type=checkbox]')) {
    e.target.closest('.check-item').classList.toggle('on', e.target.checked);
  }
});

// ============ TOAST NOTIFICATIONS ============
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.classList.remove('show'), 3600);
}

// ============ CONSTANTS & SHARED DATA ============
const stages = ['Applied', 'Screening', 'Interview', 'Verification', 'Offer', 'Hired'];
const roleLabels = {
  jobseeker: 'Job Seeker',
  employer: 'Employer',
  freelancer: 'Freelancer',
  trainer: 'Trainer',
  manpower: 'Manpower Provider',
  contractor: 'Project Contractor',
  admin: 'Administrator'
};

const jobCategories = ['IT & Software', 'Sales & Marketing', 'Operations', 'Finance & Accounts', 'HR & Admin', 'Manufacturing', 'Healthcare', 'Other'];
const serviceCategories = ['Design & Creative', 'Writing & Translation', 'Web & Software Development', 'Digital Marketing', 'Admin Support', 'Video & Animation', 'Other'];
const courseCategories = ['Technical Skills', 'Soft Skills', 'Language', 'Certification Prep', 'Vocational Training', 'Other'];
const manpowerRoleOptions = ['Skilled Labour', 'Unskilled Labour', 'Security Guard', 'Housekeeping Staff', 'Driver', 'Technician', 'Supervisor', 'Electrician', 'Operator', 'Other'];

let currentUser = null;
let activeTab = 'overview';
let resumeFiles = {};

// Reference state from api helper
const state = window.api.state;

function logActivity(text) {
  state.activityLog.unshift({ text, time: new Date().toLocaleString() });
  if (state.activityLog.length > 200) state.activityLog.pop();
  window.api.saveLocalState();
}

// ============ MODAL HELPERS ============
function openModal(title, bodyHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}

// ============ CARD FLIP (LOGIN / REGISTER) ============
function openCard(mode) {
  const back = document.getElementById('cardBack');
  const flip = document.getElementById('cardFlip');
  back.innerHTML = mode === 'login' ? loginFormHTML() : registerFormHTML();
  flip.classList.add('flipped');
  document.querySelector('.card-scene').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function closeCard() {
  document.getElementById('cardFlip').classList.remove('flipped');
}

function loginFormHTML() {
  return `
  <div class="card-back-head"><h3>Member Login</h3><button class="icon-close" onclick="closeCard()">✕</button></div>
  <form onsubmit="return doLogin(event)">
    <div class="field"><label>Email</label><input type="email" id="loginEmail" placeholder="you@example.com" value="shreekant@shieldinfrasolutions.in" required></div>
    <div class="field"><label>Password</label><input type="password" id="loginPass" placeholder="••••••••" value="Shree#2425@22267" required></div>
    <div class="err-msg" id="loginErr">Invalid email or password.</div>
    <button class="btn3d red" style="width:100%;" type="submit">Login</button>
  </form>
  <div class="form-note">New here? <a onclick="openCard('register')">Create an account</a></div>`;
}

function registerFormHTML() {
  return `
  <div class="card-back-head"><h3>Create Account</h3><button class="icon-close" onclick="closeCard()">✕</button></div>
  <form onsubmit="return doRegister(event)">
    <div class="field"><label>I am a</label>
      <select id="regRole" required>
        <option value="">Select role</option>
        <option value="jobseeker">Job Seeker</option>
        <option value="employer">Employer</option>
        <option value="freelancer">Freelancer</option>
        <option value="trainer">Trainer</option>
        <option value="manpower">Manpower Provider</option>
        <option value="contractor">Project Contractor</option>
      </select>
    </div>
    <div class="field"><label>Full Name</label><input type="text" id="regName" placeholder="Full name" required></div>
    <div class="field"><label>Email</label><input type="email" id="regEmail" placeholder="you@example.com" required></div>
    <div class="field"><label>Phone</label><input type="tel" id="regPhone" placeholder="10-digit mobile number" required></div>
    <div class="field"><label>Password</label><input type="password" id="regPass" placeholder="Create a password" required></div>
    <div class="err-msg" id="regErr">Please fill all fields correctly.</div>
    <button class="btn3d" style="width:100%;" type="submit">Register Free</button>
  </form>
  <div class="form-note">Already registered? <a onclick="openCard('login')">Login instead</a></div>`;
}

async function doRegister(e) {
  e.preventDefault();
  const role = document.getElementById('regRole').value;
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const phone = document.getElementById('regPhone').value.trim();
  const pass = document.getElementById('regPass').value;
  const err = document.getElementById('regErr');

  if (!role || !name || !email || !phone || !pass) {
    err.textContent = 'Please fill all fields.';
    err.style.display = 'block';
    return false;
  }

  try {
    const user = await window.api.register({ name, email, phone, password: pass, role });
    playThankYou();
    toast('Thank you for registration, ' + name + '! You can now login.');
    logActivity('New registration: <b>' + name + '</b> (' + (roleLabels[role] || role) + ')');
    
    const back = document.getElementById('cardBack');
    back.innerHTML = loginFormHTML();
    setTimeout(() => {
      const le = document.getElementById('loginEmail');
      if (le) le.value = email;
    }, 50);
  } catch (error) {
    err.textContent = error.message || 'Registration failed.';
    err.style.display = 'block';
  }
  return false;
}

async function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('loginErr');

  try {
    const user = await window.api.login(email, pass);
    err.style.display = 'none';
    currentUser = user;
    closeCard();
    toast('Welcome back, ' + user.name + '!');
    setTimeout(() => showDashboard(user), 350);
  } catch (error) {
    err.textContent = error.message || 'Invalid email or password.';
    err.style.display = 'block';
  }
  return false;
}

function logout() {
  currentUser = null;
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('landing').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ DASHBOARD NAVIGATION ============
const navByRole = {
  admin: [
    ['Overview', 'overview'],
    ['__label__CRM', ''],
    ['CRM Dashboard', 'crmdash'],
    ['All Leads', 'crmleads'],
    ['__label__Database', ''],
    ['Job Seekers DB', 'db-jobseeker'],
    ['Employers DB', 'db-employer'],
    ['Freelancers DB', 'db-freelancer'],
    ['Trainers DB', 'db-trainer'],
    ['Manpower Contractors DB', 'db-manpower-contractor'],
    ['ATS Pipeline', 'ats'],
    ['Services', 'services'],
    ['__label__Settings', ''],
    ['Pricing', 'pricing'],
    ['Site Settings', 'sitesettings']
  ],
  employer: [
    ['Overview', 'overview'],
    ['Job Postings', 'jobs'],
    ['Applications', 'applications'],
    ['ATS Pipeline', 'ats'],
    ['Hire Freelancer & Trainer', 'hirefreelancer'],
    ['Manpower Contractual', 'manpowercontract'],
    ['Project Work', 'projectwork']
  ],
  jobseeker: [
    ['Overview', 'overview'],
    ['Job Search', 'jobsearch'],
    ['My Applications', 'apps'],
    ['Profile', 'profile']
  ],
  freelancer: [
    ['Overview', 'overview'],
    ['Profile', 'profile']
  ],
  trainer: [
    ['Overview', 'overview'],
    ['Profile', 'profile'],
    ['Courses Offered', 'courses']
  ],
  manpower: [
    ['Overview', 'overview'],
    ['Workforce Pool', 'pool'],
    ['Available Manpower List', 'available'],
    ['Deployment Requests', 'deploy'],
    ['Service Location', 'servicelocation']
  ],
  contractor: [
    ['Overview', 'overview'],
    ['Active Project List', 'activeprojects'],
    ['Received Bid', 'receivedbid']
  ]
};

function showDashboard(user) {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('dNameSide').textContent = user.name;
  document.getElementById('dRoleSide').textContent = user.role === 'admin' ? 'Administrator' : (roleLabels[user.role] || user.role);

  const nav = navByRole[user.role] || navByRole.jobseeker;
  const firstTab = nav.find(n => !n[0].startsWith('__label__'));

  document.getElementById('sideNav').innerHTML = nav.map(n => {
    if (n[0].startsWith('__label__')) {
      return `<li class="side-label">${n[0].replace('__label__', '')}</li>`;
    }
    return `<li><a class="${n[1] === firstTab[1] ? 'active' : ''}" onclick="switchTab(this,'${n[1]}')">${n[0]}</a></li>`;
  }).join('');

  renderTab(user, firstTab[1]);
}

function switchTab(el, tab) {
  document.querySelectorAll('.side-nav a').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
  renderTab(currentUser, tab);
}

function goToTab(tab) {
  renderTab(currentUser, tab);
  document.querySelectorAll('.side-nav a').forEach(a => a.classList.remove('active'));
  const target = Array.from(document.querySelectorAll('.side-nav a')).find(a => (a.getAttribute('onclick') || '').includes("'" + tab + "'"));
  if (target) target.classList.add('active');
}

function dbLabel(key) {
  if (key === 'manpower-contractor') return 'Manpower Contractors';
  return roleLabels[key] || key;
}

function statusBadge(status) {
  status = status || 'Pending';
  const cls = status === 'Published' || status === 'Accepted' || status === 'Fulfilled' ? 'green' : (status === 'Rejected' || status === 'Declined' || status === 'Cancelled' ? 'red' : 'gold');
  return `<span class="badge ${cls}">${status}</span>`;
}

function appStatusBadge(status) {
  if (status === 'Rejected') return '<span class="badge red">Rejected</span>';
  if (status === 'Pending' || !status) return '<span class="badge gold">Pending Review</span>';
  if (status === 'Hired') return '<span class="badge green">Hired</span>';
  return '<span class="badge green">' + status + '</span>';
}

function getSubscription(u) {
  if (u.role === 'jobseeker') {
    const p = state.profiles[u.email];
    return (p && p.ats) ? { label: 'ATS · ₹' + state.pricing.atsBoost + ' Active', active: true } : { label: 'Free listing', active: false };
  }
  return u.subscription === 'Premium' ? { label: 'Premium · ₹' + state.pricing.premiumSubscription, active: true } : { label: 'Free', active: false };
}

// ============ MAIN TAB RENDERER ============
function renderTab(user, tab) {
  activeTab = tab;
  const heading = document.getElementById('dashHeading');
  const sub = document.getElementById('dashSub');
  const c = document.getElementById('dashContent');

  const tabTitles = {
    overview: 'Overview',
    ats: 'ATS Pipeline',
    jobsearch: 'Job Search',
    apps: 'My Applications',
    profile: 'Profile',
    jobs: 'Job Postings',
    applications: 'Applications',
    pool: 'Workforce Pool',
    available: 'Available Manpower List',
    deploy: 'Deployment Requests',
    servicelocation: 'Service Location',
    activeprojects: 'Active Project List',
    receivedbid: 'Received Bid',
    services: 'Services',
    pricing: 'Pricing',
    crmdash: 'CRM Dashboard',
    crmleads: 'All Leads',
    sitesettings: 'Site Settings',
    hirefreelancer: 'Hire Freelancer & Trainer',
    manpowercontract: 'Manpower Contractual',
    projectwork: 'Project Work',
    courses: 'Courses Offered'
  };

  heading.textContent = tab.startsWith('db-') ? (dbLabel(tab.replace('db-', '')) + ' Database') : (tabTitles[tab] || (tab.charAt(0).toUpperCase() + tab.slice(1)));
  sub.textContent = 'Signed in as ' + user.email;

  if (tab === 'overview') {
    c.innerHTML = overviewWidgets(user) +
      (user.role === 'employer' || user.role === 'admin' ? atsPanel(user) : '') +
      (user.role === 'admin' ? crmSnapshotWidget() : '') +
      ((user.role === 'freelancer' || user.role === 'trainer') ? incomingHireRequestsWidget(user) : '') +
      activityPanel(user);
  } else if (tab === 'hirefreelancer' && user.role === 'employer') {
    c.innerHTML = employerHireFreelancerTrainerPanel(user);
  } else if (tab === 'manpowercontract' && user.role === 'employer') {
    c.innerHTML = employerManpowerContractualPanel(user);
  } else if (tab === 'projectwork' && user.role === 'employer') {
    c.innerHTML = employerProjectWorkPanel(user);
  } else if (tab === 'crmdash' && user.role === 'admin') {
    c.innerHTML = crmDashboardPanel();
  } else if (tab === 'crmleads' && user.role === 'admin') {
    c.innerHTML = crmLeadsPanel();
  } else if (tab.startsWith('db-') && user.role === 'admin') {
    c.innerHTML = databasePanel(tab.replace('db-', ''));
  } else if (tab === 'ats') {
    c.innerHTML = atsPanel(user);
  } else if (tab === 'services' && user.role === 'admin') {
    c.innerHTML = servicesPanel();
  } else if (tab === 'pricing' && user.role === 'admin') {
    c.innerHTML = pricingPanel();
  } else if (tab === 'sitesettings' && user.role === 'admin') {
    c.innerHTML = siteSettingsPanel();
  } else if (tab === 'profile' && user.role === 'jobseeker') {
    c.innerHTML = jobSeekerProfilePanel(user);
  } else if (tab === 'jobsearch' && user.role === 'jobseeker') {
    c.innerHTML = jobSeekerJobSearchPanel(user);
    renderDashJobResults('');
  } else if (tab === 'apps' && user.role === 'jobseeker') {
    c.innerHTML = jobSeekerApplicationsPanel(user);
  } else if (tab === 'profile' && user.role === 'freelancer') {
    c.innerHTML = freelancerProfilePanel(user);
  } else if (tab === 'profile' && user.role === 'trainer') {
    c.innerHTML = trainerProfilePanel(user);
  } else if (tab === 'courses' && user.role === 'trainer') {
    c.innerHTML = trainerCoursesSelfPanel(user);
  } else if (tab === 'jobs' && user.role === 'employer') {
    c.innerHTML = employerJobsPanel(user);
  } else if (tab === 'applications' && user.role === 'employer') {
    c.innerHTML = employerApplicationsPanel(user);
  } else if (tab === 'pool' && user.role === 'manpower') {
    c.innerHTML = workforcePoolPanel(user);
  } else if (tab === 'available' && user.role === 'manpower') {
    c.innerHTML = availableManpowerPanel(user);
  } else if (tab === 'deploy' && user.role === 'manpower') {
    c.innerHTML = deploymentRequestsPanel(user);
  } else if (tab === 'servicelocation' && user.role === 'manpower') {
    c.innerHTML = serviceLocationPanel(user);
  } else if (tab === 'activeprojects' && user.role === 'contractor') {
    c.innerHTML = activeProjectListPanel(user);
  } else if (tab === 'receivedbid' && user.role === 'contractor') {
    c.innerHTML = receivedBidPanel(user);
  } else {
    c.innerHTML = genericPanel(tab);
  }
}

// ============ OVERVIEW & WIDGETS ============
function overviewWidgets(user) {
  if (user.role === 'admin') {
    const counts = {};
    state.users.forEach(u => { counts[u.role] = (counts[u.role] || 0) + 1; });
    return `<div class="widgets">
      <div class="widget"><b>${state.users.length}</b><span>Total Registered Users</span></div>
      <div class="widget"><b>${counts.employer || 0}</b><span>Employers</span></div>
      <div class="widget"><b>${state.candidates.length}</b><span>Candidates in ATS</span></div>
      <div class="widget"><b>6</b><span>Active Service Verticals</span></div>
    </div>`;
  }
  return `<div class="widgets">
    <div class="widget"><b>${roleLabels[user.role] || 'Member'}</b><span>Account Type</span></div>
    <div class="widget"><b>Active</b><span>Profile Status</span></div>
    <div class="widget"><b>0</b><span>New Notifications</span></div>
    <div class="widget"><b>100%</b><span>Profile Completion</span></div>
  </div>`;
}

function activityPanel(user) {
  return `<div class="panel"><h3>Welcome, ${user.name}</h3>
    <p style="color:var(--text-dim);font-size:13.5px;line-height:1.7;">
    This is your Shield Job Portal dashboard as a <b style="color:var(--gold-light)">${user.role === 'admin' ? 'Administrator' : (roleLabels[user.role] || user.role)}</b>.
    Every vertical connects directly to the ATS hiring pipeline, CRM intelligence, and real-time database.</p></div>`;
}

function servicesPanel() {
  const serviceList = [
    { title: 'Job Seeker', icon: '💼' },
    { title: 'Employer', icon: '🏢' },
    { title: 'Freelancer', icon: '🧑‍💻' },
    { title: 'Trainer', icon: '🎓' },
    { title: 'Manpower Provider', icon: '👷' },
    { title: 'Project Contractual Service', icon: '📑' }
  ];

  return `<div class="panel"><h3>Active Service Verticals</h3>
  <table><tr><th>Service</th><th>Users</th><th>Status</th></tr>
  ${serviceList.map(s => {
    const count = state.users.filter(u => roleLabels[u.role] === s.title).length;
    return `<tr><td>${s.title}</td><td>${count}</td><td><span class="badge green">Live</span></td></tr>`;
  }).join('')}
  </table></div>`;
}

// ============ ATS PIPELINE MODULE ============
function atsStageCell(candidateList, stageIdx) {
  const inStage = candidateList.filter(c => c.stage === stageIdx);
  if (!inStage.length) return `<span style="color:var(--text-dim);font-size:11px;">—</span>`;
  const items = inStage.map(c => {
    const gIdx = state.candidates.indexOf(c);
    return `<label><input type="checkbox" class="ats-check" value="${gIdx}"> ${c.name}</label>`;
  }).join('');
  return `<details class="stage-dropdown">
    <summary>${inStage.length} ▾</summary>
    <div class="stage-checklist">${items}</div>
  </details>`;
}

function atsHiredCell(candidateList) {
  const hired = candidateList.filter(c => c.stage === stages.length - 1);
  if (!hired.length) return `<span style="color:var(--text-dim);font-size:11px;">—</span>`;
  return `<div class="stage-hired-list">${hired.map(c => `<div>✓ ${c.name}</div>`).join('')}</div>`;
}

function atsPanel(user) {
  const isAdmin = user.role === 'admin';
  let rowJobIdx;
  if (isAdmin) {
    rowJobIdx = state.jobs.map((j, i) => i).filter(i => state.jobs[i].status === 'Published' && state.jobs[i].openStatus !== 'Closed');
  } else {
    rowJobIdx = state.jobs.map((j, i) => i).filter(i => state.jobs[i].postedBy === user.email);
  }

  const rows = rowJobIdx.map(idx => {
    const job = state.jobs[idx];
    const jobCandidates = isAdmin ? state.candidates.filter(c => c.jobIdx === idx) : state.candidates.filter(c => c.jobIdx === idx && c.applicantEmail);
    const employerName = isAdmin ? job.company : user.name;
    return `<tr>
      <td>${employerName}</td>
      <td>${job.title}</td>
      <td>${atsStageCell(jobCandidates, 0)}</td>
      <td>${atsStageCell(jobCandidates, 1)}</td>
      <td>${atsStageCell(jobCandidates, 2)}</td>
      <td>${atsStageCell(jobCandidates, 3)}</td>
      <td>${atsStageCell(jobCandidates, 4)}</td>
      <td>${atsHiredCell(jobCandidates)}</td>
    </tr>`;
  }).join('');

  let unassignedRow = '';
  if (isAdmin) {
    const unassigned = state.candidates.filter(c => c.jobIdx === undefined || c.jobIdx === null);
    if (unassigned.length) {
      unassignedRow = `<tr>
        <td>—</td>
        <td>Unassigned Pool</td>
        <td>${atsStageCell(unassigned, 0)}</td>
        <td>${atsStageCell(unassigned, 1)}</td>
        <td>${atsStageCell(unassigned, 2)}</td>
        <td>${atsStageCell(unassigned, 3)}</td>
        <td>${atsStageCell(unassigned, 4)}</td>
        <td>${atsHiredCell(unassigned)}</td>
      </tr>`;
    }
  }

  const addBtn = isAdmin ? `<button class="btn3d small red" onclick="addCandidate()">+ Add Candidate</button>` : '';

  return `<div class="panel">
    <h3>ATS · Applicant Tracking Pipeline ${isAdmin ? '— All Active Jobs' : '— Your Posted Jobs'}</h3>
    <div style="overflow-x:auto;">
    <table class="ats-table">
      <tr><th>Employer Name</th><th>Post</th><th>Applied</th><th>Screening</th><th>Interview</th><th>Verification</th><th>Offer</th><th>Hired</th></tr>
      ${rows || unassignedRow ? rows + unassignedRow : `<tr><td colspan="8" style="color:var(--text-dim);">${isAdmin ? 'No active job postings right now.' : "You haven't posted any jobs yet."}</td></tr>`}
    </table>
    </div>
    <div class="ats-action-row">
      ${addBtn}
      <button class="btn3d small" onclick="moveSelectedTo('Screening')">Move - Screening</button>
      <button class="btn3d small" onclick="moveSelectedTo('Interview')">Move - Interview</button>
      <button class="btn3d small" onclick="moveSelectedTo('Verification')">Move - Verification</button>
      <button class="btn3d small" onclick="moveSelectedTo('Offer')">Move - Offer</button>
      <button class="btn3d small" onclick="moveSelectedTo('Hired')">Move - Hired</button>
    </div>
  </div>`;
}

function moveSelectedTo(stageName) {
  const targetIdx = stages.indexOf(stageName);
  if (targetIdx === -1) return;
  const checked = Array.from(document.querySelectorAll('.ats-check:checked'));
  if (!checked.length) {
    toast('Select at least one candidate first.');
    return;
  }
  checked.forEach(chk => {
    const i = parseInt(chk.value, 10);
    const c = state.candidates[i];
    if (!c) return;
    c.stage = targetIdx;
    if (c.applicantEmail) {
      const app = (state.applications[c.applicantEmail] || []).find(a => a.jobIdx === c.jobIdx);
      if (app) app.status = stages[targetIdx];
    }
    logActivity('<b>' + c.name + '</b> moved to <b>' + stageName + '</b>' + (c.role ? ' for ' + c.role : ''));
  });
  window.api.saveLocalState();
  playClick();
  toast(checked.length + ' candidate' + (checked.length === 1 ? '' : 's') + ' moved to ' + stageName + '.');
  renderTab(currentUser, activeTab === 'overview' ? 'overview' : 'ats');
}

function addCandidate() {
  if (!currentUser || currentUser.role !== 'admin') {
    toast('Only admin can add unassigned candidates directly.');
    return;
  }
  const n = prompt('Candidate name:');
  if (!n) return;
  const r = prompt('Applying for role:') || 'General';
  state.candidates.push({ name: n, role: r, stage: 0 });
  window.api.saveLocalState();
  logActivity('Admin directly added candidate <b>' + n + '</b>');
  renderTab(currentUser, activeTab === 'overview' ? 'overview' : 'ats');
}

// ============ JOB SEEKER PROFILE & APPLICATIONS ============
function jobSeekerProfilePanel(user) {
  const p = state.profiles[user.email] || {};
  const atsSel = p.ats === true ? 'with' : (p.ats === false ? 'without' : '');
  const savedBadge = p.saved ? `<div class="profile-saved-badge">✓ Profile saved · ${p.ats ? 'ATS Enabled (₹' + state.pricing.atsBoost + ' paid)' : 'Standard listing (Free)'}</div>` : '';

  return `<div class="panel">
    <h3>Build Your Profile</h3>
    ${savedBadge}
    <form class="profile-form" onsubmit="return saveProfile(event)">
      <h4 style="color:var(--gold-light);font-size:13px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:12px;">Personal &amp; Contact</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Full Name</label><input type="text" id="pfName" value="${user.name}" required></div>
        <div class="field"><label>Email</label><input type="email" id="pfEmail" value="${user.email}" readonly style="opacity:.7;"></div>
        <div class="field"><label>Phone</label><input type="tel" id="pfPhone" value="${user.phone || ''}" required></div>
        <div class="field"><label>WhatsApp Number</label><input type="tel" id="pfWhatsapp" value="${p.whatsapp || ''}" placeholder="10-digit WhatsApp number"></div>
        <div class="field"><label>Current Location</label><input type="text" id="pfCurLoc" value="${p.curLocation || ''}" placeholder="e.g. Jamshedpur, Jharkhand"></div>
        <div class="field"><label>Desired Location</label><input type="text" id="pfDesLoc" value="${p.desLocation || ''}" placeholder="e.g. Bengaluru / Remote"></div>
        <div class="field"><label>Marital Status</label>
          <select id="pfMarital">
            <option value="" ${!p.marital ? 'selected' : ''}>Select</option>
            <option value="Married" ${p.marital === 'Married' ? 'selected' : ''}>Married</option>
            <option value="Not Married" ${p.marital === 'Not Married' ? 'selected' : ''}>Not Married</option>
          </select>
        </div>
        <div class="field"><label>LinkedIn Profile URL</label><input type="text" id="pfLinkedin" value="${p.linkedin || ''}" placeholder="https://linkedin.com/in/..."></div>
      </div>

      <h4 style="color:var(--gold-light);font-size:13px;letter-spacing:.05em;text-transform:uppercase;margin:18px 0 12px;">Professional Details</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Desired Job Title</label><input type="text" id="pfTitle" value="${p.title || ''}" placeholder="e.g. Frontend Developer" required></div>
        <div class="field"><label>Total Experience</label><input type="text" id="pfExp" value="${p.exp || ''}" placeholder="e.g. 2 years"></div>
        <div class="field"><label>Qualification</label><input type="text" id="pfQualification" value="${p.qualification || ''}" placeholder="e.g. B.Tech in CSE"></div>
        <div class="field"><label>Projects Done</label><input type="text" id="pfProjects" value="${p.projectsDone || ''}" placeholder="e.g. 5 live projects"></div>
        <div class="field"><label>Current Company Name</label><input type="text" id="pfCompany" value="${p.company || ''}" placeholder="e.g. ABC Pvt Ltd"></div>
        <div class="field"><label>Current Salary</label><input type="text" id="pfCurSalary" value="${p.curSalary || ''}" placeholder="e.g. ₹5,00,000 / annum"></div>
        <div class="field"><label>Expected Salary</label><input type="text" id="pfSalary" value="${p.salary || ''}" placeholder="e.g. ₹6,00,000 / annum"></div>
        <div class="field"><label>Notice Period</label><input type="text" id="pfNotice" value="${p.notice || ''}" placeholder="e.g. 30 days"></div>
      </div>
      <div class="field"><label>Reason For Change</label><input type="text" id="pfReason" value="${p.reason || ''}" placeholder="e.g. Career growth, relocation"></div>
      <div class="field"><label>Key Skills</label><input type="text" id="pfSkills" value="${p.skills || ''}" placeholder="e.g. React, Node.js, SQL"></div>
      <div class="field"><label>Project Link (if any)</label><input type="text" id="pfProjectLink" value="${p.projectLink || ''}" placeholder="https://github.com/... or live demo link"></div>
      <div class="field"><label>About / Summary</label><textarea id="pfAbout" placeholder="A short summary about your experience and goals...">${p.about || ''}</textarea></div>

      <h4 style="color:var(--gold-light);font-size:13px;letter-spacing:.05em;text-transform:uppercase;margin:18px 0 12px;">References (Any Two)</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Reference 1 — Name &amp; Contact</label><input type="text" id="pfRef1" value="${p.ref1 || ''}" placeholder="Name, designation, phone/email"></div>
        <div class="field"><label>Reference 2 — Name &amp; Contact</label><input type="text" id="pfRef2" value="${p.ref2 || ''}" placeholder="Name, designation, phone/email"></div>
      </div>

      <div class="field">
        <label>Upload Resume (PDF / DOC / DOCX)</label>
        <div class="resume-drop ${p.resumeName ? 'has-file' : ''}" id="resumeDrop">
          <input type="file" id="pfResume" accept=".pdf,.doc,.docx" onchange="handleResumeChange(this)">
          <div class="rd-title">📄 Click or drop your resume here</div>
          <div class="rd-sub">Max size 5MB</div>
          <div class="rd-file" id="resumeFileName">${p.resumeName ? 'Selected: ' + p.resumeName : ''}</div>
        </div>
      </div>

      <div class="field">
        <label>ATS (Applicant Tracking) Boost</label>
        <div class="ats-choice">
          <div class="ats-option ${atsSel === 'with' ? 'selected' : ''}" id="optWith" onclick="selectAts('with')">
            <span class="ao-check">${atsSel === 'with' ? '✓' : ''}</span>
            <span class="ao-tag">Recommended</span>
            <div class="ao-price">₹${state.pricing.atsBoost} <small>/ one-time</small></div>
            <b style="color:var(--text)">With ATS Service</b>
            <ul>
              <li>Priority visibility to Employers</li>
              <li>Profile enters the ATS pipeline directly</li>
              <li>Resume keyword optimisation check</li>
              <li>Faster shortlisting</li>
            </ul>
          </div>
          <div class="ats-option ${atsSel === 'without' ? 'selected' : ''}" id="optWithout" onclick="selectAts('without')">
            <span class="ao-check">${atsSel === 'without' ? '✓' : ''}</span>
            <span class="ao-tag">Basic</span>
            <div class="ao-price">Free</div>
            <b style="color:var(--text)">Without ATS Service</b>
            <ul>
              <li>Standard profile listing</li>
              <li>Visible in general search</li>
              <li>Manual application only</li>
              <li>Upgrade anytime later</li>
            </ul>
          </div>
        </div>
        <input type="hidden" id="pfAts" value="${atsSel}">
      </div>

      <button class="btn3d" type="submit">Save Profile</button>
    </form>
  </div>`;
}

function selectAts(choice) {
  document.getElementById('pfAts').value = choice;
  document.getElementById('optWith').classList.toggle('selected', choice === 'with');
  document.getElementById('optWithout').classList.toggle('selected', choice === 'without');
  document.getElementById('optWith').querySelector('.ao-check').textContent = choice === 'with' ? '✓' : '';
  document.getElementById('optWithout').querySelector('.ao-check').textContent = choice === 'without' ? '✓' : '';
}

function handleResumeChange(input) {
  const drop = document.getElementById('resumeDrop');
  const label = document.getElementById('resumeFileName');
  if (input.files && input.files[0]) {
    const f = input.files[0];
    if (f.size > 5 * 1024 * 1024) {
      label.textContent = 'File too large — max 5MB';
      drop.classList.remove('has-file');
      input.value = '';
      return;
    }
    label.textContent = 'Selected: ' + f.name;
    drop.classList.add('has-file');
    resumeFiles[currentUser.email] = f;
  }
}

function saveProfile(e) {
  e.preventDefault();
  const ats = document.getElementById('pfAts').value;
  if (!ats) {
    alert('Please choose whether you want the ATS service (₹' + state.pricing.atsBoost + ') or a free standard listing.');
    return false;
  }
  const resumeInput = document.getElementById('pfResume');
  const resumeName = resumeInput.files && resumeInput.files[0] ? resumeInput.files[0].name : (state.profiles[currentUser.email]?.resumeName || '');

  state.profiles[currentUser.email] = {
    title: document.getElementById('pfTitle').value.trim(),
    exp: document.getElementById('pfExp').value.trim(),
    salary: document.getElementById('pfSalary').value.trim(),
    curSalary: document.getElementById('pfCurSalary').value.trim(),
    skills: document.getElementById('pfSkills').value.trim(),
    about: document.getElementById('pfAbout').value.trim(),
    whatsapp: document.getElementById('pfWhatsapp').value.trim(),
    curLocation: document.getElementById('pfCurLoc').value.trim(),
    desLocation: document.getElementById('pfDesLoc').value.trim(),
    marital: document.getElementById('pfMarital').value,
    linkedin: document.getElementById('pfLinkedin').value.trim(),
    qualification: document.getElementById('pfQualification').value.trim(),
    projectsDone: document.getElementById('pfProjects').value.trim(),
    company: document.getElementById('pfCompany').value.trim(),
    notice: document.getElementById('pfNotice').value.trim(),
    reason: document.getElementById('pfReason').value.trim(),
    projectLink: document.getElementById('pfProjectLink').value.trim(),
    ref1: document.getElementById('pfRef1').value.trim(),
    ref2: document.getElementById('pfRef2').value.trim(),
    resumeName: resumeName,
    ats: ats === 'with',
    reviewStatus: 'Published',
    saved: true
  };

  currentUser.phone = document.getElementById('pfPhone').value.trim();
  currentUser.name = document.getElementById('pfName').value.trim();
  document.getElementById('dNameSide').textContent = currentUser.name;

  if (ats === 'with') {
    playThankYou();
    toast('Profile saved! ₹' + state.pricing.atsBoost + ' ATS service activated — entered hiring pipeline.');
    if (!state.candidates.some(c => c.applicantEmail === currentUser.email)) {
      state.candidates.push({ name: currentUser.name, role: state.profiles[currentUser.email].title || 'Job Seeker', stage: 0, applicantEmail: currentUser.email });
    }
  } else {
    playClick();
    toast('Profile saved with standard (free) listing.');
  }

  window.api.saveLocalState();
  renderTab(currentUser, 'profile');
  return false;
}

function jobSeekerJobSearchPanel(user) {
  return `<div class="panel">
    <h3>Search &amp; Apply</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:16px;">Browse admin-approved openings and apply in one click — no forms, no re-typing.</p>
    <div class="search-bar" style="margin:0 0 20px;max-width:100%;">
      <input type="text" id="dashJobSearchInput" placeholder="Search by job title, company or location..." oninput="renderDashJobResults(this.value)">
      <button class="btn3d small" onclick="renderDashJobResults(document.getElementById('dashJobSearchInput').value)">Search</button>
    </div>
    <div id="dashJobSearchResults" class="public-results"></div>
  </div>`;
}

function renderDashJobResults(filter) {
  filter = (filter || '').trim().toLowerCase();
  const el = document.getElementById('dashJobSearchResults');
  if (!el) return;
  const list = state.jobs.filter(j => j.status === 'Published' && j.openStatus !== 'Closed' && (!filter || (j.title + ' ' + j.company + ' ' + j.location).toLowerCase().includes(filter)));
  const myApps = state.applications[currentUser.email] || [];

  el.innerHTML = list.length ? list.map(j => {
    const idx = state.jobs.indexOf(j);
    const applied = myApps.some(a => a.jobIdx === idx);
    return `<div class="public-card">
      <h4>${j.title}</h4>
      <div class="pc-meta">🏢 ${j.company}${j.department ? ' · ' + j.department : ''}<br>📍 ${j.location} &nbsp;|&nbsp; 🕐 ${j.empType}${j.category ? ' &nbsp;|&nbsp; 🏷️ ' + j.category : ''}</div>
      <p>${j.summary || ''}</p>
      <div class="pc-price">${j.compensation || 'Compensation on request'}</div>
      <button class="btn3d small" ${applied ? 'disabled' : ''} onclick="applyToJob(${idx})">${applied ? '✓ Applied' : 'Apply Now'}</button>
    </div>`;
  }).join('') : `<div class="public-empty">No published jobs match your search right now. Check back soon!</div>`;
}

function applyToJob(idx) {
  const job = state.jobs[idx];
  if (!job) return;
  if (!state.applications[currentUser.email]) state.applications[currentUser.email] = [];
  if (state.applications[currentUser.email].some(a => a.jobIdx === idx)) {
    toast('You have already applied to this job.');
    return;
  }
  state.applications[currentUser.email].push({ jobIdx: idx, status: 'Pending', stage: 0 });
  window.api.saveLocalState();
  playApplyThankYou();
  toast('Thank you for applying! Your profile is under review — track it in My Applications.');
  logActivity('<b>' + currentUser.name + '</b> applied for <b>' + job.title + '</b> at ' + job.company);
  renderDashJobResults(document.getElementById('dashJobSearchInput') ? document.getElementById('dashJobSearchInput').value : '');
}

function jobSeekerApplicationsPanel(user) {
  const apps = state.applications[user.email] || [];
  const rows = apps.map(a => {
    const j = state.jobs[a.jobIdx];
    if (!j) return '';
    return `<tr><td>${j.title}</td><td>${j.company}</td><td>${j.location}</td><td>${appStatusBadge(a.status)}</td></tr>`;
  }).join('');

  return `<div class="panel"><h3>My Applications</h3>
  <table><tr><th>Job Title</th><th>Company</th><th>Location</th><th>Status</th></tr>
  ${rows || `<tr><td colspan="4" style="color:var(--text-dim);">You haven't applied to any jobs yet. Use Job Search to apply.</td></tr>`}
  </table></div>`;
// ============ EMPLOYER PANELS ============
function employerJobsPanel(user) {
  const myJobs = state.jobs.filter(j => j.postedBy === user.email);
  const jobsList = myJobs.length ? myJobs.map(j => {
    const idx = state.jobs.indexOf(j);
    return `
    <div class="job-card">
      <h4>${j.title} <span class="badge ${j.status === 'Pending' ? 'gold' : (j.openStatus === 'Closed' ? 'red' : 'green')}" style="margin-left:8px;">${j.status === 'Pending' ? '⏳ Pending Admin Review' : (j.openStatus === 'Closed' ? 'Closed' : 'Open')}</span></h4>
      <div class="job-meta">
        <span>🏢 ${j.company}${j.department ? ' · ' + j.department : ''}</span>
        <span>📍 ${j.location}</span>
        <span>🕐 ${j.empType}</span>
      </div>
      <p><b style="color:var(--text)">Compensation:</b> ${j.compensation || '—'}</p>
      <p><b style="color:var(--text)">Summary:</b> ${j.summary || '—'}</p>
      <p><b style="color:var(--text)">Close hiring within:</b> ${j.closeWithin} &nbsp;|&nbsp; <b style="color:var(--text)">Interview mode:</b> ${j.interviewMode} &nbsp;|&nbsp; <b style="color:var(--text)">Update via:</b> ${j.statusUpdateVia}</p>
      <p><b style="color:var(--text)">Hiring assistance:</b> ${j.hiringAssist === 'custom' ? 'Hiring Assistant Service (Custom Commercial)' : 'Normal Hiring Process (Normal Pricing)'}</p>
      <div class="job-tags">${(j.bgChecks || []).map(b => `<span class="badge gold">${b} Check</span>`).join('')}</div>
      <div style="margin-top:12px;display:flex;gap:8px;">
        ${j.status === 'Pending' ? '<span style="color:var(--gold-light);font-size:12px;">⏳ Awaiting Admin approval before going live</span>' : `<button class="btn3d small ${j.openStatus === 'Closed' ? '' : 'red'}" onclick="toggleJobOpenStatus(${idx})">${j.openStatus === 'Closed' ? 'Reopen Hiring' : 'Close Hiring'}</button>`}
        <button class="offer-del" onclick="removeJob(${idx})">Remove Posting</button>
      </div>
    </div>`;
  }).join('') : `<div class="offer-empty">No jobs posted yet. Use the form below to create your first job posting.</div>`;

  return `<div class="panel">
    <h3>Post a New Job</h3>
    <form class="profile-form" onsubmit="return postJob(event)">
      <div class="form-section-label">Role Basics</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Job Title</label><input type="text" id="jbTitle" placeholder="e.g. Sales Manager" required></div>
        <div class="field"><label>Employment Type</label>
          <select id="jbEmpType" required>
            <option value="">Select type</option>
            <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Temporary</option>
          </select>
        </div>
        <div class="field"><label>Company Name</label><input type="text" id="jbCompany" value="${(state.profiles[user.email] && state.profiles[user.email].company) || user.name}" placeholder="Your company name" required></div>
        <div class="field"><label>Department</label><input type="text" id="jbDept" placeholder="e.g. Sales, Engineering"></div>
        <div class="field"><label>Job Location</label><input type="text" id="jbLocation" placeholder="City, State, or Remote/Hybrid" required></div>
        <div class="field"><label>Compensation</label><input type="text" id="jbCompensation" placeholder="Salary range or benefits"></div>
      </div>

      <div class="form-section-label">Role Details</div>
      <div class="field"><label>Job Summary</label><textarea id="jbSummary" placeholder="A short overview of the role's purpose..."></textarea></div>
      <div class="field"><label>Key Responsibilities</label><textarea id="jbResponsibilities" placeholder="One responsibility per line..."></textarea></div>
      <div class="field"><label>Requirements &amp; Skills</label><textarea id="jbRequirements" placeholder="Education, experience level, certifications needed..."></textarea></div>

      <div class="form-section-label">Application Process</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Application Instructions</label><select id="jbAppInstructions"><option value="Updated CV">Updated CV</option></select></div>
        <div class="field"><label>Status To Be Updated By</label><select id="jbStatusUpdate"><option value="Call">Call</option><option value="WhatsApp">WhatsApp</option></select></div>
        <div class="field"><label>Close Hiring Within</label><select id="jbCloseWithin"><option>7 Days</option><option selected>15 Days</option><option>21 Days</option><option>30 Days</option></select></div>
        <div class="field"><label>Interview Mode</label><select id="jbInterviewMode"><option>Face to Face</option><option>Online</option></select></div>
        <div class="field"><label>Notice Period Accepted</label><input type="text" id="jbNotice" placeholder="e.g. Immediate to 30 days"></div>
      </div>
      <div class="field"><label>Special Notes</label><textarea id="jbNotes" placeholder="Any additional notes for candidates..."></textarea></div>

      <div class="form-section-label">Background Verification Level</div>
      <div class="check-group" id="bgCheckGroup">
        <label class="check-item"><input type="checkbox" value="Experience"> Experience</label>
        <label class="check-item"><input type="checkbox" value="Residential"> Residential</label>
        <label class="check-item"><input type="checkbox" value="Reference"> Reference Check</label>
        <label class="check-item"><input type="checkbox" value="Educational"> Educational</label>
        <label class="check-item"><input type="checkbox" value="Police"> Police Verification</label>
      </div>

      <div class="form-section-label">Hiring Assistance</div>
      <div class="ats-choice">
        <div class="ats-option" id="hireOptCustom" onclick="selectHiring('custom')">
          <span class="ao-check" id="hireCheckCustom"></span>
          <span class="ao-tag">Managed for you</span>
          <div class="ao-price">₹${state.pricing.employerHiringAssistant}+ <small>starting</small></div>
          <b style="color:var(--text)">Hiring Assistant Service</b>
          <ul>
            <li>Dedicated hiring assistant</li>
            <li>Sourcing, screening &amp; scheduling handled</li>
            <li>Pricing quoted based on role &amp; volume</li>
          </ul>
        </div>
        <div class="ats-option selected" id="hireOptNormal" onclick="selectHiring('normal')">
          <span class="ao-check">✓</span>
          <span class="ao-tag">Self-managed</span>
          <div class="ao-price">₹${state.pricing.employerNormalPosting} <small>per posting</small></div>
          <b style="color:var(--text)">Normal Hiring Process</b>
          <ul>
            <li>Standard job listing &amp; ATS pipeline</li>
            <li>You manage applicants yourself</li>
            <li>Regular platform pricing applies</li>
          </ul>
        </div>
      </div>
      <input type="hidden" id="jbHiringAssist" value="normal">

      <button class="btn3d" type="submit">Post Job</button>
    </form>
  </div>

  <div class="panel">
    <h3>My Job Postings</h3>
    ${jobsList}
  </div>`;
}

function selectHiring(choice) {
  document.getElementById('jbHiringAssist').value = choice;
  document.getElementById('hireOptCustom').classList.toggle('selected', choice === 'custom');
  document.getElementById('hireOptNormal').classList.toggle('selected', choice === 'normal');
  document.getElementById('hireCheckCustom').textContent = choice === 'custom' ? '✓' : '';
  document.getElementById('hireOptNormal').querySelector('.ao-check').textContent = choice === 'normal' ? '✓' : '';
}

function postJob(e) {
  e.preventDefault();
  const bgChecks = Array.from(document.querySelectorAll('#bgCheckGroup input:checked')).map(i => i.value);
  const job = {
    id: Date.now(),
    title: document.getElementById('jbTitle').value.trim(),
    empType: document.getElementById('jbEmpType').value,
    company: document.getElementById('jbCompany').value.trim(),
    department: document.getElementById('jbDept').value.trim(),
    location: document.getElementById('jbLocation').value.trim(),
    compensation: document.getElementById('jbCompensation').value.trim(),
    summary: document.getElementById('jbSummary').value.trim(),
    responsibilities: document.getElementById('jbResponsibilities').value.trim(),
    requirements: document.getElementById('jbRequirements').value.trim(),
    appInstructions: document.getElementById('jbAppInstructions').value,
    statusUpdateVia: document.getElementById('jbStatusUpdate').value,
    closeWithin: document.getElementById('jbCloseWithin').value,
    interviewMode: document.getElementById('jbInterviewMode').value,
    notice: document.getElementById('jbNotice').value.trim(),
    notes: document.getElementById('jbNotes').value.trim(),
    bgChecks: bgChecks,
    hiringAssist: document.getElementById('jbHiringAssist').value,
    postedBy: currentUser.email,
    category: 'Other',
    status: 'Pending',
    openStatus: 'Open'
  };

  if (!job.title || !job.empType || !job.company || !job.location) {
    alert('Please fill Job Title, Employment Type, Company Name and Job Location.');
    return false;
  }

  state.jobs.push(job);
  window.api.saveLocalState();
  playThankYou();
  toast('Job submitted for admin review: ' + job.title + '. It will go live once the Admin approves it.');
  logActivity('Employer <b>' + currentUser.name + '</b> submitted job for review: <b>' + job.title + '</b> [Pending Admin Approval]');
  renderTab(currentUser, 'jobs');
  return false;
}

function removeJob(index) {
  state.jobs.splice(index, 1);
  window.api.saveLocalState();
  playClick();
  renderTab(currentUser, 'jobs');
}

function toggleJobOpenStatus(idx) {
  const j = state.jobs[idx];
  if (!j) return;
  j.openStatus = j.openStatus === 'Closed' ? 'Open' : 'Closed';
  window.api.saveLocalState();
  playClick();
  toast(j.openStatus === 'Closed' ? 'Hiring closed for ' + j.title + '.' : 'Hiring reopened for ' + j.title + '.');
  logActivity((j.openStatus === 'Closed' ? 'Closed hiring for ' : 'Reopened hiring for ') + '<b>' + j.title + '</b>');
  renderTab(currentUser, 'jobs');
}

function employerApplicationsPanel(user) {
  const myJobIdx = state.jobs.map((j, i) => i).filter(i => state.jobs[i].postedBy === user.email);
  let rows = [];
  Object.keys(state.applications).forEach(email => {
    (state.applications[email] || []).forEach(a => {
      if (myJobIdx.includes(a.jobIdx)) {
        rows.push({ email, app: a });
      }
    });
  });

  const tableRows = rows.map(r => {
    const seeker = state.users.find(u => u.email === r.email);
    const job = state.jobs[r.app.jobIdx];
    const p = state.profiles[r.email] || {};
    const resumeCell = p.resumeName
      ? `<button class="btn3d small" onclick="viewResume('${r.email}')">View / Download</button>`
      : `<span style="color:var(--text-dim);font-size:11px;">Not uploaded</span>`;

    return `<tr>
      <td>${seeker ? seeker.name : '—'}</td>
      <td>${seeker ? (seeker.phone || '—') : '—'}</td>
      <td>${p.notice || '—'}</td>
      <td>${p.exp || '—'}</td>
      <td style="color:var(--text-dim);font-size:12px;">${job ? job.title : '—'}</td>
      <td><button class="btn3d small dark" onclick="viewCandidateProfileReadonly('${r.email}')">View Profile</button></td>
      <td>${resumeCell}</td>
      <td>
        ${appStatusBadge(r.app.status)}
        <div style="margin-top:6px;display:flex;gap:6px;">
          <button class="btn3d small" ${r.app.status === 'Shortlisted' ? 'disabled' : ''} onclick="shortlistApplication('${r.email}',${r.app.jobIdx})">Shortlist</button>
          <button class="btn3d small red" ${r.app.status === 'Rejected' ? 'disabled' : ''} onclick="rejectApplication('${r.email}',${r.app.jobIdx})">Reject</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  return `<div class="panel">
    <h3>Applications Received</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">${rows.length} application${rows.length === 1 ? '' : 's'} across your job postings. Shortlist candidates to move them into the ATS Pipeline.</p>
    <div style="overflow-x:auto;">
    <table>
      <tr><th>Applicant Name</th><th>Contact</th><th>Notice</th><th>Experience</th><th>Applied For</th><th>Candidate Profile</th><th>Resume</th><th>Review</th></tr>
      ${tableRows || `<tr><td colspan="8" style="color:var(--text-dim);">No applications received yet.</td></tr>`}
    </table>
    </div>
  </div>`;
}

function shortlistApplication(email, jobIdx) {
  const app = (state.applications[email] || []).find(a => a.jobIdx === jobIdx);
  if (!app) return;
  app.status = 'Shortlisted';
  const seeker = state.users.find(u => u.email === email);
  const job = state.jobs[jobIdx];

  if (!state.candidates.some(c => c.applicantEmail === email && c.jobIdx === jobIdx)) {
    state.candidates.push({ name: seeker ? seeker.name : email, role: job ? job.title : 'Applicant', stage: 0, applicantEmail: email, jobIdx: jobIdx });
  }

  window.api.saveLocalState();
  playThankYou();
  toast('Candidate shortlisted and added to the ATS pipeline.');
  logActivity('<b>' + (seeker ? seeker.name : email) + '</b> shortlisted for <b>' + (job ? job.title : 'a role') + '</b>');
  renderTab(currentUser, 'applications');
}

function rejectApplication(email, jobIdx) {
  const app = (state.applications[email] || []).find(a => a.jobIdx === jobIdx);
  if (!app) return;
  app.status = 'Rejected';
  state.candidates = state.candidates.filter(c => !(c.applicantEmail === email && c.jobIdx === jobIdx));

  const seeker = state.users.find(u => u.email === email);
  const job = state.jobs[jobIdx];
  window.api.saveLocalState();
  playClick();
  toast('Candidate rejected.');
  logActivity('<b>' + (seeker ? seeker.name : email) + '</b> rejected for <b>' + (job ? job.title : 'a role') + '</b>');
  renderTab(currentUser, 'applications');
}

function viewCandidateProfileReadonly(email) {
  const u = state.users.find(x => x.email === email);
  const p = state.profiles[email] || {};
  const html = `<div class="admin-item-card">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;color:var(--text);">
      <div><b style="color:var(--gold-light)">Desired Title:</b> ${p.title || '—'}</div>
      <div><b style="color:var(--gold-light)">Experience:</b> ${p.exp || '—'}</div>
      <div><b style="color:var(--gold-light)">Qualification:</b> ${p.qualification || '—'}</div>
      <div><b style="color:var(--gold-light)">Current Company:</b> ${p.company || '—'}</div>
      <div><b style="color:var(--gold-light)">Current Location:</b> ${p.curLocation || '—'}</div>
      <div><b style="color:var(--gold-light)">Desired Location:</b> ${p.desLocation || '—'}</div>
      <div><b style="color:var(--gold-light)">Expected Salary:</b> ${p.salary || '—'}</div>
      <div><b style="color:var(--gold-light)">Notice Period:</b> ${p.notice || '—'}</div>
      <div><b style="color:var(--gold-light)">LinkedIn:</b> ${p.linkedin || '—'}</div>
      <div><b style="color:var(--gold-light)">Project Link:</b> ${p.projectLink || '—'}</div>
    </div>
    <div style="margin-top:12px;"><b style="color:var(--gold-light)">Skills:</b> ${p.skills || '—'}</div>
    <div style="margin-top:8px;"><b style="color:var(--gold-light)">About:</b> ${p.about || '—'}</div>
  </div>`;
  openModal('Candidate Profile — ' + (u ? u.name : email), html);
}

function viewResume(email) {
  const file = resumeFiles[email];
  if (file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return;
  }
  const name = (state.profiles[email] && state.profiles[email].resumeName) || 'Resume File';
  alert('Simulated resume download: ' + name + ' (In live cPanel deployment, this downloads directly from uploads/resumes/)');
}

// ============ FREELANCER & TRAINER HIRE MODULES ============
function employerHireFreelancerTrainerPanel(user) {
  const freelancerCards = [];
  Object.keys(state.offerings).forEach(email => {
    (state.offerings[email] || []).forEach(o => {
      if (o.status !== 'Published') return;
      const u = state.users.find(x => x.email === email);
      freelancerCards.push(`<div class="browse-card">
        <h4>${o.title}</h4>
        <div class="bc-meta">👤 ${u ? u.name : 'Freelancer'}${o.category ? ' · ' + o.category : ''} · ⏱ ${o.delivery || '—'}</div>
        <p>${o.desc || 'No description added.'}</p>
        <div class="bc-price">₹${o.price}</div>
        <button class="btn3d small red" onclick="openHireRequestModal('${email}','freelancer','${o.title.replace(/'/g, "\\'")}')">Hire Now</button>
      </div>`);
    });
  });

  const trainerCards = [];
  Object.keys(state.courses).forEach(email => {
    (state.courses[email] || []).forEach(co => {
      if (co.status !== 'Published') return;
      const u = state.users.find(x => x.email === email);
      trainerCards.push(`<div class="browse-card">
        <h4>${co.title}</h4>
        <div class="bc-meta">👤 ${u ? u.name : 'Trainer'}${co.category ? ' · ' + co.category : ''} · ⏱ ${co.duration || '—'}</div>
        <p>${co.desc || 'No description added.'}</p>
        <div class="bc-price">₹${co.price}</div>
        <button class="btn3d small red" onclick="openHireRequestModal('${email}','trainer','${co.title.replace(/'/g, "\\'")}')">Enroll / Hire</button>
      </div>`);
    });
  });

  const myRequests = state.hireRequests.map((r, idx) => ({ r, idx })).filter(x => x.r.employerEmail === user.email);
  const reqRows = myRequests.map(({ r }) => `
    <tr>
      <td>${r.targetName}</td>
      <td><span class="badge gold">${r.targetRole === 'freelancer' ? 'Freelancer' : 'Trainer'}</span></td>
      <td>${r.offeringTitle}</td>
      <td>${statusBadge(r.status === 'Accepted' ? 'Published' : (r.status === 'Declined' ? 'Rejected' : 'Pending'))}</td>
    </tr>`).join('');

  return `<div class="panel">
    <h3>Hire Freelancers</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">Live catalog of published freelancer talent services.</p>
    <div class="browse-grid">${freelancerCards.join('') || '<div class="offer-empty">No published freelancer services yet.</div>'}</div>
  </div>
  <div class="panel">
    <h3>Hire Trainers</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">Live catalog of corporate and technical training programs.</p>
    <div class="browse-grid">${trainerCards.join('') || '<div class="offer-empty">No published courses yet.</div>'}</div>
  </div>
  <div class="panel">
    <h3>My Hire Requests</h3>
    <table>
      <tr><th>Name</th><th>Type</th><th>Offering</th><th>Status</th></tr>
      ${reqRows || `<tr><td colspan="4" style="color:var(--text-dim);">You haven't sent any hire requests yet.</td></tr>`}
    </table>
  </div>`;
}

function openHireRequestModal(targetEmail, targetRole, offeringTitle) {
  const u = state.users.find(x => x.email === targetEmail);
  const html = `<div class="admin-item-card">
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">Send a hire request to <b style="color:var(--gold-light)">${u ? u.name : targetEmail}</b> for <b style="color:var(--gold-light)">${offeringTitle}</b>.</p>
    <div class="field"><label>Message</label><textarea id="hrMessage" placeholder="Tell them about your requirements, timeline, budget..."></textarea></div>
    <button class="btn3d small red" onclick="submitHireRequest('${targetEmail}','${targetRole}','${offeringTitle.replace(/'/g, "\\'")}')">Send Request</button>
  </div>`;
  openModal('Hire Request', html);
}

function submitHireRequest(targetEmail, targetRole, offeringTitle) {
  const message = document.getElementById('hrMessage').value.trim();
  const u = state.users.find(x => x.email === targetEmail);
  state.hireRequests.push({
    employerEmail: currentUser.email,
    employerName: currentUser.name,
    targetEmail,
    targetName: u ? u.name : targetEmail,
    targetRole,
    offeringTitle,
    message,
    status: 'Pending',
    requestedAt: new Date().toLocaleString()
  });
  window.api.saveLocalState();
  playThankYou();
  toast('Hire request sent to ' + (u ? u.name : targetEmail) + '.');
  logActivity('<b>' + currentUser.name + '</b> sent a hire request to <b>' + (u ? u.name : targetEmail) + '</b> for ' + offeringTitle);
  closeModal();
  renderTab(currentUser, 'hirefreelancer');
}

function incomingHireRequestsWidget(user) {
  const myReqs = state.hireRequests.map((r, idx) => ({ r, idx })).filter(x => x.r.targetEmail === user.email);
  if (!myReqs.length) return '';
  const rows = myReqs.map(({ r, idx }) => `
    <div class="hire-req-row">
      <div><b style="color:var(--gold-light)">${r.employerName}</b> — ${r.offeringTitle}<br><span style="color:var(--text-dim);font-size:11px;">${r.message || 'No message'}</span></div>
      ${r.status === 'Pending' ? `<div class="hr-actions">
        <button class="btn3d small" onclick="respondHireRequest(${idx},'Accepted')">Accept</button>
        <button class="btn3d small red" onclick="respondHireRequest(${idx},'Declined')">Decline</button>
      </div>` : `<span class="badge ${r.status === 'Accepted' ? 'green' : 'red'}">${r.status}</span>`}
    </div>`).join('');
  return `<div class="panel"><h3>Hire Requests Received</h3>${rows}</div>`;
}

function respondHireRequest(idx, status) {
  const r = state.hireRequests[idx];
  if (!r) return;
  r.status = status;
  window.api.saveLocalState();
  playClick();
  toast('Request ' + status.toLowerCase() + '.');
  logActivity('<b>' + currentUser.name + '</b> ' + status.toLowerCase() + ' a hire request from ' + r.employerName);
  renderTab(currentUser, 'overview');
}

// ============ FREELANCER PROFILE & OFFERINGS ============
function freelancerProfilePanel(user) {
  const p = state.profiles[user.email] || {};
  const savedBadge = p.saved ? `<div class="profile-saved-badge">✓ Freelancer profile saved</div>` : '';
  const myOfferings = state.offerings[user.email] || [];
  const offerCards = myOfferings.length ? `<div class="offer-grid">${myOfferings.map((o, i) => `
    <div class="offer-card">
      <h4>${o.title}</h4>
      <p>${o.desc || 'No description added.'}</p>
      <div class="offer-meta">
        <span class="offer-price">₹${o.price} <span style="color:var(--text-dim);font-weight:400;">/ ${o.delivery || '—'}</span></span>
        <button class="offer-del" onclick="removeOffering(${i})">Remove</button>
      </div>
    </div>`).join('')}</div>` : `<div class="offer-empty">You haven't added any offerings yet. Add your first service below.</div>`;

  return `<div class="panel">
    <h3>Build Your Freelancer Profile</h3>
    ${savedBadge}
    <form class="profile-form" onsubmit="return saveFreelancerProfile(event)">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Full Name</label><input type="text" id="flName" value="${user.name}" required></div>
        <div class="field"><label>Email</label><input type="email" id="flEmail" value="${user.email}" readonly style="opacity:.7;"></div>
        <div class="field"><label>Phone</label><input type="tel" id="flPhone" value="${user.phone || ''}" required></div>
        <div class="field"><label>Professional Title</label><input type="text" id="flTitle" value="${p.title || ''}" placeholder="e.g. UI/UX Designer" required></div>
        <div class="field"><label>Experience</label><input type="text" id="flExp" value="${p.exp || ''}" placeholder="e.g. 3 years"></div>
        <div class="field"><label>Portfolio Link</label><input type="text" id="flPortfolio" value="${p.portfolio || ''}" placeholder="https://..."></div>
      </div>
      <div class="field"><label>Skills</label><input type="text" id="flSkills" value="${p.skills || ''}" placeholder="e.g. Figma, Photoshop, Branding"></div>
      <div class="field"><label>About / Bio</label><textarea id="flAbout" placeholder="Tell employers what you do best...">${p.about || ''}</textarea></div>
      <button class="btn3d" type="submit">Save Profile</button>
    </form>
  </div>

  <div class="panel">
    <h3>My Offerings</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">List the services you offer so employers can hire you directly.</p>
    ${offerCards}
    <form class="profile-form" onsubmit="return addOffering(event)" style="margin-top:18px;border-top:1px solid var(--border);padding-top:18px;">
      <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:16px;">
        <div class="field"><label>Offering Title</label><input type="text" id="ofTitle" placeholder="e.g. Luxury Logo Design" required></div>
        <div class="field"><label>Price (₹)</label><input type="number" id="ofPrice" placeholder="e.g. 2500" min="0" required></div>
        <div class="field"><label>Delivery Time</label><input type="text" id="ofDelivery" placeholder="e.g. 3 days" required></div>
      </div>
      <div class="field"><label>Description</label><textarea id="ofDesc" placeholder="Describe deliverables..."></textarea></div>
      <button class="btn3d red" type="submit">+ Add Offering</button>
    </form>
  </div>`;
}

function saveFreelancerProfile(e) {
  e.preventDefault();
  state.profiles[currentUser.email] = {
    ...(state.profiles[currentUser.email] || {}),
    title: document.getElementById('flTitle').value.trim(),
    exp: document.getElementById('flExp').value.trim(),
    portfolio: document.getElementById('flPortfolio').value.trim(),
    skills: document.getElementById('flSkills').value.trim(),
    about: document.getElementById('flAbout').value.trim(),
    saved: true
  };
  currentUser.name = document.getElementById('flName').value.trim();
  currentUser.phone = document.getElementById('flPhone').value.trim();
  document.getElementById('dNameSide').textContent = currentUser.name;
  window.api.saveLocalState();
  playClick();
  toast('Freelancer profile saved!');
  renderTab(currentUser, 'profile');
  return false;
}

function addOffering(e) {
  e.preventDefault();
  const title = document.getElementById('ofTitle').value.trim();
  const price = document.getElementById('ofPrice').value.trim();
  const delivery = document.getElementById('ofDelivery').value.trim();
  const desc = document.getElementById('ofDesc').value.trim();
  if (!title || !price || !delivery) return false;

  if (!state.offerings[currentUser.email]) state.offerings[currentUser.email] = [];
  state.offerings[currentUser.email].push({ title, price, delivery, desc, category: 'Design & Creative', status: 'Published' });
  window.api.saveLocalState();
  playThankYou();
  toast('Offering added to your profile!');
  logActivity('<b>' + currentUser.name + '</b> added offering: <b>' + title + '</b>');
  renderTab(currentUser, 'profile');
  return false;
}

function removeOffering(index) {
  state.offerings[currentUser.email].splice(index, 1);
  window.api.saveLocalState();
  playClick();
  renderTab(currentUser, 'profile');
}

// ============ TRAINER PROFILE & COURSES ============
function trainerProfilePanel(user) {
  const p = state.profiles[user.email] || {};
  const savedBadge = p.saved ? `<div class="profile-saved-badge">✓ Trainer profile saved</div>` : '';
  return `<div class="panel">
    <h3>Build Your Trainer Profile</h3>
    ${savedBadge}
    <form class="profile-form" onsubmit="return saveTrainerProfile(event)">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Full Name</label><input type="text" id="tpName" value="${user.name}" required></div>
        <div class="field"><label>Email</label><input type="email" id="tpEmail" value="${user.email}" readonly style="opacity:.7;"></div>
        <div class="field"><label>Phone</label><input type="tel" id="tpPhone" value="${user.phone || ''}" required></div>
        <div class="field"><label>Specialization / Title</label><input type="text" id="tpTitle" value="${p.title || ''}" placeholder="e.g. Corporate Soft Skills Trainer" required></div>
        <div class="field"><label>Experience</label><input type="text" id="tpExp" value="${p.exp || ''}" placeholder="e.g. 6 years"></div>
        <div class="field"><label>Certifications / Qualification</label><input type="text" id="tpQualification" value="${p.qualification || ''}" placeholder="e.g. Certified Coach, MBA"></div>
      </div>
      <div class="field"><label>Skills / Subjects Covered</label><input type="text" id="tpSkills" value="${p.skills || ''}" placeholder="e.g. Communication, Leadership, Excel"></div>
      <div class="field"><label>About / Bio</label><textarea id="tpAbout" placeholder="Tell employers and learners about your background...">${p.about || ''}</textarea></div>
      <button class="btn3d" type="submit">Save Profile</button>
    </form>
  </div>`;
}

function saveTrainerProfile(e) {
  e.preventDefault();
  if (!state.profiles[currentUser.email]) state.profiles[currentUser.email] = {};
  Object.assign(state.profiles[currentUser.email], {
    title: document.getElementById('tpTitle').value.trim(),
    exp: document.getElementById('tpExp').value.trim(),
    qualification: document.getElementById('tpQualification').value.trim(),
    skills: document.getElementById('tpSkills').value.trim(),
    about: document.getElementById('tpAbout').value.trim(),
    saved: true
  });
  currentUser.name = document.getElementById('tpName').value.trim();
  currentUser.phone = document.getElementById('tpPhone').value.trim();
  document.getElementById('dNameSide').textContent = currentUser.name;
  window.api.saveLocalState();
  playClick();
  toast('Trainer profile saved!');
  renderTab(currentUser, 'profile');
  return false;
}

function trainerCoursesSelfPanel(user) {
  const myCourses = state.courses[user.email] || [];
  const courseCards = myCourses.length ? `<div class="offer-grid">${myCourses.map((co, i) => `
    <div class="offer-card">
      <h4>${co.title}</h4>
      <p>${co.desc || 'No description added.'}</p>
      <div class="offer-meta">
        <span class="offer-price">₹${co.price} <span style="color:var(--text-dim);font-weight:400;">/ ${co.duration || '—'}</span></span>
        <button class="offer-del" onclick="removeTrainerCourse(${i})">Remove</button>
      </div>
      <div style="margin-top:8px;">${statusBadge(co.status)}</div>
    </div>`).join('')}</div>` : `<div class="offer-empty">You haven't added any courses yet. Add your first one below.</div>`;

  return `<div class="panel">
    <h3>My Courses</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">List the courses you offer to corporate clients and students.</p>
    ${courseCards}
    <form class="profile-form" onsubmit="return addTrainerCourse(event)" style="margin-top:18px;border-top:1px solid var(--border);padding-top:18px;">
      <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:16px;">
        <div class="field"><label>Course Title</label><input type="text" id="tcTitle" placeholder="e.g. Advanced Leadership Mastery" required></div>
        <div class="field"><label>Fee (₹)</label><input type="number" id="tcPrice" min="0" placeholder="e.g. 3500" required></div>
        <div class="field"><label>Duration</label><input type="text" id="tcDuration" placeholder="e.g. 4 weeks" required></div>
      </div>
      <div class="field"><label>Description</label><textarea id="tcDesc" placeholder="What this course covers..."></textarea></div>
      <button class="btn3d red" type="submit">+ Add Course</button>
    </form>
  </div>`;
}

function addTrainerCourse(e) {
  e.preventDefault();
  const title = document.getElementById('tcTitle').value.trim();
  const price = document.getElementById('tcPrice').value.trim();
  const duration = document.getElementById('tcDuration').value.trim();
  const desc = document.getElementById('tcDesc').value.trim();
  if (!title || !price || !duration) return false;

  if (!state.courses[currentUser.email]) state.courses[currentUser.email] = [];
  state.courses[currentUser.email].push({ title, price, duration, desc, category: 'Soft Skills', status: 'Published' });
  window.api.saveLocalState();
  playThankYou();
  toast('Course added successfully!');
  logActivity('<b>' + currentUser.name + '</b> added course: <b>' + title + '</b>');
  renderTab(currentUser, 'courses');
  return false;
}

function removeTrainerCourse(index) {
  state.courses[currentUser.email].splice(index, 1);
  window.api.saveLocalState();
  playClick();
  renderTab(currentUser, 'courses');
}

// ============ MANPOWER MODULES ============
function workforcePoolPanel(user) {
  const pool = state.workforcePool[user.email] || [];
  const cards = pool.map((w, idx) => `
    <div class="offer-card">
      <h4>${w.roleType}</h4>
      <p>Skill Level: ${w.skillLevel || '—'} &nbsp;|&nbsp; Experience: ${w.experience || '—'}</p>
      <div class="offer-meta">
        <span class="offer-price">${w.count} worker${w.count == 1 ? '' : 's'}</span>
        <span class="badge ${w.available ? 'green' : 'gold'}" style="cursor:pointer;" onclick="toggleWorkforceAvailability(${idx})">${w.available ? 'Available' : 'Deployed'}</span>
      </div>
      <div style="margin-top:10px;"><button class="offer-del" onclick="removeWorkforceEntry(${idx})">Remove</button></div>
    </div>`).join('');

  return `<div class="panel">
    <h3>Workforce Pool</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">Maintain your roster by role and skill. Click badge to toggle immediate deployment availability.</p>
    <div class="offer-grid">${cards || '<div class="offer-empty">No workforce added yet. Use form below to build your pool.</div>'}</div>
    <form class="profile-form" onsubmit="return addWorkforceEntry(event)" style="margin-top:18px;border-top:1px solid var(--border);padding-top:18px;">
      <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:16px;">
        <div class="field"><label>Role / Trade</label><input type="text" id="wfRole" placeholder="e.g. Electrician" required></div>
        <div class="field"><label>Skill Level</label>
          <select id="wfSkill"><option>Skilled</option><option>Semi-Skilled</option><option>Unskilled</option></select>
        </div>
        <div class="field"><label>Experience</label><input type="text" id="wfExp" placeholder="e.g. 3+ years"></div>
        <div class="field"><label>Count Available</label><input type="number" id="wfCount" min="1" placeholder="e.g. 10" required></div>
      </div>
      <button class="btn3d red" type="submit">+ Add to Pool</button>
    </form>
  </div>`;
}

function addWorkforceEntry(e) {
  e.preventDefault();
  const roleType = document.getElementById('wfRole').value.trim();
  const skillLevel = document.getElementById('wfSkill').value;
  const experience = document.getElementById('wfExp').value.trim();
  const count = document.getElementById('wfCount').value.trim();
  if (!roleType || !count) return false;

  if (!state.workforcePool[currentUser.email]) state.workforcePool[currentUser.email] = [];
  state.workforcePool[currentUser.email].push({ roleType, skillLevel, experience, count, available: true });
  window.api.saveLocalState();
  playThankYou();
  toast('Added to workforce pool.');
  renderTab(currentUser, 'pool');
  return false;
}

function toggleWorkforceAvailability(idx) {
  const pool = state.workforcePool[currentUser.email];
  if (!pool || !pool[idx]) return;
  pool[idx].available = !pool[idx].available;
  window.api.saveLocalState();
  playClick();
  renderTab(currentUser, activeTab);
}

function removeWorkforceEntry(idx) {
  const pool = state.workforcePool[currentUser.email];
  if (!pool) return;
  pool.splice(idx, 1);
  window.api.saveLocalState();
  playClick();
  renderTab(currentUser, activeTab);
}

function availableManpowerPanel(user) {
  const pool = state.workforcePool[user.email] || [];
  const availableEntries = pool.map((w, idx) => ({ w, idx })).filter(x => x.w.available);
  const cards = availableEntries.map(({ w, idx }) => `
    <div class="offer-card">
      <h4>${w.roleType}</h4>
      <p>Skill Level: ${w.skillLevel || '—'} &nbsp;|&nbsp; Experience: ${w.experience || '—'}</p>
      <div class="offer-meta">
        <span class="offer-price">${w.count} ready now</span>
        <button class="offer-del" onclick="toggleWorkforceAvailability(${idx})">Mark Deployed</button>
      </div>
    </div>`).join('');

  return `<div class="panel">
    <h3>Available Manpower List</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">Workforce currently marked available for immediate deployment.</p>
    <div class="offer-grid">${cards || '<div class="offer-empty">No manpower currently available. Update your Workforce Pool.</div>'}</div>
  </div>`;
}

function deploymentRequestsPanel(user) {
  const reqs = state.deploymentRequests[user.email] || [];
  const rows = reqs.map((r, idx) => `
    <tr>
      <td>${r.clientName}</td>
      <td>${r.location}</td>
      <td>${r.rolesNeeded || '—'}</td>
      <td>${r.quantity}</td>
      <td>${r.duration || '—'}</td>
      <td><span class="badge ${r.status === 'Fulfilled' ? 'green' : (r.status === 'Cancelled' ? 'red' : 'gold')}">${r.status}</span></td>
      <td style="white-space:nowrap;">
        <button class="btn3d small" onclick="updateDeploymentStatus(${idx},'In Progress')">In Progress</button>
        <button class="btn3d small" onclick="updateDeploymentStatus(${idx},'Fulfilled')">Fulfilled</button>
        <button class="btn3d small red" onclick="updateDeploymentStatus(${idx},'Cancelled')">Cancel</button>
      </td>
    </tr>`).join('');

  return `<div class="panel">
    <h3>Deployment Requests</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">Log and track manpower deployment requests from your enterprise clients.</p>
    <div style="overflow-x:auto;">
    <table>
      <tr><th>Client</th><th>Location</th><th>Roles Needed</th><th>Quantity</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
      ${rows || `<tr><td colspan="7" style="color:var(--text-dim);">No deployment requests logged yet.</td></tr>`}
    </table>
    </div>
    <form class="profile-form" onsubmit="return addDeploymentRequest(event)" style="margin-top:18px;border-top:1px solid var(--border);padding-top:18px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Client Name</label><input type="text" id="drClient" required></div>
        <div class="field"><label>Location</label><input type="text" id="drLocation" required></div>
        <div class="field"><label>Roles Needed</label><input type="text" id="drRoles" placeholder="e.g. Electricians, Helpers"></div>
        <div class="field"><label>Quantity</label><input type="number" id="drQty" min="1" required></div>
        <div class="field"><label>Duration</label><input type="text" id="drDuration" placeholder="e.g. 3 months"></div>
      </div>
      <button class="btn3d red" type="submit">+ Log Request</button>
    </form>
  </div>`;
}

function addDeploymentRequest(e) {
  e.preventDefault();
  const clientName = document.getElementById('drClient').value.trim();
  const location = document.getElementById('drLocation').value.trim();
  const rolesNeeded = document.getElementById('drRoles').value.trim();
  const quantity = document.getElementById('drQty').value.trim();
  const duration = document.getElementById('drDuration').value.trim();
  if (!clientName || !location || !quantity) return false;

  if (!state.deploymentRequests[currentUser.email]) state.deploymentRequests[currentUser.email] = [];
  state.deploymentRequests[currentUser.email].push({ clientName, location, rolesNeeded, quantity, duration, status: 'New' });
  window.api.saveLocalState();
  playThankYou();
  toast('Deployment request logged.');
  renderTab(currentUser, 'deploy');
  return false;
}

function updateDeploymentStatus(idx, status) {
  const reqs = state.deploymentRequests[currentUser.email];
  if (!reqs || !reqs[idx]) return;
  reqs[idx].status = status;
  window.api.saveLocalState();
  playClick();
  toast('Status updated: ' + status);
  renderTab(currentUser, 'deploy');
}

function serviceLocationPanel(user) {
  const locs = state.serviceLocations[user.email] || [];
  const items = locs.map((l, idx) => `
    <div class="check-item on" style="justify-content:space-between;">
      <span>📍 ${l}</span>
      <button class="offer-del" onclick="removeServiceLocation(${idx})">Remove</button>
    </div>`).join('');

  return `<div class="panel">
    <h3>Service Location</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">Cities and regions where you supply manpower.</p>
    <div class="check-group" style="margin-bottom:18px;">${items || '<div class="offer-empty">No service locations added yet.</div>'}</div>
    <form class="profile-form" onsubmit="return addServiceLocation(event)">
      <div class="field"><label>Add Location (City, State)</label><input type="text" id="slLocation" placeholder="e.g. Patna, Bihar" required></div>
      <button class="btn3d red" type="submit">+ Add Location</button>
    </form>
  </div>`;
}

function addServiceLocation(e) {
  e.preventDefault();
  const loc = document.getElementById('slLocation').value.trim();
  if (!loc) return false;

  if (!state.serviceLocations[currentUser.email]) state.serviceLocations[currentUser.email] = [];
  state.serviceLocations[currentUser.email].push(loc);
  window.api.saveLocalState();
  playClick();
  toast('Service location added.');
  renderTab(currentUser, 'servicelocation');
  return false;
}

function removeServiceLocation(idx) {
  const locs = state.serviceLocations[currentUser.email];
  if (!locs) return;
  locs.splice(idx, 1);
  window.api.saveLocalState();
  playClick();
  renderTab(currentUser, 'servicelocation');
}

// ============ CONTRACTOR PANELS ============
function activeProjectListPanel(user) {
  const projects = state.contractorProjects[user.email] || [];
  const rows = projects.map((p, idx) => `
    <tr>
      <td>${p.name}</td>
      <td>${p.client}</td>
      <td style="max-width:160px;">${p.location || '—'}</td>
      <td>${(p.contactName || p.contactNumber) ? (p.contactName || '—') + ' · ' + (p.contactNumber || '—') : '—'}</td>
      <td>₹${p.value || '—'}</td>
      <td>${p.contractPeriod || ((p.startDate || '—') + ' → ' + (p.endDate || '—'))}</td>
      <td>${p.manpowerRequired || '—'}</td>
      <td>${(p.manpowerRoles && p.manpowerRoles.length) ? p.manpowerRoles.join(', ') : '—'}</td>
      <td style="max-width:200px;font-size:12px;color:var(--text-dim);">${p.description || '—'}</td>
      <td><span class="badge ${p.status === 'Completed' ? 'green' : (p.status === 'On Hold' ? 'red' : 'gold')}">${p.status}</span></td>
      <td style="white-space:nowrap;">
        <button class="btn3d small" onclick="updateProjectStatus(${idx},'Ongoing')">Ongoing</button>
        <button class="btn3d small" onclick="updateProjectStatus(${idx},'Completed')">Completed</button>
        <button class="btn3d small red" onclick="updateProjectStatus(${idx},'On Hold')">On Hold</button>
        <button class="offer-del" onclick="removeProject(${idx})">Remove</button>
      </td>
    </tr>`).join('');

  return `<div class="panel">
    <h3>Active Project List</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">Track every contract you're executing, from kickoff to close-out.</p>
    <div style="overflow-x:auto;">
    <table>
      <tr><th>Project</th><th>Client</th><th>Location</th><th>Contact</th><th>Value</th><th>Period</th><th>Manpower Req.</th><th>Roles</th><th>Description</th><th>Status</th><th>Actions</th></tr>
      ${rows || `<tr><td colspan="11" style="color:var(--text-dim);">No active projects yet. Add one below.</td></tr>`}
    </table>
    </div>
    <form class="profile-form" onsubmit="return addProject(event)" style="margin-top:18px;border-top:1px solid var(--border);padding-top:18px;">
      <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:16px;">
        <div class="field"><label>Project Name</label><input type="text" id="pjName" required></div>
        <div class="field"><label>Client Name</label><input type="text" id="pjClient" required></div>
      </div>
      <div class="field"><label>Location (with full address)</label><textarea id="pjLocation" placeholder="Full site / office address"></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Contact Person Name</label><input type="text" id="pjContactName"></div>
        <div class="field"><label>Contact Person Number</label><input type="tel" id="pjContactNumber"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
        <div class="field"><label>Contract Value (₹)</label><input type="number" id="pjValue" min="0"></div>
        <div class="field"><label>Start Date</label><input type="date" id="pjStart"></div>
        <div class="field"><label>End Date</label><input type="date" id="pjEnd"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Contract Period</label><input type="text" id="pjContractPeriod" placeholder="e.g. 6 months"></div>
        <div class="field"><label>Total Manpower Required</label><input type="number" id="pjManpower" min="0" placeholder="e.g. 25"></div>
      </div>
      <div class="field">
        <label>Role(s) of Manpower Needed</label>
        <div class="check-group" id="pjRoles">
          ${manpowerRoleOptions.map(r => `<label class="check-item"><input type="checkbox" value="${r}"> ${r}</label>`).join('')}
        </div>
      </div>
      <div class="field"><label>Project Description</label><textarea id="pjDesc" placeholder="Scope of work, deliverables..."></textarea></div>
      <button class="btn3d red" type="submit">+ Add Project</button>
    </form>
  </div>`;
}

function addProject(e) {
  e.preventDefault();
  const name = document.getElementById('pjName').value.trim();
  const client = document.getElementById('pjClient').value.trim();
  const location = document.getElementById('pjLocation').value.trim();
  const contactName = document.getElementById('pjContactName').value.trim();
  const contactNumber = document.getElementById('pjContactNumber').value.trim();
  const value = document.getElementById('pjValue').value.trim();
  const startDate = document.getElementById('pjStart').value;
  const endDate = document.getElementById('pjEnd').value;
  const contractPeriod = document.getElementById('pjContractPeriod').value.trim();
  const manpowerRequired = document.getElementById('pjManpower').value.trim();
  const manpowerRoles = Array.from(document.querySelectorAll('#pjRoles input:checked')).map(i => i.value);
  const description = document.getElementById('pjDesc').value.trim();
  if (!name || !client) return false;

  if (!state.contractorProjects[currentUser.email]) state.contractorProjects[currentUser.email] = [];
  state.contractorProjects[currentUser.email].push({
    name, client, location, contactName, contactNumber, value, startDate, endDate, contractPeriod, manpowerRequired, manpowerRoles, description, status: 'Ongoing'
  });
  window.api.saveLocalState();
  playThankYou();
  toast('Project added to your Active Project List.');
  renderTab(currentUser, 'activeprojects');
  return false;
}

function updateProjectStatus(idx, status) {
  const list = state.contractorProjects[currentUser.email];
  if (!list || !list[idx]) return;
  list[idx].status = status;
  window.api.saveLocalState();
  playClick();
  toast('Project status updated: ' + status);
  renderTab(currentUser, 'activeprojects');
}

function removeProject(idx) {
  const list = state.contractorProjects[currentUser.email];
  if (!list) return;
  list.splice(idx, 1);
  window.api.saveLocalState();
  playClick();
  renderTab(currentUser, 'activeprojects');
}

function receivedBidPanel(user) {
  const bids = state.receivedBids[user.email] || [];
  const rows = bids.map((b, idx) => `
    <tr>
      <td>${b.bidderName}</td>
      <td>${b.project}</td>
      <td>₹${b.amount}</td>
      <td>${b.contact || '—'}</td>
      <td><span class="badge ${b.status === 'Accepted' ? 'green' : (b.status === 'Rejected' ? 'red' : 'gold')}">${b.status}</span></td>
      <td style="white-space:nowrap;">
        <button class="btn3d small" ${b.status === 'Accepted' ? 'disabled' : ''} onclick="setBidStatus(${idx},'Accepted')">Accept</button>
        <button class="btn3d small red" ${b.status === 'Rejected' ? 'disabled' : ''} onclick="setBidStatus(${idx},'Rejected')">Reject</button>
      </td>
    </tr>`).join('');

  return `<div class="panel">
    <h3>Received Bids</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">Bids received from vendors and subcontractors for your projects.</p>
    <div style="overflow-x:auto;">
    <table>
      <tr><th>Bidder</th><th>Project</th><th>Bid Amount</th><th>Contact</th><th>Status</th><th>Actions</th></tr>
      ${rows || `<tr><td colspan="6" style="color:var(--text-dim);">No bids received yet.</td></tr>`}
    </table>
    </div>
    <form class="profile-form" onsubmit="return logBid(event)" style="margin-top:18px;border-top:1px solid var(--border);padding-top:18px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Bidder Name</label><input type="text" id="bdName" required></div>
        <div class="field"><label>Project</label>
          <select id="bdProject">
            ${(state.contractorProjects[user.email] || []).map(p => `<option>${p.name}</option>`).join('') || '<option value="">No active projects</option>'}
          </select>
        </div>
        <div class="field"><label>Bid Amount (₹)</label><input type="number" id="bdAmount" min="0" required></div>
        <div class="field"><label>Contact</label><input type="text" id="bdContact" placeholder="Phone or email"></div>
      </div>
      <button class="btn3d red" type="submit">+ Log Bid</button>
    </form>
  </div>`;
}

function logBid(e) {
  e.preventDefault();
  const bidderName = document.getElementById('bdName').value.trim();
  const project = document.getElementById('bdProject').value;
  const amount = document.getElementById('bdAmount').value.trim();
  const contact = document.getElementById('bdContact').value.trim();
  if (!bidderName || !amount) return false;

  if (!state.receivedBids[currentUser.email]) state.receivedBids[currentUser.email] = [];
  state.receivedBids[currentUser.email].push({ bidderName, project, amount, contact, status: 'New' });
  window.api.saveLocalState();
  playThankYou();
  toast('Bid logged.');
  renderTab(currentUser, 'receivedbid');
  return false;
}

function setBidStatus(idx, status) {
  const bids = state.receivedBids[currentUser.email];
  if (!bids || !bids[idx]) return;
  bids[idx].status = status;
  window.api.saveLocalState();
  playClick();
  toast('Bid ' + status.toLowerCase() + '.');
  renderTab(currentUser, 'receivedbid');
}

// ============ ADMIN: DATABASE VIEWERS ============
function databasePanel(key) {
  const roleSet = (key === 'manpower-contractor') ? ['manpower', 'contractor'] : [key];
  const list = state.users.filter(u => roleSet.includes(u.role));
  const roleName = dbLabel(key);

  let headerExtra = '';
  let cellsFn = () => '';
  if (key === 'jobseeker') {
    headerExtra = '<th>Profile</th><th>CV</th><th>Review</th>';
    cellsFn = jobseekerExtraCells;
  } else if (key === 'employer') {
    headerExtra = '<th>Job Postings</th><th>Category</th><th>Review</th>';
    cellsFn = employerExtraCells;
  } else if (key === 'freelancer') {
    headerExtra = '<th>Services Offered</th><th>Category</th><th>Review</th>';
    cellsFn = freelancerExtraCells;
  } else if (key === 'trainer') {
    headerExtra = '<th>Courses Offered</th><th>Category</th><th>Review</th>';
    cellsFn = trainerExtraCells;
  } else if (key === 'manpower-contractor') {
    headerExtra = '<th>Workforce Role(s)</th><th>Location (Address)</th><th>Contact Person</th><th>Contract Period</th><th>Details</th>';
    cellsFn = manpowerExtraCells;
  }

  const rows = list.map(u => {
    const s = getSubscription(u);
    return `<tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone || '-'}</td>
      ${roleSet.length > 1 ? `<td><span class="badge gold">${roleLabels[u.role] || u.role}</span></td>` : ''}
      <td><span class="badge ${s.active ? 'green' : 'gold'}">${s.label}</span></td>
      ${cellsFn(u)}
      <td style="white-space:nowrap;">
        <button class="btn3d small dark" onclick="editUser('${u.email}')">Edit</button>
        <button class="btn3d small" onclick="toggleSubscription('${u.email}')">${s.active ? 'Downgrade' : 'Upgrade'}</button>
        <button class="btn3d small red" onclick="deleteUser('${u.email}')">Delete</button>
      </td>
    </tr>`;
  }).join('');

  return `<div class="panel">
    <h3>${roleName} Database</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">${list.length} registered ${roleName.toLowerCase()}${list.length === 1 ? '' : 's'}. Edit details, inspect CVs, review submissions, and manage subscription tiers.</p>
    <div style="overflow-x:auto;">
    <table>
      <tr><th>Name</th><th>Email</th><th>Phone</th>${roleSet.length > 1 ? '<th>Role</th>' : ''}<th>Subscription</th>${headerExtra}<th>Actions</th></tr>
      ${rows || `<tr><td colspan="10" style="color:var(--text-dim);">No users registered yet in this database.</td></tr>`}
    </table>
    </div>
  </div>`;
}

function jobseekerExtraCells(u) {
  const p = state.profiles[u.email] || {};
  return `
    <td><button class="btn3d small dark" onclick="openJobseekerProfileModal('${u.email}')">${p.saved ? 'View/Edit' : 'No Profile'}</button></td>
    <td>
      <button class="btn3d small dark" onclick="openCvModal('${u.email}')">${p.resumeName ? 'Edit CV' : 'Add CV'}</button>
      ${p.resumeName ? `<button class="btn3d small" onclick="viewResume('${u.email}')">View / Download</button>` : ''}
    </td>
    <td>${statusBadge(p.reviewStatus || 'Published')}<div style="margin-top:6px;display:flex;gap:6px;">
      <button class="btn3d small" onclick="setReviewStatus('${u.email}','Published')">Publish</button>
      <button class="btn3d small red" onclick="setReviewStatus('${u.email}','Rejected')">Reject</button>
    </div></td>`;
}

function employerExtraCells(u) {
  const items = state.jobs.filter(j => j.postedBy === u.email);
  const pendingCount = items.filter(j => j.status === 'Pending').length;
  return `
    <td><button class="btn3d small dark" onclick="openEmployerPostingsModal('${u.email}')">${items.length} Posting${items.length === 1 ? '' : 's'}${pendingCount > 0 ? ` <span class="badge gold" style="margin-left:5px;">${pendingCount} Pending</span>` : ''}</button></td>
    <td><button class="btn3d small dark" onclick="openEmployerPostingsModal('${u.email}')">Edit Category</button></td>
    <td><button class="btn3d small ${pendingCount > 0 ? 'red' : 'dark'}" onclick="openEmployerPostingsModal('${u.email}')">${pendingCount > 0 ? '⚠ Review Now' : 'View / Manage'}</button></td>`;
}

function openEmployerPostingsModal(email) {
  const u = state.users.find(x => x.email === email);
  const jobs = state.jobs.filter(j => j.postedBy === email);

  if (!jobs.length) {
    openModal('Job Postings — ' + (u ? u.name : email), '<div class="offer-empty">No job postings from this employer yet.</div>');
    return;
  }

  const jobCats = ['IT & Software', 'Sales & Marketing', 'Operations', 'Finance & Accounts', 'HR & Admin', 'Manufacturing', 'Healthcare', 'Other'];

  const rows = jobs.map((j, localIdx) => {
    const globalIdx = state.jobs.indexOf(j);
    const statusCls = j.status === 'Published' ? 'green' : (j.status === 'Rejected' ? 'red' : 'gold');
    return `<div class="admin-item-card" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-weight:700;color:var(--gold-light);font-size:14px;">${j.title}</div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:3px;">${j.company} · ${j.location} · ${j.empType}</div>
          <div style="font-size:12px;color:var(--text-dim);">${j.compensation || '—'}</div>
        </div>
        <span class="badge ${statusCls}">${j.status}</span>
      </div>

      <div style="margin-top:10px;font-size:12px;color:var(--text-dim);line-height:1.6;">
        ${j.summary ? '<b style="color:var(--text)">Summary:</b> ' + j.summary : ''}
      </div>

      <div class="cat-row">
        <div class="field">
          <label>Job Category</label>
          <select id="jobCat_${globalIdx}" onchange="adminUpdateJobCategory(${globalIdx},this.value)">
            ${jobCats.map(c => `<option value="${c}" ${j.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="review-row">
        <button class="btn3d small" ${j.status === 'Published' ? 'disabled' : ''} onclick="adminPublishJob(${globalIdx})">✓ Publish</button>
        <button class="btn3d small red" ${j.status === 'Rejected' ? 'disabled' : ''} onclick="adminRejectJob(${globalIdx})">✗ Reject</button>
        <button class="btn3d small dark" onclick="adminDeleteJob(${globalIdx})">Delete</button>
      </div>
    </div>`;
  }).join('');

  openModal('Job Postings Review — ' + (u ? u.name : email), rows);
}

function adminUpdateJobCategory(globalIdx, category) {
  if (!state.jobs[globalIdx]) return;
  state.jobs[globalIdx].category = category;
  window.api.saveLocalState();
  playClick();
  toast('Category updated to: ' + category);
}

function adminPublishJob(globalIdx) {
  if (!state.jobs[globalIdx]) return;
  state.jobs[globalIdx].status = 'Published';
  window.api.saveLocalState();
  playThankYou();
  toast('Job published: ' + state.jobs[globalIdx].title);
  logActivity('Admin published job: <b>' + state.jobs[globalIdx].title + '</b> by ' + state.jobs[globalIdx].company);
  // Refresh modal
  openEmployerPostingsModal(state.jobs[globalIdx].postedBy);
  // Also refresh DB panel in background
}

function adminRejectJob(globalIdx) {
  if (!state.jobs[globalIdx]) return;
  state.jobs[globalIdx].status = 'Rejected';
  window.api.saveLocalState();
  playClick();
  toast('Job rejected: ' + state.jobs[globalIdx].title);
  logActivity('Admin rejected job: <b>' + state.jobs[globalIdx].title + '</b> by ' + state.jobs[globalIdx].company);
  openEmployerPostingsModal(state.jobs[globalIdx].postedBy);
}

function adminDeleteJob(globalIdx) {
  if (!state.jobs[globalIdx]) return;
  const title = state.jobs[globalIdx].title;
  const postedBy = state.jobs[globalIdx].postedBy;
  if (!confirm('Delete job posting: ' + title + '?')) return;
  state.jobs.splice(globalIdx, 1);
  window.api.saveLocalState();
  playClick();
  toast('Job posting deleted.');
  openEmployerPostingsModal(postedBy);
}

function freelancerExtraCells(u) {
  const items = state.offerings[u.email] || [];
  return `
    <td><button class="btn3d small dark" onclick="openFreelancerOfferingsModal('${u.email}')">${items.length} Service${items.length === 1 ? '' : 's'}</button></td>
    <td><button class="btn3d small dark" onclick="openFreelancerOfferingsModal('${u.email}')">Edit Category</button></td>
    <td><button class="btn3d small dark" onclick="openFreelancerOfferingsModal('${u.email}')">Review</button></td>`;
}

function trainerExtraCells(u) {
  const items = state.courses[u.email] || [];
  return `
    <td><button class="btn3d small dark" onclick="openTrainerCoursesModal('${u.email}')">${items.length} Course${items.length === 1 ? '' : 's'}</button></td>
    <td><button class="btn3d small dark" onclick="openTrainerCoursesModal('${u.email}')">Edit Category</button></td>
    <td><button class="btn3d small dark" onclick="openTrainerCoursesModal('${u.email}')">Review</button></td>`;
}

function manpowerExtraCells(u) {
  const wp = state.workforcePool[u.email] || [];
  const cp = state.contractorProjects[u.email] || [];
  const roles = wp.map(w => w.roleType).join(', ') || '—';
  const loc = (state.serviceLocations[u.email] || []).join(', ') || '—';
  const contact = u.phone || '—';
  const timeline = cp[0]?.contractPeriod || '—';

  return `
    <td>${roles}</td>
    <td style="max-width:180px;">${loc}</td>
    <td>${contact}</td>
    <td>${timeline}</td>
    <td><button class="btn3d small dark" onclick="openManpowerDetailsModal('${u.email}')">Edit Details</button></td>`;
}

function toggleSubscription(email) {
  const u = state.users.find(x => x.email === email);
  if (!u) return;
  if (u.role === 'jobseeker') {
    if (!state.profiles[email]) state.profiles[email] = {};
    state.profiles[email].ats = !state.profiles[email].ats;
  } else {
    u.subscription = u.subscription === 'Premium' ? 'Free' : 'Premium';
  }
  window.api.saveLocalState();
  playClick();
  toast('Subscription updated for ' + u.name);
  renderTab(currentUser, 'db-' + ((u.role === 'manpower' || u.role === 'contractor') ? 'manpower-contractor' : u.role));
}

function editUser(email) {
  const u = state.users.find(x => x.email === email);
  if (!u) return;
  const newName = prompt('Edit name:', u.name);
  if (newName === null) return;
  const newPhone = prompt('Edit phone:', u.phone || '');
  if (newPhone === null) return;
  u.name = newName.trim() || u.name;
  u.phone = newPhone.trim();
  window.api.saveLocalState();
  playClick();
  toast('User updated: ' + u.name);
  renderTab(currentUser, 'db-' + ((u.role === 'manpower' || u.role === 'contractor') ? 'manpower-contractor' : u.role));
}

function deleteUser(email) {
  if (currentUser && email === currentUser.email) {
    alert("You cannot delete the active account you are logged in as.");
    return;
  }
  const u = state.users.find(x => x.email === email);
  if (!u) return;
  if (!confirm('Remove ' + u.name + ' (' + u.email + ') from the database?')) return;

  const key = (u.role === 'manpower' || u.role === 'contractor') ? 'manpower-contractor' : u.role;
  state.users = state.users.filter(x => x.email !== email);
  delete state.profiles[email];
  delete state.offerings[email];
  delete state.courses[email];
  window.api.saveLocalState();
  playClick();
  toast('User removed from database.');
  renderTab(currentUser, 'db-' + key);
}

// ============ ADMIN: CRM DASHBOARD & CHARTS ============
function svgGauge(percent, color) {
  percent = Math.max(0, Math.min(100, percent || 0));
  const size = 110, stroke = 10, radius = (size - stroke) / 2, circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="#26262c" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="53%" text-anchor="middle" fill="#f3ede0" font-size="19" font-family="Cinzel, serif" font-weight="700">${Math.round(percent)}%</text>
  </svg>`;
}

function gaugeCard(title, percent, color, sub) {
  return `<div class="gauge-card">${svgGauge(percent, color)}<div class="gauge-label">${title}</div><div class="gauge-sub">${sub || ''}</div></div>`;
}

function pct(n, d) { return d > 0 ? (n / d * 100) : 0; }

function barChart(data) {
  const max = Math.max(...data.map(d => d.value), 1);
  return `<div class="bar-chart">${data.map(d => `
    <div class="bar-row">
      <span class="bar-label">${d.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max((d.value / max * 100), d.value > 0 ? 4 : 0)}%;background:${d.color};"></div></div>
      <span class="bar-value">${d.value}</span>
    </div>`).join('')}</div>`;
}

function crmPipelineCounts() {
  const counts = { New: 0, Contacted: 0, Converted: 0, Lost: 0 };
  state.users.filter(u => u.role !== 'admin').forEach(u => {
    const s = state.crmStatus[u.email] || 'New';
    counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
}

function crmPipelineRow() {
  const counts = crmPipelineCounts();
  return `<div class="pipeline-row">
    <div class="pipeline-chip"><b>${counts.New}</b>New Leads</div>
    <div class="pipeline-chip"><b>${counts.Contacted}</b>Contacted</div>
    <div class="pipeline-chip"><b>${counts.Converted}</b>Converted</div>
    <div class="pipeline-chip"><b>${counts.Lost}</b>Lost</div>
  </div>`;
}

function crmActivityFeed(limit) {
  const items = state.activityLog.slice(0, limit || 50);
  if (!items.length) return `<div class="offer-empty">No activity recorded yet.</div>`;
  return `<div class="activity-feed">${items.map(a => `
    <div class="activity-row"><span class="dot"></span><div><span class="txt">${a.text}</span><span class="time">${a.time}</span></div></div>`).join('')}</div>`;
}

function crmSnapshotWidget() {
  return `<div class="panel">
    <h3>CRM Snapshot</h3>
    ${crmPipelineRow()}
    <div style="margin-top:14px;">${crmActivityFeed(6)}</div>
    <div style="margin-top:14px;"><button class="btn3d small dark" onclick="goToTab('crmdash')">Open Full CRM Dashboard</button></div>
  </div>`;
}

function crmMetrics() {
  const employers = state.users.filter(u => u.role === 'employer');
  const freelancers = state.users.filter(u => u.role === 'freelancer');
  const activeClients = employers.filter(u => state.jobs.some(j => j.postedBy === u.email)).length;
  const activeJobs = state.jobs.filter(j => j.status === 'Published' && j.openStatus !== 'Closed').length;
  const closedJobs = state.jobs.filter(j => j.openStatus === 'Closed').length;
  const activeCandidates = state.candidates.length;
  const hiredList = state.candidates.filter(c => c.stage === stages.length - 1);
  const hiredCandidates = hiredList.length;
  const shortlistedCandidates = state.candidates.filter(c => c.stage === 0).length;
  const rejectedCandidates = Object.values(state.applications).reduce((s, arr) => s + arr.filter(a => a.status === 'Rejected').length, 0);
  const totalApplications = Object.values(state.applications).reduce((s, arr) => s + arr.length, 0);
  const activeFreelancers = freelancers.filter(u => (state.offerings[u.email] || []).some(o => o.status === 'Published')).length;
  const allOfferings = Object.values(state.offerings).flat();
  const activeFreelancerServices = allOfferings.filter(o => o.status === 'Published').length;
  const pipelineFreelanceProjects = allOfferings.filter(o => !o.status || o.status === 'Pending').length;
  const registeredUsers = state.users.filter(u => u.role !== 'admin').length;

  return {
    employers, freelancers, activeClients, activeJobs, closedJobs, activeCandidates,
    hiredList, hiredCandidates, shortlistedCandidates, rejectedCandidates, totalApplications,
    activeFreelancers, activeFreelancerServices, pipelineFreelanceProjects, registeredUsers
  };
}

function crmDashboardPanel() {
  const m = crmMetrics();

  const kpiHtml = `<div class="widgets" style="margin-bottom:18px;">
    <div class="widget"><b>${m.activeClients}</b><span>Active Clients</span></div>
    <div class="widget"><b>${m.activeJobs}</b><span>Active Jobs</span></div>
    <div class="widget"><b>${m.closedJobs}</b><span>Closed Jobs</span></div>
    <div class="widget"><b>${m.registeredUsers}</b><span>Registered Users</span></div>
  </div>
  <div class="widgets" style="margin-bottom:18px;">
    <div class="widget"><b>${m.activeCandidates}</b><span>Active Candidates</span></div>
    <div class="widget"><b>${m.hiredCandidates}</b><span>Hired Candidates</span></div>
    <div class="widget"><b>${m.shortlistedCandidates}</b><span>Shortlisted</span></div>
    <div class="widget"><b>${m.rejectedCandidates}</b><span>Rejected</span></div>
  </div>
  <div class="widgets" style="margin-bottom:24px;">
    <div class="widget"><b>${m.activeFreelancers}</b><span>Active Freelancers</span></div>
    <div class="widget"><b>${m.activeFreelancerServices}</b><span>Active Services</span></div>
    <div class="widget"><b>${m.pipelineFreelanceProjects}</b><span>Pipeline Projects</span></div>
    <div class="widget"><b>${m.totalApplications}</b><span>Total Applications</span></div>
  </div>`;

  const hiredListHtml = `<div class="panel">
    <h3>Hired Candidate List</h3>
    ${m.hiredList.length ? `<div class="crm-hired-list">${m.hiredList.map(c => `<div class="crm-hired-chip"><b>${c.name}</b>${c.role || ''}</div>`).join('')}</div>` : '<div class="offer-empty">No candidates hired yet.</div>'}
  </div>`;

  const gaugesHtml = `<div class="panel">
    <h3>Target Achievement — Circular View</h3>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:16px;">Quick read on process fulfillment and hiring pipelines.</p>
    <div class="gauge-grid">
      ${gaugeCard('Job Closure Rate', pct(m.closedJobs, m.closedJobs + m.activeJobs), 'var(--gold)', m.closedJobs + ' of ' + (m.closedJobs + m.activeJobs) + ' jobs closed')}
      ${gaugeCard('Candidate Hire Rate', pct(m.hiredCandidates, m.activeCandidates), 'var(--green)', m.hiredCandidates + ' of ' + m.activeCandidates + ' in pipeline')}
      ${gaugeCard('Freelancer Activation', pct(m.activeFreelancers, m.freelancers.length), 'var(--red)', m.activeFreelancers + ' of ' + m.freelancers.length + ' freelancers')}
    </div>
  </div>`;

  const funnelHtml = `<div class="panel">
    <h3>Recruitment Funnel — Comparative View</h3>
    ${barChart([
      { label: 'Applications', value: m.totalApplications, color: 'var(--gold)' },
      { label: 'Shortlisted', value: m.activeCandidates, color: 'var(--green)' },
      { label: 'Hired', value: m.hiredCandidates, color: '#4c9a00' },
      { label: 'Rejected', value: m.rejectedCandidates, color: 'var(--red)' }
    ])}
  </div>`;

  const roleCounts = {};
  state.users.filter(u => u.role !== 'admin').forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });
  const roleBarHtml = `<div class="panel">
    <h3>Registered Users by Role — Comparative View</h3>
    ${barChart([
      { label: 'Job Seekers', value: roleCounts.jobseeker || 0, color: 'var(--gold)' },
      { label: 'Employers', value: roleCounts.employer || 0, color: 'var(--red)' },
      { label: 'Freelancers', value: roleCounts.freelancer || 0, color: 'var(--green)' },
      { label: 'Trainers', value: roleCounts.trainer || 0, color: '#8a6dd6' },
      { label: 'Manpower', value: roleCounts.manpower || 0, color: '#4aa3d8' },
      { label: 'Contractors', value: roleCounts.contractor || 0, color: '#d88a4a' }
    ])}
  </div>`;

  return kpiHtml + hiredListHtml + gaugesHtml + funnelHtml + roleBarHtml + `
  <div class="panel">
    <h3>Lead Pipeline</h3>
    ${crmPipelineRow()}
    <p style="color:var(--text-dim);font-size:12px;margin-top:10px;">Manage individual leads from <a onclick="goToTab('crmleads')" style="color:var(--green);cursor:pointer;font-weight:700;">All Leads</a>.</p>
  </div>
  <div class="panel">
    <h3>Recent Activity — Across All Panels</h3>
    ${crmActivityFeed(50)}
  </div>`;
}

function crmLeadsPanel() {
  const leads = state.users.filter(u => u.role !== 'admin');
  const rows = leads.map(u => {
    const status = state.crmStatus[u.email] || 'New';
    const notes = state.crmNotes[u.email] || [];
    const lastNote = notes.length ? notes[0].note : '—';
    return `<tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="badge gold">${roleLabels[u.role] || u.role}</span></td>
      <td><span class="badge ${status === 'Converted' ? 'green' : (status === 'Lost' ? 'red' : 'gold')}">${status}</span></td>
      <td style="max-width:200px;font-size:12px;color:var(--text-dim);">${lastNote}</td>
      <td><button class="btn3d small dark" onclick="openCrmProfileModal('${u.email}')">Open CRM Profile</button></td>
    </tr>`;
  }).join('');

  return `<div class="panel">
    <h3>All Leads</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;">Every registered user across every role with pipeline status and follow-up notes.</p>
    <div style="overflow-x:auto;">
    <table>
      <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Note</th><th>Actions</th></tr>
      ${rows || `<tr><td colspan="6" style="color:var(--text-dim);">No leads yet.</td></tr>`}
    </table>
    </div>
  </div>`;
}

function openCrmProfileModal(email) {
  const u = state.users.find(x => x.email === email);
  if (!u) return;
  const status = state.crmStatus[email] || 'New';
  const notes = state.crmNotes[email] || [];

  const html = `
    <div class="admin-item-card">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;color:var(--text);margin-bottom:14px;">
        <div><b style="color:var(--gold-light)">Role:</b> ${roleLabels[u.role] || u.role}</div>
        <div><b style="color:var(--gold-light)">Phone:</b> ${u.phone || '—'}</div>
      </div>
      <div class="field"><label>Lead Status</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn3d small ${status === 'New' ? '' : 'dark'}" onclick="setCrmStatus('${email}','New')">New</button>
          <button class="btn3d small ${status === 'Contacted' ? '' : 'dark'}" onclick="setCrmStatus('${email}','Contacted')">Contacted</button>
          <button class="btn3d small ${status === 'Converted' ? '' : 'dark'}" onclick="setCrmStatus('${email}','Converted')">Converted</button>
          <button class="btn3d small red" onclick="setCrmStatus('${email}','Lost')">Lost</button>
        </div>
      </div>
      <div class="field"><label>Add Follow-up Note</label>
        <textarea id="crmNoteInput" placeholder="e.g. Called on phone, interested in ATS upgrade..."></textarea>
      </div>
      <button class="btn3d small" onclick="addCrmNote('${email}')">+ Add Note</button>
      <div style="margin-top:16px;">
        <label style="display:block;font-size:11px;color:var(--text-dim);margin-bottom:8px;">FOLLOW-UP HISTORY</label>
        ${notes.length ? notes.map(n => `<div class="crm-note">${n.note}<span class="time">${n.time}</span></div>`).join('') : '<div class="offer-empty">No notes yet.</div>'}
      </div>
    </div>`;

  openModal('CRM Profile — ' + u.name, html);
}

function setCrmStatus(email, status) {
  state.crmStatus[email] = status;
  window.api.saveLocalState();
  playClick();
  toast('Lead status updated: ' + status);
  openCrmProfileModal(email);
}

function addCrmNote(email) {
  const input = document.getElementById('crmNoteInput');
  const text = input.value.trim();
  if (!text) return;
  if (!state.crmNotes[email]) state.crmNotes[email] = [];
  state.crmNotes[email].unshift({ note: text, time: new Date().toLocaleString() });
  window.api.saveLocalState();
  playClick();
  toast('Note added.');
  openCrmProfileModal(email);
}

// ============ ADMIN: PRICING & SITE SETTINGS ============
function pricingPanel() {
  return `<div class="panel">
    <h3>Platform Pricing</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:18px;">Set the pricing tiers used across the portal. Changes apply live immediately.</p>
    <div class="widgets" style="margin-bottom:24px;">
      <div class="widget"><b>₹${state.pricing.atsBoost}</b><span>Job Seeker ATS Boost</span></div>
      <div class="widget"><b>₹${state.pricing.employerNormalPosting}</b><span>Normal Hiring Posting</span></div>
      <div class="widget"><b>₹${state.pricing.employerHiringAssistant}+</b><span>Hiring Assistant Service</span></div>
      <div class="widget"><b>₹${state.pricing.premiumSubscription}</b><span>Premium Subscriptions</span></div>
    </div>
    <form class="profile-form" onsubmit="return savePricing(event)">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Job Seeker ATS Boost (₹, one-time)</label><input type="number" id="prAts" value="${state.pricing.atsBoost}" min="0" required></div>
        <div class="field"><label>Employer Normal Hiring — per posting (₹)</label><input type="number" id="prNormal" value="${state.pricing.employerNormalPosting}" min="0" required></div>
        <div class="field"><label>Hiring Assistant Service — starting from (₹)</label><input type="number" id="prAssist" value="${state.pricing.employerHiringAssistant}" min="0" required></div>
        <div class="field"><label>Premium Subscription — Freelancer/Trainer/Manpower (₹)</label><input type="number" id="prPremium" value="${state.pricing.premiumSubscription}" min="0" required></div>
      </div>
      <button class="btn3d" type="submit">Save Pricing</button>
    </form>
  </div>`;
}

function savePricing(e) {
  e.preventDefault();
  state.pricing.atsBoost = parseInt(document.getElementById('prAts').value) || 0;
  state.pricing.employerNormalPosting = parseInt(document.getElementById('prNormal').value) || 0;
  state.pricing.employerHiringAssistant = parseInt(document.getElementById('prAssist').value) || 0;
  state.pricing.premiumSubscription = parseInt(document.getElementById('prPremium').value) || 0;
  window.api.saveLocalState();
  playThankYou();
  toast('Pricing updated across platform.');
  renderTab(currentUser, 'pricing');
  return false;
}

function siteSettingsPanel() {
  const s = state.siteSettings;
  return `<div class="panel">
    <h3>Site Content Customizer</h3>
    <p style="color:var(--text-dim);font-size:12.5px;margin-bottom:16px;">Edit public homepage hero copy, branding, and contact details.</p>
    <form class="profile-form" onsubmit="return saveSiteSettings(event)">
      <div class="field"><label>Hero Eyebrow (top line)</label><input type="text" id="ssEyebrow" value="${s.heroEyebrow}"></div>
      <div class="field"><label>Hero Title</label><input type="text" id="ssHeroTitle" value="${s.heroTitle}"></div>
      <div class="field"><label>Hero Lead / Subtitle</label><textarea id="ssHeroLead">${s.heroLead}</textarea></div>
      <div class="field"><label>Moto Line</label><input type="text" id="ssMoto" value="${s.moto}"></div>
      <div class="field"><label>Footer Text (HTML supported)</label><textarea id="ssFooterText">${s.footerText}</textarea></div>

      <h4 class="form-section-label">Logo &amp; Photo Banner</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Logo Image URL</label><input type="text" id="ssLogoUrl" value="${s.logoUrl}" placeholder="https://..."></div>
        <div class="field"><label>Hero Banner URL</label><input type="text" id="ssBannerUrl" value="${s.bannerUrl}" placeholder="https://..."></div>
      </div>

      <h4 class="form-section-label">Social Media Links</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Facebook</label><input type="text" id="ssFacebook" value="${s.social.facebook}"></div>
        <div class="field"><label>Twitter / X</label><input type="text" id="ssTwitter" value="${s.social.twitter}"></div>
        <div class="field"><label>LinkedIn</label><input type="text" id="ssLinkedin" value="${s.social.linkedin}"></div>
        <div class="field"><label>Instagram</label><input type="text" id="ssInstagram" value="${s.social.instagram}"></div>
      </div>

      <h4 class="form-section-label">Contact Details</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="field"><label>Contact Email</label><input type="email" id="ssContactEmail" value="${s.contact.email}"></div>
        <div class="field"><label>Contact Phone</label><input type="tel" id="ssContactPhone" value="${s.contact.phone}"></div>
      </div>
      <div class="field"><label>Address</label><input type="text" id="ssContactAddress" value="${s.contact.address}"></div>

      <button class="btn3d" type="submit">Save Site Settings</button>
    </form>
  </div>`;
}

function saveSiteSettings(e) {
  e.preventDefault();
  state.siteSettings.heroEyebrow = document.getElementById('ssEyebrow').value;
  state.siteSettings.heroTitle = document.getElementById('ssHeroTitle').value;
  state.siteSettings.heroLead = document.getElementById('ssHeroLead').value;
  state.siteSettings.moto = document.getElementById('ssMoto').value;
  state.siteSettings.footerText = document.getElementById('ssFooterText').value;
  state.siteSettings.logoUrl = document.getElementById('ssLogoUrl').value.trim();
  state.siteSettings.bannerUrl = document.getElementById('ssBannerUrl').value.trim();
  state.siteSettings.social = {
    facebook: document.getElementById('ssFacebook').value.trim(),
    twitter: document.getElementById('ssTwitter').value.trim(),
    linkedin: document.getElementById('ssLinkedin').value.trim(),
    instagram: document.getElementById('ssInstagram').value.trim()
  };
  state.siteSettings.contact = {
    email: document.getElementById('ssContactEmail').value.trim(),
    phone: document.getElementById('ssContactPhone').value.trim(),
    address: document.getElementById('ssContactAddress').value.trim()
  };

  window.api.saveLocalState();
  applySiteSettings();
  playThankYou();
  toast('Site settings saved and applied.');
  renderTab(currentUser, 'sitesettings');
  return false;
}

function applySiteSettings() {
  const s = state.siteSettings;
  const eyebrowEl = document.getElementById('heroEyebrowText');
  if (eyebrowEl) eyebrowEl.innerHTML = s.heroEyebrow;
  const titleEl = document.getElementById('heroTitleText');
  if (titleEl) titleEl.textContent = s.heroTitle;
  const leadEl = document.getElementById('heroLeadText');
  if (leadEl) leadEl.textContent = s.heroLead;
  const motoEl = document.getElementById('motoText');
  if (motoEl) motoEl.textContent = s.moto;
  const footerEl = document.getElementById('footerText');
  if (footerEl) footerEl.innerHTML = s.footerText;

  const logoImg = document.getElementById('siteLogoImg');
  if (logoImg) {
    if (s.logoUrl) {
      logoImg.src = s.logoUrl;
      logoImg.style.display = 'inline-block';
    } else {
      logoImg.style.display = 'none';
    }
  }

  const bannerImg = document.getElementById('siteBannerImg');
  if (bannerImg) {
    if (s.bannerUrl) {
      bannerImg.src = s.bannerUrl;
      bannerImg.style.display = 'block';
    } else {
      bannerImg.style.display = 'none';
    }
  }

  const socialEl = document.getElementById('footerSocial');
  if (socialEl) {
    const links = [
      s.social.facebook ? `<a href="${s.social.facebook}" target="_blank" rel="noopener">Facebook</a>` : '',
      s.social.twitter ? `<a href="${s.social.twitter}" target="_blank" rel="noopener">Twitter / X</a>` : '',
      s.social.linkedin ? `<a href="${s.social.linkedin}" target="_blank" rel="noopener">LinkedIn</a>` : '',
      s.social.instagram ? `<a href="${s.social.instagram}" target="_blank" rel="noopener">Instagram</a>` : ''
    ].filter(Boolean).join('');
    socialEl.innerHTML = links;
  }

  const contactEl = document.getElementById('footerContact');
  if (contactEl) {
    const parts = [
      s.contact.email ? `✉️ ${s.contact.email}` : '',
      s.contact.phone ? `📞 ${s.contact.phone}` : '',
      s.contact.address ? `📍 ${s.contact.address}` : ''
    ].filter(Boolean).map(p => `<span>${p}</span>`).join('');
    contactEl.innerHTML = parts;
  }
}

// ============ PUBLIC LANDING SEARCH & SERVICES ============
function renderPublicJobs(filters) {
  filters = filters || {};
  const title = (filters.title || '').trim().toLowerCase();
  const location = (filters.location || '').trim().toLowerCase();
  const salary = (filters.salary || '').trim().toLowerCase();
  const skill = (filters.skill || '').trim().toLowerCase();
  const el = document.getElementById('jobSearchResults');
  if (!el) return;

  const list = state.jobs.filter(j => {
    if (j.status !== 'Published' || j.openStatus === 'Closed') return false;
    if (title && !j.title.toLowerCase().includes(title) && !j.company.toLowerCase().includes(title)) return false;
    if (location && !(j.location || '').toLowerCase().includes(location)) return false;
    if (salary && !(j.compensation || '').toLowerCase().includes(salary)) return false;
    if (skill && !(j.requirements || '').toLowerCase().includes(skill)) return false;
    return true;
  });

  el.innerHTML = list.length ? list.map(j => `
    <div class="public-card">
      <h4>${j.title}</h4>
      <div class="pc-meta">🏢 ${j.company}${j.department ? ' · ' + j.department : ''}<br>📍 ${j.location} &nbsp;|&nbsp; 🕐 ${j.empType}${j.category ? ' &nbsp;|&nbsp; 🏷️ ' + j.category : ''}</div>
      <p>${j.summary || ''}</p>
      <div class="pc-price">${j.compensation || 'Compensation on request'}</div>
      <button class="btn3d small" onclick="ctaApplyJob()">Login &amp; Apply Now</button>
    </div>`).join('') : `<div class="public-empty">No published jobs match your search yet. <a onclick="openCard('register')" style="color:var(--green);cursor:pointer;font-weight:700;">Register as an employer</a> to post a job opening.</div>`;
}

function runAdvancedJobSearch() {
  renderPublicJobs({
    title: document.getElementById('advJobTitle') ? document.getElementById('advJobTitle').value : '',
    location: document.getElementById('advJobLocation') ? document.getElementById('advJobLocation').value : '',
    salary: document.getElementById('advJobSalary') ? document.getElementById('advJobSalary').value : '',
    skill: document.getElementById('advJobSkill') ? document.getElementById('advJobSkill').value : ''
  });
}

function ctaApplyJob() {
  toast('Please login or register as a Job Seeker to apply.');
  openCard('register');
}

function renderPublicFreelancers(filter) {
  filter = (filter || '').trim().toLowerCase();
  const el = document.getElementById('freelancerSearchResults');
  if (!el) return;

  let list = [];
  Object.keys(state.offerings).forEach(email => {
    (state.offerings[email] || []).forEach(o => {
      if (o.status !== 'Published') return;
      const u = state.users.find(x => x.email === email);
      const hay = (o.title + ' ' + (o.category || '') + ' ' + (u ? u.name : '')).toLowerCase();
      if (filter && !hay.includes(filter)) return;
      list.push({ ...o, freelancerName: u ? u.name : 'Freelancer' });
    });
  });

  el.innerHTML = list.length ? list.map(o => `
    <div class="public-card">
      <h4>${o.title}</h4>
      <div class="pc-meta">👤 ${o.freelancerName}${o.category ? ' &nbsp;|&nbsp; 🏷️ ' + o.category : ''} &nbsp;|&nbsp; ⏱ ${o.delivery || '—'}</div>
      <p>${o.desc || 'No description added.'}</p>
      <div class="pc-price">₹${o.price}</div>
      <button class="btn3d small red" onclick="ctaHireFreelancer()">Hire Now</button>
    </div>`).join('') : `<div class="public-empty">No published freelancer services match your query. <a onclick="openCard('register')" style="color:var(--green);cursor:pointer;font-weight:700;">Register as a freelancer</a> to list your services.</div>`;
}

function ctaHireFreelancer() {
  toast('Please login or register as an Employer to hire talent.');
  openCard('register');
}

function genericPanel(tab) {
  return `<div class="panel"><h3>${tab.toUpperCase()}</h3>
  <p style="color:var(--text-dim);font-size:13.5px;line-height:1.7;">
  This section is fully active and synchronized with your Shield Job Portal database.</p></div>`;
}

// Initial Landing Page Load
window.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('svcGrid');
  if (grid) {
    const services = [
      { icon: '💼', title: 'Job Seeker', desc: 'Discover verified openings, build a standout profile and track every application from a single dashboard.' },
      { icon: '🏢', title: 'Employer', desc: 'Post jobs, manage applicants and run your entire hiring pipeline with the built-in ATS.' },
      { icon: '🧑‍💻', title: 'Freelancer', desc: 'Showcase your portfolio, bid on projects and get discovered by employers looking for specialised talent.' },
      { icon: '🎓', title: 'Trainer', desc: 'List training programs and certifications, manage batches and connect with learners nationwide.' },
      { icon: '👷', title: 'Manpower Provider', desc: 'Supply skilled and unskilled workforce to businesses with demand tracking and deployment tools.' },
      { icon: '📑', title: 'Project Contractual Service', desc: 'Bid, manage and deliver contractual projects end to end with milestone and payment tracking.' }
    ];
    grid.innerHTML = services.map(s => `<div class="svc-card"><div class="svc-icon">${s.icon}</div><h3>${s.title}</h3><p>${s.desc}</p></div>`).join('');
  }

  renderPublicJobs({});
  renderPublicFreelancers('');
  applySiteSettings();
});
