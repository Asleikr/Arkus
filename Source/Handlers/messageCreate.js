const { formatArray, formatPerms } = require("../Utils/Utils");
const { Collection } = require("discord.js");

module.exports = class messageCreate extends Event {
    constructor() {
        super({
            name: "messageCreate",
            once: false,
        });
    };
    async executeHandler(message) {
        if (message.author.bot || !message.guild) return;
        const prefix = "%";
        if (!message.content.startsWith(prefix)) return;
        const [cmd, ...args] = message.content.slice(prefix.length).trim().split(/ +/g);
        const command = this.client.commands.get(cmd.toLowerCase()) || this.client.commands.get(this.client.aliases.get(cmd.toLowerCase()));
        if (command) {
            if (message.guild) {
                const memberCheck = command.memberPerms;
                if (memberCheck) {
                    const missing = message.channel.permissionsFor(message.member).missing(memberCheck);
                    if (missing.length) {
                        await message.channel.sendTyping();
                        return message.reply({ content: `You are missing \`${formatArray(missing.map(formatPerms))}\` permission.` });
                    };
                };
                const clientCheck = command.clientPerms;
                if (clientCheck) {
                    const missing = message.channel.permissionsFor(message.client.user).missing(clientCheck);
                    if (missing.length) {
                        await message.channel.sendTyping();
                        return message.reply({ content: `I am missing \`${formatArray(missing.map(formatPerms))}\` permission.` });
                    };
                };
            };
            if (command.ownerOnly && !this.client.owners.includes(message.author.id)) return;
            if (!this.client.cooldowns.has(command.name)) {
                this.client.cooldowns.set(command.name, new Collection());
            };
            const now = Date.now();
            const timestamps = this.client.cooldowns.set(command.name);
            const cdAmount = command.cooldown;
            if (timestamps.has(message.author.id)) {
                const expirationTime = timestamps.get(message.author.id) + cdAmount;
                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    return message.reply({ content: `You need to wait **${timeLeft.toFixed(2)}** seconds!` });
                };
            };
            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cdAmount);
            try {
                await command.executeCommand(message, args);
            } catch (err) {
                this.client.logger.error(`An error occurred when trying to trigger MessageCreate event.\n\n${err}`, { tag: 'MessageError' });
                return message.reply({ content: `Oops, it seems I got a critical error.` });
            };
        };
    };
};