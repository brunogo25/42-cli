'use strict';

const c = require('../ui/colors');
const { t, getLanguage } = require('../i18n');
const stats = require('./stats');

const EASY_FUNCTIONS = [
  'isalpha', 'isdigit', 'isalnum', 'isascii', 'isprint',
  'toupper', 'tolower', 'strlen', 'bzero', 'memset',
];

const HARD_FUNCTIONS = [
  'split', 'strmapi', 'striteri', 'lstmap', 'lstdelone',
  'lstclear', 'lstiter', 'substr', 'strjoin', 'strtrim', 'itoa',
];

const RARITY_COLORS = {
  common: c.gray,
  uncommon: c.green,
  rare: c.cyan,
  epic: c.magenta,
  legendary: c.yellow,
  secret: c.red,
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'secret'];

function uniqueCount(arr) {
  return Array.isArray(arr) ? arr.length : 0;
}

const ACHIEVEMENTS = [
  // ───── LOYALTY ─────
  { id: 'first_steps', rarity: 'common', badge: '🌱',
    name_en: 'First Steps', name_fr: 'Premiers pas',
    desc_en: 'Open 42 CLI for the first time.',
    desc_fr: 'Lancer 42 CLI pour la première fois.',
    check: (s) => (s.launches || 0) >= 1 },

  { id: 'welcome_back', rarity: 'common', badge: '👋',
    name_en: 'Welcome Back', name_fr: 'Te revoilà',
    desc_en: 'Launch the CLI on 5 different days.',
    desc_fr: 'Lancer le CLI sur 5 jours différents.',
    check: (s) => uniqueCount(s.launchDays) >= 5 },

  { id: 'habitual', rarity: 'uncommon', badge: '📅',
    name_en: 'Habitual', name_fr: 'Habitué',
    desc_en: 'Launch the CLI on 30 different days.',
    desc_fr: 'Lancer le CLI sur 30 jours différents.',
    check: (s) => uniqueCount(s.launchDays) >= 30 },

  { id: 'devotee', rarity: 'rare', badge: '⛩',
    name_en: 'Devotee', name_fr: 'Disciple',
    desc_en: 'Launch the CLI on 100 different days.',
    desc_fr: 'Lancer le CLI sur 100 jours différents.',
    check: (s) => uniqueCount(s.launchDays) >= 100 },

  { id: 'daily_driver', rarity: 'uncommon', badge: '🚗',
    name_en: 'Daily Driver', name_fr: 'Conducteur quotidien',
    desc_en: 'Launch 10 times in a single day.',
    desc_fr: 'Lancer 10 fois dans la même journée.',
    check: (s) => (s.todayLaunches || 0) >= 10 },

  { id: 'marathon', rarity: 'rare', badge: '🏃',
    name_en: 'Marathon', name_fr: 'Marathon',
    desc_en: 'Launch 25 times in a single day.',
    desc_fr: 'Lancer 25 fois dans la même journée.',
    check: (s) => (s.todayLaunches || 0) >= 25 },

  { id: 'streak_3', rarity: 'common', badge: '🔥',
    name_en: 'On Fire', name_fr: 'En feu',
    desc_en: 'Launch the CLI 3 days in a row.',
    desc_fr: 'Lancer le CLI 3 jours d\'affilée.',
    check: (s) => (s.consecutiveDays || 0) >= 3 },

  { id: 'streak_7', rarity: 'uncommon', badge: '🔥',
    name_en: 'Week-Long Burn', name_fr: 'Une semaine entière',
    desc_en: 'Launch the CLI 7 days in a row.',
    desc_fr: 'Lancer le CLI 7 jours d\'affilée.',
    check: (s) => (s.consecutiveDays || 0) >= 7 },

  { id: 'streak_14', rarity: 'rare', badge: '🌋',
    name_en: 'Two-Week Inferno', name_fr: 'Deux semaines en fusion',
    desc_en: 'Launch the CLI 14 days in a row.',
    desc_fr: 'Lancer le CLI 14 jours d\'affilée.',
    check: (s) => (s.consecutiveDays || 0) >= 14 },

  { id: 'streak_30', rarity: 'epic', badge: '🌪',
    name_en: 'Storm', name_fr: 'Tempête',
    desc_en: 'Launch the CLI 30 days in a row.',
    desc_fr: 'Lancer le CLI 30 jours d\'affilée.',
    check: (s) => (s.consecutiveDays || 0) >= 30 },

  { id: 'streak_42', rarity: 'legendary', badge: '👑',
    name_en: 'Forty-Two', name_fr: 'Quarante-deux',
    desc_en: 'Launch the CLI 42 days in a row. The answer.',
    desc_fr: 'Lancer le CLI 42 jours d\'affilée. La réponse.',
    check: (s) => (s.consecutiveDays || 0) >= 42 },

  // ───── TIME OF DAY ─────
  { id: 'night_owl', rarity: 'common', badge: '🦉',
    name_en: 'Night Owl', name_fr: 'Oiseau de nuit',
    desc_en: 'Launch between midnight and 5 AM.',
    desc_fr: 'Lancer entre minuit et 5 h du matin.',
    check: (s, ctx) => ctx && ctx.now && ctx.now.getHours() >= 0 && ctx.now.getHours() < 5 },

  { id: 'three_am', rarity: 'uncommon', badge: '🕒',
    name_en: '3 AM Demon', name_fr: 'Démon de 3 h',
    desc_en: 'Launch at some point between 3:00 and 3:59 AM.',
    desc_fr: 'Lancer entre 3 h 00 et 3 h 59.',
    check: (s, ctx) => ctx && ctx.now && ctx.now.getHours() === 3 },

  { id: 'midnight_strike', rarity: 'rare', badge: '🌙',
    name_en: 'Midnight Strike', name_fr: 'Frappe de minuit',
    desc_en: 'Launch between 0:00 and 0:59.',
    desc_fr: 'Lancer entre 0 h 00 et 0 h 59.',
    check: (s, ctx) => ctx && ctx.now && ctx.now.getHours() === 0 },

  { id: 'sunrise', rarity: 'common', badge: '🌅',
    name_en: 'Sunrise Session', name_fr: 'Session du lever',
    desc_en: 'Launch between 6 AM and 8 AM.',
    desc_fr: 'Lancer entre 6 h et 8 h.',
    check: (s, ctx) => ctx && ctx.now && ctx.now.getHours() >= 6 && ctx.now.getHours() < 8 },

  { id: 'lunch_break', rarity: 'common', badge: '🥪',
    name_en: 'Lunch Break', name_fr: 'Pause déjeuner',
    desc_en: 'Launch between 12 PM and 1 PM.',
    desc_fr: 'Lancer entre midi et 13 h.',
    check: (s, ctx) => ctx && ctx.now && ctx.now.getHours() === 12 },

  { id: 'weekend_warrior', rarity: 'common', badge: '🛡',
    name_en: 'Weekend Warrior', name_fr: 'Combattant du weekend',
    desc_en: 'Launch on a Saturday or Sunday.',
    desc_fr: 'Lancer un samedi ou un dimanche.',
    check: (s, ctx) => {
      if (!ctx || !ctx.now) return false;
      const d = ctx.now.getDay();
      return d === 0 || d === 6;
    } },

  { id: 'weekend_loyal', rarity: 'uncommon', badge: '🏖',
    name_en: 'Weekend Loyal', name_fr: 'Fidèle du weekend',
    desc_en: 'Launch the CLI on 10 different weekend days.',
    desc_fr: 'Lancer le CLI 10 weekends différents.',
    check: (s) => (s.weekendLaunches || 0) >= 10 },

  { id: 'all_seven_days', rarity: 'rare', badge: '🗓',
    name_en: 'No Days Off', name_fr: 'Sans jour de repos',
    desc_en: 'Launch on every day of the week (Mon–Sun) at least once.',
    desc_fr: 'Lancer sur chaque jour de la semaine (lun–dim) au moins une fois.',
    check: (s) => {
      const dows = new Set();
      for (const day of (s.launchDays || [])) {
        const d = new Date(day);
        if (!isNaN(d)) dows.add(d.getDay());
      }
      return dows.size >= 7;
    } },

  // ───── TESTING ─────
  { id: 'first_test', rarity: 'common', badge: '🧪',
    name_en: 'First Test', name_fr: 'Premier test',
    desc_en: 'Run your very first test.',
    desc_fr: 'Lancer votre tout premier test.',
    check: (s) => (s.testRuns || 0) >= 1 },

  { id: 'test_25', rarity: 'common', badge: '⚗',
    name_en: 'Lab Coat', name_fr: 'Blouse blanche',
    desc_en: 'Run 25 test sessions.',
    desc_fr: 'Effectuer 25 sessions de test.',
    check: (s) => (s.testRuns || 0) >= 25 },

  { id: 'test_100', rarity: 'uncommon', badge: '💯',
    name_en: 'Century', name_fr: 'Siècle',
    desc_en: 'Run 100 test sessions.',
    desc_fr: 'Effectuer 100 sessions de test.',
    check: (s) => (s.testRuns || 0) >= 100 },

  { id: 'test_500', rarity: 'rare', badge: '🏛',
    name_en: 'Test Maximus', name_fr: 'Test Maximus',
    desc_en: 'Run 500 test sessions.',
    desc_fr: 'Effectuer 500 sessions de test.',
    check: (s) => (s.testRuns || 0) >= 500 },

  { id: 'oops_easy', rarity: 'common', badge: '🤡',
    name_en: 'Oops', name_fr: 'Oups',
    desc_en: 'Fail a test on an easy function. We\'ve all been there.',
    desc_fr: 'Échouer un test sur une fonction facile. Ça arrive aux meilleurs.',
    check: (s, ctx) => ctx && ctx.event === 'test' && ctx.passed === false &&
      Array.isArray(ctx.targets) && ctx.targets.some((fn) => EASY_FUNCTIONS.includes(fn)) },

  { id: 'oops_hard', rarity: 'uncommon', badge: '🌀',
    name_en: 'Respect', name_fr: 'Respect',
    desc_en: 'Fail a test on a hard function. The brave bleed first.',
    desc_fr: 'Échouer un test sur une fonction difficile. Les braves saignent en premier.',
    check: (s, ctx) => ctx && ctx.event === 'test' && ctx.passed === false &&
      Array.isArray(ctx.targets) && ctx.targets.some((fn) => HARD_FUNCTIONS.includes(fn)) },

  { id: 'skill_issue', rarity: 'uncommon', badge: '😬',
    name_en: 'Skill Issue', name_fr: 'Problème de skill',
    desc_en: 'Fail 10 tests in total. Tomorrow is another day.',
    desc_fr: 'Échouer 10 tests au total. Demain est un autre jour.',
    check: (s) => (s.testsFailed || 0) >= 10 },

  { id: 'emotional_damage', rarity: 'rare', badge: '💔',
    name_en: 'Emotional Damage', name_fr: 'Dégâts émotionnels',
    desc_en: 'Fail 50 tests in total. Therapy is real.',
    desc_fr: 'Échouer 50 tests au total. La thérapie est une option valide.',
    check: (s) => (s.testsFailed || 0) >= 50 },

  { id: 'practice_perfect', rarity: 'uncommon', badge: '✨',
    name_en: 'Practice Makes Perfect', name_fr: 'C\'est en forgeant',
    desc_en: 'Pass a test on a function you previously failed.',
    desc_fr: 'Réussir un test sur une fonction précédemment échouée.',
    check: (s, ctx) => ctx && ctx.event === 'test' && ctx.passed === true &&
      Array.isArray(ctx.targets) && ctx.targets.some((fn) => (s.failedFunctions || {})[fn] >= 1) },

  { id: 'libft_explorer', rarity: 'uncommon', badge: '🗺',
    name_en: 'Libft Explorer', name_fr: 'Explorateur Libft',
    desc_en: 'Test 20 different libft functions across all sessions.',
    desc_fr: 'Tester 20 fonctions libft différentes au total.',
    check: (s) => Object.keys(s.testedFunctions || {}).length >= 20 },

  { id: 'libft_connoisseur', rarity: 'rare', badge: '🎓',
    name_en: 'Libft Connoisseur', name_fr: 'Connaisseur Libft',
    desc_en: 'Test all 42 libft functions at least once.',
    desc_fr: 'Tester chacune des 42 fonctions libft au moins une fois.',
    check: (s) => Object.keys(s.testedFunctions || {}).length >= 42 },

  { id: 'norminette_friend', rarity: 'common', badge: '📏',
    name_en: 'Norminette Friend', name_fr: 'Ami de la norminette',
    desc_en: 'Run norminette 10 times.',
    desc_fr: 'Lancer norminette 10 fois.',
    check: (s) => (s.norminetteRuns || 0) >= 10 },

  { id: 'norminette_disciple', rarity: 'uncommon', badge: '📐',
    name_en: 'Norminette Disciple', name_fr: 'Disciple de la norminette',
    desc_en: 'Run norminette 50 times.',
    desc_fr: 'Lancer norminette 50 fois.',
    check: (s) => (s.norminetteRuns || 0) >= 50 },

  { id: 'norminette_clean', rarity: 'uncommon', badge: '🧼',
    name_en: 'Squeaky Clean', name_fr: 'Impeccable',
    desc_en: 'Pass norminette 5 times.',
    desc_fr: 'Passer norminette 5 fois sans erreur.',
    check: (s) => (s.norminetteClean || 0) >= 5 },

  { id: 'norminette_roasted', rarity: 'common', badge: '🌶',
    name_en: 'Norminette Roasted', name_fr: 'Norminette m\'a grillé',
    desc_en: 'Fail norminette at least once.',
    desc_fr: 'Échouer norminette au moins une fois.',
    check: (s) => ((s.norminetteRuns || 0) - (s.norminetteClean || 0)) >= 1 },

  { id: 'compliance_officer', rarity: 'common', badge: '📋',
    name_en: 'Compliance Officer', name_fr: 'Officier conformité',
    desc_en: 'Run the subject compliance check 5 times.',
    desc_fr: 'Lancer la vérification de conformité du sujet 5 fois.',
    check: (s) => (s.complianceRuns || 0) >= 5 },

  // ───── EXPLORATION ─────
  { id: 'bilingual', rarity: 'common', badge: '🌍',
    name_en: 'Bilingual', name_fr: 'Bilingue',
    desc_en: 'Switch language at least once.',
    desc_fr: 'Changer de langue au moins une fois.',
    check: (s) => (s.languageSwitches || 0) >= 1 },

  { id: 'identity_crisis', rarity: 'uncommon', badge: '🎭',
    name_en: 'Identity Crisis', name_fr: 'Crise d\'identité',
    desc_en: 'Change your name 3 times.',
    desc_fr: 'Changer de prénom 3 fois.',
    check: (s) => (s.nameChanges || 0) >= 3 },

  { id: 'settings_tinkerer', rarity: 'common', badge: '⚙',
    name_en: 'Settings Tinkerer', name_fr: 'Bricoleur des réglages',
    desc_en: 'Open Settings 10 times.',
    desc_fr: 'Ouvrir les réglages 10 fois.',
    check: (s) => (s.settingsOpens || 0) >= 10 },

  { id: 'patch_reader', rarity: 'common', badge: '📰',
    name_en: 'Patch Reader', name_fr: 'Lecteur de patch',
    desc_en: 'Open the patch notes section.',
    desc_fr: 'Ouvrir les notes de version.',
    check: (s) => (s.patchNotesOpens || 0) >= 1 },

  { id: 'changelog_addict', rarity: 'uncommon', badge: '📚',
    name_en: 'Changelog Addict', name_fr: 'Accro au changelog',
    desc_en: 'Open patch notes 10 times.',
    desc_fr: 'Ouvrir les notes de version 10 fois.',
    check: (s) => (s.patchNotesOpens || 0) >= 10 },

  { id: 'meta', rarity: 'common', badge: '🪞',
    name_en: 'Meta', name_fr: 'Méta',
    desc_en: 'Open the achievements menu.',
    desc_fr: 'Ouvrir le menu des succès.',
    check: (s) => (s.achievementsOpens || 0) >= 1 },

  // ───── FUN / RNG ─────
  { id: 'lucky_animation', rarity: 'uncommon', badge: '🎉',
    name_en: 'Surprise!', name_fr: 'Surprise !',
    desc_en: 'Trigger a lucky-day animation.',
    desc_fr: 'Déclencher une animation jour de chance.',
    check: (s) => (s.animationsTriggered || 0) >= 1 },

  { id: 'lucky_three', rarity: 'rare', badge: '🎊',
    name_en: 'Triple Confetti', name_fr: 'Triple confettis',
    desc_en: 'Trigger 3 lucky-day animations.',
    desc_fr: 'Déclencher 3 animations jour de chance.',
    check: (s) => (s.animationsTriggered || 0) >= 3 },

  { id: 'lucky_ten', rarity: 'epic', badge: '🎰',
    name_en: 'Jackpot Hands', name_fr: 'Mains de jackpot',
    desc_en: 'Trigger 10 lucky-day animations.',
    desc_fr: 'Déclencher 10 animations jour de chance.',
    check: (s) => (s.animationsTriggered || 0) >= 10 },

  { id: 'fact_finder', rarity: 'uncommon', badge: '🔎',
    name_en: 'Fact Finder', name_fr: 'Chasseur d\'anecdotes',
    desc_en: 'See 50 different fun facts.',
    desc_fr: 'Voir 50 anecdotes différentes.',
    check: (s) => Math.max(uniqueCount(s.factsSeenEn), uniqueCount(s.factsSeenFr)) >= 50 },

  { id: 'trivia_master', rarity: 'rare', badge: '🧠',
    name_en: 'Trivia Master', name_fr: 'Maître des anecdotes',
    desc_en: 'See 150 different fun facts.',
    desc_fr: 'Voir 150 anecdotes différentes.',
    check: (s) => Math.max(uniqueCount(s.factsSeenEn), uniqueCount(s.factsSeenFr)) >= 150 },

  { id: 'phrase_collector', rarity: 'uncommon', badge: '💬',
    name_en: 'Phrase Collector', name_fr: 'Collectionneur de répliques',
    desc_en: 'See 15 different one-liners.',
    desc_fr: 'Voir 15 répliques différentes.',
    check: (s) => Math.max(uniqueCount(s.phrasesSeenEn), uniqueCount(s.phrasesSeenFr)) >= 15 },

  { id: 'six_seven', rarity: 'rare', badge: '67',
    name_en: 'Six Seven', name_fr: 'Six Sept',
    desc_en: 'See "six seven" appear at launch.',
    desc_fr: 'Voir « six sept » apparaître au lancement.',
    check: (s, ctx) => ctx && ctx.event === 'phrase' && /six\s*(seven|sept)/i.test(ctx.text || '') },

  // ───── HIDDEN / SECRET ─────
  { id: 'forty_two_launches', rarity: 'epic', hidden: true, badge: '42',
    name_en: 'The Answer', name_fr: 'La Réponse',
    desc_en: 'Launch the CLI exactly 42 times.',
    desc_fr: 'Lancer le CLI exactement 42 fois.',
    check: (s) => (s.launches || 0) === 42 },

  { id: 'forty_two_funcs', rarity: 'epic', hidden: true, badge: '🧩',
    name_en: 'Meaning of Life', name_fr: 'Sens de la vie',
    desc_en: 'Test all 42 unique libft functions in your career.',
    desc_fr: 'Tester les 42 fonctions libft uniques dans votre carrière.',
    check: (s) => Object.keys(s.testedFunctions || {}).length >= 42 && (s.testRuns || 0) >= 42 },

  { id: 'four_forty_two', rarity: 'rare', hidden: true, badge: '⏰',
    name_en: 'At 4:42', name_fr: 'À 4 h 42',
    desc_en: 'Launch the CLI at 4:42 — AM or PM.',
    desc_fr: 'Lancer le CLI à 4 h 42 ou 16 h 42.',
    check: (s, ctx) => ctx && ctx.now && ctx.now.getMinutes() === 42 &&
      (ctx.now.getHours() === 4 || ctx.now.getHours() === 16) },

  { id: 'minute_42', rarity: 'uncommon', hidden: true, badge: '🕓',
    name_en: 'Minute 42', name_fr: 'Minute 42',
    desc_en: 'Launch on minute :42 of any hour.',
    desc_fr: 'Lancer à la minute :42 de n\'importe quelle heure.',
    check: (s, ctx) => ctx && ctx.now && ctx.now.getMinutes() === 42 },

  { id: 'point_42_percent', rarity: 'legendary', hidden: true, badge: '🌌',
    name_en: '0.42%!', name_fr: '0,42 % !',
    desc_en: 'Trigger the 0.42% rare event. The universe blinked at you.',
    desc_fr: 'Déclencher l\'événement 0,42 %. L\'univers vous a fait un clin d\'œil.',
    check: (s, ctx) => ctx && ctx.event === 'point42' },

  { id: 'true_believer', rarity: 'legendary', hidden: true, badge: '🪐',
    name_en: 'True Believer', name_fr: 'Vrai croyant',
    desc_en: 'Launch the CLI 100 days in a row.',
    desc_fr: 'Lancer le CLI 100 jours d\'affilée.',
    check: (s) => (s.consecutiveDays || 0) >= 100 },

  { id: 'come_back_kid', rarity: 'rare', hidden: true, badge: '🎈',
    name_en: 'Come Back Kid', name_fr: 'Le retour du fils prodigue',
    desc_en: 'Return after being away for 30 days.',
    desc_fr: 'Revenir après 30 jours d\'absence.',
    check: (s, ctx) => ctx && ctx.event === 'launch' && (ctx.daysAway || 0) >= 30 },

  { id: 'speedrunner', rarity: 'rare', hidden: true, badge: '⚡',
    name_en: 'Speedrunner', name_fr: 'Speedrunner',
    desc_en: 'Launch 5 times within 5 minutes.',
    desc_fr: 'Lancer 5 fois en 5 minutes.',
    check: (s) => (s.todayLaunches || 0) >= 5 },

  { id: 'unstoppable', rarity: 'epic', hidden: true, badge: '💎',
    name_en: 'Unstoppable', name_fr: 'Inarrêtable',
    desc_en: 'Test 100 different functions in your career.',
    desc_fr: 'Tester 100 fonctions différentes dans votre carrière.',
    check: (s) => Object.keys(s.testedFunctions || {}).length >= 100 },

  { id: 'norminette_god', rarity: 'epic', hidden: true, badge: '🛐',
    name_en: 'Norminette Devotee', name_fr: 'Adepte absolu de la norminette',
    desc_en: 'Pass norminette 50 times.',
    desc_fr: 'Passer norminette 50 fois sans erreur.',
    check: (s) => (s.norminetteClean || 0) >= 50 },

  { id: 'old_friend', rarity: 'legendary', hidden: true, badge: '🕯',
    name_en: 'Old Friend', name_fr: 'Vieil ami',
    desc_en: 'Launch the CLI on 365 different days.',
    desc_fr: 'Lancer le CLI sur 365 jours différents.',
    check: (s) => uniqueCount(s.launchDays) >= 365 },

  { id: 'completionist', rarity: 'legendary', hidden: true, badge: '🏆',
    name_en: 'Completionist', name_fr: 'Complétionniste',
    desc_en: 'Earn every other achievement.',
    desc_fr: 'Obtenir tous les autres succès.',
    check: () => false },
];

const TOTAL = ACHIEVEMENTS.length;

function nameOf(a) {
  return getLanguage() === 'fr' && a.name_fr ? a.name_fr : a.name_en;
}
function descOf(a) {
  return getLanguage() === 'fr' && a.desc_fr ? a.desc_fr : a.desc_en;
}

function paintRarity(rarity, text) {
  const fn = RARITY_COLORS[rarity] || c.gray;
  return fn(text);
}

function rarityLabel(rarity) {
  return t(`achievement.rarity.${rarity}`);
}

function unlockedSet(snapshot) {
  return new Set(snapshot.achievements || []);
}

function isCompletionist(snapshot) {
  const earned = unlockedSet(snapshot);
  for (const a of ACHIEVEMENTS) {
    if (a.id === 'completionist') continue;
    if (!earned.has(a.id)) return false;
  }
  return true;
}

function evaluate(ctx = {}) {
  const snap = stats.snapshot();
  const earned = unlockedSet(snap);
  const newly = [];
  for (const a of ACHIEVEMENTS) {
    if (earned.has(a.id)) continue;
    let ok = false;
    try { ok = !!a.check(snap, ctx); } catch { ok = false; }
    if (ok) {
      stats.unlockAchievement(a.id);
      newly.push(a);
      earned.add(a.id);
    }
  }
  // Completionist: special-case after others.
  if (!earned.has('completionist') && isCompletionist(snap)) {
    stats.unlockAchievement('completionist');
    newly.push(ACHIEVEMENTS.find((a) => a.id === 'completionist'));
  }
  return newly;
}

function printToast(a) {
  const rarity = paintRarity(a.rarity, rarityLabel(a.rarity).toUpperCase());
  console.log();
  console.log(
    `  ${c.yellow('🏆')} ${c.bold(c.yellow(t('achievement.unlocked')))} ` +
    `${a.badge}  ${c.bold(nameOf(a))}  ${c.dim('—')} ${c.dim(rarity)}`
  );
  console.log(`     ${c.dim(descOf(a))}`);
  console.log();
}

function announceNew(newly) {
  for (const a of newly) printToast(a);
}

module.exports = {
  ACHIEVEMENTS, TOTAL, RARITY_ORDER, RARITY_COLORS,
  evaluate, announceNew, printToast,
  nameOf, descOf, paintRarity, rarityLabel, unlockedSet,
  EASY_FUNCTIONS, HARD_FUNCTIONS,
};
