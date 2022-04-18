const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const armorManager = require('mineflayer-armor-manager')
const autoeat = require('mineflayer-auto-eat')
const {pathfinder, Movements, goals} = require('mineflayer-pathfinder')
var Vec3 = require("vec3");

const GoalFollow = goals.GoalFollow
//const GoalBlock = goals.GoalBlock
const {goals: {GoalNear}} = require('mineflayer-pathfinder')

const {time} = require('console');

const {exec} = require('child_process');

const RANGE_GOAL = 2 // get within this radius of the playera

async function createBot() {
    await new Promise(resolve => setTimeout(resolve, 10000));
    const bot = mineflayer.createBot({
        // fp-bot-001-010\snowcatman  host is in offline mode
        //
        host: '192.168.86.146',
        //host: "pix3lpirat3.com",
        //host: 'localhost',
        //port: 25568,
        //username: "MrPaver"
        //username: "snow_alt_002@outlook.com",
        username: "snowcatman@hotmail.com",
        auth: 'microsoft'
    })

    bot.loadPlugin(pvp)
    bot.loadPlugin(armorManager)
    bot.loadPlugin(pathfinder)
    // Load the plugin
    bot.loadPlugin(autoeat)

    bot.once('spawn', () => {
        const mcData = require('minecraft-data')(bot.version)
        const defaultMove = new Movements(bot, mcData)

        bot.autoEat.options = {
            priority: 'foodPoints',
            startAt: 14,
            bannedFood: []
        }

        bot.on('chat', (username, message) => {
            if (username === bot.username) return
            if (message !== 'come') return
            const target = bot.players[username].entity
            if (!target) {
                bot.chat("I don't see you !")
                return
            }
            const {
                x: playerX,
                y: playerY,
                z: playerZ
            } = target.position

            bot.pathfinder.setMovements(defaultMove)
            bot.pathfinder.setGoal(new GoalNear(playerX, playerY, playerZ, RANGE_GOAL))
        })
    })

    var isGuarding = false;
    var isFallowing = false;
    var issleepp = false;
    var playerToFallow = ""

    bot.on('playerCollect', (collector, itemDrop) => {
        if (collector !== bot.entity) return

        setTimeout(() => {
            const sword = bot.inventory.items().find(item => item.name.includes('sword'))
            if (sword) bot.equip(sword, 'hand')
        }, 150)
    })

    bot.on('playerCollect', (collector, itemDrop) => {
        if (collector !== bot.entity) return

        setTimeout(() => {
            const shield = bot.inventory.items().find(item => item.name.includes('shield'))
            if (shield) bot.equip(shield, 'off-hand')
        }, 250)
    })

    bot.on("chat", async function (username, message) {
        var controllers = ["MrSnowcatman", "Me", "You", "Myself"];
        const command = message.split(' ') //split message up by a space " ".
        if (!controllers.includes(username)) return   // if not controller do nothing
        if (command[0] == bot.username)  // if it me the bot continue
            console.log(command[1])
        console.log(command[2])
        if (command[1]) {
            switch (true) {
                case command === 'loaded':
                    await bot.waitForChunksToLoad()
                    bot.chat('Ready!')
                    break
                case /^list$/.test(command[1]):
                    console.log('list cmd trigerd')
                    sayItems()
                    break
                case /^toss \d+ \w+$/.test(command[1]):
                    // toss amount name
                    // ex: toss 64 diamond
                    tossItem(command[2], command[1])
                    break
                case /^toss \w+$/.test(command[1]):
                    // toss name
                    // ex: toss diamond
                    tossItem(command[1])
                    break
                case /^equip [\w-]+ \w+$/.test(command[1]):
                    // equip destination name
                    // ex: equip hand diamond
                    equipItem(command[2], command[1])
                    break
                case /^unequip \w+$/.test(command[1]):
                    // unequip testination
                    // ex: unequip hand
                    unequipItem(command[1])
                    break
                case /^use$/.test(command[1]):
                    useEquippedItem()
                    break
                case /^craft \d+ \w+$/.test(command[1]):
                    // craft amount item
                    // ex: craft 64 stick
                    craftItem(command[2], command[1])
                    break
                case /^whatsyourinfo$/.test(command[1]):
                    mybotinfo()
                    break
            }
        }
    })

    bot.on("chat", async function (username, message) {
        var controllers = ["MrSnowcatman", "Me", "You", "Myself"];
        if (!controllers.includes(username)) return;
        switch (message) {
            case 'tossall':
                tossAllItem()
                console.log("triger user tossall");
                break
            case 'fallowme':
                playerToFallow = username
                followPlayer(playerToFallow)
                isFallowing = true
                console.log("triger user fallowme");
                break
            case 'guardhere':
                doguard(username)
                console.log('triger ', username, ' guardhere');
                break
            case 'asyouwere':
                console.log("triger user return to guardhere");
                if (!guardPos) return
                break
            case 'stop':
                StopAll()
                isGuarding = false;
                isFallowing = false;
                console.log("trigerd stop all command")
                break
            case 'sleep':
                goToSleep()
                //bot.chat('going to sleep')
                console.log("bot.on(chat) trigerd gotosleep()")
                break
            case 'wakeup':
                wakeUp()
                console.log("bot.on(chat) triggerd wakeup()")
                break
        }
    })

    let guardPos = null

    // Called when the bot has killed it's target.
    bot.on('stoppedAttacking', () => {
        if (guardPos) {
            moveToGuardPos()
        }
    })

    // Check for new enemies to attack
    bot.on('physicsTick', () => {


        if (bot.isSleeping) {
            // const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 14 &&
            const filter = e => e.type === 'mob' && e.position.distanceTo(guardPos) < 14 && e.mobType !== 'Armor Stand'
            // Mojang classifies armor stands as mobs for some reason?


            const entity = bot.nearestEntity(filter)   // getting entity error can not read null  <------


            if (entity) {
                // Start attacking
                bot.pvp.attack(entity)
                //bot.chat('on the attack')
                console.log('attack hostile intities')
            }
        }
    })

    //===========================================================================
    async function tossAllItem() {
        for (let slot of bot.inventory.slots) {
            if (slot == null) continue
            await bot.toss(slot.type, null, slot.count)
        }
    }

    //===========================================================================
    function guardArea(pos) {
        guardPos = new Vec3(pos.x, pos.y, pos.z)
        // We are not currently in combat, move to the guard pos
        if (!bot.pvp.target) {
            moveToGuardPos()
            //console("triger pos 02 ", pos)
        }
    }

    //===========================================================================
    function followPlayer(username) {
        console.log("trigered followplayer function")
        const followPlr = bot.players[username]

        if (!followPlr || !followPlr.entity) {
            bot.chat("I can't see ", username, "!")
            return
        }

        const mcData = require('minecraft-data')(bot.version)
        const movements = new Movements(bot, mcData)
        movements.canDig = false
        movements.scafoldingBlocks = []

        bot.pathfinder.setMovements(movements)

        const goal = new GoalFollow(followPlr.entity, 2)
        bot.pathfinder.setGoal(goal, true)
    }

    //===========================================================================
    // Cancel all pathfinder and combat
    function StopAll() {
        try {
            bot.pathfinder.setGoal(null)

            //some code
        } catch(e) {
            console.log(e)
            //if error occurs then ...
        }
        //guardPos = false
        bot.pvp.stop()
        // bot.chat("Stop! command issued, all forgoten!")
        console.log("Stop! command issued!")
    }

    //===========================================================================
    // Guard the location the player is standing
    function doguard(username) {
        const player = bot.players[username]
        if (isGuarding == true) {
            console.log('returning to guard position')
            moveToGuardPos();
        }
        if (!player) {
            bot.chat("I can't see you.");
        }
        if (isGuarding == false) {
            guardArea(player.entity.position).clone;
            console.log("triger begin guarding here ", player.entity.position);
            isGuarding = true
        }
        else {
            console.log("doguard return err - null");
            return
        }
    }

    //===========================================================================
    // Pathfinder to the guard position
    function moveToGuardPos() {
        const mcData = require('minecraft-data')(bot.version)
        bot.pathfinder.setMovements(new Movements(bot, mcData))
        bot.pathfinder.setGoal(new goals.GoalGetToBlock(guardPos.x, guardPos.y, guardPos.z))
        // console("triger pos 05 move to guard pos triger ", pos);
        // isGuarding = true; // how many time you going to make this true or false,
        // how about listening for goal compleated?
    }

    //===========================================================================
    async function gothroughdoor() {
        isADoor = {};
        const door = bot.findBlock({
            matching: (block) => bot.isADoor(block) && !block._properties.facing,
            maxDistance: 64,
        })
    }

    //===========================================================================
    async function goToSleep() {
        console.log("trigard sleep 01");
        var time = bot.time.timeOfDay;
        if (time <= 12750) {
            bot.chat('Its not my bed time!')
            console.log('too early to go to bed.')
            if (bot.issleepp) {
                console.log('already in bed.')
                return
            } else {
                console.log(" trigger sleep 02")
                const bed = bot.findBlock({
                    matching: (block) => bot.isABed(block) && !block._properties.occupied,
                    maxDistance: 14,
                })
                console.log('triggerd sleep bed found at ', bed.position)
                if (!bed) {
                    console.log('no bed found - triger 1')
                    bot.chat('There is no accessible bed for me, what do you want me to do?')
                    //if (!bot.isSleeping) bot.quit() && createBot();
                    return
                }
                const mcData = require('minecraft-data')(bot.version)
                bot.pathfinder.setMovements(new Movements(bot, mcData))
                await bot.pathfinder.goto(new goals.GoalGetToBlock(bed.position.x, bed.position.y, bed.position.z,)).catch()
                if (bed) {
                    console.log("trigard pathfinding to bed ", bed.position)
                    bot.chat('ok, heading to sleep');
                    await bot.sleep(bed).catch(function (err) {
                        if (issleepp) {
                            console.log("trigard gotosleep() - !sleepp gotoSleep()")
                            console.log(i.username, " should be in bed now")
                            // goToSleep()
                        }
                        if (err) {
                            bot.chat(`I can't sleep: ${err.message}`)
                            console.log('trigard sleep err: ->', err.message)
                        }
                        // type of error do this
                        // if no available bed do this --> go back to guarding.
                        if (err) {
                            bot.chat('There is no accessible bed for me')
                            console.log('triger - no accessible bed to be found')
                            // then go back to guarding
                            if (!bot.isSleeping) // true false statments met then do
                                console.log("something went wrong I can't sleep");
                            bot.chat("something went wrong I can't sleep");
                            new Promise(resolve => setTimeout(resolve, 5000)); {
                                if (!bot.issleepp && isGuarding == true) {moveToGuardPos()()
                                }
                            }
                        }
                    })
                }
            }
        }
    }

    bot.on('time', async function () {
        if (bot.time.timeOfDay > 12675 && bot.time.timeOfDay < 12700) {
            console.log('time of sunset trigerd', (bot.time.timeOfDay));
            bot.chat('About 20 secound tell Bed time')
        }
        //console.log(bot.time.timeOfDay);
        if (bot.time.timeOfDay > 12775 && bot.time.timeOfDay < 12825) {
            console.log('time of sunset trigerd', (bot.time.timeOfDay));
            //bot.chat('Its my bed time!')
            //StopAll()
            await goToSleep();
        }
    });

    bot.on('sleep', () => {
        console.log('bot.on sleep trigerd')
        // bot.pathfinder.setGoal(null)
        bot.chat('Good night!')
    })

    bot.on('wake', () => {
        console.log("wakeup trigerd!") && bot.chat('wakeup trigerd!');

        if (isGuarding == true) {
            moveToGuardPos();
        };
        if (isFallowing) {followPlayer(playerToFallow)
        };
        if (!guardPos) {
            console.log('!guardPos trigerd')
            return
        }
    })

    //===========================================================================
    async function wakeUp() {
        try {
            await bot.wake()
            bot.chat("I woke up!")
        } catch (err) {
            bot.chat(`I can't wake up: ${err.message}`)
            console.log('wake up err --> ', err.message)
        }
        // if (isGuarding) {
        //  moveToGuardPos();
        //  }
    }

    //===========================================================================
    function sayItems(items = null) {
        if (!items) {
            items = bot.inventory.items()
            if (require('minecraft-data')(bot.version).isNewerOrEqualTo('1.9') && bot.inventory.slots[45]) items.push(bot.inventory.slots[45])
        }
        const output = items.map(itemToString).join(', ')
        if (output) {
            bot.chat(output)
        } else {
            bot.chat('empty')
        }
    }

    //===========================================================================
    async function tossItem(name, amount) {
        amount = parseInt(amount, 10)
        const item = itemByName(name)
        if (!item) {
            bot.chat(`I have no ${name}`)
        } else {
            try {
                if (amount) {
                    await bot.toss(item.type, null, amount)
                    bot.chat(`tossed ${amount} x ${name}`)
                } else {
                    await bot.tossStack(item)
                    bot.chat(`tossed ${name}`)
                }
            } catch (err) {
                bot.chat(`unable to toss: ${err.message}`)
            }
        }
    }

    //===========================================================================
    async function equipItem(name, destination) {
        const item = itemByName(name)
        if (item) {
            try {
                await bot.equip(item, destination)
                bot.chat(`equipped ${name}`)
            } catch (err) {
                bot.chat(`cannot equip ${name}: ${err.message}`)
            }
        } else {
            bot.chat(`I have no ${name}`)
        }
    }

    //===========================================================================
    async function unequipItem(destination) {
        try {
            await bot.unequip(destination)
            bot.chat('unequipped')
        } catch (err) {
            bot.chat(`cannot unequip: ${err.message}`)
        }
    }

    //===========================================================================
    function useEquippedItem() {
        bot.chat('activating item')
        bot.activateItem()
    }

    //===========================================================================
    async function craftItem(name, amount) {
        amount = parseInt(amount, 10)
        const mcData = require('minecraft-data')(bot.version)

        const item = mcData.itemsByName[name]
        const craftingTableID = mcData.blocksByName.crafting_table.id

        const craftingTable = bot.findBlock({
            matching: craftingTableID
        })

        if (item) {
            const recipe = bot.recipesFor(item.id, null, 1, craftingTable)[0]
            if (recipe) {
                bot.chat(`I can make ${name}`)
                try {
                    await bot.craft(recipe, amount, craftingTable)
                    bot.chat(`did the recipe for ${name} ${amount} times`)
                } catch (err) {
                    bot.chat(`error making ${name}`)
                }
            } else {
                bot.chat(`I cannot make ${name}`)
            }
        } else {
            bot.chat(`unknown item: ${name}`)
        }
    }

    //===========================================================================
    function itemToString(item) {
        if (item) {
            return `${item.name} x ${item.count}`
        } else {
            return '(nothing)'
        }
    }

    //===========================================================================
    function itemByName(name) {
        const items = bot.inventory.items()
        if (require('minecraft-data')(bot.version).isNewerOrEqualTo('1.9') && bot.inventory.slots[45]) items.push(bot.inventory.slots[45])
        return items.filter(item => item.name === name)[0]
    }

    //===========================================================================
    bot.on('autoeat_started', () => {
        console.log('Auto Eat started!')
    })

    //===========================================================================
    bot.on('autoeat_stopped', () => {
        console.log('Auto Eat stopped!')
    })

    //===========================================================================
    bot.on('health', () => {
        if (bot.food === 20) bot.autoEat.disable()
        // Disable the plugin if the bot is at 20 food points
        else bot.autoEat.enable() // Else enable the plugin again
    })

    //===========================================================================
    bot.on('quit', () => {
        createBot()
    })

    bot.on('end', () => {
        createBot()
    })
    //===========================================================================
    // what are you doing
    function mybotinfo() {
        bot.chat("triggered my bot info function")
        return
    }






    //===========================================================================
    // Log errors and kick reasons:
    bot.on('kicked', console.log)
    bot.on('error', console.log)
}

createBot()