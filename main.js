require('prototype.room')();

var {
    role
} = require('game.constants');

var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleDropMiner = require('role.dropminer');
var roleHauler = require('role.hauler');
var roleHauler = require('role.hauler');

var infrastructureTasks = require('tasks.infrastructure');
var creepTasks = require('tasks.creeps');
var creepFactory = require('tasks.build.creeps');

var MIN_HARVESTER_CREEPS = 0;
var MAX_HARVESTER_CREEPS = 5;
var MAX_UPGRADER_CREEPS = 5;
var MIN_BUILDER_CREEPS = 0;
var MAX_BUILDER_CREEPS = 5;

function bodyCost(body) {
    let sum = 0;
    for (let i in body)
        sum += BODYPART_COST[body[i]];
    return sum;
}

// TODO:
// 1. Hauler should drop at spawn if no storage and builders should pickup dropped energy.

module.exports.loop = function () {
    console.log("--- NEW TICK -----------------------------");
    let spawn = Game.spawns['Spawn1'];
    let room = spawn.room;

    room.determineSourceAccessPoints();

    room.structures();

    let sources = room.memory.sources;
    room.droppedResources();

    //let towers = structures.filter(x => x.structureType == STRUCTURE_TOWER);

    const structures = room.structures();

    if (structures.tower) {
        structures.tower.forEach(tower => {
            //console.log('INFO: Processing Tower '+ tower.id + '...');

            let hostiles = room.find(FIND_HOSTILE_CREEPS);

            if (hostiles.length) {
                console.log("DEFENCE: Attacking hostile from '" + hostiles[0].owner.username + "'");
                tower.attack(hostiles[0]);
                //towers.forEach(t => t.attack(hostiles[0]));
            } else {
                let closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => structure.hits < structure.hitsMax
                });
                if (closestDamagedStructure) {
                    console.log('DEFENCE: Repairing damaged structure');
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

        // if (_.isEmpty(Game.creeps[name])) {
        //     Memory.creeps.shift();
        //     console.log('WARNING: Attempting to force clear \'empty\' creep:', name);
        // }
    }

    let energyAvailable = room.energyAvailable;
    //console.log('DEBUG: energyAvailable: ' + energyAvailable + '/' + energyCapacityAvailable);

    let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == role.HARVESTER);
    let dropminers = _.filter(Game.creeps, (creep) => creep.memory.role == role.DROPMINER);
    let haulers = _.filter(Game.creeps, (creep) => creep.memory.role == role.HAULER);
    let builders = _.filter(Game.creeps, (creep) => creep.memory.role == role.BUILDER);
    let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == role.UPGRADER);

    // Harvesters
    if (dropminers.length >= 2 && haulers.length >= 2) {
        room.memory.maxHarvesterCreeps = MIN_HARVESTER_CREEPS;
    } else {
        room.memory.maxHarvesterCreeps = Math.max(harvesters.length, MAX_HARVESTER_CREEPS);
    }


    // Drop miners
    // Not sure if the file ternary condition is correct or not.
    //room.memory.maxDropMinerCreeps = room.getSources().length * (room.memory.minersPerSource ? room.memory.minersPerSource : 0);
    room.memory.maxDropMinerCreeps = (dropminers.length == 0 && harvesters.length == 0) ? 0 : room.getMaxSourceAccessPoints();

    // Haulers
    room.memory.maxHaulerCreeps = dropminers.length == 0 ? 0 : dropminers.length * sources.length;

    const sufficientHarvesters = harvesters.length >= room.memory.maxHarvesterCreeps;
    const sufficientDropMiners = dropminers.length >= room.memory.maxDropMinerCreeps;
    const sufficientHaulers = dropminers.length > 0 && (haulers.length >= room.memory.maxHaulerCreeps);

    // Builders
    let constructionSites = room.constructionSites().length;

    room.memory.maxBuilderCreeps = (sufficientHarvesters || (sufficientDropMiners && sufficientHaulers)) && constructionSites > 0 ?
        Math.min(MAX_BUILDER_CREEPS, constructionSites + (energyAvailable % 750)) :
        MIN_BUILDER_CREEPS;

    // Upgraders
    // Should be a set value + number of containers * 2?
    room.memory.maxUpgraderCreeps = (sufficientHarvesters || (sufficientDropMiners && sufficientHaulers)) ? MAX_UPGRADER_CREEPS + (1 * 2) : 0;

    const sufficientBuilders = builders.length >= room.memory.maxBuilderCreeps;
    const sufficientUpgraders = (upgraders.length >= room.memory.maxUpgraderCreeps) || (sufficientHarvesters || (sufficientDropMiners && sufficientHaulers)) && upgraders.length < room.memory.maxUpgraderCreeps;

    // Summary of actual vs target numbers.
    console.log('  Harvesters: ' + harvesters.length + '/' + room.memory.maxHarvesterCreeps + ' ' + (sufficientHarvesters ? '✔️' : '❌'));
    console.log('  Drop Miners: ' + dropminers.length + '/' + room.memory.maxDropMinerCreeps + ' ' + (sufficientDropMiners ? '✔️' : '❌'));
    console.log('  Haulers: ' + haulers.length + '/' + room.memory.maxHaulerCreeps + ' ' + (sufficientHaulers ? '✔️' : '❌'));
    console.log('  Builders: ' + builders.length + '/' + room.memory.maxBuilderCreeps + ' ' + (sufficientBuilders ? '✔️' : '❌'));
    console.log('  Upgraders: ' + upgraders.length + '/' + room.memory.maxUpgraderCreeps + ' ' + (sufficientUpgraders ? '✔️' : '❌'));

    // HARVESTER creep
    if (!sufficientHarvesters) {
        let bodyType = [];

        if (energyAvailable >= 200) {
            bodyType = [WORK, CARRY, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            // let targetSourceId = undefined;

            // if (harvesters.length == 0) {
            //     targetSourceId = room.memory.sources[0].id;
            // }

            // for (let i = 0; i < room.memory.sources.length; i++) {
            //     const source = room.memory.sources[i];

            //     let creepsForThisSource = _.countBy(harvesters, x => x.memory.sourceId == source.id).true;

            //     if (creepsForThisSource == source.accessPoints) {
            //         continue;
            //     }

            //     if (creepsForThisSource > source.accessPoints) {
            //         console.log('WARNING: Too many HARVESTER creeps for source ' + source.id);

            //         // TODO Remove excess creeps.
            //         continue;
            //     }

            //     targetSourceId = source.id;
            //     break;
            // }

            // if (!targetSourceId) {
            //     console.log('ERROR: Attempting to create HAVESTER with an assigned source');
            // } else {
            creepFactory.createJob(room, spawn, role.HARVESTER, bodyType, {
                role: role.HARVESTER
            });
        }
    }

    // DROPMINER creep
    if (!sufficientDropMiners) {
        let bodyType = [];

        if (energyAvailable >= 700) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE];
            room.memory.minersPerSource = 1;
        } else if (energyAvailable >= 600) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE]; // 5 WORK parts mine exactly 3000 energy every 300 ticks.
            room.memory.minersPerSource = 1;
        } else if (energyAvailable >= 300) {
            bodyType = [WORK, WORK, MOVE, MOVE];
            room.memory.minersPerSource = 3;
        } else if (energyAvailable >= 200) {
            bodyType = [WORK, MOVE, MOVE];
            room.memory.minersPerSource = 3;
        }

        if (!_.isEmpty(bodyType)) {
            let targetSourceId = undefined;

            if (dropminers.length == 0) {
                targetSourceId = room.memory.sources[0].id;
            }

            for (let i = 0; i < room.memory.sources.length; i++) {
                const source = room.memory.sources[i];

                let creepsForThisSource = Math.min(source.accessPoints, _.countBy(dropminers, x => x.memory.sourceId == source.id).true);

                if (creepsForThisSource == source.accessPoints) {
                    continue;
                }

                if (creepsForThisSource > source.accessPoints) {
                    console.log('WARNING: Too many DROPMINER creeps for source ' + source.id);

                    // TODO Remove excess creeps.
                    continue;
                }

                targetSourceId = source.id;
                break;
            }

            if (!targetSourceId) {
                console.log('ERROR: Attempting to create ' + role.DROPMINER + ' with an assigned source');
            } else {
                creepFactory.createJob(room, spawn, role.DROPMINER, bodyType, {
                    role: role.DROPMINER,
                    sourceId: targetSourceId
                });
            }
        }
    }

    // HAULER creep
    if (haulers.length < room.memory.maxHaulerCreeps) {
        let bodyType = [];

        if (energyAvailable >= 450 && room.memory.minersPerSource == 1) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyAvailable >= 250) {
            bodyType = [CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (energyAvailable >= 200) {
            bodyType = [CARRY, MOVE, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            creepFactory.createJob(room, spawn, role.HAULER, bodyType, {
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
    if (!sufficientBuilders && ((sufficientDropMiners && sufficientHaulers) || sufficientHarvesters)) {
        let bodyType = [];

        if (energyAvailable >= 900) {
            bodyType = [
                WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE
            ];
        } else if (energyAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 300) {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 200) {
            bodyType = [WORK, CARRY, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            creepFactory.createJob(room, spawn, role.BUILDER, bodyType, {
                role: role.BUILDER
            });
        }
    }

    // UPGRADER creeps
    // TODO: ...and < min drop miners
    if (!sufficientUpgraders) {
        let bodyType = [];

        if (room.storage && energyAvailable >= 1750) {
            bodyType = [
                WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE, MOVE
            ];
        } else if (room.storage && energyAvailable >= 1000) {
            bodyType = [
                WORK, WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE
            ];
        } else if (room.storage && energyAvailable >= 550) {
            bodyType = [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 200) {
            bodyType = [WORK, CARRY, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            creepFactory.createJob(room, spawn, role.UPGRADER, bodyType, {
                role: role.UPGRADER
            });
        }
    }

    creepFactory.processBuildQueue(room, spawn);
    creepFactory.showSpawningCreepInfo(room, spawn)

    console.log('INFO: Running Creeps...');
    for (let name in Game.creeps) {
        let creep = Game.creeps[name];

        if (creep.memory.role == role.HARVESTER) {
            roleHarvester.run(creep);
        }
        if (creep.memory.role == role.DROPMINER) {
            roleDropMiner.harvest(creep);
        }
        if (creep.memory.role == role.HAULER) {
            roleHauler.run(creep);
        }
        if (creep.memory.role == role.UPGRADER) {
            roleUpgrader.run(creep);
        }
        if (creep.memory.role == role.BUILDER) {
            roleBuilder.run(creep);
        }
    }

    // TODO Only do this mod n times, e.g. % 10.
    infrastructureTasks.buildLinks(room);
    creepTasks.suicideCreep(room);
}