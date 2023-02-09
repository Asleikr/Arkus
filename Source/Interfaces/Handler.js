global.Event = module.exports = class Handler {
    constructor(options) {

        this.name = options.name || "";
        this.type = options.once || false;
    }

    async executeHandler(...args) {
        throw new Error(`${this.name} does not provide exec method !`);
    }
}