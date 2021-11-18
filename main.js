require('prototype.room')();

var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleDropMiner = require('role.dropminer');
var roleHauler = require('role.hauler');

var infrastructureTasks = require('tasks.infrastructure');
var creepTasks = require('tasks.creeps');

var MAX_HARVESTER_CREEPS = 5;
var MAX_UPGRADER_CREEPS = 2;
var MAX_BUILDER_CREEPS = 5;
var MIN_HARVESTER_CREEPS = 0;
var MIN_BUILDER_CREEPS = 0;

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
    let room = Game.spawns['Spawn1'].room;
    let structures = room.getStructures();

    let towers = _.filter(structures, { filter: (c) => c.structureType == STRUCTURE_TOWER });

    let tower = towers[0];
    if (tower) {
        console.log('INFO: Processing Towers...');

        let hostiles = room.find(FIND_HOSTILE_CREEPS);

        if (hostiles.length) {
            console.log("DEFENCE: Attacking hostile from '" + hostiles[0].owner.username + "'");
            towers.forEach(t => t.attack(hostiles[0]));
        } else {
            let closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => structure.hits < structure.hitsMax
            });
            if (closestDamagedStructure) {
                console.log('DEFENCE: Repairing damaged structure');
                tower.repair(closestDamagedStructure);
            }
        }
    } else {
        console.log('WARNING: No towers!');
    }

    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('INFO: Clearing creep memory:', name);
        }
    }

    console.log('INFO: Processing Creeps...');

    let energyCapacityAvailable = room.energyCapacityAvailable;
    let energyAvailable = room.energyAvailable;

    console.log('DEBUG: energyAvailable: ' + energyAvailable + '/' + energyCapacityAvailable);

    let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    let dropMiners = _.filter(Game.creeps, (creep) => creep.memory.role == 'dropminer');
    let haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler');
    let builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');

    // Harvesters
    // Should have MAX_HARVESTER_CREEPS but reduce numbers when drop miners start to appear.
    room.memory.maxHarvesterCreeps = dropMiners.length == 0 ? MAX_HARVESTER_CREEPS : MIN_HARVESTER_CREEPS;

    // Drop miners
    // Not sure if the file ternary condition is correct or not.
    room.memory.maxDropMinerCreeps = room.getSources().length * (room.memory.minersPerSource ? room.memory.minersPerSource : 0);

    // Haulers
    room.memory.maxHaulerCreeps = Math.max(0, Math.round(dropMiners.length * 1.25));

    // Builders
    let constructionSites = room.getConstructionSites();
    room.memory.maxBuilderCreeps = constructionSites > 0
        ? Math.min(MAX_BUILDER_CREEPS, constructionSites + (energyAvailable % 750))
        : MIN_BUILDER_CREEPS;

    // Upgraders
    // Should be a set value + number of containers * 2?
    let maxUpgraderCreeps = MAX_UPGRADER_CREEPS + (1 * 2);

    // Summary of actual vs target numbers.
    console.log('  Harvesters: ' + harvesters.length + '/' + room.memory.maxHarvesterCreeps);
    console.log('  Drop Miners: ' + dropMiners.length + '/' + room.memory.maxDropMinerCreeps);
    console.log('  Haulers: ' + haulers.length + '/' + room.memory.maxHaulerCreeps);
    console.log('  Builders: ' + builders.length + '/' + room.memory.maxBuilderCreeps);
    console.log('  Upgraders: ' + upgraders.length + '/' + maxUpgraderCreeps);

    room.memory.sufficientDropMiners = dropMiners.length >= room.memory.maxDropMinerCreeps && haulers.length > room.memory.maxHaulerCreeps;
    room.memory.sufficientHarvesters = harvesters.length >= room.memory.maxHarvesterCreeps;

    if (!room.memory.sufficientDropMiners) {
        let bodyType = [];

        if (energyAvailable >= 600) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE]; // 5 WORK parts mine exactly 3000 energy every 300 ticks.
            room.memory.minersPerSource = 1;
        } else if (energyAvailable >= 300) {
            bodyType = [WORK, WORK, MOVE, MOVE];
            room.memory.minersPerSource = 3;
        } else if (energyAvailable >= 200) {
            bodyType = [WORK, MOVE, MOVE];
            room.memory.minersPerSource = 3;
        } else {
            bodyType = undefined;
            console.log('DEBUG: Insufficient energy to build dropMiner creep.');
        }

        if (bodyType && dropMiners.length < room.memory.maxDropMinerCreeps) {
            let availableSources = room.selectAvailableSource(dropMiners);
            let targetSourceId = availableSources[0].id;

            roleDropMiner.createMiner(Game.spawns['Spawn1'], 'DropMiner', bodyType, targetSourceId)
        }
    }

    if (haulers.length < room.memory.maxHaulerCreeps) {
        let bodyType = [];

        if (energyAvailable >= 400 && room.memory.minersPerSource == 1) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else if (energyAvailable >= 200) {
            bodyType = [CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 100) {
            bodyType = [CARRY, MOVE];
        } else {
            bodyType = undefined;
            console.log('DEBUG: Insufficient energy to build hauler creep.');
        }

        if (bodyType) {
            roleHauler.createHauler(Game.spawns['Spawn1'], 'Hauler', bodyType);
        }
    }

    if (!room.memory.sufficientHarvesters) {
        let bodyType = [];

        if (energyAvailable >= 150) {
            bodyType = [WORK, CARRY, MOVE];
        } else {
            bodyType = undefined;
            console.log('DEBUG: Insufficient energy to build HARVESTER creep.');
        }

        if (bodyType) {
            room.memory.buildingHarvester = true;
            roleHarvester.createHarvester(Game.spawns['Spawn1'], 'Harvester', bodyType);
        }
        else {
            room.memory.buildingHarvester = false;
        }
    }

    if (builders.length < room.memory.maxBuilderCreeps) {
        let bodyType = [];

        if (energyAvailable >= 900) {
            bodyType = [
                WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE];
        } else if (energyAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 300) {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 200) {
            bodyType = [WORK, CARRY, MOVE];
        } else {
            bodyType = undefined;
            console.log('DEBUG: Insufficient energy to build builder creep.');
        }

        if (bodyType) {
            roleBuilder.createBuilder(Game.spawns['Spawn1'], 'Builder', bodyType);
        }
    }

    // TODO: ...and < min drop miners
    if ((room.memory.sufficientHarvesters || room.memory.sufficientDropMiners) && upgraders.length < maxUpgraderCreeps) {
        let bodyType = [];

        if (room.storage && energyAvailable >= 1750) {
            bodyType = [
                WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (room.storage && energyAvailable >= 1000) {
            bodyType = [
                WORK, WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE];
        } else if (room.storage && energyAvailable >= 550) {
            bodyType = [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 200) {
            bodyType = [WORK, CARRY, MOVE];
        } else {
            bodyType = undefined;
            console.log('DEBUG: Insufficient energy to build upgrader creep.');
            // TODO Should queue the upgrader here and not build any more until it's removed from the queue.
        }

        if (bodyType) {
            roleUpgrader.createUpgrader(Game.spawns['Spawn1'], 'Upgrader', bodyType);
        }
    }

    if (Game.spawns['Spawn1'].spawning) {
        let spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            Game.spawns['Spawn1'].pos.x + 1,
            Game.spawns['Spawn1'].pos.y,
            { align: 'left', opacity: 0.8 });
    }

    console.log('INFO: Running Creeps...');
    for (let name in Game.creeps) {
        let creep = Game.creeps[name];

        if (creep.memory.role == 'harvester') {
            roleHarvester.harvest(creep);
        }
        if (creep.memory.role == 'dropminer') {
            roleDropMiner.harvest(creep);
        }
        if (creep.memory.role == 'hauler') {
            roleHauler.run(creep);
        }
        if (creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if (creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
    }

    console.log('INFO: Running Infrastructure tasks...');
    infrastructureTasks.buildLinks(room);

    console.log('INFO: Running Creep tasks...');
    creepTasks.suicideCreep(room);
}