import { CommandInteraction } from "discord.js";
import { Discord, Slash, Guild, Client, SlashOption, SlashChoice } from "discordx";
import { hasPermission } from "../commands_manager";
import { guild_id } from "../config.json";
import { initGame } from "../game_manager";

let discordx_client: Client;

@Guild(guild_id)
@Discord()
class InitClass {
  @Slash({
    name: "init",
    description: "Init a game",
  })
  async init(
    @SlashChoice({ name: "Question pour un piscineux", value: "qpp" })
    @SlashChoice({ name: "Blindtest", value: "blindtest" })
    @SlashOption({ name: "type", description: "Type of the game", required: true })
    type: string,
    interaction: CommandInteraction
  ) {
    if (hasPermission(interaction.member, interaction)) {
      initGame(discordx_client, type);
      interaction.reply("Game inited with type: " + type);
    }
  }
}

export async function init(client: Client) {
  discordx_client = client;
  console.log("Init command inited");
  await client.initApplicationCommands();
}
