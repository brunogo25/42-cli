'use strict';

module.exports = {
  'banner.description': '42 — an interactive CLI to test your 42 Common Core exercises.',
  'banner.credits': 'by Bruno Gomez (bgomez) · 2026 piscine student',

  'common.back': 'Back',
  'common.quit': 'Quit',
  'common.comingSoon': 'coming soon',
  'common.bye': 'bye!',
  'common.byeName': 'bye, {name}!',
  'common.hello': 'Hello, {name}!',
  'common.yes': 'Yes',
  'common.no': 'No',

  'firstRun.pickLanguage': 'Pick a language / Choisissez une langue:',
  'firstRun.askName': "What's your name?",
  'firstRun.nameRequired': 'please enter a name.',

  'main.cursus': 'Which cursus are you working on?',
  'main.commonCore': 'Common Core',
  'main.advancedCore': 'Advanced Core',
  'main.settings': 'Settings',

  'update.available': 'Update available: {remote} (you have {local}).',
  'update.howTo': 'Run "42 update" to upgrade — or press / in the menu.',
  'update.menuItem': 'Update 42-cli ({local} → {remote}) — press /',
  'update.running': 'Updating 42-cli…',
  'update.done': 'Update complete. Restart "42" to use the new version.',
  'update.failed': 'Update failed.',
  'update.upToDate': 'You are already on the latest version ({local}).',
  'update.checking': 'checking for updates…',
  'update.unreachable': 'could not reach github.',
  'update.confirm': 'Update now?',

  'cc.pick': 'Pick an exercise:',

  'libft.pathPrompt': 'Path to libft directory:',
  'libft.notLibft': 'not a libft project — needs Makefile, libft.h, and ft_*.c at the root.',
  'libft.areYouHere': 'Are you in your libft directory? ({cwd})',
  'libft.useThisDir': 'Yes — use this directory',
  'libft.enterPath': 'No — enter a path',
  'libft.fallbackToPathEntry': 'falling back to path entry.',
  'libft.functionsPrompt':
    'Functions to test (comma/space separated, ft_ prefix optional, blank to cancel):',
  'libft.catalogHeader': 'available functions:',
  'libft.unknownFunctions': 'unknown function(s): {names}',
  'libft.tryListHint': 'try: type "list" to see the catalog, or check the ft_ prefix.',
  'libft.pathLabel': 'libft path:',
  'libft.action': 'Libft — what do you want to do?',
  'libft.testAll': 'Test all 42 functions',
  'libft.testPick': 'Test specific functions… (type names)',
  'libft.runNorm': 'Run Norminette',
  'libft.runNormAndTests': 'Run Norminette + all tests',
  'libft.compliance': 'Subject compliance check (files / Makefile / header)',
  'libft.changePath': 'Change libft path',

  'settings.title': 'Settings',
  'settings.name': 'Name',
  'settings.namePrompt': 'Your name:',
  'settings.nameSaved': 'Name saved ({name}).',
  'settings.language': 'Language',
  'settings.checkUpdates': 'Check for updates now',
  'settings.languageSaved': 'Language saved.',

  'sections.testsAll': 'tests · all 42 functions',
  'sections.norminette': 'norminette',
  'sections.compliance': 'subject compliance',
};
