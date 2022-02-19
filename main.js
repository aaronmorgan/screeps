/*

BUGS: 
1. If there are no Harvesters or Haulers/Dropminers then Builders etc should not get energy from the spawn. It blocks creeps from spawning.
2. Add a 'harvestingSatisfied' flag that would fix #1 above and mean that other creeps like builders cannot be done if not true.
3. Harvestrs are quitting after 32%.
6. Harvesters are dropping off resouces then going to pick up more if they're left with less than 32%.
7. Harvesters are not correctly using their sourceId value.

IMPROVEMENTS:
6. Build an upgrader before any builders, to get to RCL 2 ASAP.
7. The auto scaling for Haulers is working well but if it scales back up a creep already marked for death won't be unmarked.
8. Haulers should target nearest dropped energy.
9. Should check build queue before enquing a second creep of the same type just built.
10. Upgraders should auto scale like Haulers, so we only work of available container/storage availability/capacity.

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

const MIN_HARVESTER_CREEPS = 0;
const MAX_HARVESTER_CREEPS = 5;
const MAX_UPGRADER_CREEPS = 5;
const MIN_BUILDER_CREEPS = 2;
const MAX_BUILDER_CREEPS = 4;

// TODO:
// 1. Hauler should drop at spawn if no storage and builders should pickup dropped energy.

module.exports.loop = function () {
    console.log("--- NEW TICK -----------------------------");
    let spawn = Game.spawns['Spawn1'];
    let room = spawn.room;

    // room.determineRCLAccessPoints();
    room.determineSourceAccessPoints();
    room.structures();
    room.droppedResources();

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
    let allDroppedEnergy = 0;
    room.droppedResources().forEach(x => {
        allDroppedEnergy += x.energy
    });

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
        room.memory.maxHaulerCreeps = dropminers.length
    }

    const sufficientHarvesters = harvesters.length >= room.memory.maxHarvesterCreeps;
    const sufficientDropMiners = dropminers.length >= room.memory.maxDropMinerCreeps;
    const sufficientHaulers = dropminers.length > 0 && (haulers.length >= room.memory.maxHaulerCreeps);

    // Builders
    room.memory.maxBuilderCreeps = room.constructionSites().length > 0 ? 3 : 0;

    // Upgraders
    room.memory.maxUpgraderCreeps = MAX_UPGRADER_CREEPS;

    const sufficientBuilders = builders.length >= room.memory.maxBuilderCreeps;
    const sufficientUpgraders = upgraders.length >= room.memory.maxUpgraderCreeps;

    // Summary of actual vs target numbers.
    console.log('  Harvesters: ' + harvesters.length + '/' + room.memory.maxHarvesterCreeps + ' ' + (sufficientHarvesters ? '✔️' : '❌'));
    console.log('  Drop Miners: ' + dropminers.length + '/' + room.memory.maxDropMinerCreeps + ' ' + (sufficientDropMiners ? '✔️' : '❌'));
    console.log('  Haulers: ' + haulers.length + '/' + room.memory.maxHaulerCreeps + ' ' + (sufficientHaulers ? '✔️' : '❌'));
    console.log('  Builders: ' + builders.length + '/' + room.memory.maxBuilderCreeps + ' ' + (sufficientBuilders ? '✔️' : '❌'));
    console.log('  Upgraders: ' + upgraders.length + '/' + room.memory.maxUpgraderCreeps + ' ' + (sufficientUpgraders ? '✔️' : '❌'));

    if (room.memory.creepBuildQueue && (room.memory.creepBuildQueue.length < global.MAX_CREEP_BUILD_QUEUE_LENGTH)) {
        // HARVESTER creep
        if (!sufficientHarvesters) {
            let bodyType = [];

            if (energyCapacityAvailable >= 500) {
                bodyType = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
            } else if (energyCapacityAvailable >= 350) {
                bodyType = [WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
            } else {
                bodyType = [WORK, CARRY, MOVE, MOVE, MOVE];
            }

            if (!_.isEmpty(bodyType)) {
                let targetSourceId = undefined;

                if (harvesters.length == 0) {
                    targetSourceId = spawn.pos.findClosestByPath(room.sources().map(x => x.pos))
                }

                for (let i = 0; i < room.memory.sources.length; i++) {
                    const source = room.memory.sources[i];

                    const creepsForThisSource = Math.min(source.accessPoints, _.countBy(harvesters, x => x.memory.sourceId == source.id).true);

                    const b = harvesters.filter(x => x.memory.sourceId == source.id).length;

                    if (b == room.memory.minersPerSource) {
                        continue;
                    }

                    if (creepsForThisSource > source.accessPoints) {
                        console.log('⚠️ WARNING: Too many DROPMINER creeps for source ' + source.id);

                        // TODO Remove excess creeps. Remove the creep with the lowest TTL?
                        continue;
                    }

                    targetSourceId = source.id;
                    break;
                };

                if (!targetSourceId) {
                    console.log('ERROR: Attempting to create ' + role.HARVESTER + ' with an assigned source');
                } else {
                    creepFactory.create(room, spawn, role.HARVESTER, bodyType, {
                        role: role.HARVESTER,
                        sourceId: targetSourceId
                    });
                }
            }
        }

        // DROPMINER creep
        if (!sufficientDropMiners &&
            (harvesters.length > 0 || haulers.length > 0)) {

            let bodyType = [];

            if (energyCapacityAvailable >= 700) {
                bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE];
                room.memory.minersPerSource = 1;
            } else if (energyCapacityAvailable >= 600) {
                bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE]; // 5 WORK parts mine exactly 3000 energy every 300 ticks.
                room.memory.minersPerSource = 1;
            } else if (energyCapacityAvailable >= 400) {
                bodyType = [WORK, WORK, WORK, MOVE, MOVE];
                room.memory.minersPerSource = 2;
            } else if (energyCapacityAvailable >= 350) {
                bodyType = [WORK, WORK, WORK, MOVE];
                room.memory.minersPerSource = 2;
            } else {
                bodyType = [WORK, WORK, MOVE, MOVE];
                room.memory.minersPerSource = 2;
            }

            if (!_.isEmpty(bodyType)) {
                let targetSourceId = undefined;

                if (dropminers.length == 0) {
                    targetSourceId = spawn.pos.findClosestByPath(room.sources().map(x => x.pos))
                }

                for (let i = 0; i < room.memory.sources.length; i++) {
                    const source = room.memory.sources[i];

                    const a = Math.min(source.accessPoints, room.memory.minersPerSource);
                    const creepsForThisSource = Math.min(a, _.countBy(dropminers, x => x.memory.sourceId == source.id).true);

                    const b = dropminers.filter(x => x.memory.sourceId == source.id).length;

                    if (b == room.memory.minersPerSource) {
                        continue;
                    }

                    if (creepsForThisSource > source.accessPoints) {
                        console.log('⚠️ WARNING: Too many DROPMINER creeps for source ' + source.id);

                        // TODO Remove excess creeps. Remove the creep with the lowest TTL?
                        continue;
                    }

                    targetSourceId = source.id;
                    break;
                };

                room.memory.maxDropMinerCreeps = room.memory.minersPerSource * room.memory.sources.length;

                if (!targetSourceId) {
                    console.log('ERROR: Attempting to create ' + role.DROPMINER + ' with an assigned source');
                } else {
                    creepFactory.create(room, spawn, role.DROPMINER, bodyType, {
                        role: role.DROPMINER,
                        sourceId: targetSourceId
                    });
                }
            }
        }

        // HAULER creep
        if (!sufficientHaulers) {
            let bodyType = [];

            if (energyCapacityAvailable >= 450) {
                bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
            } else if (energyCapacityAvailable >= 400) {
                bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
            } else if (energyCapacityAvailable >= 350) {
                bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
            } else {
                bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
            }

            if (!_.isEmpty(bodyType)) {
                creepFactory.create(room, spawn, role.HAULER, bodyType, {
                    role: role.HAULER,
                    harvesting: true,
                    targetedDroppedEnergy: {
                        id: 0,
                        pos: new RoomPosition(1, 1, room.name)
                    }
                });
            }
        }

        console.log('eh? ', (harvesters.length > 0 || (haulers.length > 0 && dropminers.length > 0)));
        // BUILDER creep
        if (!sufficientBuilders &&
            (harvesters.length > 0 || (haulers.length > 0 && dropminers.length > 0))) {

            let bodyType = [];

            if (energyCapacityAvailable >= 900) {
                bodyType = [
                    WORK, WORK, WORK, WORK, WORK,
                    CARRY, CARRY, CARRY, CARRY, CARRY,
                    MOVE, MOVE, MOVE
                ];
            } else if (energyCapacityAvailable >= 400) {
                bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
            } else if (energyCapacityAvailable >= 350) {
                bodyType = [WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
            } else {
                bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
            }

            if (!_.isEmpty(bodyType)) {
                creepFactory.create(room, spawn, role.BUILDER, bodyType, {
                    role: role.BUILDER,
                    building: true
                });
            }
        }

        // UPGRADER creeps
        if (!sufficientUpgraders) {
            let bodyType = [];

            if (room.storage && energyCapacityAvailable >= 1750) {
                bodyType = [
                    WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                    CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                    MOVE, MOVE, MOVE, MOVE, MOVE
                ];
            } else if (room.storage && energyCapacityAvailable >= 1000) {
                bodyType = [
                    WORK, WORK, WORK, WORK, WORK, WORK,
                    CARRY, CARRY, CARRY, CARRY,
                    MOVE, MOVE, MOVE, MOVE
                ];
                // Prioritise movement overy carry capaciity. If the container is repeatedly low
                // on energy we don't want to be waiting.
            } else if (energyCapacityAvailable >= 550) {
                bodyType = [WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
            } else if (energyCapacityAvailable >= 400) {
                bodyType = [WORK, WORK, CARRY, MOVE, MOVE, MOVE];
            } else if (energyCapacityAvailable >= 350) {
                bodyType = [WORK, WORK, CARRY, MOVE, MOVE];
            } else {
                bodyType = [WORK, CARRY, MOVE, MOVE];
            }

            if (!_.isEmpty(bodyType)) {
                creepFactory.create(room, spawn, role.UPGRADER, bodyType, {
                    role: role.UPGRADER
                });
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