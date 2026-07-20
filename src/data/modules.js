'use strict';

// The 42 cursus, reorganised into modules. Each module groups several
// submodules (the individual projects/exercises). `available: false` marks a
// module that is shown locked in the tab bar but cannot be entered yet.
//
// `exams` (when present) lists the exams a module can drill: `lang` is the
// language the exam is graded in ('c' or 'python'), `bank` is the folder under
// resources/exam/<bank>/ holding that exercise pool, and `label` names the rank
// it mirrors. A module may expose several (OOP covers both Rank 03 and 04).
// Use examsOf() rather than reading the field directly.
//
// Submodules are pure descriptors — the dispatch from a submodule id to the
// menu that runs it lives in menus/modulesScreen.js, mirroring how
// commonCore.js dispatches on a returned value rather than storing callbacks.

const { PROJECTS } = require('./pythonProjects');

const MODULES = [
  {
    id: 'fundamentals',
    title: 'Programming Fundamentals',
    descKey: 'mod.fundamentals.desc',
    available: true,
    exams: [
      { id: 'rank02', lang: 'c', banks: ['fundamentals'], label: 'Rank 02 — C' },
    ],
    submodules: [
      { id: 'libft', title: 'Libft' },
      { id: 'printf', title: 'ft_printf' },
      { id: 'gnl', title: 'get_next_line' },
      { id: 'push_swap', title: 'push_swap' },
      { id: 'exam', exam: true },
    ],
  },
  {
    id: 'oop',
    title: 'Object Oriented Programming',
    descKey: 'mod.oop.desc',
    available: true,
    // Two axes on the same 21 real subjects: the rank ladders reproduce an
    // actual exam sitting, while the tier entries pool both ranks so you can
    // drill just the easy / medium / hard band you are weak at.
    exams: [
      { id: 'rank03', lang: 'python', banks: ['rank03'], label: 'Rank 03 — Python' },
      { id: 'rank04', lang: 'python', banks: ['rank04'], label: 'Rank 04 — Python' },
      { id: 'easy', lang: 'python', banks: ['rank03', 'rank04'], tier: 'easy',
        labelKey: 'exam.tierEasy', group: 'exam.byDifficulty' },
      { id: 'medium', lang: 'python', banks: ['rank03', 'rank04'], tier: 'medium',
        labelKey: 'exam.tierMedium', group: 'exam.byDifficulty' },
      { id: 'advanced', lang: 'python', banks: ['rank03', 'rank04'], tier: 'hard',
        labelKey: 'exam.tierAdvanced', group: 'exam.byDifficulty' },
    ],
    submodules: [
      ...PROJECTS.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        python: true,
      })),
      { id: 'exam', exam: true },
    ],
  },
  {
    id: 'sysadmin',
    title: 'Systems And Networks Administration',
    descKey: 'mod.sysadmin.desc',
    available: false,
  },
  {
    id: 'algorithmics',
    title: 'Algorithmics',
    descKey: 'mod.algorithmics.desc',
    available: false,
  },
  {
    id: 'ai',
    title: 'Artificial Intelligence',
    descKey: 'mod.ai.desc',
    available: false,
  },
  {
    id: 'sysnet',
    title: 'System and Network Programming',
    descKey: 'mod.sysnet.desc',
    available: false,
  },
  {
    id: 'web',
    title: 'Web Programming',
    descKey: 'mod.web.desc',
    available: false,
  },
];

function byId(id) {
  return MODULES.find((m) => m.id === id) || null;
}

// Normalised exam list for a module: [] when it has none. Tolerates the older
// singular `exam` shape so a module can still declare just one.
function examsOf(module) {
  if (!module) return [];
  if (Array.isArray(module.exams)) return module.exams;
  if (module.exam) return [{ id: 'exam', ...module.exam }];
  return [];
}

// Every module that offers at least one exam, in cursus order.
function modulesWithExams() {
  return MODULES.filter((m) => m.available && examsOf(m).length);
}

module.exports = { MODULES, byId, examsOf, modulesWithExams };
