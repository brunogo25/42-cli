'use strict';

// Newest first. When you bump package.json, prepend a new entry here.
// `notes_en` is required; `notes_fr` is shown when the user's language is FR
// and falls back to `notes_en` if missing.
module.exports = [
  {
    version: '0.5.1',
    date: '2026-07-20',
    notes_en: [
      'Python exams can now be practised **by difficulty** — Easy (6), Medium (9) and Advanced (6) — not just by rank. Picking a band pools the matching exercises from both Rank 03 and Rank 04.',
      'A difficulty drill walks **every** exercise in its band, while the Rank 03 / Rank 04 entries keep taking one exercise per level, which is the shape of a real exam sitting.',
      'The exam picker now shows how many exercises each entry holds.',
    ],
    notes_fr: [
      'Les examens Python se pratiquent désormais **par difficulté** — Facile (6), Moyen (9) et Avancé (6) — et plus seulement par rank. Choisir un niveau regroupe les exercices correspondants des Rank 03 et Rank 04.',
      'Un entraînement par difficulté parcourt **tous** les exercices de son niveau, tandis que les entrées Rank 03 / Rank 04 gardent un exercice par palier, la forme d\'un vrai examen.',
      'Le sélecteur d\'examen affiche maintenant le nombre d\'exercices de chaque entrée.',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-07-20',
    notes_en: [
      '**Practice an exam** is now on the main menu — no more digging through Modules to find it. Exams are grouped under their module so you can tell at a glance which one each belongs to.',
      'New **exam simulator**: one exercise at a time in a folder on your Desktop, type `grademe` to submit, and the next one unlocks only once you pass. A failed attempt shows you the exact case that broke — and unlike the real exam, there is no retry timer.',
      'The Python exams now use the **real Rank 03 and Rank 04 subjects** (21 exercises), graded against the function signature the subject specifies, with hidden test cases beyond the printed examples.',
      'Forbidden functions are enforced — using `sorted()` where the subject bans it now fails the exercise, like it would at 42.',
    ],
    notes_fr: [
      '**Passer un examen** est désormais dans le menu principal — plus besoin de fouiller dans Modules. Les examens sont regroupés par module pour voir d\'un coup d\'œil à qui appartient chacun.',
      'Nouveau **simulateur d\'examen** : un exercice à la fois dans un dossier sur ton Bureau, tape `grademe` pour rendre, et le suivant ne se débloque qu\'une fois réussi. Un échec te montre le cas exact qui a cassé — et contrairement au vrai examen, sans minuteur.',
      'Les examens Python utilisent maintenant les **vrais sujets Rank 03 et Rank 04** (21 exercices), corrigés selon la signature de fonction du sujet, avec des tests cachés en plus des exemples.',
      'Les fonctions interdites sont vérifiées — utiliser `sorted()` là où le sujet l\'interdit fait échouer l\'exercice, comme à 42.',
    ],
  },
  {
    version: '0.4.3',
    date: '2026-06-25',
    notes_en: [
      'Contributors list now shows **Milan Rubinsztejn** in full, with his 42 login (`mirubins`).',
    ],
    notes_fr: [
      'La liste des Contributeurs affiche désormais **Milan Rubinsztejn** au complet, avec son login 42 (`mirubins`).',
    ],
  },
  {
    version: '0.4.2',
    date: '2026-06-25',
    notes_en: [
      'Credited **Milan** in the Contributors list for helping with many things.',
    ],
    notes_fr: [
      'Ajout de **Milan** dans la liste des Contributeurs pour son aide sur de nombreux aspects.',
    ],
  },
  {
    version: '0.4.1',
    date: '2026-06-25',
    notes_en: [
      'Credited **diadjaff** in the Contributors list for flagging the **vowel_count** and **anagram** case-sensitivity tests in Exam Practice. Following that report — and questions about whether the Python release had knocked anything loose — the testers were re-verified end to end: the **libft fd-print tests** (`ft_putchar_fd`, `ft_putstr_fd`, `ft_putendl_fd`, `ft_putnbr_fd`) still pass every case, and the second test of both **vowel_count** (`AEIOUaeiou → 10`) and **anagram** (`Dormitory` vs `DirtyRoom → True`) correctly passes a correct solution and correctly rejects a case-broken one. No regression was found; the C tester was never touched by the Python work.',
    ],
    notes_fr: [
      'Ajout de **diadjaff** dans la liste des Contributeurs pour avoir signalé les tests de sensibilité à la casse de **vowel_count** et **anagram** dans l\'Exam Practice. Suite à ce signalement — et aux doutes sur un éventuel dégât causé par la sortie Python — les testeurs ont été re-vérifiés de bout en bout : les **tests d\'affichage fd de la libft** (`ft_putchar_fd`, `ft_putstr_fd`, `ft_putendl_fd`, `ft_putnbr_fd`) passent toujours tous les cas, et le second test de **vowel_count** (`AEIOUaeiou → 10`) comme d\'**anagram** (`Dormitory` vs `DirtyRoom → True`) valide bien une solution correcte et rejette bien une solution insensible à la casse erronée. Aucune régression trouvée ; le testeur C n\'a jamais été modifié par les travaux Python.',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-06-03',
    notes_en: [
      'The home screen is now a **module navigator**. The old "Common Core / Python Piscine" split is gone — press ← / → to move between cursus modules along the top tab bar, ↑ / ↓ to pick a submodule, Enter to open it. **Programming Fundamentals** groups libft, ft_printf, get_next_line and push_swap; **Object Oriented Programming** groups the seven Python projects. The locked modules (Sys Admin, Algorithmics, AI, System & Network Programming, Web) are shown greyed out. Achievements, Settings, Contributors and the rest stay in the main menu.',
      '**push_swap is live.** New tester in the Programming Fundamentals module: it compiles your project with `make`, then acts as its own checker — it replays your operation stream on a simulated pair of stacks and verifies stack a ends sorted ascending with b empty, so you do not need `checker_linux`. It validates error handling (`Error` on stderr for non-integers, duplicates and INT overflow), the no-argument case, the four strategy selectors (`--simple` / `--medium` / `--complex` / `--adaptive`), the `--bench` output, and counts operations against the subject\'s performance targets (100 numbers < 2000 ops, 500 < 12000, with good / excellent tiers). Norminette is available on it too.',
      'New **Exam Practice** in each module — sit the exam under real conditions. Choose how many exercises (1–5) and the difficulty: ascending (easy → hard) or a fixed level (1–4). The CLI picks random exercises, scaffolds a fresh `exam-…/` folder with one subject per exercise, and grades each: C solutions (Programming Fundamentals) are compiled with `-Wall -Wextra -Werror` and run against hidden cases; Python solutions (OOP) are executed and checked, and you can run **flake8** and **mypy** on them. Ships with 24 exercises spread across the four difficulty levels.',
      'New **Feedback** entry in the main menu. Hit a bug, or did the tester say PASS but you failed the moulinette / a peer review? Send it straight to the maintainer without leaving the terminal — pick a category, write your message, and it is delivered by email (your name and 42 login travel with it). Anyone who sends feedback is credited locally in the Contributors list. New achievements: **Speak Up**, **Bug Reporter** and **Voice of the Community**.',
      'New **galaxy** banner — the launch screen now opens on a spiral galaxy next to the 42 wordmark. It sits side-by-side on wide terminals and stacks neatly on narrow ones.',
    ],
    notes_fr: [
      'L\'écran d\'accueil est désormais un **navigateur de modules**. Le découpage « Common Core / Piscine Python » disparaît — appuyez sur ← / → pour passer d\'un module du cursus à l\'autre via la barre d\'onglets du haut, ↑ / ↓ pour choisir un sous-module, Entrée pour l\'ouvrir. **Programming Fundamentals** regroupe libft, ft_printf, get_next_line et push_swap ; **Object Oriented Programming** regroupe les sept projets Python. Les modules verrouillés (Sys Admin, Algorithmique, IA, System & Network Programming, Web) sont affichés en grisé. Succès, Réglages, Contributeurs et le reste restent dans le menu principal.',
      '**push_swap est disponible.** Nouveau testeur dans le module Programming Fundamentals : il compile votre projet avec `make`, puis joue le rôle de checker — il rejoue votre flux d\'opérations sur une paire de piles simulées et vérifie que la pile a finit triée en ordre croissant avec b vide, sans avoir besoin de `checker_linux`. Il vérifie la gestion des erreurs (`Error` sur stderr pour non-entiers, doublons et dépassement INT), le cas sans argument, les quatre sélecteurs de stratégie (`--simple` / `--medium` / `--complex` / `--adaptive`), la sortie `--bench`, et compte les opérations face aux objectifs de performance du sujet (100 nombres < 2000 ops, 500 < 12000, avec paliers good / excellent). La norminette est aussi disponible.',
      'Nouveau **Exam Practice** dans chaque module — passez l\'examen en conditions réelles. Choisissez le nombre d\'exercices (1–5) et la difficulté : croissante (facile → difficile) ou niveau fixe (1–4). Le CLI tire des exercices au hasard, crée un dossier `exam-…/` neuf avec un sujet par exercice, et corrige chacun : les solutions C (Programming Fundamentals) sont compilées avec `-Wall -Wextra -Werror` et lancées sur des cas cachés ; les solutions Python (OOP) sont exécutées et vérifiées, et vous pouvez lancer **flake8** et **mypy** dessus. Livré avec 24 exercices répartis sur les quatre niveaux de difficulté.',
      'Nouvelle entrée **Retour** dans le menu principal. Un bug, ou le testeur a dit PASS mais vous avez échoué la moulinette / une correction ? Envoyez-le directement au mainteneur sans quitter le terminal — choisissez une catégorie, écrivez votre message, et il est livré par e-mail (votre nom et votre login 42 l\'accompagnent). Toute personne qui envoie un retour est créditée localement dans la liste des Contributeurs. Nouveaux succès : **Prends la parole**, **Chasseur de bugs** et **Voix de la communauté**.',
      'Nouvelle bannière **galaxie** — l\'écran de lancement s\'ouvre désormais sur une galaxie spirale à côté du logo 42. Elle s\'affiche côte à côte sur les terminaux larges et s\'empile proprement sur les étroits.',
    ],
  },
  {
    version: '0.3.1',
    date: '2026-06-03',
    notes_en: [
      'Python Piscine testers no longer leave files behind in your project. A handful of exercises (the file-ops and exception modules) are tested by writing small fixture files next to your script and running it the way the subject demonstrates — but in the default "run in place" mode those fixtures were written into your own directory and never cleaned up, leaving stray files in your repo after a run (and silently overwriting a real file of yours if it happened to share the name). The tester now removes every fixture it creates once the test finishes, and only ever deletes files it actually wrote — any file that already existed before the run is left exactly as it was.',
    ],
    notes_fr: [
      'Les testeurs de la Piscine Python ne laissent plus de fichiers dans votre projet. Quelques exercices (les modules fichiers et exceptions) sont testés en écrivant de petits fichiers de fixture à côté de votre script puis en le lançant comme le montre le sujet — mais en mode « exécution sur place » (par défaut) ces fixtures étaient écrites dans votre propre dossier et jamais supprimées, laissant des fichiers parasites dans votre dépôt après un run (et écrasant silencieusement un de vos vrais fichiers s\'il portait le même nom). Le testeur supprime désormais chaque fixture qu\'il crée une fois le test terminé, et ne supprime que les fichiers qu\'il a réellement écrits — tout fichier déjà présent avant le run est laissé intact.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-06-02',
    notes_en: [
      'New **Python Piscine** menu — testers for all seven Python data-engineering modules, run the same way as the C testers (point at the project root, run all tests or a single exercise, then flake8 / mypy). Covered: **Growing Code** (function I/O), **Garden Guardian** (exceptions), **Data Quest** (collections), **Code Cultivation** (OOP), **Code Nexus** (polymorphism/ABCs), **The Codex** (imports) and **Data Archivist** (file ops). Each exercise is checked against the behaviour its subject pins down: deterministic exercises (argv/stdin → output) are matched exactly, while the modules whose output the subject leaves to you (Code Cultivation, Code Nexus) and the random ones (Data Quest ex3/5/6) are smoke-checked — runs cleanly + emits the required structure. flake8 is the style gate (the Python "norminette") and mypy checks the typed exercises. Needs Python 3.10+ on your PATH; flake8/mypy are skipped with a hint if not installed.',
    ],
    notes_fr: [
      'Nouveau menu **Piscine Python** — des testeurs pour les sept modules Python de data engineering, utilisés comme les testeurs C (pointez la racine du projet, lancez tous les tests ou un seul exercice, puis flake8 / mypy). Couverts : **Growing Code** (E/S de fonctions), **Garden Guardian** (exceptions), **Data Quest** (collections), **Code Cultivation** (POO), **Code Nexus** (polymorphisme/ABC), **The Codex** (imports) et **Data Archivist** (fichiers). Chaque exercice est vérifié selon ce que son sujet fixe : les exercices déterministes (argv/stdin → sortie) sont comparés exactement, tandis que les modules dont le sujet vous laisse la sortie (Code Cultivation, Code Nexus) et les exercices aléatoires (Data Quest ex3/5/6) sont vérifiés en « smoke test » — s\'exécute sans planter + produit la structure attendue. flake8 sert de garde de style (la « norminette » Python) et mypy vérifie les exercices typés. Nécessite Python 3.10+ dans votre PATH ; flake8/mypy sont ignorés avec une astuce s\'ils ne sont pas installés.',
    ],
  },
  {
    version: '0.2.7',
    date: '2026-05-08',
    notes_en: [
      'ft_printf tester now checks `ft_printf(NULL)` — calling ft_printf with **the format string itself** being NULL (not `%s` with a NULL argument, which was already covered in the `%s` group). The C standard leaves this undefined and glibc\'s printf segfaults on Linux, but the moulinette is known to grade implementations on this edge case and silent segfaults here have cost people their evaluation. The new "NULL format" group asserts that ft_printf must not crash and must return a non-positive value (typically `-1`); if your ft_printf does segfault, the existing crash handler catches it and reports `CRASH` instead of taking the whole run down with it.',
    ],
    notes_fr: [
      'Le testeur ft_printf vérifie maintenant `ft_printf(NULL)` — appel de ft_printf avec **le format string lui-même** à NULL (pas `%s` avec un argument NULL, qui était déjà couvert dans le groupe `%s`). Le standard C laisse ce cas indéfini et le printf de la glibc segfaulte sous Linux, mais la moulinette est connue pour évaluer ce cas limite et un segfault silencieux ici a déjà coûté l\'éval à plusieurs personnes. Le nouveau groupe « NULL format » exige que ft_printf ne crashe pas et renvoie une valeur ≤ 0 (typiquement `-1`) ; si votre ft_printf segfaulte, le gestionnaire de crash existant l\'attrape et affiche `CRASH` au lieu de faire tomber tout le run avec lui.',
    ],
  },
  {
    version: '0.2.6',
    date: '2026-05-05',
    notes_en: [
      'Picking a bonus list function on its own ("Test specific functions…") now warns up front when `ft_lstnew` is missing from the selection. The list-test fixtures (`build3` in tester.c, plus the direct calls in `lstadd_front` / `lstadd_back` / `lstdelone`) all need `ft_lstnew` to actually produce a list — when `HAVE_FT_lstnew` isn\'t defined, `build3` quietly returns NULL and the only assertion that passes is the `ft_lstsize(NULL) == 0` one, leaving the user staring at "1 / 2 passed" with no clue why. The runner now prints a yellow warning naming each affected target and tells you to add `ft_lstnew` before the build starts. Affects `ft_lstadd_front`, `ft_lstsize`, `ft_lstlast`, `ft_lstadd_back`, `ft_lstdelone`, `ft_lstclear`, `ft_lstiter`, `ft_lstmap`. (Thanks Yanis Trabelsi / @ytrabels for spotting the silent-failure mode.)',
    ],
    notes_fr: [
      'Tester une fonction de liste bonus toute seule (« Tester des fonctions précises… ») affiche désormais un avertissement clair quand `ft_lstnew` n\'est pas dans la sélection. Les fixtures des tests de liste (`build3` dans tester.c, plus les appels directs dans `lstadd_front` / `lstadd_back` / `lstdelone`) ont besoin de `ft_lstnew` pour réellement construire une liste — quand `HAVE_FT_lstnew` n\'est pas défini, `build3` renvoie silencieusement NULL et la seule assertion qui passe est le `ft_lstsize(NULL) == 0`, laissant l\'utilisateur face à un « 1 / 2 passed » incompréhensible. Le runner imprime maintenant un avertissement jaune nommant chaque cible concernée et demande d\'ajouter `ft_lstnew` avant la compilation. Concerne `ft_lstadd_front`, `ft_lstsize`, `ft_lstlast`, `ft_lstadd_back`, `ft_lstdelone`, `ft_lstclear`, `ft_lstiter`, `ft_lstmap`. (Merci Yanis Trabelsi / @ytrabels d\'avoir identifié ce mode d\'échec silencieux.)',
    ],
  },
  {
    version: '0.2.5',
    date: '2026-05-04',
    notes_en: [
      'Per-function tests no longer get blocked by an unrelated broken prototype. Until now the standalone runner defined `HAVE_FT_<fn>` for every `ft_*.c` it could compile, which activated every matching test body. So if you asked for `ft_itoa` and your `libft.h` declared, say, `ft_strmapi` with the wrong return type (`char` instead of `char *`), the tester compile would explode on `test_strmapi` — a function nobody asked about. The runner now only defines `HAVE_FT_<fn>` for the functions you actually targeted; other `ft_*.c` files still link (so cross-file helpers like `ft_strjoin` → `ft_strlen` resolve), but their test bodies stay gated out.',
      'New hint when a wrong prototype is the cause: instead of the misleading "linking failed" message, the build-error summary now says "your libft.h declares one of the targeted functions with the wrong signature — check the return type and parameter list against the subject" when the compiler output points at a tester.c type mismatch.',
      'The "Test specific functions…" prompt now leads with the `ft_` prefix and a concrete example (`ft_itoa, ft_split`). The function catalog header calls out "always with the ft_ prefix", and the unknown-function error suggests the prefix explicitly. The parser still tolerates bare names so older muscle memory keeps working — the UI just stops pretending both forms are equally canonical.',
    ],
    notes_fr: [
      'Les tests par fonction ne sont plus bloqués par un prototype cassé sans rapport. Jusqu\'ici, le runner standalone définissait `HAVE_FT_<fn>` pour chaque `ft_*.c` qu\'il arrivait à compiler, ce qui activait chaque corps de test correspondant. Donc si vous demandiez `ft_itoa` et que votre `libft.h` déclarait, disons, `ft_strmapi` avec le mauvais type de retour (`char` au lieu de `char *`), la compilation du testeur explosait sur `test_strmapi` — une fonction que personne n\'avait demandée. Le runner ne définit désormais `HAVE_FT_<fn>` que pour les fonctions ciblées ; les autres `ft_*.c` sont toujours liés (les helpers inter-fichiers type `ft_strjoin` → `ft_strlen` résolvent), mais leurs corps de test restent désactivés.',
      'Nouveau message quand un mauvais prototype est en cause : au lieu du « linking failed » trompeur, le résumé d\'erreur de build dit maintenant « votre libft.h déclare l\'une des fonctions ciblées avec la mauvaise signature — vérifiez le type de retour et les paramètres par rapport au sujet » quand la sortie du compilateur pointe une incohérence de types dans tester.c.',
      'Le prompt « Tester des fonctions spécifiques… » commence désormais par le préfixe `ft_` et un exemple concret (`ft_itoa, ft_split`). L\'en-tête du catalogue précise « toujours avec le préfixe ft_ », et le message d\'erreur sur fonction inconnue le rappelle explicitement. Le parser accepte toujours les noms sans préfixe pour ne pas casser la mémoire musculaire — l\'interface arrête juste de prétendre que les deux formes sont équivalentes.',
    ],
  },
  {
    version: '0.2.4',
    date: '2026-05-04',
    notes_en: [
      '"Test specific functions…" in the libft menu no longer needs your Makefile or libft.h. The runner now compiles each requested `ft_<fn>.c` directly under ASan, ships a fallback `libft.h` (used only when yours is missing — `#include "libft.h"` searches the source\'s own directory first), and you can test the one function you just wrote even with zero other functions implemented.',
      'The libft tester gained a `HAVE_LIBFT_LIST` gate around the entire linked-list section (helpers, tests, dispatch entries). Testing a non-bonus subset like `ft_strlen` no longer fails to compile when `t_list` isn\'t declared anywhere — it just skips the bonus tests cleanly.',
      'Per-function build errors get a precise diagnostic now: missing source files surface as "source file(s) not found: ft_xyz.c", a single failed compile shows "ft_xyz.c failed to compile" with the last 12 lines of compiler output. No more "make exited 2, good luck" lottery.',
      'The libft menu accepts directories with just one `ft_*.c` at the root (Makefile and `libft.h` are no longer hard requirements). The strict 3-file check still applies to the ft_printf-with-libft flow that links a real `libft.a`.',
      'gnl tester now runs `make fclean` on your gnl directory before each build (when a Makefile is present). Brings gnl in line with libft and ft_printf, both of which already auto-fclean — fresh code now always rebuilds, even if you forgot to clean manually. (Thanks Stann Carneiro / @scarneir.)',
      'New legendary achievement "Total Wipeout ☠" — fail every single test in a single tester run (0 / N passed). Works across libft, ft_printf and gnl. (Thanks Samuel Daviot / @sdaviot.)',
      'Contributors page now shows what each person contributed — a one-line reason next to their name when available. Welcome to Stann Carneiro and Samuel Daviot.',
    ],
    notes_fr: [
      'Le menu libft « Tester des fonctions spécifiques… » ne dépend plus de votre Makefile ni de votre libft.h. Le testeur compile désormais chaque `ft_<fn>.c` demandé directement sous ASan, embarque un `libft.h` de secours (utilisé uniquement si le vôtre est absent — `#include "libft.h"` cherche d\'abord dans le dossier de la source), et vous pouvez tester la fonction que vous venez d\'écrire même avec zéro autre fonction implémentée.',
      'Le testeur libft gagne une garde `HAVE_LIBFT_LIST` autour de toute la section liste chaînée (helpers, tests, entrées du dispatch). Tester un sous-ensemble non-bonus comme `ft_strlen` ne casse plus la compilation quand `t_list` n\'est déclaré nulle part — la section bonus est simplement omise.',
      'Les erreurs de build par fonction sont désormais précises : un fichier source manquant s\'affiche « source file(s) not found: ft_xyz.c », un échec de compilation isolé affiche « ft_xyz.c failed to compile » avec les 12 dernières lignes du compilateur. Fini la loterie « make a renvoyé 2, bonne chance ».',
      'Le menu libft accepte les dossiers contenant juste un `ft_*.c` à la racine (Makefile et `libft.h` ne sont plus des prérequis durs). Le contrôle strict des 3 fichiers reste en place pour le mode ft_printf-avec-libft qui lie une vraie `libft.a`.',
      'Le testeur gnl exécute désormais `make fclean` sur votre dossier gnl avant chaque build (quand un Makefile est présent). Aligné avec libft et ft_printf qui font déjà ce nettoyage automatique — votre code à jour est toujours recompilé, même si vous avez oublié de nettoyer à la main. (Merci Stann Carneiro / @scarneir.)',
      'Nouveau succès légendaire « Effacement total ☠ » — échouer absolument tous les tests d\'un même run (0 / N réussis). Fonctionne pour libft, ft_printf et gnl. (Merci Samuel Daviot / @sdaviot.)',
      'La page Contributeurs affiche maintenant ce que chaque personne a apporté — une ligne descriptive à côté du nom quand elle est renseignée. Bienvenue à Stann Carneiro et Samuel Daviot.',
    ],
  },
  {
    version: '0.2.3',
    date: '2026-05-04',
    notes_en: [
      'No more guessing paths: the ft_printf "with libft" mode now requires libft at the canonical `<project>/libft/` (the location the subject mandates) and, when missing, prints the exact path it expected with a one-line fix — instead of asking the student to type a path they don\'t know.',
      'Path prompts now tell you how to cancel: "Path to … (or press Enter to cancel)". Previously the only escape was Ctrl+C, which killed the CLI.',
      'ft_printf tester: a crash mid-test (e.g. SIGSEGV from `ft_printf("%s", NULL)` when your `ft_putstr` doesn\'t guard NULL) used to silently swallow every later group — you\'d see the groups that ran before the crash, then nothing at all, no CRASH line, no summary. Cause: stdout stayed redirected to the internal capture pipe after `siglongjmp`. The signal handler now restores stdout first, so the CRASH line, the remaining groups, and the final summary all print normally.',
      '`ft_strtrim` test in the libft tester: every old case used a single-character `set`, where treating `set` as a substring is indistinguishable from treating it as a set of characters — so a wrong implementation would pass. Added six cases that pin the actual contract: multi-char set with mixed leading/trailing chars (`ft_strtrim("ab middle ba", "ab")` → `" middle "`), internal occurrences must be preserved, mixed-whitespace set, empty set, whole-string trim with multi-char set, and a check that the result is a fresh allocation (not the input pointer when nothing is trimmed).',
    ],
    notes_fr: [
      'Plus besoin de deviner un chemin : le mode « avec libft » exige désormais libft au seul emplacement canonique `<projet>/libft/` (celui que le sujet impose) et, en cas d\'absence, affiche le chemin exact attendu avec la correction à appliquer — au lieu de demander à l\'étudiant de taper un chemin qu\'il ne connaît pas.',
      'Les saisies de chemin indiquent maintenant comment annuler : « Chemin vers … (ou Entrée pour annuler) ». Avant, la seule issue était Ctrl+C, qui tuait le CLI.',
      'Testeur ft_printf : un crash en plein test (par ex. SIGSEGV sur `ft_printf("%s", NULL)` quand votre `ft_putstr` ne protège pas NULL) avalait silencieusement tous les groupes suivants — vous voyiez ceux exécutés avant le crash, puis plus rien du tout, ni ligne CRASH, ni résumé. Cause : stdout restait redirigé vers le pipe de capture interne après `siglongjmp`. Le gestionnaire de signal restaure désormais stdout d\'abord, et la ligne CRASH, les groupes restants et le résumé final s\'affichent normalement.',
      'Test `ft_strtrim` du testeur libft : tous les anciens cas utilisaient un `set` d\'un seul caractère — situation où traiter `set` comme une sous-chaîne donne le même résultat que le traiter comme un ensemble de caractères, donc une implémentation fausse passait quand même. Ajout de six cas qui fixent le vrai contrat : set multi-caractères avec chars mélangés en début/fin (`ft_strtrim("ab middle ba", "ab")` → `" middle "`), les occurrences internes doivent être préservées, set d\'espaces variés, set vide, trim total avec set multi-caractères, et vérification que le résultat est une nouvelle allocation (pas le pointeur d\'entrée quand rien n\'est coupé).',
    ],
  },
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
