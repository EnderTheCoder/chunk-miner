import {Vec3} from "vec3";
import {goals, Movements, pathfinder} from "mineflayer-pathfinder";

import mineflayer = require("mineflayer")
import {Bot} from "mineflayer"
import {Block} from "prismarine-block"
import BotInventory from "./BotInventory";
import TaskManager from "../task/TaskManager";

const autoeat = require("mineflayer-auto-eat")
// import {MagicVec3} from "../utils/MagicVec3";

export default class Miner {

    id: number
    bot: Bot

    targetBlock: Block
    mcData
    garbageList: Array<string> = [
        "cobblestone",
        "dirt",
    ]
    state: string = "resting"
    supplyPos = {
        food: null,
        pickaxe: null,
        axe: null,
        shovel: null,
        ladder: null,
    }
    dischargePos

    supplyAmount = {
        food: 64,
        pickaxe: 5,
        axe: 1,
        shovel: 2,
        ladder: 64,
    }

    taskManagerBelongTo

    isLadderBuilder

    isCheatPlacingEnabled

    timerID

    constructor(botData, id) {

        this.bot = mineflayer.createBot(botData)
        this.bot.on("inject_allowed", () => {
            this.mcData = require("minecraft-data")(this.bot.version)
        })

        this.bot.loadPlugin(pathfinder)
        this.bot.

        this.bot.once("spawn", async () => {

            console.log("Bot " + id + " spawned")


            this.timerID = setInterval(
                () => {

                    if (this.state == "preparing") {
                        this.handleBlock()
                    }
                }, 5)
        })

        this.bot.once("end",  async (reason) => {
            console.log("Bot " + this.id + " is dead. Reason: " + reason)
            this.kill()
        })

        this.bot.on("chat", (username, message) => {
            if (message == "state") this.bot.chat(this.state)
        })
        // this.bot.loadPlugin(autoeat)
        // // this.bot.autoEat.options = {
        // //     priority: 'foodPoints',
        // //     startAt: 14,
        // //     bannedFood: []
        // // }
        // this.bot.once("spawn", () => {
        //     this.bot.autoeat.options.priority = "foodPoints"
        //     this.bot.autoEat.options.bannedFood = []
        //     this.bot.autoEat.options.eatingTimeout = 3
        // })
        // this.bot.on("autoeat_started", async () => {
        //
        //     if(!await this.inventoryCheck("food")) await this.goGetSupply()
        //     console.log("Auto Eat started!")
        // })
        this.isLadderBuilder = false
        this.isCheatPlacingEnabled = true
        this.id = id
    }
    targetPos: Vec3

    public setTarget(targetPos: Vec3) {
        this.targetPos = targetPos
        this.state = "preparing"
    }

    public linkTaskManager(task: TaskManager) {
        this.taskManagerBelongTo = task
    }

    public setLadderBuilder() {
        this.isLadderBuilder = !this.isLadderBuilder
    }

    public setCheatPlacing() {
        this.isCheatPlacingEnabled = !this.isCheatPlacingEnabled
    }

    public setSupplyPos(supplyPos, supplyType) {
        this.supplyPos[supplyType] = supplyPos
    }

    public setDischargePos(dischargePos) {
        this.dischargePos = dischargePos
    }

    public async digBlock() {
        if (!await this.inventoryCheck("tools")) await this.goGetSupply()
        this.state = "digging"
        try {
            await this.bot.dig(this.targetBlock).finally()
        } catch (e) {
            console.warn(e)
        }
    }

    private isBlockReferencable(block, offsetX, offsetY, offsetZ) {
        return this.bot.blockAt(block.position.offset(offsetX, offsetY, offsetZ)).name != "air" &&
            this.bot.blockAt(block.position.offset(offsetX, offsetY, offsetZ)).name != "lava" &&
            this.bot.blockAt(block.position.offset(offsetX, offsetY, offsetZ)).name != "water"
    }

    public findReferencableBlock() {
        let referenceBlock
        let faceVector
        if (this.isBlockReferencable(this.targetBlock, 1, 0, 0)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(1, 0, 0))
            faceVector = new Vec3(-1, 0, 0)
        } else if (this.isBlockReferencable(this.targetBlock, -1, 0, 0)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(-1, 0, 0))
            faceVector = new Vec3(1, 0, 0)
        } else if (this.isBlockReferencable(this.targetBlock, 0, 1, 0)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(0, 1, 0))
            faceVector = new Vec3(0, -1, 0)
        } else if (this.isBlockReferencable(this.targetBlock, 0, -1, 0)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(0, -1, 0))
            faceVector = new Vec3(0, 1, 0)
        } else if (this.isBlockReferencable(this.targetBlock, 0, 0, 1)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(0, 0, 1))
            faceVector = new Vec3(0, 0, -1)
        } else if (this.isBlockReferencable(this.targetBlock, 0, 0, -1)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(0, 0, -1))
            faceVector = new Vec3(0, 0, 1)
        } else {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(1, 0, 0))
            faceVector = new Vec3(-1, 0, 0)
            console.warn("WARNING: No legal reference block found. Use illegal block instead. This might cause error or ban.")
        }

        return {referenceBlock: referenceBlock, faceVector: faceVector}
    }

    public async fillLiquid() {

        let reference = this.findReferencableBlock()
        let inventory = new BotInventory(this.bot)

        // for (let i = 0; i < this.garbageList.length; i++) {
        //     if (inventory.countItem(this.garbageList[i]) > 0) {
        //         await this.bot.equip(this.mcData.itemsByName[this.garbageList[i]], "hand")
        //         break
        //     }
        // }
        try {
            console.log("place is executed")

            await this.bot.placeBlock(reference.referenceBlock, reference.faceVector)
        } catch (e) {
            console.warn(e)
        }
    }

    public async goNearTargetBlock() {
        this.state = "moving"
        try {
            const digGoal = new goals.GoalGetToBlock(this.targetBlock.position.x, this.targetBlock.position.y, this.targetBlock.position.z)
            const digMovement = new Movements(this.bot, this.mcData)
            await this.bot.equip(this.bot.pathfinder.bestHarvestTool(this.targetBlock), "hand")
            await this.bot.pathfinder.setMovements(digMovement)
            await this.bot.pathfinder.goto(digGoal)
        } catch (e) {
            const digGoal = new goals.GoalLookAtBlock(this.targetBlock.position, this.bot.world, {reach: 4})
            const digMovement = new Movements(this.bot, this.mcData)
            await this.bot.equip(this.bot.pathfinder.bestHarvestTool(this.targetBlock), "hand")
            await this.bot.pathfinder.setMovements(digMovement)
            await this.bot.pathfinder.goto(digGoal)
        }
    }

    public async goNearChunk() {
        this.state = "moving"
        console.log(this.taskManagerBelongTo.chunk.endPos.x, this.taskManagerBelongTo.chunk.endPos.z)
        const nearGoal = new goals.GoalNearXZ(this.taskManagerBelongTo.chunk.endPos.x, this.taskManagerBelongTo.chunk.endPos.z, 4)
        const nearMovement = new Movements(this.bot, this.mcData)
        await this.bot.pathfinder.setMovements(nearMovement)
        await this.bot.pathfinder.goto(nearGoal)
    }

    public async handleBlock() {

        if (await this.taskManagerBelongTo.globalBlockVersion(this.targetPos) == null) {
            console.log(this.id + "null")
            await this.goNearChunk()
        }

        this.targetBlock = await this.taskManagerBelongTo.globalBlockVersion(this.targetPos)

        if (this.targetBlock.name != "air") {
            console.log(this.targetBlock)
            if (this.targetBlock.name == "lava" || this.targetBlock.name == "water") {
                await this.goNearTargetBlock()
                await this.fillLiquid()
                this.taskManagerBelongTo.chunk.addToUnsafe(this.bot.blockAt(this.targetPos))
                return
            } else if (this.targetBlock.diggable) {
                console.log("dig")
                if (this.isSafe(this.targetBlock)) {
                    await this.goNearTargetBlock()
                    await this.digBlock()
                    this.taskManagerBelongTo.chunk.dug(this.targetBlock)
                } else {
                    this.taskManagerBelongTo.chunk.addToUnsafe(this.targetBlock)
                }
            } else {
                if (this.targetBlock.name != "air") {
                    this.taskManagerBelongTo.chunk.addToBlacklist(this.targetBlock)
                    console.log("blacklist")
                }
            }
        }
        this.state = "resting"
    }

    public async buildLadder(ladderPos: Vec3, vector: Vec3) {
        this.targetBlock = this.bot.blockAt(ladderPos)
        await this.goNearTargetBlock()
        let reference = this.findReferencableBlock()
        await this.bot.placeBlock(reference.referenceBlock, reference.faceVector)
    }

    public async inventoryCheck(supplyItemName) {
        this.state = "checkingInventory"

        let inventory = new BotInventory(this.bot)
        switch (supplyItemName) {
            case "tools": {
                if (inventory.countAxe() == 0) return false
                if (inventory.countPickaxe() == 0) return false
                if (inventory.countShovel() == 0) return false
                break
            }
            case "food": {
                if (inventory.countFood() == 0) return false
                break
            }
            case "ladder": {
                if (inventory.countItem("ladder") == 0) return false
                break
            }
        }
        return true
    }

    public async goChest(target) {
        this.state = "moving"
        const chestGoal = new goals.GoalGetToBlock(target.x, target.y, target.z)
        const chestMovement = new Movements(this.bot, this.mcData)
        chestMovement.scafoldingBlocks = []
        this.bot.pathfinder.setMovements(chestMovement)
        await this.bot.pathfinder.goto(chestGoal)
    }

    public async goDischarge() {
        await this.goChest(this.dischargePos)
        this.state = "discharging"
        let inventory = new BotInventory(this.bot)
        for (let slot of this.bot.inventory.slots) {
            if (
                slot != null &&
                !slot.name.includes("_shovel") &&
                !slot.name.includes("_pickaxe") &&
                !slot.name.includes("_axe") &&
                !inventory.isFood(slot) &&
                slot.type != this.mcData.itemsByName.ladder.id
            ) await inventory.inventoryToContainer(this.bot.blockAt(this.dischargePos), slot.type, inventory.countItem(slot.name))
        }

    }

    public async goGetSupply() {

        await this.goDischarge()
        let inventory = new BotInventory(this.bot)
        for (let key in this.supplyPos) {

            if (key != "ladder" || !this.isLadderBuilder) await this.goChest(this.supplyPos[key])

            this.state = "supplying"

            let supplyType

            switch (key) {
                case "pickaxe": {
                    supplyType = await inventory.getPickaxeType(this.bot.blockAt(this.supplyPos[key]))
                    break
                }

                case "axe": {
                    supplyType = await inventory.getAxeType(this.bot.blockAt(this.supplyPos[key]))

                    break
                }

                case "shovel": {
                    supplyType = await inventory.getShovelType(this.bot.blockAt(this.supplyPos[key]))
                    break
                }

                case "food": {
                    supplyType = await inventory.getFoodType(this.bot.blockAt(this.supplyPos[key]))

                    break
                }

                case "ladder": {
                    supplyType = this.mcData.itemsByName.ladder.id
                    break
                }
            }
            await inventory.containerToInventory(this.bot.blockAt(this.supplyPos[key]), supplyType, this.supplyAmount[key])


        }

    }

    public getState() {
        return this.state
    }

    public async follow(playerName) {
        this.state = "following"
        const followGoal = new goals.GoalFollow(this.bot.players[playerName].entity, 1)
        const followMovement = new Movements(this.bot, this.mcData)
        this.bot.pathfinder.setMovements(followMovement)
        await this.bot.pathfinder.goto(followGoal)
        this.state = "resting"
    }

    public isSafe(block): boolean {
        return new Movements(this.bot, this.mcData).safeToBreak(block)
    }

    public getBot() {
        return this.bot
    }

    public kill() {
        this.state = "dead"
        clearInterval(this.timerID)
        this.bot.quit()
        this.taskManagerBelongTo.removeMiner(this)
    }
}