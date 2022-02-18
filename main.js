/*
BUGS: 
1. If there are no Harvesters or Haulers/Dropminers then Builders etc should not get energy from the spawn. It blocks creeps from spawning.

IMPROVEMENTS:
1. Don't despawn a hauler as soon as the DropMiner count changes. Wait 10 ticks or so to ensure it's still necessary to remove it.
2. Set the 'max dropminers per source' when producing the top DropMiner.
3. All creeps with Carry feature should drop resources when ticks to live < 2.
4. Structure build queue should only place one construction site at a time.

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
                    //console.log('DEFENCE: Repairing damaged structure');
                    tower.repair(closestDamagedStructure);
                }
            }
        });
    }

    if (_.isEmpty(structures.tower) && room.controller.level >= 3) {
        console.log('⚠️ WARNING: No towers!');
    }

    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('INFO: Clearing creep memory:', name);
        }
    }

    //const energyAvailable = room.energyAvailable;
    let energyCapacityAvailable = room.energyCapacityAvailable;

    // TODO Should be room creeps, not game....
    const harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == role.HARVESTER);
    const dropminers = _.filter(Game.creeps, (creep) => creep.memory.role == role.DROPMINER);
    const haulers = _.filter(Game.creeps, (creep) => creep.memory.role == role.HAULER);
    const builders = _.filter(Game.creeps, (creep) => creep.memory.role == role.BUILDER);
    const upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == role.UPGRADER);

    room.memory.creeps = {
        dropminers: dropminers.length
    };

    // Manage the build queue in case we're in a situation where it's jammed up with something it cannot build
    if (harvesters.length == 0 && dropminers.length == 0) {
        creepFactory.clearBuildQueue(room);

        // Drop down to only what's available incase we're trying to queue creeps we cannot affort.
        energyCapacityAvailable = room.energyAvailable;
    }

    // Harvesters
    room.memory.maxHarvesterCreeps = (dropminers.length == 0 || haulers.length == 0) ?
        room.getMaxSourceAccessPoints() :
        0;

    if (haulers.length == 0 && dropminers.length > 0) {
        room.memory.maxHarvesterCreeps = dropminers.length;
    } // TODO could be refined?

    // Drop miners
    // Not sure if the file ternary condition is correct or not.
    //room.memory.maxDropMinerCreeps = room.getSources().length * (room.memory.minersPerSource ? room.memory.minersPerSource : 0);
    room.memory.maxDropMinerCreeps = (dropminers.length == 0 && harvesters.length == 0) ? 0 : room.getMaxSourceAccessPoints();

    // Haulers
    room.memory.maxHaulerCreeps = dropminers.length; // == 0 ? 0 : Math.floor(dropminers.length * 1.5);

    const sufficientHarvesters = harvesters.length >= room.memory.maxHarvesterCreeps;
    const sufficientDropMiners = dropminers.length >= room.memory.maxDropMinerCreeps;
    const sufficientHaulers = dropminers.length > 0 && (haulers.length >= room.memory.maxHaulerCreeps);

    // Builders
    const constructionSites = room.constructionSites().length;

    room.memory.maxBuilderCreeps = constructionSites > 0 ?
        room.controller.level :
        0;

    // Upgraders
    // Should be a set value + number of containers * 2?
    room.memory.maxUpgraderCreeps = MAX_UPGRADER_CREEPS;

    const sufficientBuilders = builders.length >= room.memory.maxBuilderCreeps;
    const sufficientUpgraders = upgraders.length >= room.memory.maxUpgraderCreeps;

    // Summary of actual vs target numbers.
    console.log('  Harvesters: ' + harvesters.length + '/' + room.memory.maxHarvesterCreeps + ' ' + (sufficientHarvesters ? '✔️' : '❌'));
    console.log('  Drop Miners: ' + dropminers.length + '/' + room.memory.maxDropMinerCreeps + ' ' + (sufficientDropMiners ? '✔️' : '❌'));
    console.log('  Haulers: ' + haulers.length + '/' + room.memory.maxHaulerCreeps + ' ' + (sufficientHaulers ? '✔️' : '❌'));
    console.log('  Builders: ' + builders.length + '/' + room.memory.maxBuilderCreeps + ' ' + (sufficientBuilders ? '✔️' : '❌'));
    console.log('  Upgraders: ' + upgraders.length + '/' + room.memory.maxUpgraderCreeps + ' ' + (sufficientUpgraders ? '✔️' : '❌'));

    if (room.memory._creepBuildQueue && (room.memory._creepBuildQueue.length < global.MAX_CREEP_BUILD_QUEUE_LENGTH)) {
        // HARVESTER creep
        if (!sufficientHarvesters) {
            let bodyType = [];

            if (energyCapacityAvailable >= 500) {
                bodyType = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
            } else {
                bodyType = [WORK, CARRY, MOVE, MOVE, MOVE];
            }

            if (!_.isEmpty(bodyType)) {
                creepFactory.create(room, spawn, role.HARVESTER, bodyType, {
                    role: role.HARVESTER
                });
            }
        }

        // DROPMINER creep
        if (room.controller.level >= 2 && !sufficientDropMiners) {
            let bodyType = [];

            if (energyCapacityAvailable >= 700) {
                bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE];
                room.memory.minersPerSource = 1;
            } else if (energyCapacityAvailable >= 600) {
                bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE]; // 5 WORK parts mine exactly 3000 energy every 300 ticks.
                room.memory.minersPerSource = 1;
            } else {
                bodyType = [WORK, WORK, MOVE, MOVE];
                room.memory.minersPerSource = 2;
            }

            if (!_.isEmpty(bodyType)) {
                let targetSourceId = undefined;

                if (dropminers.length == 0) {
                    // TODO select the closet one.
                    targetSourceId = room.memory.sources[0].id;
                }

                room.memory.sources.every(source => {
                    let creepsForThisSource = Math.min(source.accessPoints, _.countBy(dropminers, x => x.memory.sourceId == source.id).true);

                    if (creepsForThisSource == source.accessPoints) {
                        return true;
                    }

                    if (creepsForThisSource > source.accessPoints) {
                        console.log('WARNING: Too many DROPMINER creeps for source ' + source.id);

                        // TODO Remove excess creeps. Remove the creep with the lowest TTL?
                        return true;
                    }

                    targetSourceId = source.id;
                    return false;
                });

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
        if (room.controller.level >= 2 && !sufficientHaulers) {
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

        // BUILDER creep
        if (!sufficientBuilders) {
            let bodyType = [];

            if (energyCapacityAvailable >= 900) {
                bodyType = [
                    WORK, WORK, WORK, WORK, WORK,
                    CARRY, CARRY, CARRY, CARRY, CARRY,
                    MOVE, MOVE, MOVE
                ];
            } else if (energyCapacityAvailable >= 400) {
                bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
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
    creepFactory.logBuildQueueDetails(room);
    creepFactory.showSpawningCreepInfo(room, spawn)

    for (let name in Game.creeps) {
        const creep = Game.creeps[name];

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
    }

    // TODO Only do this mod n times, e.g. % 10.
    infrastructureTasks.buildLinks(room);
    creepTasks.suicideCreep(room);
}