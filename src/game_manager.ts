import { EmbedBuilder, GuildMember, MessageCollector, TextBasedChannel, TextChannel } from "discord.js";
import { Client } from "discordx";
import fs from "fs";

export interface IQuestion {
  question: string;
  answers: string[];
  case_sensitive: boolean;
  answers_nb: number;
}

export interface IUser {
  id: string;
  points: number;
}

export interface ICoalition {
  name: string;
  channel: string;
  points: IUser[];
  collector: MessageCollector | null;
}

export class Game {
  questions: IQuestion[];
  current_question_index: number;
  coalitions: ICoalition[];
  client: Client;
  adminChannel: TextChannel | null;
  type: string;

  constructor(client: Client, type: string) {
    this.questions = [];
    this.type = type;
    if (type == "qpp") {
      const files = fs.readdirSync("./qpp_questions").filter((file) => file.endsWith(".json"));
      for (const file of files) {
        const data = fs.readFileSync(`./qpp_questions/${file}`, "utf8");
        this.questions.push(...JSON.parse(data));
      }
    } else {
      const files = fs.readdirSync("./blindtest_questions").filter((file) => file.endsWith(".json"));
      for (const file of files) {
        const data = fs.readFileSync(`./blindtest_questions/${file}`, "utf8");
        this.questions.push(...JSON.parse(data));
      }
    }
    console.log("Game inited with " + this.questions.length + " questions");
    console.table(this.questions);
    const config = JSON.parse(fs.readFileSync("./src/config.json", "utf8"));
    this.coalitions = [];
    for (const coalition of config.coalitions)
      this.coalitions.push({
        name: coalition.name,
        channel: coalition.channel_id,
        points: [],
        collector: null,
      });
    this.current_question_index = -1;
    this.client = client;
    this.adminChannel = null;
  }

  get listening_channels(): string[] {
    return this.coalitions.map((coalition) => coalition.channel);
  }

  get current_question(): IQuestion | null {
    if (this.current_question_index < 0 || this.current_question_index >= this.questions.length) return null;
    return this.questions[this.current_question_index];
  }

  async askQuestion(id: number, adminChannel: TextBasedChannel | null): Promise<IQuestion | null> {
    if (this.current_question != null && this.type == "qpp") this.questions.splice(this.current_question_index, 1);
    for (const coa of this.coalitions) {
      if (coa.collector != null) await this.stop_listening(coa);
    }
    this.current_question_index = id;
    this.adminChannel = adminChannel as TextChannel;

    const question: IQuestion | null = this.current_question;
    if (question != null) {
      const embed = new EmbedBuilder();
      if (this.type == "qpp") {
        embed.setTitle("Question").setDescription(question.question);
        if (question.answers_nb > 1) embed.addFields([{ name: "Multiple answers", value: 'Separate your answers by ";" without spaces, like: "Answer1;Answer2"' }]);
      } else embed.setTitle("New song");
      for (const coa of this.coalitions) {
        let channel: TextChannel = (await this.client.channels.fetch(coa.channel)) as TextChannel;

        coa.collector = channel.createMessageCollector();
        coa.collector.on("collect", (m) => {
          if (m.author.id != this.client.user?.id) getGame()?.check_answer(channel, m.member, m.content);
        });

        await channel.send({ embeds: [embed] });
      }
    }
    return question;
  }

  async askNextQuestion(adminChannel: TextBasedChannel | null): Promise<IQuestion | null> {
    if (this.type == "qpp") return this.askQuestion(Math.floor(Math.random() * this.questions.length), adminChannel);
    else {
      if (this.current_question_index == -1) return this.askQuestion(0, adminChannel);
      else return this.askQuestion(this.current_question_index + 1, adminChannel);
    }
  }

  is_qpp_answer_valid(question: IQuestion, answer: string): boolean {
    if (!question.case_sensitive) {
      question.answers = question.answers.map((a) => a.toLowerCase());
      answer = answer.toLowerCase();
    }
    if (question.answers_nb == 1) return question.answers.includes(answer);
    let answers = answer.split(";").filter((a) => question.answers.includes(a));
    answers = answers.filter((a, i) => answers.indexOf(a) == i);
    return answers.length == question.answers_nb;
  }

  is_blindtest_answer_valid(question: IQuestion, answer: string): string[] {
    let found = [];
    for (const elem of question.answers) {
      if (answer.includes(elem)) found.push(elem);
    }
    for (const elem of found) {
      question.answers.splice(question.answers.indexOf(elem), 1);
    }
    return found;
  }

  check_answer(channel: TextChannel, member: GuildMember | null, answer: string) {
    if (member == null) return;
    const question: IQuestion | null = this.current_question;
    if (question == null) return;
    if (this.type == "qpp" && this.is_qpp_answer_valid(question, answer)) {
      const coalition = this.coalitions.find((coa) => coa.channel == channel.id);
      if (coalition != null) {
        let user = coalition.points.find((u) => u.id == member.id);
        if (user == null) {
          coalition.points.push({ id: member.id, points: 0 });
          user = coalition.points.find((u) => u.id == member.id);
        }
        if (user != null) user.points++;
        const embed = new EmbedBuilder().setTitle("Answer found !").setDescription(`<@${member.id}> found the answer !`).setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });
        channel.send({ embeds: [embed] });
        const adminEmbed = new EmbedBuilder()
          .setTitle("Answer found !")
          .setDescription(`<@${member.id}> from the ${coalition.name} found the answer ! He has now ${user?.points} points.`)
          .setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });

        this.adminChannel?.send({ embeds: [adminEmbed] });
        coalition.collector?.stop();
        coalition.collector = null;

        let finished: boolean = true;
        for (const coalition of this.coalitions) {
          if (coalition.collector != null) finished = false;
        }
        if (finished) {
          const finishEmbed = new EmbedBuilder().setTitle("Round ended").setDescription("All coalitions found the answer !").setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });

          this.adminChannel?.send({ embeds: [finishEmbed] });
          this.adminChannel = null;
        }
      }
    } else if (this.type == "blindtest") {
      let found = this.is_blindtest_answer_valid(question, answer);
      if (found.length > 0) {
        const coalition = this.coalitions.find((coa) => coa.channel == channel.id);
        if (coalition != null) {
          let user = coalition.points.find((u) => u.id == member.id);
          if (user == null) {
            coalition.points.push({ id: member.id, points: 0 });
            user = coalition.points.find((u) => u.id == member.id);
          }
          if (user != null) user.points += found.length;
          const embed = new EmbedBuilder()
            .setTitle("Answer found !")
            .setDescription(`<@${member.id}> found answers:\n${found.join("\n")} !`)
            .setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });
          channel.send({ embeds: [embed] });
          const adminEmbed = new EmbedBuilder()
            .setTitle("Answer found !")
            .setDescription(`<@${member.id}> found the answers:\n${found.join("\n")}\nHe has now ${user?.points} points.`)
            .setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });
          this.adminChannel?.send({ embeds: [adminEmbed] });
          if (question.answers.length == 0) {
            coalition.collector?.stop();
            coalition.collector = null;
            const finishEmbed = new EmbedBuilder().setTitle("Round ended").setDescription("All answers found !").setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });
            this.adminChannel?.send({ embeds: [finishEmbed] });
            this.adminChannel = null;
          }
        }
      }
    }
  }

  async stop_listening(coa: ICoalition) {
    coa.collector?.stop();
    coa.collector = null;
    let channel: TextChannel = (await this.client.channels.fetch(coa.channel)) as TextChannel;
    const embed = new EmbedBuilder()
      .setTitle("Stop!")
      .setDescription("Administrators stop the current question. You cannot answer anymore.")
      .setFooter({ text: "</>  by Dhubleur & Shocquen with ❤️" });
    channel.send({ embeds: [embed] });
  }
}

let game: Game | null = null;

export function getGame(): Game | null {
  return game;
}

export function initGame(client: Client, type: string): Game {
  game = new Game(client, type);
  return game;
}
