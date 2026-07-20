'use strict';

// Folks who helped shape this CLI — bug reports, suggestions, code feedback.
// Order preserved as added; new contributors append to the end.
// `reason_en` / `reason_fr` are optional one-liners describing what they
// contributed; render only when present.
module.exports = [
  { name: 'Yoann Pirot',                  login: 'yopirot' },
  { name: 'Eliott Ruffin',                login: 'eruffin' },
  { name: 'Carole Vingert',               login: 'cvingert' },
  { name: 'Mikail Bennis',                login: 'mibennis' },
  { name: 'Paul Léon Camille Guermonprez', login: 'pguermon' },
  { name: 'Stann Carneiro',               login: 'scarneir',
    reason_en: 'auto `make fclean` before tests so fresh code always rebuilds',
    reason_fr: '`make fclean` automatique avant les tests pour toujours recompiler le code à jour' },
  { name: 'Samuel Daviot',                login: 'sdaviot',
    reason_en: '"Total Wipeout" achievement — failing every test in a single run',
    reason_fr: 'succès « Effacement total » — échouer tous les tests d\'un même run' },
  { name: 'Yanis Trabelsi',               login: 'ytrabels',
    reason_en: 'spotted that picking ft_lstsize alone failed because build3 silently stubbed out without ft_lstnew',
    reason_fr: 'a repéré que tester ft_lstsize seul échouait parce que build3 se neutralisait silencieusement sans ft_lstnew' },
  { name: 'diadjaff',                      login: 'diadjaff',
    reason_en: 'flagged the vowel_count / anagram case tests in Exam Practice — prompted a full re-verification of the exam grader and the libft fd-print tests after the Python release',
    reason_fr: 'a signalé les tests de casse de vowel_count / anagram dans l\'Exam Practice — a déclenché une re-vérification complète du correcteur d\'examen et des tests d\'affichage fd de la libft après la sortie Python' },
  { name: 'Milan Rubinsztejn',             login: 'mirubins',
    reason_en: 'helping with many things',
    reason_fr: 'aide sur de nombreux aspects' },
];
