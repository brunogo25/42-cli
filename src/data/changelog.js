'use strict';

// Newest first. When you bump package.json, prepend a new entry here.
// `notes_en` is required; `notes_fr` is shown when the user's language is FR
// and falls back to `notes_en` if missing.
module.exports = [
  {
    version: '0.1.4',
    date: '2026-04-28',
    notes_en: [
      'Achievements! 60+ unlockable badges across common, uncommon, rare, epic, legendary, and secret tiers.',
      'New "Achievements" section in the main menu lets you browse what you\'ve earned and what\'s left to chase. Hidden achievements stay locked until obtained.',
      'Added a 0.42% rare event with a coolest-of-the-cool ASCII animation — trigger it once and you unlock a hidden secret achievement.',
      'Achievements unlock with a toast right where you are: launching, testing, running norminette, switching language, opening menus.',
      'New stats are tracked locally only (launches, streaks, tests run, functions tested, norminette runs, etc.) — never leaves your machine.',
    ],
    notes_fr: [
      'Succès ! Plus de 60 badges à débloquer, des plus communs aux secrets légendaires.',
      'Nouvelle section « Succès » dans le menu principal pour parcourir ce que vous avez débloqué et ce qu\'il reste à chasser. Les succès cachés ne se révèlent qu\'une fois obtenus.',
      'Ajout d\'un événement 0,42 % avec une animation ASCII très, très cool — déclenchez-le une seule fois et vous débloquez un succès secret.',
      'Les succès se débloquent avec une notification là où vous êtes : au lancement, pendant les tests, la norminette, le changement de langue, l\'ouverture des menus.',
      'Nouvelles statistiques suivies en local uniquement (lancements, séries, tests, fonctions, norminette…) — rien ne quitte votre machine.',
    ],
  },
  {
    version: '0.1.3',
    date: '2026-04-28',
    notes_en: [
      'Added a "What\'s new" section so you can see exactly what changed in every release.',
      'After updating, the patch notes for the new version are shown automatically the next time you launch.',
    ],
    notes_fr: [
      'Ajout d\'une section « Quoi de neuf » pour voir précisément ce qui change à chaque version.',
      'Après une mise à jour, les notes de la nouvelle version s\'affichent automatiquement au lancement suivant.',
    ],
  },
  {
    version: '0.1.2',
    date: '2026-04-28',
    notes_en: [
      'Removed the "vibe of the day" framing — funny one-liners now read as quiet aphorisms instead of an announcement.',
    ],
    notes_fr: [
      'Suppression de l\'étiquette « vibe du jour » — les répliques apparaissent maintenant comme de petits aphorismes.',
    ],
  },
  {
    version: '0.1.1',
    date: '2026-04-28',
    notes_en: [
      'Update check now runs fresh on every launch — no more 12-hour cache hiding new releases from your friends.',
      'Update status (up to date / available / offline) is shown prominently right under the banner.',
      'Added 180+ fun facts and one-liners that appear after the Hello line, with rare ASCII animations on lucky launches.',
      'First-run name prompt: the CLI now greets and farewells you by name.',
      'Removed "Check for updates" from Settings — it runs automatically on every launch.',
    ],
    notes_fr: [
      'La vérification des mises à jour s\'exécute à chaque lancement — fini le cache de 12 h qui masquait les nouveautés à vos amis.',
      'L\'état des mises à jour (à jour / disponible / hors ligne) s\'affiche clairement sous la bannière.',
      'Plus de 180 anecdotes et répliques apparaissent après le « Bonjour », avec des animations ASCII rares les jours de chance.',
      'Saisie du prénom au premier lancement : le CLI vous salue et vous dit au revoir par votre nom.',
      'Retiré « Vérifier les mises à jour » des Réglages — ça se fait à chaque lancement.',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-04-25',
    notes_en: ['Initial release.'],
    notes_fr: ['Version initiale.'],
  },
];
