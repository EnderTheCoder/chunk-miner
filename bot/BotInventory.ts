export default class BotInventory {

    bot
    mcData
    constructor(bot) {
        this.bot = bot
        this.mcData = require("minecraft-data")(this.bot.version)

    }

   private contains(str1, str2) {
        return str1.search(str2) != -1
    }

    public getSlot() {
        return this.bot.inventory.slots
    }

    public countPickaxe() {
        let slots = this.getSlot()
        let count = 0
        for (let i = 0; i < slots.length; i++) {
            if (slots[i] != null && this.contains(slots[i].name, "_pickaxe")) count++
        }
        return count
    }

    public countAxe() {
        let slots = this.getSlot()
        let count = 0
        for (let i = 0; i < slots.length; i++) {
            if (slots[i] != null && this.contains(slots[i].name, "_axe")) count++
        }
        return count
    }

    public countShovel() {
        let slots = this.getSlot()
        let count = 0
        for (let i = 0; i < slots.length; i++) {
            if (slots[i] != null && this.contains(slots[i].name, "_shovel")) count++
        }
        return count
    }

    public countFood() {
        let slots = this.getSlot()

        let count = 0

        for (let i = 0; i < slots.length; i++)
            if (slots[i] != null && this.isFood(slots[i])) count++

        return count
    }

    public countItem(name) {
        let slots = this.getSlot()
        let count = 0
        for (let i = 0; i < slots.length; i++) {
            if (slots[i] != null && slots[i].name == name) count++
        }
        return count
    }

    public async containerToInventory(containerBlock, itemType, count) {
        let containerWindow = await this.bot.openContainer(containerBlock)
        await containerWindow.withdraw(itemType, null, count, null)
        containerWindow.close()
    }

    public async inventoryToContainer(containerBlock, itemType, count) {
        let containerWindow = await this.bot.openContainer(containerBlock)
        await containerWindow.deposit(itemType, null, count, null)
        containerWindow.close()
    }

    public async getPickaxeType(containerBlock) {
        let slots = await this.bot.openContainer(containerBlock).slots
        for (let i = 0; i < slots.length - 27; i++) {
            if (slots[i] != null && slots[i].name.contains("_pickaxe")) return slots[i].type
        }
    }

    public async getShovelType(containerBlock) {
        let slots = await this.bot.openContainer(containerBlock).slots
        for (let i = 0; i < slots.length - 27; i++) {
            if (slots[i] != null && slots[i].name.contains("_shovel")) return slots[i].type
        }
    }

    public async getAxeType(containerBlock) {
        let slots = await this.bot.openContainer(containerBlock).slots
        for (let i = 0; i < slots.length - 27; i++) {
            if (slots[i] != null && slots[i].name.contains("_axe")) return slots[i].type
        }
    }

    public async getFoodType(containerBlock) {
        let slots = await this.bot.openContainer(containerBlock).slots
        for (let slot of slots)
            if (slot != null && this.isFood(slot)) return slot.type

    }

    public isFood(item) {
        for (let food of this.mcData.foodsArray) {
            if (food.type == item.type) return true
        }
        return false
    }

}