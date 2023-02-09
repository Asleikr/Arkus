const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { connect, connection: db, default: mongoose } = require("mongoose");
const { resolve } = require("path");
const { sync } = require("glob");

const Command = require("./Command");
const Handler = require("./Handler");

module.exports = class Application extends Client {
    constructor() { super({
        intents: [],
        partials: [],
        allowedMentions: { parse: ["roles", "users"], repliedUser: false,},
        });

        this.cooldowns = new Collection();
        this.commands = new Collection();
        this.handlers = new Collection();
        this.aliases = new Collection();

        this.config = require("../Utils/Config");
        this.logger = require("../utils/Logger");

        mongoose.set('strictQuery', false);
        db.on('connected', async () => this.logger.log(`Successfully connected to the database! (Latency: ${Math.round(await this.getDatabasePing())}ms)`, { tag: 'Database' }));
        db.on('disconnected', () => this.logger.error('Disconnected from the database!', { tag: 'Database' }));
        db.on('error', (error) => this.logger.error(`Unable to connect to the database!\nError: ${error}`, { tag: 'Database' }));
        db.on('reconnected', async () => this.logger.log(`Reconnected to the database! (Latency: ${Math.round(await this.getDatabasePing())}ms)`, { tag: 'Database' }));
    };

    async loadOnlineDatabase() {
        return await connect(process.env.MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    };

    async getDatabasePing() {
        const cNano = process.hrtime();
        await db.db.command({ ping: 1 });
        const time = process.hrtime(cNano);
        return (time[0] * 1e9 + time[1]) * 1e-6;
    };

    searchEachCommands() {
        const cmdFile = sync(resolve("./Source/Commands/**/*.js"));
        cmdFile.forEach((filepath) => {
            const File = require(filepath);
            if (!(File.prototype instanceof Command)) return;
            const command = new File();
            command.client = this;
            this.commands.set(command.name, command);
            command.aliases.forEach((alias) => {
                this.aliases.set(alias, command.name);
            });
        });
    };

    searchEachHandlers() {
        const handler_file = sync(resolve("./Source/Handlers/*.js"));
        handler_file.forEach((filepath) => {
            const File = require(filepath);
            if (!(File.prototype instanceof Handler)) return;
            const handler = new File();
            handler.client = this;
            this.events.set(handler.name, handler);
            const emitter = event.emitter ? typeof handler.emitter === "string" ? this[handler.emitter] : emitter : this;
            emitter[handler.type ? "once": "on"](handler.name, (...args) => handler.executeHandler(...args));
        });
    };

    async loadAllPrograms() {
        this.loadOnlineDatabase();
        this.searchEachCommands();
        this.searchEachEvents();
        return super.login(this.config.token);
    };
};