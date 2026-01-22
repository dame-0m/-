const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const EMBED_CHANNEL_NAME = "นัดลงดัน";
const DATA_CHANNEL_NAME = "รายชื่อนัดลงดัน";
const userSelections = new Map();

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

const DAY_TH = {
  monday: "จันทร์",
  tuesday: "อังคาร",
  wednesday: "พุธ",
  thursday: "พฤหัส",
  friday: "ศุกร์",
  saturday: "เสาร์"
};


const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", async () => {
  console.log("Bot Online");

  for (const guild of client.guilds.cache.values()) {

    const embedChannel = guild.channels.cache.find(
      ch => ch.name === EMBED_CHANNEL_NAME
    );

    if (!embedChannel) {
      console.log(`[${guild.name}] ไม่พบห้อง ${EMBED_CHANNEL_NAME}`);
      continue;
    }

    const embed = new EmbedBuilder()
      .setTitle("<a:22709sword10929m:1446934116455944222>ว่างวันไหนกันบ้างงับ จะได้ไปลงดันกัน<a:22709sword10929m:1446934116455944222>")
      .setDescription("กดปุ่มด้านล่างเพื่อเลือกวันและช่วงเวลาที่ว่างได้เลย")
      .setColor(0x00bfff);

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start_select")
        .setLabel("ปุ่มๆๆๆ")
        .setStyle(ButtonStyle.Success)
    );

    await embedChannel.send({
      embeds: [embed],
      components: [buttonRow]
    });

    console.log(`ส่ง Embed สำเร็จที่เซิร์ฟ: ${guild.name}`);
  }
});


client.on("interactionCreate", async interaction => {
  if (interaction.isButton() && interaction.customId === "start_select") {
    await interaction.deferReply({ ephemeral: true });

    const dayMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_days")
        .setPlaceholder("เลือกวันว่าง")
        .setMinValues(1)
        .setMaxValues(6)
        .addOptions([
          { label: "จันทร์", value: "monday" },
          { label: "อังคาร", value: "tuesday" },
          { label: "พุธ", value: "wednesday" },
          { label: "พฤหัส", value: "thursday" },
          { label: "ศุกร์", value: "friday" },
          { label: "เสาร์", value: "saturday" }
        ])
    );

    await interaction.editReply({
      content: "ว่างวันไหนบ้าง(เลือกได้หลายวันนะ)",
      components: [dayMenu]
    });
  }
  if (interaction.isStringSelectMenu() && interaction.customId === "select_days") {
    await interaction.deferReply({ ephemeral: true });

    userSelections.set(interaction.user.id, {
      days: interaction.values
    });

    const timeMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_times")
        .setPlaceholder("เลือกช่วงเวลาที่ว่าง")
        .setMinValues(1)
        .setMaxValues(2)
        .addOptions([
          { label: "18:00 - 21:00", value: "18:00 - 21:00" },
          { label: "21:00 - 01:00", value: "21:00 - 01:00" }
        ])
    );

    await interaction.editReply({
      content: "ว่างเวลาไหนบ้าง",
      components: [timeMenu]
    });
  }
  if (interaction.isStringSelectMenu() && interaction.customId === "select_times") {
    await interaction.deferReply({ ephemeral: true });

    const data = userSelections.get(interaction.user.id);
    if (!data) {
      return interaction.editReply({
        content: "ไม่พบข้อมูลการเลือกวัน กรุณาเริ่มใหม่"
    });
    }

/* เรียงวัน */
    const sortedDays = data.days
      .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
      .map(day => DAY_TH[day]);

/* เรียงเวลา */
    const sortedTimes = interaction.values.sort((a, b) => {
      const getHour = t => parseInt(t.split(":")[0]);
      return getHour(a) - getHour(b);
    });

    const dataChannel = interaction.guild.channels.cache.find(
      ch => ch.name === DATA_CHANNEL_NAME
    );

    if (!dataChannel) {
      return interaction.editReply({
        content: "ไม่พบห้อง 'รายชื่อนัดลงดัน'"
      });
    }

    const username = interaction.user.username;
    const serverName = interaction.member.displayName;

    await dataChannel.send(
      `ชื่อ : **${username} (${serverName})**\n` +
      `วันที่ว่าง : ${sortedDays.join(", ")}\n` +
      `เวลา : ${sortedTimes.join(", ")}`
    );

    userSelections.delete(interaction.user.id);

    await interaction.editReply({
      content: "เรียบร้อยงับ กดปิดข้อความได้เลย",
      components: []
    });
  }
});

client.login(TOKEN);

