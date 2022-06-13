import { SlashCommandBuilder } from "@discordjs/builders"
import { REST } from "@discordjs/rest"
import { APIMessage, Routes } from "discord-api-types/v10"
import { Application, CacheType, Client, CommandInteraction, Permissions, Intents, Interaction, Message, MessageEmbed, MessageReaction, TextChannel, User, PartialMessageReaction, PartialUser, Typing } from "discord.js"
import { clientId, guildId, token } from "../config.json"


const intents = new Intents()
intents
    .add(Intents.FLAGS.GUILD_MESSAGES)
    // .add(Intents.FLAGS.GUILD_MESSAGE_TYPING)
    .add(Intents.FLAGS.GUILD_MESSAGE_REACTIONS)
    .add(Intents.FLAGS.DIRECT_MESSAGES)
    // .add(Intents.FLAGS.DIRECT_MESSAGE_TYPING)
    .add(Intents.FLAGS.DIRECT_MESSAGE_REACTIONS)

const client = new Client({ intents: intents })
const rest = new REST({ version: "10" }).setToken(token)

const emojiTable = [
    { emoji: "🤬", value: "Gambit" },
    { emoji: "😱", value: "Gambit Prime" }
]

const translateEmojiToText = (emoji: string) => {
    return emojiTable.find((emojiItem) => emojiItem.emoji === emoji)?.value
}


const generateLink = () => {
    const link = client.generateInvite({
        permissions: [
            Permissions.FLAGS.ADMINISTRATOR
        ],
        scopes: ["bot", "applications.commands"],
    })
    console.log(`Generated bot invite link: ${link}`)
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

        console.log(`Responded to ${repliedObj.author.username} with ${repliedObj.id}`)
        const collector = repliedObj.createReactionCollector()
        collector.on("collect", r => console.log(`Collected ${r.emoji.name}`))
        collector.on("end", collected => console.log(`Collected ${collected.size} items`))
    }
}





const reactionManage = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    console.log(`User ${user.username} reacted with ${reaction.emoji.name}`)
    const embed = reaction.message.embeds[0]

    // if (embed.author?.name !== "Sondage") {
    //     return
    // }

    const descriptionOrignal = embed.description?.split("\n")[0]
    const descriptionReactions = []
    for (const reactionMessage of reaction.message.reactions.cache) {
        const emoji = reactionMessage[1].emoji.name || "No emoji"
        const text = translateEmojiToText(emoji) || emoji

        const users = await reactionMessage[1].users.fetch()
        const userNames = []
        for (const user of users) {
            if (user[1].username !== "Keybot") {
                userNames.push(user[1].username)
            }
        }
        descriptionReactions.push(`\n - ${text} : ${userNames.join(", ")}`)
    }


    const newDescription = `${descriptionOrignal}${descriptionReactions}`
    embed.description = newDescription
    const message = await reaction.message.fetch()
    await message.edit({ embeds: [embed] })
}

const run = async () => {
    generateLink()

    const cmd = new SlashCommandBuilder()
        .setName("m")
        .setDescription("plop")
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [cmd] })

    client.on("interactionCreate", command)
    client.on("messageReactionAdd", reactionManage)
    client.on("messageReactionRemove", reactionManage)
    // client.on("debug", message => console.log(message))
    // client.on("error", error => console.log(`${ error.message } : ${ error.stack } `))
    // client.on("typingStart", typing => console.log(`${ typing.toJSON() } `))

}

client.login(token).then(run).catch(({ message, stack }) => {
    console.log(`${message} : ${stack} `)
})
