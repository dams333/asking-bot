import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Discord, Slash, Guild, Client } from "discordx";
import { hasPermission } from "../commands_manager";
import { guild_id } from "../config.json";
import { getGame, IUser } from "../game_manager";

@Guild(guild_id)
@Discord()
class ScoresClass {
  @Slash({
    name: "scores",
    description: "Print current ladder of each coalition",
  })
  async scores(interaction: CommandInteraction) {
    if (hasPermission(interaction.member, interaction)) {
      let embeds = [];
      let game = getGame();
      if (!game) {
        const embed = new EmbedBuilder();
        embed.setTitle("No game is running!").setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });

        embeds.push(embed);
      } else {
        for (const coalition of game.coalitions) {
          const embed = new EmbedBuilder();
          embed.setTitle(`Scores of the ${coalition.name}`).setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });

          let users: IUser[] = coalition.points;
          users.sort((a, b) => b.points - a.points);
          let rank = 0;
          let result: string[] = users.length >= 1 ? users.map((user) => `${++rank}) <@${user.id}> : ${user.points} points`) : ["No users scored yet"];
          embed.setDescription(result.join("\n"));
          embeds.push(embed);
        }
      }
      interaction.reply({ embeds: embeds });
    }
  }
}

export async function init(client: Client) {
  console.log("Scores command inited");
  await client.initApplicationCommands();
}
