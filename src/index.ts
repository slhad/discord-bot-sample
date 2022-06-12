import { SlashCommandBuilder } from "@discordjs/builders"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v10"
import { Application, Client } from "discord.js"
import { clientId, guildId, Token } from "../config.json"


const client = new Client({ intents: 8 })
const rest = new REST({ version: "10" }).setToken(Token)


const cleanCommands = async () => {
    const r = await rest.get(Routes.applicationGuildCommands(clientId, guildId)) as Application[]
    for (const app of r) {
        await rest.delete(Routes.applicationGuildCommand(clientId, guildId, app.id))
    }

}



const run = async () => {

    await cleanCommands()

    const cmd = new SlashCommandBuilder()
        .setName("toast")
        .setDescription("plop")
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [cmd] })
}

client.login(Token).then(run).catch(({ message, stack }) => {
    console.log(`${message} : ${stack}`)
})
