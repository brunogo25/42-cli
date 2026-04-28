'use strict';

module.exports = {
  'banner.description': '42 — un CLI interactif pour tester vos exercices du Common Core 42.',
  'banner.credits': 'par Bruno Gomez (bgomez) · piscineux 2026',

  'common.back': 'Retour',
  'common.quit': 'Quitter',
  'common.comingSoon': 'à venir',
  'common.bye': 'à plus !',
  'common.byeName': 'à plus, {name} !',
  'common.hello': 'Bonjour, {name} !',
  'common.yes': 'Oui',
  'common.no': 'Non',

  'firstRun.pickLanguage': 'Pick a language / Choisissez une langue :',
  'firstRun.askName': 'Comment vous appelez-vous ?',
  'firstRun.nameRequired': 'veuillez saisir un nom.',

  'fun.didYouKnow': 'Le saviez-vous ?',
  'fun.vibe': 'vibe du jour :',
  'fun.luckyDay': 'JOUR DE CHANCE !',
  'fun.wow': 'WAOUH !',

  'main.cursus': 'Sur quel cursus travaillez-vous ?',
  'main.commonCore': 'Common Core',
  'main.advancedCore': 'Tronc avancé',
  'main.settings': 'Réglages',

  'update.available': 'Mise à jour disponible : {remote} (vous avez {local}).',
  'update.howTo': 'Lancez « 42 update » pour mettre à jour — ou appuyez sur / dans le menu.',
  'update.menuItem': 'Mettre à jour 42-cli ({local} → {remote}) — appuyez sur /',
  'update.running': 'Mise à jour en cours…',
  'update.done': 'Mise à jour terminée. Relancez « 42 » pour utiliser la nouvelle version.',
  'update.failed': 'Échec de la mise à jour.',
  'update.upToDate': 'Vous êtes déjà à la dernière version ({local}).',
  'update.checking': 'recherche de mises à jour…',
  'update.unreachable': 'github injoignable.',
  'update.offline': 'hors ligne — impossible de vérifier les mises à jour.',
  'update.onLatest': 'à jour (v{local}).',
  'update.confirm': 'Mettre à jour maintenant ?',

  'cc.pick': 'Choisissez un exercice :',

  'libft.pathPrompt': 'Chemin vers le dossier libft :',
  'libft.notLibft':
    "ce n'est pas un projet libft — il faut Makefile, libft.h et ft_*.c à la racine.",
  'libft.areYouHere': 'Êtes-vous dans votre dossier libft ? ({cwd})',
  'libft.useThisDir': 'Oui — utiliser ce dossier',
  'libft.enterPath': 'Non — saisir un chemin',
  'libft.fallbackToPathEntry': 'saisie de chemin manuelle.',
  'libft.functionsPrompt':
    'Fonctions à tester (séparées par virgule/espace, préfixe ft_ optionnel, vide pour annuler) :',
  'libft.catalogHeader': 'fonctions disponibles :',
  'libft.unknownFunctions': 'fonction(s) inconnue(s) : {names}',
  'libft.tryListHint': 'tapez « list » pour voir le catalogue, ou vérifiez le préfixe ft_.',
  'libft.pathLabel': 'chemin libft :',
  'libft.action': 'Libft — que voulez-vous faire ?',
  'libft.testAll': 'Tester les 42 fonctions',
  'libft.testPick': 'Tester des fonctions précises… (saisissez les noms)',
  'libft.runNorm': 'Lancer Norminette',
  'libft.runNormAndTests': 'Lancer Norminette + tous les tests',
  'libft.compliance': 'Vérification de conformité au sujet (fichiers / Makefile / header)',
  'libft.changePath': 'Changer le chemin libft',

  'settings.title': 'Réglages',
  'settings.name': 'Nom',
  'settings.namePrompt': 'Votre nom :',
  'settings.nameSaved': 'Nom enregistré ({name}).',
  'settings.language': 'Langue',
  'settings.languageSaved': 'Langue enregistrée.',

  'sections.testsAll': 'tests · les 42 fonctions',
  'sections.norminette': 'norminette',
  'sections.compliance': 'conformité au sujet',
};
