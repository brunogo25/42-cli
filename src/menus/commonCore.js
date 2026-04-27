'use strict';

const { select } = require('../ui/select');
const libft = require('./libft');

async function run() {
  while (true) {
    const choice = await select({
      message: 'Pick an exercise:',
      choices: [
        { label: 'Libft', value: 'libft' },
        { label: 'ft_printf', value: 'printf', disabled: 'coming soon' },
        { label: 'get_next_line', value: 'gnl', disabled: 'coming soon' },
        { label: 'Born2BeRoot', value: 'b2br', disabled: 'coming soon' },
        { label: 'so_long', value: 'solong', disabled: 'coming soon' },
        { label: 'push_swap', value: 'push_swap', disabled: 'coming soon' },
        { label: 'minishell', value: 'minishell', disabled: 'coming soon' },
        { label: 'philosophers', value: 'philo', disabled: 'coming soon' },
        { label: 'cub3d / miniRT', value: 'cubrt', disabled: 'coming soon' },
        { label: 'NetPractice', value: 'netpractice', disabled: 'coming soon' },
        { label: 'CPP modules', value: 'cpp', disabled: 'coming soon' },
        { label: 'webserv', value: 'webserv', disabled: 'coming soon' },
        { label: 'Inception', value: 'inception', disabled: 'coming soon' },
        { label: 'ft_transcendence', value: 'transcendence', disabled: 'coming soon' },
        { label: 'Back', value: 'back' },
        { label: 'Quit', value: 'quit' },
      ],
    });
    if (choice === 'libft') {
      const back = await libft.run();
      if (back === 'quit') return 'quit';
    } else if (choice === 'back') {
      return 'back';
    } else if (choice === 'quit') {
      return 'quit';
    }
  }
}

module.exports = { run };
