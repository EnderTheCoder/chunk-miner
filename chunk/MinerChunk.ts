import {Vec3} from "vec3";

export default class MinerChunk {
    startPos
    endPos

    blacklist = []
    unsafe = []

    completed = []

    blockDugAmount = 0
    blockTotalAmount = 0

    chunkX
    chunkZ

    constructor(position: Vec3) {
        let corner = this.getChunkCorner(position)
        this.startPos = corner.startPos
        this.endPos = corner.endPos
        this.chunkX = this.startPos.x / 16
        this.chunkZ = this.startPos.z / 16

    }

    // public getChunkCorner(pos: Vec3) {
    //     return {startPos: new Vec3(pos.x >> 4 << 4, -64, pos.z >> 4 << 4), endPos: new Vec3(pos.x | 15, 128, pos.z | 15)}
    // }

    public getChunkCorner(pos) {
        let startPos = new Vec3((pos.x) - pos.x % 16, -64, pos.z - pos.z % 16)
        if (pos.x < 0) startPos.x--
        if (pos.z < 0) startPos.z--
        let endPos = new Vec3((startPos.x >= 0) ? startPos.x + 15 : startPos.x - 15, 128, (startPos.z >= 0) ? startPos.z + 15 : startPos.z - 15)
        return {startPos: startPos, endPos: endPos}
    }

    public dug(block) {
        this.blockDugAmount++
        // this.completed[block.position.x][block.position.y][block.position.z] = true
    }

    public isBlacklisted(position): boolean {
        for (let block of this.blacklist) if (block.position == position) return true
        return false
    }

    public addToBlacklist(block) {
        this.blacklist[this.blacklist.length] = block
    }

    public removeFromBlacklist(block) {
        for (let i = 0; i < this.blacklist.length; i++) {
            if (this.blacklist[i].position == block.position) this.blacklist.splice(i, 1)
        }
    }

    public addToUnsafe(block) {
        this.unsafe[this.unsafe.length] = block
    }

    public removeFromUnsafe(block) {
        for (let i = 0; i < this.unsafe.length; i++) {
            if (this.unsafe[i].position == block.position) this.unsafe.splice(i, 1)
        }
    }

    public isInBlacklist(block) {
        for (let i of this.blacklist) if (i.position == block.position) return true
        return false
    }

    public isInUnsafe(block) {
        for (let i of this.unsafe) if (i.position == block.position) return true
        return false
    }

    public getX() {
        return this.chunkX
    }

    public getZ() {
        return this.chunkZ
    }

}