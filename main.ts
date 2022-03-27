import TaskManager from "./task/TaskManager";
import MinerChunk from "./chunk/MinerChunk";
import {Vec3} from "vec3";
import Miner from "./bot/Miner";
import BotManager from "./bot/BotManager";


main().catch(console.error)




async function main() {
    //create a new task
    let task = new TaskManager(new MinerChunk(new Vec3(-29, 112, 5)))
    //add a bot to the task and run the task

    let botManager = new BotManager()
    let miners = await botManager.createOfflineBots("ender_bot_", 5, "localhost")




    task.addMiners(miners)
            .then(() => task.start())

}
