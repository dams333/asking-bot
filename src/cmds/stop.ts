import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Discord, Slash, Guild, Client, SlashOption } from "discordx";
import { hasPermission } from "../commands_manager";
import { guild_id } from "../config.json";
import { getGame } from "../game_manager";

@Guild(guild_id)
@Discord()
class StopClass {
  @Slash({
    name: "stop",
    description: "Stop waiting for answers",
  })
  async stop(
    @SlashOption({
      name: "coalition_name",
      description: "Optionnal name of the coalition as registered where you want to stop listening",
      required: false,
    })
    name: string,
    interaction: CommandInteraction
  ) {
    if (hasPermission(interaction.member, interaction)) {
      let game = getGame();
      if (!game) {
        const embed = new EmbedBuilder();
        embed.setTitle("No game is running!").setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });
        interaction.reply({ embeds: [embed] });
      } else {
        if (name == null) {
          for (const coalition of game.coalitions) {
            if (coalition.collector != null) await game.stop_listening(coalition);
          }
          const embed = new EmbedBuilder();
          embed.setTitle("Listening stopped in all channels").setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });
          interaction.reply({ embeds: [embed] });
        } else {
          let coalition = game.coalitions.find((c) => c.name == name);
          if (coalition == null) {
            const embed = new EmbedBuilder();
            embed.setTitle("No coalition found").setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });
            interaction.reply({ embeds: [embed] });
          } else {
            await game.stop_listening(coalition);
            const embed = new EmbedBuilder();
            embed.setTitle("Listening stopped in " + coalition.name + " channel").setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });
            interaction.reply({ embeds: [embed] });
          }
        }
      }
    }
  }
}

export async function init(client: Client) {
  console.log("Stop command inited");
  await client.initApplicationCommands();
}
