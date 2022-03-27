const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')

var Vec3 = require("vec3");

const bot = mineflayer.createBot({
    host: "localhost",
    username: "test"
})

bot.loadPlugin(pathfinder)
let mcData

bot.once("spawn", () => {
    mcData = require("minecraft-data")(bot.version)
    goNearChunk().then(() => {
        bot.chat("arrived")
    })
})

async function goNearChunk() {
    const nearGoal = new goals.GoalNearXZ(15, 17, 4)
    // console.log(this.mcData)
    const nearMovement = new Movements(bot, mcData)
    await bot.pathfinder.setMovements(nearMovement)
    await bot.pathfinder.goto(nearGoal)
    console.log("near")
}
