'use strict';

// Newest first. When you bump package.json, prepend a new entry here.
// `notes_en` is required; `notes_fr` is shown when the user's language is FR
// and falls back to `notes_en` if missing.
module.exports = [
  {
    version: '0.1.9',
    date: '2026-04-29',
    notes_en: [
      'You can now pick any menu option by typing its hotkey — `1` to `9` for the first nine items, then `q w e r t y u i o p` for items 10 and beyond. `0` always goes back. Arrows + Enter still work; this is just a faster path for users who know the menu.',
      '"What\'s new" now renders oldest→newest so the latest release sits at the bottom of the screen, right above the prompt — no more scrolling up to see what just changed.',
    ],
    notes_fr: [
      'Vous pouvez maintenant choisir n\'importe quelle option en tapant son raccourci — `1` à `9` pour les neuf premiers items, puis `q w e r t y u i o p` au-delà. `0` revient toujours en arrière. Les flèches + Entrée fonctionnent toujours ; c\'est juste plus rapide pour qui connaît le menu.',
      '« Quoi de neuf » s\'affiche désormais de l\'ancien au plus récent : la dernière version se retrouve en bas de l\'écran, juste au-dessus du prompt — plus besoin de remonter pour voir ce qui vient de changer.',
    ],
  },
  {
    version: '0.1.8',
    date: '2026-04-29',
    notes_en: [
      'Patch notes are caught up — the "What\'s new" screen now shows entries for 0.1.5, 0.1.6 and 0.1.7 (README italic check, AddressSanitizer instrumentation, and the `.o` / `.a` build-artifact check). They had shipped silently; scroll down to read what you missed.',
    ],
    notes_fr: [
      'Notes de version à jour — l\'écran « Quoi de neuf » affiche maintenant les entrées 0.1.5, 0.1.6 et 0.1.7 (contrôle italique du README, instrumentation AddressSanitizer, contrôle des fichiers `.o` / `.a`). Elles avaient été livrées silencieusement ; faites défiler pour voir ce qui vous a échappé.',
    ],
  },
  {
    version: '0.1.7',
    date: '2026-04-29',
    notes_en: [
      'Subject compliance now flags `.o` and `.a` build artifacts at the submission root with a clear "run `make fclean` before submitting" hint — previously these were silently ignored even though they shouldn\'t be pushed.',
    ],
    notes_fr: [
      'La vérification de conformité signale maintenant les fichiers `.o` et `.a` à la racine du rendu avec un message clair : « lancez `make fclean` avant de rendre » — ils étaient silencieusement ignorés alors qu\'ils ne doivent pas être poussés.',
    ],
  },
  {
    version: '0.1.6',
    date: '2026-04-29',
    notes_en: [
      'The libft tester now compiles your code under AddressSanitizer. Memory bugs (heap-buffer-overflow, use-after-free, off-by-one writes) surface as a clear file:line diagnostic instead of silently passing on macOS or producing misleading "wrong content" failures on Linux.',
      'New "memory error" banner in the test summary pulls the violation type and source location out of the ASan report so you can jump straight to the bug.',
    ],
    notes_fr: [
      'Le testeur libft compile désormais votre code sous AddressSanitizer. Les erreurs mémoire (heap-buffer-overflow, use-after-free, écritures off-by-one) apparaissent avec un fichier:ligne précis au lieu de passer silencieusement sur macOS ou de produire des échecs trompeurs « contenu incorrect » sur Linux.',
      'Nouvelle bannière « erreur mémoire » dans le résumé : le type de violation et l\'emplacement source sont extraits du rapport ASan pour aller droit au bug.',
    ],
  },
  {
    version: '0.1.5',
    date: '2026-04-28',
    notes_en: [
      'Subject compliance now checks that the first paragraph of your README (the student presentation) is in italic — wrap it in `*…*` or `_…_` to pass. Plain or bold intros are flagged.',
    ],
    notes_fr: [
      'La vérification de conformité contrôle maintenant que le premier paragraphe du README (la présentation de l\'étudiant) est en italique — entourez-le de `*…*` ou `_…_` pour passer. Les introductions en texte brut ou en gras sont signalées.',
    ],
  },
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
