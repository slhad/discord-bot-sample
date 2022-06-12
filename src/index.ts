import { SlashCommandBuilder } from "@discordjs/builders"
import { REST } from "@discordjs/rest"
import { APIMessage, Routes } from "discord-api-types/v10"
import { Application, CacheType, Client, CommandInteraction, Interaction, Message, MessageEmbed, MessageReaction, TextChannel, User } from "discord.js"
import { clientId, guildId, token } from "../config.json"


const client = new Client({ intents: 8 })
const rest = new REST({ version: "10" }).setToken(token)


const cleanCommands = async () => {
    const r = await rest.get(Routes.applicationGuildCommands(clientId, guildId)) as Application[]
    for (const app of r) {
        await rest.delete(Routes.applicationGuildCommand(clientId, guildId, app.id))
    }

}

const filterReactions = (mr: MessageReaction, user: User): boolean | Promise<boolean> => {
    return [":cross:"].indexOf(mr.emoji.identifier) >= 0
}

// Reply with a proposition
const command = async (interaction: Interaction<CacheType>) => {
    if (interaction instanceof CommandInteraction) {


        const embed = new MessageEmbed()
            .setTitle("What do you want ?")
            .setDescription("Eat, Yell, Drink ?")

        const replied = await interaction.reply({ embeds: [embed], fetchReply: true }) as any
        const channel = await interaction.guild.channels.fetch(replied["channel_id"] || replied["channelId"]) as TextChannel

        const repliedObj = await channel.messages.fetch(replied.id)

        console.log(repliedObj.author.username)
        const collector = repliedObj.createReactionCollector()
        collector.on("collect", r => console.log(`Collected ${r.emoji.name}`))
        collector.on("end", collected => console.log(`Collected ${collected.size} items`))
    }
}

const run = async () => {


    const cmd = new SlashCommandBuilder()
        .setName("m")
        .setDescription("plop")
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [cmd] })

    client.on("interactionCreate", command)
    client.on("messageReactionAdd", console.log)

}


client.login(token).then(run).catch(({ message, stack }) => {
    console.log(`${message} : ${stack}`)
})
