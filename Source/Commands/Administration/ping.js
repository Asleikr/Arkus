const { EmbedBuilder } = require("discord.js");

module.exports = class Ping extends Command {
    constructor() {
        super({
            name: "ping",
            aliases: ["pong"],
            description: "Ping command",
            category: "Misc",
            ownerOnly: false,
            cooldown: 3000,
            memberPerms: [],
            clientPerms: [],
        });
    };
    async executeCommand(message) {
        const emb = new EmbedBuilder()
            .setColor("#2f3136")
            .setDescription(`Database: ${Math.round(await this.client.databasePing())}ms\nBot: ${Math.round(message.createdTimestamp - Date.now())}ms`);
        return message.channel.send({ embeds: [emb] });
    };
};