import TaskManager from "./task/TaskManager";

const mineflayer = require("mineflayer");

import Miner from "./bot/Miner";
import BotManager from "./bot/BotManager";

// const bot = mineflayer.createBot({
//     username: "ender_bot",
//     host: "www.bierdl.cn",
// })
//
// let spamLock = 1
//
// let checkPoint = false
import {goals, pathfinder} from "mineflayer-pathfinder"
import MinerChunk from "./chunk/MinerChunk";
import {Vec3} from "vec3";
//
// bot.on("spawn", async () => {
//     const mcData = require("minecraft-data")(bot.version)
//     bot.loadPlugin(pathfinder)
//     await bot.waitForChunksToLoad()
//     bot.chat("/login 1991455223")
//     await bot.waitForTicks(20)
//     bot.on("chat", async (username, message) => {
//             // if (Date.now() - spamLock > 1000) {
//             //     spamLock = Date.now()
//             //     if (username != bot.username) {
//             //         // bot.chat("啊对对对" + Date.now())
//             //         checkPoint = !checkPoint
//             //     }
//             // }
//             if (username == "EnderTheCoder") {
//                 message = message.split(" ")[0]
//                 switch (message) {
//                     case "follow": {
//                         bot.chat("前往Master所在位置" + Date.now())
//                         bot.pathfinder.setGoal(new goals.GoalFollow(bot.players["EnderTheCoder"].entity, 1))
//                         break
//                     }
//
//                     case "teleport": {
//                         bot.chat("/tpa EnderTheCoder")
//                         break
//                     }
//
//                     case "scan": {
//                         bot.chat(Date.now() + "开始寻找目标范围内最近的钻石")
//                         let diamonds = bot.findBlocks({
//                             matching: mcData.blocksByName.diamond_ore.id,
//                             count: 10
//                         })
//                         await bot.waitForTicks(60)
//
//                         if (diamonds.length == 0) {
//                             bot.chat(Date.now() + "未发现目标")
//                         } else {
//
//                             for (let diamond of diamonds) {
//                                 bot.chat("目标钻石坐标：(" + diamond.position.x + ", " + diamond.position.y + ", " + diamond.position.z + ")")
//                                 await bot.waitForTicks(50)
//                             }
//                         }
//                         break
//                     }
//                     case "chunk": {
//
//
//
//                         break
//                     }
//                 }
//             }
//
//         }
//     )
// })

let bot_manager = new BotManager()
let miner = bot_manager.createCustomBot("ender_bot", "www.bierdl.cn", 25565, "/login 1991455223")

miner.bot.on("messagestr", (message) => {
    console.log(message)
})

miner.bot.on("chat", async (username, message) => {
    // if (Date.now() - spamLock > 1000) {
    //     spamLock = Date.now()
    //     if (username != bot.username) {
    //         // bot.chat("啊对对对" + Date.now())
    //         checkPoint = !checkPoint
    //     }
    // }
    if (username == "EnderTheCoder") {
        message = message.split(" ")[0]
        switch (message) {
            case "follow": {
                miner.bot.chat("前往Master所在位置" + Date.now())
                miner.bot.pathfinder.setGoal(new goals.GoalFollow(miner.bot.players["EnderTheCoder"].entity, 1))
                break
            }

            case "teleport": {
                miner.bot.chat("/tpa EnderTheCoder")
                break
            }

            case "scan": {
                miner.bot.chat(Date.now() + "开始寻找目标范围内最近的钻石")
                let diamonds = miner.bot.findBlocks({
                    matching: miner.mcData.blocksByName.diamond_ore.id,
                    count: 10
                })
                await miner.bot.waitForTicks(60)

                if (diamonds.length == 0) {
                    miner.bot.chat(Date.now() + "未发现目标")
                } else {

                    for (let diamond of diamonds) {
                        miner.bot.chat("目标钻石坐标：(" + diamond.x + ", " + diamond.y + ", " + diamond.z + ")")
                        await miner.bot.waitForTicks(50)
                    }
                }
                break
            }
            case "chunk": {
                console.log("chunk now")
                let task_manager = new TaskManager(new MinerChunk(miner.bot.entity.position))
                task_manager.addMiner(miner)
                task_manager.start()
                break
            }
        }
    }
})

miner.bot.on("kicked", console.log)


// bot.once("windowOpen", (window)=>{window.cl})