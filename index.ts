import TaskManager from "./task/TaskManager";
import MinerChunk from "./chunk/MinerChunk";
import {Vec3} from "vec3";
import Miner from "./bot/Miner";
import BotManager from "./bot/BotManager";
import MagicVec3 from "./utils/MagicVec3";



let bot_manager = new BotManager()
let miner = bot_manager.createCustomBot("EnderTheCoder", "pfh.world", 25565, "/login qn63uxs")

let target = 64*64

miner.bot.once("spawn", async () => {
    // let task_manager = new TaskManager(new MinerChunk(miner.bot.entity.position))
    // task_manager.addMiner(miner)
    // task_manager.start()
    // console.log(miner.mcData.blocksByName.diamond_ore.id)
    // await miner.bot.waitForChunksToLoad()
    // miner.bot.chat("开始扫描区域矿物")
    let diamonds = miner.bot.findBlocks({
        matching: miner.mcData.blocksByName.diamond_ore.id,
        maxDistance: 128,
        count: 128
    })
    // console.log(diamonds)
    // miner.bot.chat("扫描到加载区域内钻石数量" + diamonds.length)
    // for (let diamond of diamonds) {
    //     await miner.bot.waitForTicks(20)
    //     miner.bot.chat("目标钻石坐标：(" + diamond.x + ", " + diamond.y + ", " + diamond.z + ")")
    // }
    
    miner.bot.chat("开始刷石机生产，生产目标：" + target)
    await miner.bot.waitForChunksToLoad()
    let count = 0
    while(count < target) {
        let stone = miner.bot.findBlock({
            matching: miner.mcData.blocksByName.cobblestone.id,
            maxDistance: 3,
        })
        if (stone == null) {
            miner.bot.chat("错误，未检测到圆石")
            await miner.bot.waitForTicks(20)
            continue
        }
        await miner.bot.equip(miner.bot.pathfinder.bestHarvestTool(stone), "hand")
        await miner.bot.dig(stone)
        if (count % 32 == 0) miner.bot.chat("进度：" + count + "/" + target)

        count++
        // console.log("进度：" + count + "/" + target)
    }
    miner.bot.chat("Mission Complete!")
})
miner.bot.on("kicked", console.log)
miner.bot.on("messagestr", (message) => {
    console.log(message)
})