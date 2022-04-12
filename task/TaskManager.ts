import MagicVec3 from "../utils/MagicVec3"
import Miner from "../bot/Miner";
import MinerChunk from "../chunk/MinerChunk";
import {Vec3} from "vec3";

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

    public changePos() {
        if (this.position.getMagic().x == this.position.getMagicStartPos().x && this.position.getMagic().z == this.position.getMagicStartPos().z) {
            this.position.getMagic().y--
            this.position.getMagic().x = this.position.getMagicEndPos().x
            this.position.getMagic().z = this.position.getMagicEndPos().z

            console.log("level:" + this.position.getMagic().y)
        } else if (this.position.getMagic().z == this.position.getMagicStartPos().z) {
            this.position.getMagic().x--
            this.position.getMagic().z = this.position.getMagicEndPos().z
        } else this.position.getMagic().z--
    }


    public run() {

        let miner = this.pickUpRestingBot()
        if (miner == null) return

        this.changePos()

        // console.log(this.position.getMagic())

        this.dealUnsafeBlocks(miner)
            .then(
                async () => {
                    miner.setTarget(this.position.getOriginal())
                }
            )

        miner.setTarget(this.position.getOriginal())

    }

    public getStartPos() {
        while (this.globalBlockVersion(this.position.getOriginal()) == null || this.globalBlockVersion(this.position.getOriginal()).name == "air") {
            this.changePos()
        }
    }

    public start() {
        // this.getStartPos()
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

    public globalBlockVersion(pos: Vec3) {
        for (let miner of this.minerList) {
            let block = miner.bot.blockAt(pos)
            if (block != null) return block
        }
        return null
    }

    public async stop() {
        clearInterval(this.timerID)
    }

    public async info() {

    }

}