const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { initDB } = require('./src/utils/db');
const { getConfig } = require('./src/utils/configStore');
const { startDashboard } = require('./src/dashboard/server');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const { handleSetup, handleCome, handleRename, handleBlacklist } = require('./src/handlers/commands');
const { handleMenus } = require('./src/handlers/menus');
const { handleButtons } = require('./src/handlers/buttons');
const { handleModals } = require('./src/handlers/modals');

client.once('clientReady', async () => {
  const config = getConfig();
  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    const commands = [
      {
        name: 'setup',
        description: 'Sends the shop selection panel'
      },
      {
        name: 'come',
        description: 'Summons the client to the ticket'
      },
      {
        name: 'rename',
        description: 'Renames the current ticket channel',
        options: [
          {
            name: 'name',
            description: 'The new name for the channel',
            type: 3,
            required: true
          }
        ]
      },
      {
        name: 'blacklist',
        description: 'Manage the blacklist',
        options: [
          {
            name: 'add',
            description: 'Add a user to the blacklist',
            type: 1,
            options: [
              {
                name: 'user',
                description: 'The user to blacklist',
                type: 6,
                required: true
              }
            ]
          },
          {
            name: 'remove',
            description: 'Remove a user from the blacklist',
            type: 1,
            options: [
              {
                name: 'user',
                description: 'The user to remove from the blacklist',
                type: 6,
                required: true
              }
            ]
          },
          {
            name: 'list',
            description: 'List all blacklisted users',
            type: 1
          }
        ]
      }
    ];
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async (interaction) => {
  const config = getConfig();

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'setup') {
      await handleSetup(interaction, config);
    } else if (interaction.commandName === 'come') {
      await handleCome(interaction, config);
    } else if (interaction.commandName === 'rename') {
      await handleRename(interaction, config);
    } else if (interaction.commandName === 'blacklist') {
      await handleBlacklist(interaction, config);
    }
    return;
  }

  if (interaction.isStringSelectMenu()) {
    await handleMenus(interaction, config);
    return;
  }

  if (interaction.isButton()) {
    await handleButtons(interaction, config, client);
    return;
  }

  if (interaction.isModalSubmit()) {
    await handleModals(interaction, config);
    return;
  }
});

(async () => {
  await initDB();
  startDashboard(client);
  const config = getConfig();
  client.login(config.token);
})();
