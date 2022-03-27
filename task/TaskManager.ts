import MagicVec3 from "../utils/MagicVec3"
import Miner from "../bot/Miner";
import MinerChunk from "../chunk/MinerChunk";

const mineflayer = require("mineflayer")

export default class TaskManager {

    position: MagicVec3
    minerList = []
    chunk: MinerChunk
    timerID
    constructor(chunk: MinerChunk) {

        this.chunk = chunk
        this.position = new MagicVec3(chunk.endPos, chunk.startPos, chunk.endPos)

    }

    public async addMiners(miners: Array<Miner>) {
        for (let miner of miners) {
            this.minerList[this.minerList.length] = miner
            miner.linkTaskManager(this)
        }
    }

    public async removeMiner(miner: Miner) {
        for (let i = 0; i < this.minerList.length; i++) if (miner == this.minerList[i]) this.minerList.splice(i, 1)
    }

    public run() {

        let miner = this.pickUpRestingBot()
        if (miner == null) return

        if (this.position.getMagic().x == this.position.getMagicStartPos().x && this.position.getMagic().z == this.position.getMagicStartPos().z) {
            this.position.getMagic().y--
            this.position.getMagic().x = this.position.getMagicEndPos().x
            this.position.getMagic().z = this.position.getMagicEndPos().z
        } else if (this.position.getMagic().z == this.position.getMagicStartPos().z) {
            this.position.getMagic().x--
            this.position.getMagic().z = this.position.getMagicEndPos().z
        } else this.position.getMagic().z--

        // console.log(this.position.getMagic())

        this.dealUnsafeBlocks(miner)
            .then(
                async () => {
                    miner.setTarget(this.position.getOriginal())
                }
            )

        miner.setTarget(this.position.getOriginal())

    }

    public start() {

        this.timerID = setInterval(async () => {
            this.run()
        }, 5)

    }

    public async dealUnsafeBlocks(miner: Miner) {
        for (let block of this.chunk.unsafe) {
            if (miner.isSafe(block)) await miner.setTarget(block.position)
        }
    }


    public pickUpRestingBot(): Miner {
        for (let miner of this.minerList) {
            if (miner.getState() == "resting") return miner
        }
        return null
    }

    public async complete() {
        console.log('Task Completed at CHUNK(' + this.chunk.getX() + ', ' + this.chunk.getZ() + ')')

    }

    public async stop() {
        clearInterval(this.timerID)
    }

    public async info() {

    }

}