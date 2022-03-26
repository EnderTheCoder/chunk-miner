import {Vec3} from "vec3";
import {goals, Movements, pathfinder} from "mineflayer-pathfinder";
const autoEat = require('mineflayer-auto-eat')
const mineflayer = require("mineflayer")
import {BotInventory} from "./BotInventory";

export class Miner {

    id: number
    bot
    targetBlock
    mcData
    garbageList
    state
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

    isLadderBuilder

    isCheatPlacingEnabled

    constructor(botData, id) {
        this.bot = mineflayer.createBot(botData)
        this.mcData = require("minecraft-data")(this.bot.version)
        this.garbageList = [
            "cobblestone"
        ]
        this.bot.loadPlugin(pathfinder)
        this.state = "resting"

        this.bot.loadPlugin(autoEat)
        this.bot.autoEat.
        this.bot.autoEat.options = {
            priority: 'foodPoints',
            startAt: 14,
            bannedFood: []
        }
        this.bot.on("autoeat_started", async () => {

            if(!await this.inventoryCheck("food")) await this.goGetSupply()
            console.log("Auto Eat started!")
        })
        this.isLadderBuilder = false
        this.isCheatPlacingEnabled = true
        this.id = id
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

        try {
            await this.bot.dig(this.targetBlock)
        } catch (e) {
            if (e.message != "Digging aborted") throw e
        }
    }

    private isBlockReferencable(block, offsetX, offsetY, offsetZ) {
        return this.bot.blockAt(block.position.offset(offsetX, offsetY, offsetZ)) != "air" &&
            this.bot.blockAt(block.position.offset(offsetX, offsetY, offsetZ)) != "lava" &&
            this.bot.blockAt(block.position.offset(offsetX, offsetY, offsetZ)) != "water"
    }

    public async fillLiquid() {

        let referenceBlock
        let faceVector
        if (this.isBlockReferencable(this.targetBlock, 1, 0, 0)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(1, 0, 0))
            faceVector = new Vec3(-1, 0, 0)
        } else
        if (this.isBlockReferencable(this.targetBlock, -1, 0, 0)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(-1, 0, 0))
            faceVector = new Vec3(1, 0, 0)
        } else
        if (this.isBlockReferencable(this.targetBlock, 0, 1, 0)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(0, 1, 0))
            faceVector = new Vec3(0, -1, 0)
        } else
        if (this.isBlockReferencable(this.targetBlock, 0, -1, 0)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(0, -1, 0))
            faceVector = new Vec3(0, 1, 0)
        } else
        if (this.isBlockReferencable(this.targetBlock, 0, 0, 1)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(0, 0, 1))
            faceVector = new Vec3(0, 0, -1)
        } else
        if (this.isBlockReferencable(this.targetBlock, 0, 0, -1)) {
            referenceBlock = this.bot.blockAt(this.targetBlock.position.offset(0, 0, -1))
            faceVector = new Vec3(0, 0, 1)
        }

        for (let i = 0; i < this.garbageList.length; i++) {
            await this.bot.equip(this.mcData.itemsByName[this.garbageList[i]], "hand")
        }
        await this.bot.placeBlock(referenceBlock, faceVector)
    }

    public async goNearTargetBlock() {
        try {
            const digGoal = new goals.GoalLookAtBlock(this.targetBlock.position, this.bot.world, {reach: 4})
            const digMovement = new Movements(this.bot, this.mcData)
            await this.bot.equip(this.bot.pathfinder.bestHarvestTool(this.targetBlock), "hand")
            await this.bot.pathfinder.setMovements(digMovement)
            await this.bot.pathfinder.goto(digGoal)
        } catch (e) {
            const digGoal = new goals.GoalGetToBlock(this.targetBlock.position.x, this.targetBlock.position.y, this.targetBlock.position.z)
            const digMovement = new Movements(this.bot, this.mcData)
            await this.bot.equip(this.bot.pathfinder.bestHarvestTool(this.targetBlock), "hand")
            await this.bot.pathfinder.setMovements(digMovement)
            await this.bot.pathfinder.goto(digGoal)
        }
    }

    public async goNearChunk(target) {
        const nearGoal = new goals.GoalNearXZ(target, this.bot.world, 16)
        const nearMovement = new Movements(this.bot, this.mcData)
        await this.bot.pathfinder.setMovements(nearMovement)
        await this.bot.pathfinder.goto(nearGoal)
    }

    public async handleBlock(target, success: (target) => void, blackList: (target) => void, unsafe: (target) => void) {
        if (this.bot.blockAt(target) == null) {
            await this.goNearChunk(target)
        }

        this.targetBlock = this.bot.blockAt(target)

        if (this.targetBlock.name == "lava" || this.targetBlock.name == "water") {
            await this.goNearTargetBlock()
            await this.fillLiquid()
            unsafe(target)
            return
        } else if (this.bot.canDigBlock(this.targetBlock)) {
            const safeDigMovement = new Movements(this.bot, this.mcData)
            if (safeDigMovement.safeToBreak(this.targetBlock)) {
                await this.goNearTargetBlock()
                await this.digBlock()
                return
            } else {
                unsafe(target)
            }
        } else {
            blackList(target)
        }
    }



    public async inventoryCheck(supplyItemName) {
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
        const chestGoal = new goals.GoalGetToBlock(target.x, target.y, target.z)
        const chestMovement = new Movements(this.bot, this.mcData)
        chestMovement.scafoldingBlocks = []
        this.bot.pathfinder.setMovements(chestMovement)
        await this.bot.pathfinder.goto(chestGoal)
    }

    public async goDischarge() {
        await this.goChest(this.dischargePos)

        let inventory = new BotInventory(this.bot)
        for (let slot of this.bot.inventory.slots) {
            if (
                slot != null &&
                !slot.name.contains("_shovel") &&
                !slot.name.contains("_pickaxe") &&
                !slot.name.contains("_axe") &&
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


    public async follow(playerName) {
        const followGoal = new goals.GoalFollow(this.bot.players[playerName].entity, 1)
        const followMovement = new Movements(this.bot, this.mcData)
        this.bot.pathfinder.setMovements(followMovement)
        this.bot.pathfinder.setGoal(followGoal)
    }

    public async stop() {

    }
}