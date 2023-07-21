import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Discord, Slash, Guild, Client, SlashOption } from "discordx";
import { hasPermission } from "../commands_manager";
import { guild_id } from "../config.json";
import { getGame, IQuestion } from "../game_manager";

@Guild(guild_id)
@Discord()
class AskClass {
  @Slash({
    name: "ask",
    description: "Send question to channels",
  })
  async ask(
    @SlashOption({
      name: "index",
      description: "Optionnal index of the question in JSON",
      required: false,
    })
    index: number,
    interaction: CommandInteraction
  ) {
    if (hasPermission(interaction.member, interaction)) {
      let game = getGame();
      if (game == null) {
        interaction.reply("Please init a game before");
        return;
      }
      let question: IQuestion | null;
      if (index == undefined) question = await game.askNextQuestion(interaction.channel);
      else question = await game.askQuestion(index, interaction.channel);
      if (question == null) interaction.reply("No question found");
      else {
        const embed = new EmbedBuilder().setTitle("Question sent").setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" }).setDescription(question.question);
        if (game.type == "qpp") {
          embed.addFields([
            { name: "Accetped answers", value: question.answers.join("\n") },
            { name: "Case", value: `The question is case ${question.case_sensitive ? "sensitive" : "insensitive"}` },
          ]);
        } else {
          embed.addFields([{ name: "Excepted answers", value: question.answers.join("\n") }]);
        }
        interaction.reply({ embeds: [embed] });
      }
    }
  }
}

export async function init(client: Client) {
  console.log("Ask command inited");
  await client.initApplicationCommands();
}
