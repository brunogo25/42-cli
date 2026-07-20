'use strict';

// Exam picker — reachable straight from the main menu, so practising an exam
// no longer means walking the whole Modules navigator to find the "Exam
// Practice" entry buried in a submodule list.
//
// Exams are grouped under their module with header rows (see select.js's
// `header` choice flag) so it stays obvious which cursus module each one
// belongs to, the same context the Modules screen gives via its tab bar.

const { select } = require('../ui/select');
const { modulesWithExams, examsOf } = require('../data/modules');
const examPractice = require('./examPractice');
const examSim = require('./examSim');
const grader = require('../runners/examGrader');
const c = require('../ui/colors');
const { t } = require('../i18n');

function examLabel(exam) {
  const base = exam.labelKey ? t(exam.labelKey) : (exam.label || exam.banks[0]);
  const count = grader.loadExam(exam).length;
  return `${base}  ${c.dim(t('exam.exerciseCount', { n: count }))}`;
}

// Turn a module's exams into choice rows, opening a sub-header whenever an
// exam declares a new `group` (the difficulty band sits under its own title).
function examChoices(module, choices, lookup) {
  let openGroup = null;
  for (const e of examsOf(module)) {
    if (e.group && e.group !== openGroup) {
      choices.push({ header: true, label: `  ${t(e.group)}`, indent: true });
      openGroup = e.group;
    }
    const key = `${module.id}:${e.id}`;
    lookup.set(key, { module, exam: e });
    choices.push({ label: examLabel(e), value: key });
  }
}

// Simulator (one exercise at a time, real-exam shape) vs drill (N exercises
// graded as a batch). Returns 'back' / 'quit' / undefined like every submenu.
async function pickMode(module, exam) {
  const action = await select({
    message: t('exam.mode'),
    choices: [
      { label: t('exam.modeSim'), value: 'sim' },
      { label: t('exam.modeDrill'), value: 'drill' },
      { label: t('common.back'), value: 'back' },
      { label: t('common.quit'), value: 'quit' },
    ],
  });
  if (action === 'sim') return examSim.run(module, exam);
  if (action === 'drill') return examPractice.run(module, exam);
  return action;
}

// Entry from the Modules screen: the module is already known, so only the
// exam choice is left — and when it offers just one, skip straight to the mode.
async function runForModule(module) {
  const exams = examsOf(module);
  if (!exams.length) return 'back';
  if (exams.length === 1) return pickMode(module, exams[0]);

  while (true) {
    const choices = [];
    const lookup = new Map();
    examChoices(module, choices, lookup);
    choices.push({ label: t('common.back'), value: 'back' });
    choices.push({ label: t('common.quit'), value: 'quit' });

    const choice = await select({ message: t('exam.pickExam'), choices });
    if (choice === 'back') return 'back';
    if (choice === 'quit') return 'quit';

    const hit = lookup.get(choice);
    if (!hit) continue;
    const back = await pickMode(module, hit.exam);
    if (back === 'quit') return 'quit';
  }
}

// Entry from the main menu: every exam across every module, grouped by module.
async function run() {
  const modules = modulesWithExams();
  if (!modules.length) {
    console.log('');
    console.log(c.yellow(`  ${t('exam.noneAvailable')}`));
    console.log('');
    return 'back';
  }

  while (true) {
    const choices = [];
    const lookup = new Map();
    for (const m of modules) {
      choices.push({ header: true, label: m.title });
      examChoices(m, choices, lookup);
    }
    choices.push({ label: t('common.back'), value: 'back' });
    choices.push({ label: t('common.quit'), value: 'quit' });

    const choice = await select({ message: t('exam.pickExam'), choices });
    if (choice === 'back') return 'back';
    if (choice === 'quit') return 'quit';

    const hit = lookup.get(choice);
    if (!hit) continue;
    const back = await pickMode(hit.module, hit.exam);
    if (back === 'quit') return 'quit';
  }
}

module.exports = { run, runForModule };
