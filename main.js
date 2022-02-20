/*

BUGS: 
1. If there are no Harvesters or Haulers/Dropminers then Builders etc should not get energy from the spawn. It blocks creeps from spawning.
2. Add a 'harvestingSatisfied' flag that would fix #1 above and mean that other creeps like builders cannot be done if not true.
3. Harvestrs are quitting after 32%.
6. Harvesters are dropping off resouces then going to pick up more if they're left with less than 32%.
7. Harvesters are not correctly using their sourceId value.
8. Race condition if a creep type is spawning the logic may queue another of that type because it's not 

IMPROVEMENTS:
6. Build an upgrader before any builders, to get to RCL 2 ASAP.
7. The auto scaling for Haulers is working well but if it scales back up a creep already marked for death won't be unmarked.
8. Haulers should target nearest dropped energy.
9. Should check build queue before enquing a second creep of the same type just built.
10. Upgraders should auto scale like Haulers, so we only work of available container/storage availability/capacity.
11. If Harvester cannot access energy source it should pickup dropped energy.
*/

require('prototype.room')();

const {
    role,
    global
} = require('game.constants');

let roleHarvester = require('role.harvester');
let roleUpgrader = require('role.upgrader');
let roleBuilder = require('role.builder');
let roleDropMiner = require('role.dropminer');
let roleHauler = require('role.hauler');

let infrastructureTasks = require('tasks.infrastructure');
let creepTasks = require('tasks.creeps');
let creepFactory = require('tasks.build.creeps');

module.exports.loop = function () {
    console.log("--- NEW TICK -----------------------------");
    let spawn = Game.spawns['Spawn1'];
    let room = spawn.room;

    // room.determineRCLAccessPoints();
    room.determineSourceAccessPoints();
    room.structures();
    room.droppedResources();

    if (!room.memory.game) {
        room.memory.game = {
            phase: 1
        }
    }

    const structures = room.structures();

    if (structures.tower) {
        structures.tower.forEach(tower => {
            let hostiles = room.find(FIND_HOSTILE_CREEPS);

            if (hostiles.length) {
                console.log("DEFENCE: Attacking hostile from '" + hostiles[0].owner.username + "'");
                tower.attack(hostiles[0]);
            } else {
                let closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => structure.hits < structure.hitsMax
                });
                if (closestDamagedStructure) {
                    tower.repair(closestDamagedStructure);
                }
            }
        });
    }

    if (_.isEmpty(structures.tower) && room.controller.level >= 3) {
        console.log('⚠️ WARNING: No towers!');
    }

    if (Game.tick % 50 == 0) {
        console.log('INFO: Checking for deleted creeps...');
        room.myCreeps().forEach(c => {
            const creep = Game.creeps[c.name];
            if (!Game.creeps[creep]) {
                delete Memory.creeps[creep];
                console.log('INFO: Clearing creep memory:', creep);
            }
        });
    }

    let energyCapacityAvailable = room.energyCapacityAvailable;

    const harvesters = room.creeps().harvesters;
    const dropminers = room.creeps().dropminers;
    const haulers = room.creeps().haulers;
    const builders = room.creeps().builders;
    const upgraders = room.creeps().upgraders;

    room.memory.creeps = {
        dropminers: dropminers.length
    };

    // Manage the build queue in case we're in a situation where it's jammed up with something it cannot build
    if ((harvesters.length == 0 && dropminers.length == 0) ||
        (harvesters.length == 0 && haulers.length == 0)) {
        creepFactory.clearBuildQueue(room);

        // Drop down to only what's available incase we're trying to queue creeps we cannot affort.
        energyCapacityAvailable = room.energyAvailable;
    }

    // Harvesters
    room.memory.maxHarvesterCreeps = (dropminers.length == 0) ? // || haulers.length == 0) ?
        room.getMaxSourceAccessPoints() :
        0;

    // Drop miners
    // Not sure if the file ternary condition is correct or not.
    if (!room.memory.maxDropMinerCreeps) {
        room.memory.maxDropMinerCreeps = (dropminers.length == 0 && harvesters.length == 0) ? 0 : room.getMaxSourceAccessPoints();
    }


    // Haulers
    if (!room.memory.maxHaulerCreeps) {
        room.memory.maxHaulerCreeps = 1 + dropminers.length;
    }

    if (Game.tick % 10 != 0) {
        let allDroppedEnergy = 0;
        room.droppedResources().forEach(x => {
            allDroppedEnergy += x.energy
        });

        if (structures.container) {


            let allContainersCapacity = 0;
            structures.container.forEach(x => {
                allContainersCapacity += x.storeCapacity - x.store.energy;
            });

            // Cap the dropped energy count so we don't try to pickup/store more than we have capacity for.
            if (allDroppedEnergy > allContainersCapacity) {
                allDroppedEnergy = allContainersCapacity;
            }

            if (allContainersCapacity > 0) {
                console.log('Dropped energy vs container capacity: ' + allDroppedEnergy + '/' + allContainersCapacity);

                const droppedEnergyAsPercentageOfContainerCapacity = (allDroppedEnergy / allContainersCapacity * 100);
                const additionalHaulersModifier = Math.ceil(Math.floor(droppedEnergyAsPercentageOfContainerCapacity) / 25);
                room.memory.maxHaulerCreeps = dropminers.length + additionalHaulersModifier;
            } else {
                const additionalHaulersModifier = Math.floor(allDroppedEnergy / 100);
                room.memory.maxHaulerCreeps = dropminers.length + additionalHaulersModifier;s            }
        } else {
            const additionalHaulersModifier = Math.floor(allDroppedEnergy / 100);
            room.memory.maxHaulerCreeps = dropminers.length + additionalHaulersModifier;
        }
    }

    const sufficientHarvesters = harvesters.length >= room.memory.maxHarvesterCreeps;
    const sufficientDropMiners = dropminers.length >= room.memory.maxDropMinerCreeps;
    const sufficientHaulers = dropminers.length > 0 && (haulers.length >= room.memory.maxHaulerCreeps);

    // Builders
    room.memory.maxBuilderCreeps = room.constructionSites().length > 0 ? 3 : 0;

    // Upgraders
    room.memory.maxUpgraderCreeps = 1 + MAX_UPGRADER_CREEPS;

    const sufficientBuilders = builders.length >= room.memory.maxBuilderCreeps;
    const sufficientUpgraders = upgraders.length >= room.memory.maxUpgraderCreeps;

    // Summary of actual vs target numbers.
    console.log('  Harvesters: ' + harvesters.length + '/' + room.memory.maxHarvesterCreeps + ' ' + (sufficientHarvesters ? '✔️' : '❌'));
    console.log('  Drop Miners: ' + dropminers.length + '/' + room.memory.maxDropMinerCreeps + ' ' + (sufficientDropMiners ? '✔️' : '❌'));
    console.log('  Haulers: ' + haulers.length + '/' + room.memory.maxHaulerCreeps + ' ' + (sufficientHaulers ? '✔️' : '❌'));
    console.log('  Builders: ' + builders.length + '/' + room.memory.maxBuilderCreeps + ' ' + (sufficientBuilders ? '✔️' : '❌'));
    console.log('  Upgraders: ' + upgraders.length + '/' + room.memory.maxUpgraderCreeps + ' ' + (sufficientUpgraders ? '✔️' : '❌'));

    if (room.memory.creepBuildQueue && (room.memory.creepBuildQueue.queue.length < global.MAX_CREEP_BUILD_QUEUE_LENGTH)) {
        switch (room.memory.game.phase) {
            case 1: {
                // First turn; get a Harvester out immediately.
                if (roleHarvester.tryBuild(room, spawn, energyCapacityAvailable, harvesters) == OK) {
                    room.memory.game.phase += 1
                }

                break;
            }
            case 2: {
                // With the Harvester from phase 1 get an Upgrader out immediately to get the RCL to level 2.
                if (roleUpgrader.tryBuild(room, spawn, energyCapacityAvailable) == OK) {
                    room.memory.game.phase += 1
                }
                break;
            }
            default: {
                // Manage the build queue in case we're in a situation where it's jammed up with something it cannot build
                // TODO Fix this, it flushes the build queue in the early game.
                // if ((harvesters.length == 0 && dropminers.length == 0) ||
                //     (harvesters.length == 0 && haulers.length == 0)) {
                //     creepFactory.clearBuildQueue(room);

                //     // Drop down to only what's available incase we're trying to queue creeps we cannot affort.
                //     energyCapacityAvailable = room.energyAvailable;
                // }

                // HARVESTER creep
                if (!sufficientHarvesters) {
                    roleHarvester.tryBuild(room, spawn, energyCapacityAvailable, harvesters);
                }

                // DROPMINER creep
                if (!sufficientDropMiners &&
                    (harvesters.length > 0 || haulers.length > 0)) {

                    roleDropMiner.tryBuild(room, spawn, energyCapacityAvailable, dropminers);
                }

                // HAULER creep
                if (!sufficientHaulers) {
                    roleHauler.tryBuild(room, spawn, energyCapacityAvailable);
                }

                // BUILDER creep
                if (!sufficientBuilders &&
                    (harvesters.length > 0 || (haulers.length > 0 && dropminers.length > 0))) {

                    roleBuilder.tryBuild(room, spawn, energyCapacityAvailable);
                }

                // UPGRADER creeps
                if (!sufficientUpgraders) {
                    roleUpgrader.tryBuild(room, spawn, energyCapacityAvailable);
                }
            }
        }
    }

    creepFactory.processBuildQueue(room, spawn);
    creepFactory.evaluateBuildQueue(room);
    creepFactory.showSpawningCreepInfo(room, spawn)

    room.myCreeps().forEach(c => {
        const creep = Game.creeps[c.name];

        if (creep.memory.role == role.HARVESTER) {
            roleHarvester.run(creep);
        }
        if (creep.memory.role == role.DROPMINER) {
            roleDropMiner.run(creep);
        }
        if (creep.memory.role == role.HAULER) {
            roleHauler.run(creep);
        }
        if (creep.memory.role == role.BUILDER) {
            roleBuilder.run(creep);
        }
        if (creep.memory.role == role.UPGRADER) {
            roleUpgrader.run(creep);
        }
    });

    // TODO Only do this mod n times, e.g. % 10.
    infrastructureTasks.buildLinks(room);
    creepTasks.suicideCreep(room);
}