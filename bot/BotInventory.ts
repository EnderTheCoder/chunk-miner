export class BotInventory {

    bot
    mcData
    constructor(bot) {
        this.bot = bot
        this.mcData = require("minecraft-data")(this.bot.version)

    }

    public getSlot() {
        return this.bot.inventory.slots
    }

    public countPickaxe() {
        let slots = this.getSlot()
        let count = 0
        for (let i = 0; i < slots.length; i++) {
            if (slots[i] != null && slots[i].name.contains("_pickaxe")) count++
        }
        return count
    }

    public countAxe() {
        let slots = this.getSlot()
        let count = 0
        for (let i = 0; i < slots.length; i++) {
            if (slots[i] != null && slots[i].name.contains("_axe")) count++
        }
        return count
    }

    public countShovel() {
        let slots = this.getSlot()
        let count = 0
        for (let i = 0; i < slots.length; i++) {
            if (slots[i] != null && slots[i].name.contains("_shovel")) count++
        }
        return count
    }

    public countFood() {
        let slots = this.getSlot()
        let foods = this.mcData.foodsArray

        let count = 0

        for (let i = 0; i < slots.length; i++) {
            for (let j = 0; j < foods.length; j++) {
                if (slots[i] != null && slots[i].name == foods[j].name) count++
            }
        }
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
}