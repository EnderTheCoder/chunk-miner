import Miner from "./Miner"
import MinerChunk from "../chunk/MinerChunk";
export default class BotManager {
    public async createOfflineBots(prefix = "test", amount = 1, host = "127.0.0.1", port = 25565) {
        let bots = []

        for (let i = 0; i < amount; i++) {
            bots[i] = new Miner({
                username: prefix + i,
                host: host,
                port: port
            }, i)
        }
        return bots
    }

    public async moveToNewChunk(chunk: MinerChunk, bot: Miner) {
        await bot.goNearChunk()
    }





}