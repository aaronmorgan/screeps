/*

BUGS: 
1. If there are no Harvesters or Haulers/Dropminers then Builders etc should not get energy from the spawn. It blocks creeps from spawning.
2. Add a 'harvestingSatisfied' flag that would fix #1 above and mean that other creeps like builders cannot be done if not true.
3. Harvestrs are quitting after 32%.
6. Harvesters are dropping off resouces then going to pick up more if they're left with less than 32%.
7. Harvesters are not correctly using their sourceId value.
8. Race condition if a creep type is spawning the logic may queue another of that type because it's not 
9. Builder will not build until it's at 100% capacity.

IMPROVEMENTS:
7. The auto scaling for Haulers is working well but if it scales back up a creep already marked for death won't be unmarked.
8. Haulers should target nearest dropped energy.
9. Should check build queue before enquing a second creep of the same type just built.
11. If Harvester cannot access energy source it should pickup dropped energy.
12. Should the rcl.container simply be placed -30% away from the rcl, back towards the spawn?
15. Spawn name should be stored in room memory.
16. Don't clear the build queue in the first few turns; check game phase?s
17. Don't build the RCL container if there's already a base container withing range. 10? 15? tiles.
18. Determine the size of the Upgraders based on the distance of the RCL from the base. 
19. When a harvester or hauler has a transfer target set it shouldn't reassess and waste time changing direction.

*/

require('prototype.room')();
//require('prototype.source');

const {
    role,
    global
} = require('game.constants');

let roleHarvester = require('role.harvester');
let roleCourier = require('role.courier');
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

    room.structures();
    // room.linkContainers();
    room.droppedResources();
    room.determineSourceAccessPoints();

    infrastructureTasks.locateSpawnDumpLocation(room);

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

    let energyCapacityAvailable = room.energyCapacityAvailable;

    const harvesters = room.creeps().harvesters || [];
    const couriers = room.creeps().couriers || [];
    const dropminers = room.creeps().dropminers || [];
    const haulers = room.creeps().haulers || [];
    const builders = room.creeps().builders || [];
    const upgraders = room.creeps().upgraders || [];



    room.memory.creeps = {
        harvesters: harvesters.length,
        couriers: couriers.length,
        dropminers: dropminers.length,
        haulers: haulers.length,
        builders: builders.length,
        upgraders: upgraders.length
    };

    // Manage the build queue in case we're in a situation where it's jammed up with something it cannot build
    // if ((harvesters.length <= 2 && dropminers.length == 0)) {
    //     creepFactory.clearBuildQueue(room);
    //     roleHarvester.tryBuild(room, spawn, room.energyAvailable, harvesters);
    //     // Drop down to only what's available incase we're trying to queue creeps we cannot affort.
    // } else if (dropminers.length > 0 && haulers.length == 0) {
    //     creepFactory.clearBuildQueue(room);
    //     if (haulers.length <= room.memory.maxHaulers) {
    //         roleHauler.tryBuild(room, spawn, room.energyAvailable);
    //     }
    // } else if (upgraders.length == 0) {
    //     creepFactory.clearBuildQueue(room);

    //     roleUpgrader.tryBuild(room, spawn, room.energyAvailable);
    // }

    // Harvesters
    // if (!room.memory.maxHarvesterCreeps) {
    //     room.memory.maxHarvesterCreeps = MAX_HARVESTES * room.memory.sources.length;
    // }

    // Couriers
    // if (!room.memory.maxCourierCreeps) {
    //     room.memory.maxCourierCreeps = room.memory.sources.length;
    // }

    // Drop miners
    // Not sure if the file ternary condition is correct or not.
    // if (!room.memory.maxDropMinerCreeps) {
    //     room.memory.maxDropMinerCreeps = (dropminers.length == 0 && harvesters.length == 0) ? 0 : room.memory.maxSourceAccessPoints;
    // }

    // if (Game.time % 200 == 0) {
    //     console.log('⚠️ Info: Re-evaluating creep requirements.')

    //     let allDroppedEnergy = 0;
    //     room.droppedResources().forEach(x => {
    //         allDroppedEnergy += x.energy
    //     });

    //     // let additionalHaulersModifier = room.memory.sources.length;

    //     // if (structures.container) {
    //     //     let allContainersCapacity = 0;

    //     //     structures.container.forEach(x => {
    //     //         allContainersCapacity += x.storeCapacity - x.store.energy;
    //     //     });

    //     //     // Cap the dropped energy count so we don't try to pickup/store more than we have capacity for.
    //     //     if (allDroppedEnergy > allContainersCapacity) {
    //     //         allDroppedEnergy = allContainersCapacity;
    //     //     }

    //     //     if (allContainersCapacity > 0) {
    //     //         //console.log('Dropped energy vs container capacity: ' + allDroppedEnergy + '/' + allContainersCapacity);
    //     //         const droppedEnergyAsPercentageOfContainerCapacity = (allDroppedEnergy / allContainersCapacity * 100);
    //     //         additionalHaulersModifier += Math.ceil(Math.floor(droppedEnergyAsPercentageOfContainerCapacity) / 25);
    //     //     } else {
    //     //         additionalHaulersModifier += Math.floor(allDroppedEnergy / 100);
    //     //     }
    //     // } else {
    //     //     additionalHaulersModifier = Math.floor(allDroppedEnergy / 100);
    //     // }

    //     // room.memory.maxHaulerCreeps = Math.floor(MAX_HAULERS, dropminers.length + additionalHaulersModifier);

    //     // Upgraders
    //     if (structures.container) {
    //         let allContainersCapacity = 0;
    //         let allContainersEnergy = 0;

    //         structures.container.forEach(x => {
    //             allContainersCapacity += x.storeCapacity;
    //             allContainersEnergy += x.store.energy;
    //         });

    //         if (allContainersCapacity > 0) {
    //             const droppedEnergyAsPercentageOfContainerCapacity = (allContainersEnergy / allContainersCapacity * 100);
    //             const additionalHaulersModifier = Math.ceil(Math.floor(droppedEnergyAsPercentageOfContainerCapacity) / 25);

    //             room.memory.maxUpgraderCreeps = Math.floor(MAX_UPGRADERS, upgraders.length + additionalHaulersModifier);
    //         } else {
    //             room.memory.maxUpgraderCreeps = MAX_UPGRADERS;
    //         }
    //     } else {
    //         room.memory.maxUpgraderCreeps = MAX_UPGRADERS;
    //     }
    // }


    const maxDropMinerCreeps = room.memory.maxDropMinerCreeps || room.memory.maxSouceAccessPoints;
    const maxHarvesterCreeps = Math.max(0, room.memory.maxSouceAccessPoints - dropminers.length);
    room.memory.maxBuilderCreeps = room.constructionSites().length > 0 ? 3 : 0;
    const maxUpgraderCreeps = Math.min(4, room.controller.level);
    const maxCourierCreeps = Math.round(harvesters.length / 2);

    const sufficientHarvesters = harvesters.length >= maxHarvesterCreeps;
    const sufficientCouriers = couriers.length >= maxCourierCreeps;
    const sufficientDropMiners = dropminers.length >= maxDropMinerCreeps;
    const sufficientHaulers = haulers.length >= room.memory.maxHaulers; // dropminers.length > 0 && (haulers.length >= room.memory.maxHaulerCreeps);
    const sufficientUpgraders = upgraders.length >= maxUpgraderCreeps;
    const sufficientBuilders = builders.length >= room.memory.maxBuilderCreeps;

    // Summary of actual vs target numbers.
    console.log('  Game Phase: ' + room.memory.game.phase);
    console.log('  Harvesters: ' + harvesters.length + '/' + maxHarvesterCreeps + ' ' + (sufficientHarvesters ? '✔️' : '❌'));
    console.log('  Couriers: ' + couriers.length + '/' + maxCourierCreeps + ' ' + (sufficientCouriers ? '✔️' : '❌'));
    console.log('  Drop Miners: ' + dropminers.length + '/' + maxDropMinerCreeps + ' ' + (sufficientDropMiners ? '✔️' : '❌'));
    console.log('  Haulers: ' + haulers.length + '/' + room.memory.maxHaulerCreeps + ' ' + (sufficientHaulers ? '✔️' : '❌'));
    console.log('  Builders: ' + builders.length + '/' + room.memory.maxBuilderCreeps + ' ' + (sufficientBuilders ? '✔️' : '❌'));
    console.log('  Upgraders: ' + upgraders.length + '/' + maxUpgraderCreeps + ' ' + (sufficientUpgraders ? '✔️' : '❌'));

    creepFactory.processBuildQueue(room, spawn);
    creepFactory.evaluateBuildQueue(room);
    //creepFactory.showSpawningCreepInfo(room, spawn)

    if (Game.time % 50 == 0) {
        console.log('⚠️ INFO: Checking for deleted creeps...');
        for (var i in Memory.creeps) {
            if (!Game.creeps[i]) {
                delete Memory.creeps[i];
            }
        }
    }

    room.myCreeps().forEach(c => {
        const creep = Game.creeps[c.name];

        if (creep.memory.role == role.HARVESTER) {
            roleHarvester.run(creep);
        }
        if (creep.memory.role == role.COURIER) {
            roleCourier.run(creep);
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


    if (room.memory.creepBuildQueue && (room.memory.creepBuildQueue.queue.length < global.MAX_CREEP_BUILD_QUEUE_LENGTH)) {
        // HARVESTERS
        if (!sufficientHarvesters) {
            roleHarvester.tryBuild(room, spawn, energyCapacityAvailable, harvesters);
            return;
        }

        // COURIERS
        if (!sufficientCouriers) {
            roleCourier.tryBuild(room, spawn, energyCapacityAvailable);
            return;
        }

        // DROPMINERS
        if (!sufficientDropMiners) {
            roleDropMiner.tryBuild(room, spawn, energyCapacityAvailable, dropminers);
            return;
        }

        // UPGRADERS
        if (!sufficientUpgraders) {
            roleUpgrader.tryBuild(room, spawn, energyCapacityAvailable);
            return;
        }

        // BUILDERS
        if (sufficientHarvesters && !sufficientBuilders) {
            roleBuilder.tryBuild(room, spawn, energyCapacityAvailable);
            return;
        }

        //            break;
        //       }
        // case 2: {
        //     // With the Harvester from phase 1 get an Upgrader out immediately to get the RCL to level 2.
        //     if (upgraders.length == 0) {
        //         roleUpgrader.tryBuild(room, spawn, energyCapacityAvailable);
        //     } else {
        //         room.memory.game.phase = 3;
        //     }
        //     break;
        // }
        // case 3: {
        //     // With the Upgrader from phase 2 get a builder out to work on extensions.
        //     if (!sufficientUpgraders) {
        //         roleUpgrader.tryBuild(room, spawn, energyCapacityAvailable);
        //     } else {
        //         room.memory.game.phase = 4;
        //     }

        //     room.memory.maxBuilderCreeps = 2;
        //     break;
        // }
        // case 4: {
        //     // With the Upgraders working on their own get some couriers out to shift us into drop mining mode.
        //     if (couriers.length <= 2) {
        //         roleCourier.tryBuild(room, spawn, energyCapacityAvailable);
        //     } else {
        //         room.memory.game.phase = 5;
        //     }

        //     room.memory.maxBuilderCreeps = 2;
        //     break;
        // }
        // // case 5: {
        // //     room.memory.maxBuilderCreeps = 2;
        // //     break;
        // // }
        // default: {
        //     // Manage the build queue in case we're in a situation where it's jammed up with something it cannot build
        //     // TODO Fix this, it flushes the build queue in the early game.
        //     // if ((harvesters.length == 0 && dropminers.length == 0) ||
        //     //     (harvesters.length == 0 && haulers.length == 0)) {
        //     //     creepFactory.clearBuildQueue(room);

        //     //     // Drop down to only what's available incase we're trying to queue creeps we cannot affort.
        //     //     energyCapacityAvailable = room.energyAvailable;
        //     // }

        //     // HARVESTER creeps
        //     if (!sufficientHarvesters) {
        //         roleHarvester.tryBuild(room, spawn, energyCapacityAvailable, harvesters);
        //         break;
        //     }

        //     // DROPMINER creeps
        //     // if (!sufficientDropMiners &&
        //     //     (harvesters.length > 0 || haulers.length > 0)) {

        //     //     roleDropMiner.tryBuild(room, spawn, energyCapacityAvailable, dropminers);
        //     //     break;
        //     // }

        //     // HAULER creeps
        //     // if (!sufficientHaulers) {
        //     //     roleHauler.tryBuild(room, spawn, energyCapacityAvailable);
        //     //     break;
        //     // }

        //     // COURIERS 
        //     if (!sufficientCouriers) {
        //         roleCourier.tryBuild(room, spawn, energyCapacityAvailable);
        //         break;
        //     }

        //     // BUILDER creeps
        //     if (!sufficientBuilders &&
        //         (harvesters.length > 0 || (haulers.length > 0 && dropminers.length > 0))) {

        //         roleBuilder.tryBuild(room, spawn, energyCapacityAvailable);
        //         break;
        //     }

        //     // UPGRADER creeps
        //     if (!sufficientUpgraders) {
        //         roleUpgrader.tryBuild(room, spawn, energyCapacityAvailable);
        //         break;
        //     }
        // }

        // // Check continually to see if builders are required.
        // if (!sufficientBuilders) {
        //     roleBuilder.tryBuild(room, spawn, energyCapacityAvailable)
        // } else {
        //     room.memory.game.phase++;
        // }

        //    }
    }
}