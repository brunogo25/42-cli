'use strict';

const { select } = require('../ui/select');
const libft = require('./libft');
const ftPrintf = require('./ftPrintf');
const gnl = require('./gnl');
const { t } = require('../i18n');

async function run() {
  while (true) {
    const cs = t('common.comingSoon');
    const choice = await select({
      message: t('cc.pick'),
      choices: [
        { label: 'Libft', value: 'libft' },
        { label: 'ft_printf', value: 'printf' },
        { label: 'get_next_line', value: 'gnl' },
        { label: 'Born2BeRoot', value: 'b2br', disabled: cs },
        { label: 'so_long', value: 'solong', disabled: cs },
        { label: 'push_swap', value: 'push_swap', disabled: cs },
        { label: 'minishell', value: 'minishell', disabled: cs },
        { label: 'philosophers', value: 'philo', disabled: cs },
        { label: 'cub3d / miniRT', value: 'cubrt', disabled: cs },
        { label: 'NetPractice', value: 'netpractice', disabled: cs },
        { label: 'CPP modules', value: 'cpp', disabled: cs },
        { label: 'webserv', value: 'webserv', disabled: cs },
        { label: 'Inception', value: 'inception', disabled: cs },
        { label: 'ft_transcendence', value: 'transcendence', disabled: cs },
        { label: t('common.back'), value: 'back' },
        { label: t('common.quit'), value: 'quit' },
      ],
    });
    if (choice === 'libft') {
      const back = await libft.run();
      if (back === 'quit') return 'quit';
    } else if (choice === 'printf') {
      const back = await ftPrintf.run();
      if (back === 'quit') return 'quit';
    } else if (choice === 'gnl') {
      const back = await gnl.run();
      if (back === 'quit') return 'quit';
    } else if (choice === 'back') {
      return 'back';
    } else if (choice === 'quit') {
      return 'quit';
    }
  }
}

module.exports = { run };
