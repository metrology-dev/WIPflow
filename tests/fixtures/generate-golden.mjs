/**
 * Generator script for tests/fixtures/golden-project.wipflow
 * Run once with: node tests/fixtures/generate-golden.mjs
 *
 * Produces a realistic, production-like dataset covering:
 * - 12 groups (labs), 8 priorities, 12 statuses, 5 persons, ~175 tasks
 * - All activity categories (planned/active/problem/none)
 * - Past/current/future tasks spanning ~14 months
 * - Calendar stress days (mixed dot categories on same day)
 * - Search stress cases (similar names with prefixes)
 * - Every filter combination has matching data
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Configuration ─────────────────────────────────────────────────────────────

const LABS = [
  'Chemistry', 'Biology', 'Physics', 'Materials', 'Electronics',
  'Software', 'Quality', 'Safety', 'Metrology', 'Environment',
  'Research', 'Production',
];

const PERSONS = ['Alice K.', 'Bob R.', 'Charlie M.', 'Diana S.', 'Erik L.'];

const PRIORITIES = [
  'Critical', 'High', 'Medium-High', 'Medium', 'Medium-Low', 'Low', 'Very Low', 'Backlog',
];

const STATUSES = [
  { name: 'Not Started',       activityCategory: 'planned'  },
  { name: 'Active',            activityCategory: 'active'   },
  { name: 'On Hold',           activityCategory: 'active'   },
  { name: 'In Review',         activityCategory: 'active'   },
  { name: 'Awaiting Approval', activityCategory: 'planned'  },
  { name: 'Awaiting Customer', activityCategory: 'planned'  },
  { name: 'Blocked',           activityCategory: 'problem'  },
  { name: 'Overdue',           activityCategory: 'problem'  },
  { name: 'At Risk',           activityCategory: 'problem'  },
  { name: 'Completed',         activityCategory: 'none'     },
  { name: 'Cancelled',         activityCategory: 'none'     },
  { name: 'Deferred',          activityCategory: 'none'     },
];

const TAGS = [
  'calibration', 'measurement', 'accreditation', 'maintenance', 'ISO-17025',
  'urgent', 'audit', 'compliance', 'safety', 'documentation',
];

const HOLIDAYS = [
  '2026-01-01 New Year',
  '2026-04-03 Good Friday',
  '2026-04-06 Easter Monday',
  '2026-05-01 Labour Day',
  '2026-06-06 National Day',
  '2026-12-24 Christmas Eve',
  '2026-12-25 Christmas Day',
  '2026-12-31 New Year Eve',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

let taskIdCounter = 1;
function makeId() { return `task_golden_${String(taskIdCounter++).padStart(4, '0')}`; }

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function workdaysToCalendarApprox(workdays, alloc) {
  return Math.ceil(workdays / (alloc / 100)) + Math.floor(workdays / 5) * 2; // rough
}

function calcEndDate(startStr, workdays, allocPct, holidays) {
  const holidaySet = new Set(holidays.map(h => h.slice(0, 10)));
  const calDays = Math.ceil(workdays / (allocPct / 100));
  let d = new Date(startStr + 'T12:00:00');
  let remaining = calDays;
  const isWorkday = (dt) => dt.getDay() !== 0 && dt.getDay() !== 6;
  const fmt = (dt) => dt.toISOString().slice(0, 10);
  if (isWorkday(d) && !holidaySet.has(fmt(d))) remaining--;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    if (isWorkday(d) && !holidaySet.has(fmt(d))) remaining--;
  }
  return fmt(d);
}

function pick(arr, i) { return arr[i % arr.length]; }
function pickRandom(arr, seed) { return arr[seed % arr.length]; }

// ── Task generation ───────────────────────────────────────────────────────────

const now = new Date('2026-06-07T12:00:00');
const tasks = [];

// Reference date: today is 2026-06-07

function task(name, lab, person, priority, status, startDate, workdays, alloc, progress, description, tags, notes) {
  const endDate = calcEndDate(startDate, workdays, alloc, HOLIDAYS);
  const id = makeId();
  const created = new Date(now.getTime() - Math.random() * 180 * 86400000).toISOString();
  return {
    id, name, lab, person, priority, status,
    startDate, endDate, workdays, alloc: alloc ?? 100, progress: progress ?? 0,
    description: description ?? '', tags: tags ?? '', notes: notes ?? '',
    created, modified: created,
  };
}

// ── Group 1: Not Started (planned) — 40 tasks ─────────────────────────────────

const notStartedTasks = [
  // Future tasks
  task('Prepare Report',                 'Chemistry',   'Alice K.',   'High',        'Not Started', '2026-07-01', 5,  100, 0),
  task('Prepare Report Draft',           'Chemistry',   'Alice K.',   'High',        'Not Started', '2026-07-01', 3,  100, 0),
  task('Prepare Report Final',           'Chemistry',   'Alice K.',   'High',        'Not Started', '2026-07-15', 2,  100, 0),
  task('Prepare Report Review',          'Chemistry',   'Bob R.',     'Medium',      'Not Started', '2026-07-20', 1,  100, 0),
  task('Calibration Plan Q3',            'Metrology',   'Charlie M.', 'Critical',    'Not Started', '2026-07-01', 10, 100, 0, 'Annual calibration plan for Q3 equipment'),
  task('Safety Audit Preparation',       'Safety',      'Diana S.',   'Critical',    'Not Started', '2026-07-05', 8,  100, 0, 'Prepare documentation for safety audit'),
  task('ISO-17025 Documentation Update', 'Quality',     'Erik L.',    'High',        'Not Started', '2026-07-10', 15, 80,  0, '', 'ISO-17025,documentation'),
  task('Equipment Procurement Q3',       'Materials',   'Bob R.',     'Medium',      'Not Started', '2026-07-15', 5,  100, 0),
  task('Staff Training Schedule',        'Research',    'Alice K.',   'Low',         'Not Started', '2026-08-01', 3,  50,  0),
  task('Lab Expansion Planning',         'Production',  'Charlie M.', 'Medium-High', 'Not Started', '2026-08-10', 20, 100, 0),

  task('Reagent Inventory Audit',        'Chemistry',   'Diana S.',   'Medium',      'Not Started', '2026-07-20', 3,  100, 0, '', 'audit,compliance'),
  task('Protocol Revision Batch 1',      'Biology',     'Erik L.',    'Medium',      'Not Started', '2026-07-01', 5,  100, 0),
  task('Protocol Revision Batch 2',      'Biology',     'Alice K.',   'Medium',      'Not Started', '2026-07-08', 5,  100, 0),
  task('Protocol Revision Batch 3',      'Biology',     'Bob R.',     'Medium-Low',  'Not Started', '2026-07-15', 5,  100, 0),
  task('Instrument Qualification IQ',    'Electronics', 'Charlie M.', 'High',        'Not Started', '2026-08-01', 10, 100, 0),
  task('Instrument Qualification OQ',    'Electronics', 'Diana S.',   'High',        'Not Started', '2026-08-15', 10, 100, 0),
  task('Instrument Qualification PQ',    'Electronics', 'Erik L.',    'High',        'Not Started', '2026-09-01', 10, 100, 0),
  task('Accreditation Renewal Package',  'Quality',     'Alice K.',   'Critical',    'Not Started', '2026-09-15', 20, 80,  0, '', 'accreditation,ISO-17025'),
  task('Environment Monitoring Setup',   'Environment', 'Bob R.',     'Medium',      'Not Started', '2026-08-20', 8,  100, 0),
  task('Software Validation Protocol',   'Software',    'Charlie M.', 'High',        'Not Started', '2026-09-01', 15, 100, 0, '', 'documentation,compliance'),

  // Awaiting Approval (planned category)
  task('Budget Request Q4',              'Research',    'Diana S.',   'High',        'Awaiting Approval', '2026-06-20', 3, 50,  0),
  task('New Hire Requisition',           'Production',  'Erik L.',    'Medium',      'Awaiting Approval', '2026-06-25', 2, 50,  0),
  task('Vendor Contract Amendment',      'Quality',     'Alice K.',   'Medium-High', 'Awaiting Approval', '2026-07-01', 5, 50,  0),
  task('Equipment Lease Extension',      'Metrology',   'Bob R.',     'Medium',      'Awaiting Approval', '2026-07-05', 2, 50,  0),

  // Awaiting Customer (planned category)
  task('Customer Spec Review A',         'Chemistry',   'Charlie M.', 'High',        'Awaiting Customer', '2026-06-15', 5,  50, 0),
  task('Customer Spec Review B',         'Physics',     'Diana S.',   'Medium',      'Awaiting Customer', '2026-06-20', 3,  50, 0),
  task('Customer Sample Analysis',       'Biology',     'Erik L.',    'High',        'Awaiting Customer', '2026-07-01', 8,  50, 0),

  // Far future
  task('Year-End Compliance Report',     'Quality',     'Alice K.',   'High',        'Not Started', '2026-11-01', 15, 60,  0),
  task('Annual Calibration Review',      'Metrology',   'Bob R.',     'Critical',    'Not Started', '2026-11-15', 20, 80,  0, '', 'calibration,measurement'),
  task('Maintenance Contract Renewal',   'Safety',      'Charlie M.', 'Medium',      'Not Started', '2026-10-01', 5,  100, 0, '', 'maintenance'),
  task('Lab Relocation Phase 1',         'Production',  'Diana S.',   'Critical',    'Not Started', '2026-10-15', 30, 100, 0),
  task('Lab Relocation Phase 2',         'Production',  'Erik L.',    'Critical',    'Not Started', '2026-11-20', 20, 100, 0),
  task('IT Infrastructure Upgrade',      'Software',    'Alice K.',   'High',        'Not Started', '2026-09-15', 25, 80,  0),
  task('Data Migration Project',         'Software',    'Bob R.',     'High',        'Not Started', '2026-10-01', 20, 100, 0),
  task('Emergency Response Plan Update', 'Safety',      'Charlie M.', 'Medium-High', 'Not Started', '2026-08-15', 10, 100, 0),
  task('Waste Disposal Certification',   'Environment', 'Diana S.',   'Medium',      'Not Started', '2026-09-20', 5,  100, 0, '', 'compliance,safety'),
  task('Backlog: Process Improvement',   'Research',    'Erik L.',    'Backlog',     'Not Started', '2026-12-01', 30, 50,  0),
  task('Backlog: Documentation Cleanup', 'Quality',     'Alice K.',   'Backlog',     'Not Started', '2026-12-15', 10, 50,  0, '', 'documentation'),
  task('Backlog: Legacy System Review',  'Software',    'Bob R.',     'Very Low',    'Not Started', '2026-12-01', 15, 50,  0),
  task('Backlog: Archive Old Records',   'Chemistry',   'Charlie M.', 'Very Low',    'Not Started', '2026-11-01', 5,  50,  0),
];

// ── Group 2: Active tasks (active category) — 40 tasks ────────────────────────

const activeTasks = [
  // Currently running (spanning today 2026-06-07)
  task('Routine Water Analysis',         'Chemistry',   'Alice K.',   'High',     'Active',   '2026-06-02', 5,  100, 60,  'Weekly water quality testing', 'measurement'),
  task('Microscopy Campaign',            'Biology',     'Bob R.',     'Medium',   'Active',   '2026-05-26', 10, 100, 45),
  task('Tensile Strength Study',         'Materials',   'Charlie M.', 'High',     'Active',   '2026-06-01', 8,  100, 25,  'Material testing for supplier qualification'),
  task('Firmware Update Rollout',        'Electronics', 'Diana S.',   'Critical', 'Active',   '2026-06-03', 5,  100, 70,  '', 'urgent'),
  task('ISO Audit Support',              'Quality',     'Erik L.',    'Critical', 'Active',   '2026-06-01', 10, 100, 50,  'Supporting external ISO audit', 'audit,ISO-17025'),
  task('Thermal Resistance Testing',     'Physics',     'Alice K.',   'Medium',   'Active',   '2026-06-02', 7,  80,  30),
  task('Software Regression Testing',    'Software',    'Bob R.',     'High',     'Active',   '2026-06-01', 10, 100, 40,  '', 'urgent'),
  task('Safety Inspection Rounds',       'Safety',      'Charlie M.', 'High',     'Active',   '2026-06-01', 5,  50,  80),
  task('Calibration: Pipettes Batch A',  'Metrology',   'Diana S.',   'High',     'Active',   '2026-06-02', 3,  100, 90,  '', 'calibration,measurement'),
  task('Environmental Sampling Q2',      'Environment', 'Erik L.',    'Medium',   'Active',   '2026-05-18', 15, 60,  55),

  // On Hold (still active category — task not progressing but tracked)
  task('Supplier Qualification Beta',    'Chemistry',   'Alice K.',   'Medium',   'On Hold',  '2026-05-15', 20, 50,  30),
  task('Reagent Shelf-Life Study',       'Biology',     'Bob R.',     'Low',      'On Hold',  '2026-04-01', 60, 20,  10),
  task('Prototype Assembly v2',          'Electronics', 'Charlie M.', 'High',     'On Hold',  '2026-05-01', 15, 100, 20),
  task('Performance Benchmarking',       'Software',    'Diana S.',   'Medium',   'On Hold',  '2026-05-20', 10, 50,  5),

  // In Review
  task('Q1 Performance Review',          'Quality',     'Erik L.',    'High',     'In Review', '2026-04-15', 20, 60,  95),
  task('Annual Lab Report Draft',        'Research',    'Alice K.',   'Medium',   'In Review', '2026-05-01', 15, 80,  90,  '', 'documentation'),
  task('Validation Protocol Rev 3',      'Metrology',   'Bob R.',     'High',     'In Review', '2026-05-20', 10, 100, 98,  '', 'accreditation'),
  task('Waste Water Analysis Report',    'Environment', 'Charlie M.', 'Medium',   'In Review', '2026-06-01', 5,  100, 95,  '', 'measurement,compliance'),

  // Ongoing longer tasks spanning today
  task('Contamination Investigation',    'Chemistry',   'Diana S.',   'Critical', 'Active',   '2026-05-25', 15, 100, 35,  'Root-cause investigation for contamination event', 'urgent,safety'),
  task('Equipment Validation Master',    'Metrology',   'Erik L.',    'High',     'Active',   '2026-05-01', 40, 80,  45,  '', 'calibration,accreditation'),
  task('Data Analysis Campaign Q2',      'Research',    'Alice K.',   'Medium',   'Active',   '2026-05-04', 25, 60,  55),
  task('Production Line Qualification',  'Production',  'Bob R.',     'Critical', 'Active',   '2026-04-20', 50, 100, 40,  'Full production line QC qualification'),
  task('Particle Size Analysis Series',  'Materials',   'Charlie M.', 'Medium',   'Active',   '2026-06-01', 10, 80,  20),
  task('Power Systems Safety Review',    'Safety',      'Diana S.',   'High',     'Active',   '2026-05-15', 20, 50,  60,  '', 'safety,compliance'),

  // Started in past, ending in future
  task('Lab Accreditation Maintenance',  'Quality',     'Erik L.',    'Critical', 'Active',   '2026-01-05', 100, 30, 40,  '', 'accreditation,ISO-17025'),
  task('Continuous Monitoring Program',  'Environment', 'Alice K.',   'High',     'Active',   '2026-01-01', 120, 25, 50,  '', 'measurement'),
  task('Long-term Stability Study',      'Chemistry',   'Bob R.',     'Medium',   'Active',   '2025-12-01', 180, 20, 35,  'Stability study per ICH guidelines'),
  task('Process Development Phase 2',    'Biology',     'Charlie M.', 'High',     'Active',   '2026-03-01', 80,  50, 55),
  task('IT Security Assessment',         'Software',    'Diana S.',   'High',     'Active',   '2026-04-01', 60,  80, 65,  '', 'compliance,urgent'),
  task('Building Maintenance Cycle',     'Safety',      'Erik L.',    'Medium',   'On Hold',  '2026-03-01', 90,  30, 25,  '', 'maintenance'),

  // Near-future starting soon
  task('Calibration: Balances Batch B',  'Metrology',   'Alice K.',   'High',     'Active',   '2026-06-08', 5,  100, 0,  '', 'calibration,measurement'),
  task('Sterility Testing Campaign',     'Biology',     'Bob R.',     'Critical', 'Active',   '2026-06-09', 8,  100, 0),
  task('Corrosion Resistance Study',     'Materials',   'Charlie M.', 'Medium',   'Active',   '2026-06-10', 12, 80,  0),
  task('Network Security Patch',         'Software',    'Diana S.',   'High',     'Active',   '2026-06-08', 3,  100, 0,  '', 'urgent'),
  task('Vibration Analysis Campaign',    'Physics',     'Erik L.',    'Medium',   'Active',   '2026-06-09', 6,  100, 0),
  task('Cleaning Validation Study',      'Production',  'Alice K.',   'High',     'In Review','2026-05-18', 15, 80,  92),
  task('SOP Revision: Sampling',         'Quality',     'Bob R.',     'Medium',   'In Review','2026-06-01', 8,  100, 95,  '', 'documentation'),
  task('Electrical Safety Testing',      'Electronics', 'Charlie M.', 'High',     'Active',   '2026-06-05', 7,  100, 15,  '', 'safety'),
  task('GxP Training Completion',        'Research',    'Diana S.',   'Medium',   'Active',   '2026-06-01', 10, 50,  70,  '', 'compliance,documentation'),
  task('Chemical Compatibility Study',   'Chemistry',   'Erik L.',    'Medium-High','Active',  '2026-06-03', 10, 80,  20),
];

// ── Group 3: Completed tasks (none category) — 40 tasks ───────────────────────

const completedTasks = [
  task('Q1 Calibration Audit',           'Metrology',   'Alice K.',   'Critical', 'Completed', '2026-01-05', 20, 100, 100, '', 'calibration,audit'),
  task('Annual Safety Drill',            'Safety',      'Bob R.',     'High',     'Completed', '2026-01-10', 3,  100, 100, '', 'safety'),
  task('SOP Review Cycle 2025',          'Quality',     'Charlie M.', 'Medium',   'Completed', '2025-11-01', 30, 60,  100, '', 'documentation'),
  task('Equipment Maintenance Jan',      'Electronics', 'Diana S.',   'Medium',   'Completed', '2026-01-15', 5,  100, 100, '', 'maintenance'),
  task('H2O Purification Validation',    'Chemistry',   'Erik L.',    'High',     'Completed', '2026-01-20', 10, 100, 100, '', 'measurement,accreditation'),
  task('Supplier Audit: Vendor A',       'Quality',     'Alice K.',   'High',     'Completed', '2026-02-01', 8,  100, 100, '', 'audit,compliance'),
  task('Protein Quantification Study',   'Biology',     'Bob R.',     'Medium',   'Completed', '2026-02-05', 10, 80,  100),
  task('HVAC Qualification',             'Production',  'Charlie M.', 'Critical', 'Completed', '2026-02-10', 15, 100, 100, '', 'compliance,accreditation'),
  task('pH Meter Calibration Campaign',  'Metrology',   'Diana S.',   'High',     'Completed', '2026-02-15', 5,  100, 100, '', 'calibration,measurement'),
  task('Fire Safety Inspection',         'Safety',      'Erik L.',    'Critical', 'Completed', '2026-02-20', 3,  100, 100, '', 'safety,compliance'),

  task('Stability Sample Pull Q1',       'Chemistry',   'Alice K.',   'Medium',   'Completed', '2026-03-01', 3,  100, 100),
  task('Microbiology Method Transfer',   'Biology',     'Bob R.',     'High',     'Completed', '2026-03-05', 20, 80,  100, '', 'accreditation'),
  task('X-Ray Diffraction Analysis',     'Physics',     'Charlie M.', 'Medium',   'Completed', '2026-03-10', 5,  100, 100),
  task('Polymer Testing Campaign',       'Materials',   'Diana S.',   'Medium',   'Completed', '2026-03-15', 8,  100, 100),
  task('SCADA System Update',            'Software',    'Erik L.',    'High',     'Completed', '2026-03-20', 10, 100, 100, '', 'urgent'),
  task('Chemical Storage Audit',         'Environment', 'Alice K.',   'High',     'Completed', '2026-03-25', 5,  100, 100, '', 'safety,audit,compliance'),
  task('Particle Counter IQ',            'Metrology',   'Bob R.',     'High',     'Completed', '2026-04-01', 8,  100, 100, '', 'calibration'),
  task('Endotoxin Testing Validation',   'Biology',     'Charlie M.', 'Critical', 'Completed', '2026-04-05', 12, 100, 100, '', 'accreditation,measurement'),
  task('Electrical Panel Inspection',    'Electronics', 'Diana S.',   'Medium',   'Completed', '2026-04-10', 3,  100, 100, '', 'safety,maintenance'),
  task('Q1 Environmental Report',        'Environment', 'Erik L.',    'Medium',   'Completed', '2026-04-15', 5,  100, 100, '', 'compliance,documentation'),

  task('Autoclave Requalification',      'Production',  'Alice K.',   'High',     'Completed', '2026-04-20', 10, 100, 100, '', 'calibration,accreditation'),
  task('Dissolution Tester Calibration', 'Metrology',   'Bob R.',     'High',     'Completed', '2026-04-25', 5,  100, 100, '', 'calibration,measurement'),
  task('Risk Assessment Review',         'Safety',      'Charlie M.', 'High',     'Completed', '2026-05-01', 5,  100, 100, '', 'safety,compliance'),
  task('Supply Chain Audit',             'Quality',     'Diana S.',   'Medium',   'Completed', '2026-05-05', 8,  100, 100, '', 'audit'),
  task('Trace Metal Analysis',           'Chemistry',   'Erik L.',    'Medium',   'Completed', '2026-05-10', 5,  100, 100, '', 'measurement'),
  task('Fluorescence Microscopy Setup',  'Biology',     'Alice K.',   'Medium',   'Completed', '2026-05-12', 5,  100, 100),
  task('Vibration Isolation Install',    'Physics',     'Bob R.',     'Low',      'Completed', '2026-05-15', 3,  100, 100),
  task('Document Control Training',      'Quality',     'Charlie M.', 'Medium',   'Completed', '2026-05-18', 2,  100, 100, '', 'documentation,compliance'),
  task('Network Firewall Upgrade',       'Software',    'Diana S.',   'High',     'Completed', '2026-05-20', 5,  100, 100, '', 'urgent'),
  task('Waste Disposal Audit Q1',        'Environment', 'Erik L.',    'Medium',   'Completed', '2026-05-22', 3,  100, 100, '', 'audit,compliance'),

  // Older completed tasks
  task('Year-End Report 2025',           'Quality',     'Alice K.',   'High',     'Completed', '2025-11-01', 20, 60,  100, '', 'documentation'),
  task('Equipment Census 2025',          'Metrology',   'Bob R.',     'Medium',   'Completed', '2025-10-01', 10, 50,  100),
  task('GDPR Compliance Review',         'Software',    'Charlie M.', 'Critical', 'Completed', '2025-09-01', 15, 80,  100, '', 'compliance,documentation'),
  task('Emergency Generator Test',       'Safety',      'Diana S.',   'High',     'Completed', '2025-11-15', 2,  100, 100, '', 'safety,maintenance'),
  task('Reagent Qualification 2025',     'Chemistry',   'Erik L.',    'Medium',   'Completed', '2025-10-15', 15, 80,  100),
  task('Cross-Lab Method Comparison',    'Biology',     'Alice K.',   'Medium',   'Completed', '2025-12-01', 20, 60,  100),
  task('Software License Audit 2025',    'Software',    'Bob R.',     'Low',      'Completed', '2025-09-15', 3,  50,  100),
  task('ISO Gap Analysis 2025',          'Quality',     'Charlie M.', 'High',     'Completed', '2025-08-01', 10, 80,  100, '', 'ISO-17025,audit'),
  task('PPE Stock Review',               'Safety',      'Diana S.',   'Low',      'Completed', '2025-11-01', 2,  100, 100, '', 'safety'),
  task('Solvent Recovery Validation',    'Chemistry',   'Erik L.',    'Medium',   'Completed', '2025-12-15', 10, 100, 100),

  // Cancelled / Deferred
  task('Lab Extension Project 2025',     'Production',  'Alice K.',   'High',     'Cancelled', '2025-06-01', 90, 100, 10,  'Cancelled due to budget constraints'),
  task('LIMS Upgrade Project',           'Software',    'Bob R.',     'Medium',   'Cancelled', '2026-03-01', 40, 80,  5,   'Cancelled — replaced by cloud solution'),
  task('Deferred: Old Instrument Repair','Metrology',   'Charlie M.', 'Low',      'Deferred',  '2026-01-15', 10, 50,  0),
];

// ── Group 4: Problem tasks — 20 tasks ─────────────────────────────────────────

const problemTasks = [
  // Blocked
  task('Reagent Supply Blocked',         'Chemistry',   'Alice K.',   'Critical', 'Blocked',  '2026-05-20', 10, 100, 0,   'Waiting for critical reagent delivery', 'urgent'),
  task('Equipment Repair Pending',       'Metrology',   'Bob R.',     'Critical', 'Blocked',  '2026-06-01', 5,  100, 0,   'Mass spectrometer down, waiting for part', 'urgent,maintenance'),
  task('Regulatory Hold',                'Biology',     'Charlie M.', 'High',     'Blocked',  '2026-05-25', 15, 100, 40,  'External regulatory review required'),
  task('Data Access Issue',              'Software',    'Diana S.',   'High',     'Blocked',  '2026-06-02', 3,  100, 0,   'Database permissions issue blocking analysis', 'urgent'),
  task('Supplier Non-Conformance',       'Quality',     'Erik L.',    'Critical', 'Blocked',  '2026-05-15', 20, 100, 20,  'Supplier audit finding blocking release'),
  task('Building Permit Delay',          'Production',  'Alice K.',   'High',     'Blocked',  '2026-04-01', 30, 100, 15),
  task('IT System Outage Impact',        'Software',    'Bob R.',     'Critical', 'Blocked',  '2026-06-05', 5,  100, 0,   '', 'urgent'),

  // Overdue
  task('Overdue: Pressure Gauge Calib',  'Metrology',   'Charlie M.', 'Critical', 'Overdue',  '2026-05-01', 10, 100, 0,   'Calibration overdue — equipment quarantined', 'calibration,urgent'),
  task('Overdue: Method Revalidation',   'Biology',     'Diana S.',   'High',     'Overdue',  '2026-05-05', 15, 100, 0,   '', 'accreditation,urgent'),
  task('Overdue: SOP Approval',          'Quality',     'Erik L.',    'High',     'Overdue',  '2026-05-10', 5,  100, 80,  'Final approval signature outstanding'),
  task('Overdue: Risk Review',           'Safety',      'Alice K.',   'Critical', 'Overdue',  '2026-05-12', 3,  100, 60,  '', 'safety,urgent'),
  task('Overdue: Environmental Report',  'Environment', 'Bob R.',     'Medium',   'Overdue',  '2026-05-20', 5,  100, 70,  '', 'compliance'),

  // At Risk
  task('At Risk: Q2 Deliverable',        'Research',    'Charlie M.', 'High',     'At Risk',  '2026-05-18', 20, 60,  50),
  task('At Risk: Audit Readiness',       'Quality',     'Diana S.',   'Critical', 'At Risk',  '2026-06-01', 10, 100, 30,  'Audit in 3 weeks, preparation behind schedule', 'audit,urgent'),
  task('At Risk: Budget Overrun',        'Production',  'Erik L.',    'High',     'At Risk',  '2026-04-15', 45, 100, 60),
  task('At Risk: Calibration Backlog',   'Metrology',   'Alice K.',   'High',     'At Risk',  '2026-05-25', 15, 80,  25,  '', 'calibration'),
  task('At Risk: Staff Shortage',        'Biology',     'Bob R.',     'Medium',   'At Risk',  '2026-06-01', 20, 100, 10),
  task('At Risk: System Integration',    'Software',    'Charlie M.', 'High',     'At Risk',  '2026-05-20', 25, 80,  35,  '', 'urgent'),
  task('At Risk: Customer Deadline',     'Chemistry',   'Diana S.',   'Critical', 'At Risk',  '2026-06-02', 8,  100, 45,  '', 'urgent'),
  task('At Risk: Material Shortage',     'Materials',   'Erik L.',    'High',     'At Risk',  '2026-06-01', 12, 100, 20),
];

// ── Combine all tasks ─────────────────────────────────────────────────────────

tasks.push(...notStartedTasks, ...activeTasks, ...completedTasks, ...problemTasks);

// ── Assemble dataset ──────────────────────────────────────────────────────────

const dataset = {
  version: '1.0',
  settings: {
    theme: 'dark',
    autosaveIntervalMinutes: 5,
    saveVersion: 0,
    groupSingular: 'Lab',
    groupPlural: 'Labs',
    labs: LABS,
    persons: PERSONS,
    priorities: PRIORITIES,
    statuses: STATUSES,
    tags: TAGS,
    holidays: HOLIDAYS,
    calendarWeekNumbering: 'iso',
    calendarFirstDay: 'mon',
    calendarShowOutsideDays: true,
  },
  tasks,
};

const outPath = resolve(__dirname, 'golden-project.wipflow');
writeFileSync(outPath, JSON.stringify(dataset, null, 2), 'utf8');
console.log(`Generated ${tasks.length} tasks → ${outPath}`);
console.log('Status breakdown:');
const byStatus = {};
tasks.forEach(t => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });
Object.entries(byStatus).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
