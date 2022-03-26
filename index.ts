import * as process from "process";

const mineflayer = require("mineflayer")
const {pathfinder, goals, Movements} = require("mineflayer-pathfinder")
const bot = mineflayer.createBot({
    username: "test",
    host: "localhost",
})
const Vec3 = require('vec3').Vec3;
const minecraftData = require("minecraft-data")("1.18.2")


const ownerName = "EnderTheCoder"

bot.loadPlugin(pathfinder)

let botState = "resting"
let target

bot.once("spawn", async () => {
    bot.waitForChunksToLoad().then(() => {
    })

})

bot.on("chat", async (username, message) => {

    if (username == ownerName) {
        switch (message) {
            case "run": {
                bot.chat("running")
                botState = "running"
                bot.waitForChunksToLoad().then(() => {
                    main()
                })
                break
            }

            case "follow": {
                botState = "following"
                bot.chat("following")
                const followGoal = new goals.GoalFollow(bot.players[ownerName].entity)
                const followMovement = new Movements(bot, minecraftData)
                bot.pathfinder.setMovements(followMovement)
                bot.pathfinder.setGoal(followGoal)
                break
            }

            case "stop": {
                bot.chat("stopped")
                // botState = "resting"
                // bot.stopDigging()
                // bot.pathfinder.stop()
                // bot.pathfinder.setGoal(null)
                process.exit(0)
                break
            }

            case "chunk": {
                console.log(getChunkCorner(bot.entity.position))
                break
            }

            case "state": {
                bot.chat(botState)
                break
            }


        }

    }

})

async function main() {
    let cornerPos = getChunkCorner(bot.entity.position)
    target = cornerPos[1];
    while (target != cornerPos[0]) {
        await searchChunk(target, cornerPos[0], cornerPos[1])
        await go()
        await dig()
    }
}


async function go() {

    if (botState == "resting") bot.pathfinder.stop()

    const digGoal = new goals.GoalGetToBlock(target.x, target.y, target.z)
    const digMovement = new Movements(bot, minecraftData)
    await bot.equip(bot.pathfinder.bestHarvestTool(bot.blockAt(target)), "hand")

    await bot.pathfinder.setMovements(digMovement)
    await bot.pathfinder.goto(digGoal)
}

async function dig() {
    // console.log(target)
    console.log(bot.world.getBlock(target))
    await bot.dig(bot.world.getBlock(target))
}

/*WARNING: YOU ARE NOT EXPECTED TO UNDERSTAND THIS
* true is real to fake, false is fake to real
* */
function magicVec3Transfer(startPos, endPos, inputPos, type) {

    return type ?
        new Vec3(
            Math.abs(inputPos.x) - Math.abs(startPos.x),
            inputPos.y,
            Math.abs(inputPos.z) - Math.abs(startPos.z)) :
        new Vec3(
            startPos.x > 0 ? 0 + (inputPos.x + Math.abs(startPos.x)) : 0 - (inputPos.x + Math.abs(startPos.x)),
            inputPos.y,
            startPos.z > 0 ? 0 + (inputPos.z + Math.abs(startPos.z)) : 0 - (inputPos.z + Math.abs(startPos.z)),)
}


async function searchChunk(nowPos, startPos, endPos) {
    // console.log("start", startPos)
    // console.log("end", endPos)
    // console.log("now", nowPos)

    let magicStartPos = magicVec3Transfer(startPos, endPos, startPos, true),
        magicEndPos = magicVec3Transfer(startPos, endPos, endPos, true),
        magicNowPos = magicVec3Transfer(startPos, endPos, nowPos, true)

    for (; magicNowPos.y >= magicStartPos.y; magicNowPos.y--)
        for (magicNowPos.x = magicEndPos.x; magicNowPos.x >= magicStartPos.x; magicNowPos.x--)
            for (magicNowPos.z = magicEndPos.z; magicNowPos.z >= magicStartPos.z; magicNowPos.z--) {


                nowPos = magicVec3Transfer(startPos, endPos, magicNowPos, false)
                // console.log(nowPos)
                // console.log(bot.world.getBlock(nowPos))
                if (botState == "resting") return nowPos

                if (
                    bot.blockAt(nowPos) != null &&
                    bot.blockAt(nowPos).name != "air"
                    // pathfinder.safeToBreak(bot.blockAt(nowPos))
                ) {
                    console.log("Target Found")
                    // console.log(nowPos)
                    target = nowPos
                    return nowPos
                }
            }
}

function getChunkCorner(pos) {
    let startPos = new Vec3((pos.x) - pos.x % 16, -64, pos.z - pos.z % 16)
    let endPos = new Vec3((startPos.x > 0) ? startPos.x + 15 : startPos.x - 15, 128, (startPos.z > 0) ? startPos.z + 15 : startPos.z - 15)
    return [startPos, endPos]
}
