import TaskManager from "./task/TaskManager";
import MinerChunk from "./chunk/MinerChunk";
import {Vec3} from "vec3";
import Miner from "./bot/Miner";
import BotManager from "./bot/BotManager";
import MagicVec3 from "./utils/MagicVec3";


index().catch(console.error)

// test().finally()


async function index() {
    //create a new task
    let task = new TaskManager(new MinerChunk(new Vec3(10, 111, -36)))
    //add a bot to the task and run the task

    let botManager = new BotManager()
    let miners = await botManager.createOfflineBots("ender_bot_", 1, "localhost")




    task.addMiners(miners)
            .then(() => task.start())

}

async function test() {
    let chunk = new MinerChunk(new Vec3(2, 1, -2))
    console.log(chunk.startPos)
    let magic = new MagicVec3(new Vec3(1, 1, -1), chunk.startPos, chunk.endPos)
    console.log(magic.getOriginal())
}
