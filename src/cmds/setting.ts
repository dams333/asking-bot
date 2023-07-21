import fs from "fs";
import { CommandInteraction, EmbedBuilder, TextChannel } from "discord.js";
import { Discord, Slash, SlashGroup, Guild, Client, SlashOption } from "discordx";
import { hasPermission } from "../commands_manager";
import { guild_id } from "../config.json";

@Guild(guild_id)
@Discord()
@SlashGroup({
  name: "settings",
  description: "Admin command",
})
@SlashGroup("settings")
class SettingsClass {
  @Slash({
    name: "add_coalition",
    description: "Define coalition's channel",
  })
  add_coalition(
    @SlashOption({
      name: "name",
      description: "Coalition's name",
      required: true,
    })
    name: string,
    @SlashOption({
      name: "channel",
      description: "Coalition's channel",
      required: true,
    })
    channel: TextChannel,
    interaction: CommandInteraction
  ) {
    if (hasPermission(interaction.member, interaction)) {
      const config = JSON.parse(fs.readFileSync("./src/config.json", "utf8"));
      const coalitions = config.coalitions;
      for (const coa of coalitions) {
        if (coa.name === name) coalitions.splice(coalitions.indexOf(coa), 1);
      }
      coalitions.push({ name: name, channel_id: channel.id });
      config.coalitions = coalitions;
      fs.writeFileSync("./src/config.json", JSON.stringify(config), "utf8");
      interaction.reply("Coalition's channel updated");
    }
  }

  @Slash({
    name: "remove_coalition",
    description: "Remove coalition from the game",
  })
  remove_coalition(
    @SlashOption({
      name: "name",
      description: "Coalition's name",
      required: true,
    })
    name: string,
    interaction: CommandInteraction
  ) {
    if (hasPermission(interaction.member, interaction)) {
      const config = JSON.parse(fs.readFileSync("./src/config.json", "utf8"));
      const coalitions = config.coalitions;
      for (const coa of coalitions) {
        if (coa.name === name) coalitions.splice(coalitions.indexOf(coa), 1);
      }
      config.coalitions = coalitions;
      fs.writeFileSync("./src/config.json", JSON.stringify(config), "utf8");
      interaction.reply("Coalition removed");
    }
  }

  @Slash({
    name: "show",
    description: "Describe current settings",
  })
  show(interaction: CommandInteraction) {
    if (hasPermission(interaction.member, interaction)) {
      let questionCount = 0;
      const files = fs.readdirSync("./qpp_questions").filter((file) => file.endsWith(".json"));
      for (const file of files) questionCount += JSON.parse(fs.readFileSync(`./qpp_questions/${file}`, "utf8")).length;
      let blindtestCount = 0;
      const blindtest = fs.readdirSync("./blindtest_questions").filter((file) => file.endsWith(".json"));
      for (const file of blindtest) blindtestCount += JSON.parse(fs.readFileSync(`./blindtest_questions/${file}`, "utf8")).length;
      const coalitions = JSON.parse(fs.readFileSync("./src/config.json", "utf8")).coalitions;
      const embed = new EmbedBuilder()
        .setTitle("Loaded settings")
        .setDescription(`They are currently ${questionCount} questions, ${blindtestCount} blindtest songs and ${coalitions.length} coalitions loaded. Coalitions list:`)
        .setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });

      let fields = [];
      for (const coalition of coalitions) {
        fields.push({
          name: coalition.name,
          value: coalition.channel_id ? `<#${coalition.channel_id}>` : "No channel",
          inline: true,
        });
      }
      embed.addFields(fields);
      interaction.reply({ embeds: [embed] });
    }
  }
}

export async function init(client: Client) {
  console.log("Settings command inited");
  await client.initApplicationCommands();
}
