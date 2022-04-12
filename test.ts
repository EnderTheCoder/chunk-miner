
const mineflayer = require("mineflayer");
const bot = mineflayer.createBot({
    username: "name",
    host: "localhost",
})

bot.on("spawn", async () => {
    bot.setControlState("jump", true)
})