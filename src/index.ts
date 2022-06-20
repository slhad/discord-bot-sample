import { SlashCommandBuilder } from "@discordjs/builders"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v10"
import { CacheType, Client, CommandInteraction, Intents, Interaction, MessageEmbed, MessageReaction, PartialMessageReaction, PartialUser, Permissions, TextChannel, User } from "discord.js"
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
    return emojiTable.find((emojiItem) => emojiItem.emoji === emoji)?.value || emoji
}

const ignoreUsers = () => {
    return (process.env["USERS_IGNORE"] || "").split(",")
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
    }
}


const timersMemory: { [key: string]: number } = {}
const timeIn = (timerId: string) => {
    timersMemory[timerId] = Date.now()
}

const timeOut = (timerId: string, prefix?: string) => {
    const timeElapsed = Date.now() - timersMemory[timerId]
    console.log(`${prefix ? prefix + " " : ""}Time elapsed ${timeElapsed} ms`)
}


const reactionManage = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    timeIn("reactionMessage")
    console.log(`User ${user.username} reacted with ${reaction.emoji.name}`)
    const embed = reaction.message.embeds[0]

    // if (embed.author?.name !== "Sondage") {
    //     return
    // }

    const descriptionOrignal = embed.description?.split("\n")[0]
    const descriptionReactions = []

    const userNamesS = await Promise.all(reaction.message.reactions.cache
        .map((mr) => mr.users.fetch().then((users) => {
            return {
                emoji: translateEmojiToText(mr.emoji.name || "No emoji"),
                users: users.filter((u) => ignoreUsers().indexOf(u.username) < 0).map(u => u.username)
            }
        })))

    for (const foundEmojiAndUsers of userNamesS.filter((fa) => fa.users.length > 0)) {
        descriptionReactions.push(`\n - ${(await foundEmojiAndUsers).emoji} : ${(await foundEmojiAndUsers).users.join(", ")}`)
    }

    if (userNamesS.some((emoji) => emoji.users.length > 0)) {
        const newDescription = `${descriptionOrignal}${descriptionReactions.join("\n")}`
        embed.description = newDescription
        const message = await reaction.message.fetch()
        await message.edit({ embeds: [embed] })
    }

    timeOut("reactionMessage", "User reaction in description")
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
