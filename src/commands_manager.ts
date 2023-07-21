import { APIInteractionGuildMember, CommandInteraction, EmbedBuilder, GuildMember } from "discord.js";
import { Client } from "discordx";
import { roles } from "./config.json";

import { init as settings_init } from "./cmds/setting";
import { init as ask_init } from "./cmds/ask";
import { init as scores_init } from "./cmds/scores";
import { init as stop_init } from "./cmds/stop";
import { init as init_init } from "./cmds/init";

export function hasPermission(member: GuildMember | APIInteractionGuildMember | null, interaction: CommandInteraction): boolean {
  let found = false;
  if (member && member instanceof GuildMember) {
    member.roles.cache.forEach((role) => {
      if (roles.includes(role.name)) found = true;
    });
  }
  if (found) return true;
  const embed = new EmbedBuilder();
  embed.setTitle("You don't have permission to use this command!").setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });
  interaction.reply({ embeds: [embed], ephemeral: true });
  return false;
}

export async function init(client: Client) {
  await settings_init(client);
  await ask_init(client);
  await scores_init(client);
  await stop_init(client);
  await init_init(client);
}
