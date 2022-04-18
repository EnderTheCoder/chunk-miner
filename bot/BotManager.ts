import Miner from "./Miner"
import MinerChunk from "../chunk/MinerChunk";
export default class BotManager {
    public async createOfflineBots(prefix = "test", amount = 1, host = "127.0.0.1", port = 25565, pre_commands) {
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

    public createCustomBot(username, host, port, pre_command) {
        return new Miner({
            username: username,
            host: host,
            port: port

        }, 0, pre_command)
    }

    public async moveToNewChunk(chunk: MinerChunk, bot: Miner) {
        await bot.goNearChunk()
    }





}