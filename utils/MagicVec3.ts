import {Vec3} from "vec3";

class MagicVec3 {

    private readonly originalVec3
    private readonly magicVec3
    private startPos
    private endPos

    /*WARNING: YOU ARE NOT EXPECTED TO UNDERSTAND THIS
    * type:true is original to magic, type:false is magic to original
    * */
    public magicVec3Transfer(startPos, endPos, inputPos, type) {
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

    //input originVec3 to get magicVec3
    constructor(originalVec3, startPos, endPos) {
        this.originalVec3 = originalVec3
        this.magicVec3 = this.magicVec3Transfer(startPos, endPos, originalVec3, true)
        this.startPos = startPos
        this.endPos = endPos

    }


    public getOriginal() {
        return this.originalVec3
    }

    public getMagic() {
        return this.magicVec3
    }
}