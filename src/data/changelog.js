'use strict';

// Newest first. When you bump package.json, prepend a new entry here.
// `notes_en` is required; `notes_fr` is shown when the user's language is FR
// and falls back to `notes_en` if missing.
module.exports = [
  {
    version: '0.2.2',
    date: '2026-04-30',
    notes_en: [
      'New ft_printf test mode: "Run all tests (also link libft.a)". Useful when your `libftprintf.a` doesn\'t bundle libft yet — the tester now also links a separate `libft.a` so you can iterate on your printf logic without first fixing your Makefile. Auto-detects `<project>/libft/`, otherwise prompts for a path.',
      'The existing "Run all tests" mode is now labeled "(libftprintf.a only — strict, eval-style)" and remains the eval simulation: it links only `libftprintf.a`, exactly like Deepthought/moulinette does. If your archive isn\'t self-contained, it fails here — and it would fail the moulinette too.',
      'The "with libft" mode shows a yellow warning before AND after the run, explaining that linking libft separately is NOT how the moulinette tests you, and walking through the exact 3 steps to make your `libftprintf.a` self-contained: keep libft in `<project>/libft/`, add the `ar rcs` merge in your Makefile (full snippet shown), then re-run strict mode to confirm eval-readiness.',
      'Tester Makefile gained a `LIBFT_LINK_PATH` knob that drives the new mode — when set it builds the companion libft with the same ASan CFLAGS and appends `-L<path> -lft` to LDFLAGS. When unset, behavior is unchanged: strict, libftprintf.a-only, eval-style.',
    ],
    notes_fr: [
      'Nouveau mode de test ft_printf : « Lancer tous les tests (lier aussi libft.a) ». Pratique quand votre `libftprintf.a` ne contient pas encore libft — le testeur lie aussi un `libft.a` séparé pour itérer sur votre logique printf sans d\'abord corriger votre Makefile. Détection automatique de `<projet>/libft/`, sinon demande le chemin.',
      'Le mode existant « Lancer tous les tests » est désormais étiqueté « (libftprintf.a seul — strict, façon éval) » et reste la simulation d\'éval : il ne lie que `libftprintf.a`, exactement comme Deepthought/la moulinette. Si votre archive n\'est pas autonome, ça échoue ici — et ça échouerait à la moulinette aussi.',
      'Le mode « avec libft » affiche un avertissement jaune avant ET après le run, qui explique que lier libft séparément n\'est PAS la façon dont la moulinette vous teste, et qui détaille les 3 étapes pour rendre votre `libftprintf.a` autonome : gardez libft dans `<projet>/libft/`, ajoutez la fusion `ar rcs` dans votre Makefile (extrait complet affiché), puis relancez le mode strict pour confirmer que vous êtes prêt pour l\'éval.',
      'Le Makefile du testeur gagne un paramètre `LIBFT_LINK_PATH` qui pilote le nouveau mode — quand il est défini, il compile la libft compagnon avec les mêmes CFLAGS ASan et ajoute `-L<chemin> -lft` aux LDFLAGS. Sans ce paramètre, le comportement est inchangé : strict, libftprintf.a seul, façon éval.',
    ],
  },
  {
    version: '0.2.1',
    date: '2026-04-29',
    notes_en: [
      'ft_printf is live — pick it from the Common Core menu to run the full tester, norminette, or subject-compliance check on your project. The "coming soon" tag on ft_printf is gone.',
      'The ft_printf tester covers every conversion the subject mandates (`cspdiuxX%`) plus mixed formats and edge cases — NULL string, NULL pointer, INT_MIN/MAX, UINT_MAX, `%c` of `\\0`, empty format, and more. 11 groups, 82+ assertions.',
      'Each test compares ft_printf byte-for-byte against the libc `printf` (via `snprintf`) AND verifies the return value equals the bytes actually written — output capture goes through a `pipe`+`dup2` so the assertion sees exactly what would have hit the terminal.',
      'Compiled under AddressSanitizer like the libft tester, so memory bugs in your ft_printf surface as a clear file:line ASan diagnostic instead of slipping through as "wrong content". Crashes (SIGSEGV/SIGBUS/SIGABRT) are caught and reported as CRASH; the run continues to the next group.',
      'New ft_printf subject-compliance check covers the README rules from page 7 of the subject — italicized first line containing "This activity has been created as part of the 42 curriculum by <login>", plus required Description / Instructions / Resources sections. Same `make -q`-based no-relink check and diagnostic hints as the libft check.',
      'The CLI now responds to both `42` and `42cli` — same binary, just whichever name your fingers reach for. `npm install -g` registers both, and the curl installer creates both symlinks. On existing installations, run `42 update` once and the `42cli` alias appears alongside.',
    ],
    notes_fr: [
      'ft_printf est disponible — choisissez-le dans le menu Common Core pour lancer le testeur complet, la norminette ou le contrôle de conformité au sujet sur votre projet. L\'étiquette « à venir » sur ft_printf disparaît.',
      'Le testeur ft_printf couvre toutes les conversions exigées par le sujet (`cspdiuxX%`), plus les formats mixtes et les cas limites — chaîne NULL, pointeur NULL, INT_MIN/MAX, UINT_MAX, `%c` de `\\0`, format vide, et plus encore. 11 groupes, 82+ assertions.',
      'Chaque test compare ft_printf octet par octet au `printf` de la libc (via `snprintf`) ET vérifie que la valeur de retour correspond aux octets réellement écrits — la sortie passe par un `pipe`+`dup2` pour que l\'assertion voie exactement ce qui aurait atteint le terminal.',
      'Compilé sous AddressSanitizer comme le testeur libft, donc les erreurs mémoire dans votre ft_printf apparaissent avec un diagnostic ASan fichier:ligne précis au lieu de passer pour un « contenu incorrect ». Les crashs (SIGSEGV/SIGBUS/SIGABRT) sont attrapés et signalés CRASH ; le run continue avec le groupe suivant.',
      'Nouveau contrôle de conformité ft_printf : règles README de la page 7 du sujet — première ligne en italique contenant « This activity has been created as part of the 42 curriculum by <login> », plus les sections obligatoires Description / Instructions / Resources. Mêmes contrôles `make -q` (anti-relink) et messages de diagnostic que pour libft.',
      'Le CLI répond maintenant à `42` comme à `42cli` — même binaire, à vous de choisir. `npm install -g` enregistre les deux, et l\'installeur curl crée les deux symlinks. Sur une installation existante, lancez `42 update` une fois et l\'alias `42cli` apparaît à côté.',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-04-29',
    notes_en: [
      'New `Contributors` section in the main menu — credits the folks (Yoann Pirot, Eliott Ruffin, Carole Vingert, Mikail Bennis, Paul Léon Camille Guermonprez) who helped shape this CLI by reporting bugs, suggesting changes, or sharing ideas. New names will be added as they help.',
      '`ft_strnstr` now has a moulinette-grade segfault test: an mmap\'d guard page is placed right after the haystack so any implementation that scans past the NUL when `len > strlen(big)` crashes here exactly like it would in moulinette. Caught as a clear `CRASH SIGSEGV` instead of slipping through.',
      'The `Makefile does not relink` check now uses `make -q` (the canonical "is anything out-of-date?" query) instead of grepping the second `make`\'s stdout for `cc`/`gcc`/`ar`. No more false positives when your Makefile prints helpful echo lines like `"Compiling … with cc"`.',
      'When the relink check does fail, the message now shows the offending recipe line plus a likely cause — `$(NAME)` in `.PHONY`, missing `$(OBJS)` prerequisites, dependency on a phony target like `all`/`clean`, or the `FORCE` trick — so you know what to fix instead of guessing.',
      'Every libft test run (and the relink check) now starts with `make fclean` so stale `.o` files from a previous build can\'t mask or fake errors. Different CFLAGS, a header that has since changed, ASan flipped on/off — none of that can sneak through a stale link anymore.',
    ],
    notes_fr: [
      'Nouvelle section « Contributeurs » dans le menu principal — elle crédite celles et ceux (Yoann Pirot, Eliott Ruffin, Carole Vingert, Mikail Bennis, Paul Léon Camille Guermonprez) qui ont aidé ce CLI en signalant des bugs, suggérant des changements ou partageant des idées. De nouveaux noms s\'ajouteront au fil des contributions.',
      '`ft_strnstr` a désormais un test de segfault niveau moulinette : une page de garde mmap\'ée est placée juste après le haystack, donc toute implémentation qui dépasse le NUL quand `len > strlen(big)` plante exactement comme à la moulinette. Détecté clairement comme `CRASH SIGSEGV` au lieu de passer entre les mailles.',
      'Le contrôle « Makefile ne reliera pas » utilise maintenant `make -q` (la requête canonique « quelque chose est-il à recompiler ? ») au lieu de chercher `cc`/`gcc`/`ar` dans la sortie du deuxième `make`. Fini les faux positifs quand votre Makefile affiche des lignes utiles comme « Compilation … avec cc ».',
      'Quand le contrôle de relink échoue vraiment, le message affiche désormais la ligne de recette fautive et une cause probable — `$(NAME)` dans `.PHONY`, prérequis `$(OBJS)` manquants, dépendance sur une cible phony comme `all`/`clean`, ou l\'astuce `FORCE` — pour savoir quoi corriger au lieu de deviner.',
      'Chaque lancement du testeur libft (et le contrôle de relink) commence maintenant par `make fclean` pour qu\'aucun `.o` obsolète d\'un build précédent ne puisse masquer ou simuler des erreurs. Des CFLAGS différents, un header modifié depuis, ASan activé/désactivé — plus rien ne passe via un lien obsolète.',
    ],
  },
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
