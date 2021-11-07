require('prototype.room')();

var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleDropMiner = require('role.dropminer');
var roleHauler = require('role.hauler');

var MAX_HARVESTER_CREEPS = 5;
var MAX_UPGRADER_CREEPS = 2;
var MAX_BUILDER_CREEPS = 5;
var MIN_HARVESTER_CREEPS = 0;
var MIN_BUILDER_CREEPS = 0;
var MIN_DROPMINER_CREEPS = 1;

function findConstructionSites() {
    return Game.spawns['Spawn1'].room.find(FIND_CONSTRUCTION_SITES).length;
}

function bodyCost(body) {
    let sum = 0;
    for (let i in body)
        sum += BODYPART_COST[body[i]];
    return sum;
}

module.exports.loop = function () {
    console.log("--- NEW TICK -----------------------------");
    let room = Game.spawns['Spawn1'].room;

    let towers = room.find(FIND_STRUCTURES, { filter: (c) => c.structureType == STRUCTURE_TOWER });
    let tower = towers[0];
    if (tower) {
        console.log('INFO: Processing Towers...');

        var hostiles = room.find(FIND_HOSTILE_CREEPS);

        if (hostiles.length) {
            console.log("DEFENCE: Attacking hostile from '" + hostiles[0].owner.username + "'");
            towers.forEach(t => t.attack(hostiles[0]));
        } else {
            var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
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

    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('INFO: Clearing creep memory:', name);
        }
    }

    console.log('INFO: Processing Creeps...');

    let energyCapacityAvailable = room.energyCapacityAvailable;
    let energyAvailable = room.energyAvailable;
    let sources = room.getSources();

    console.log('DEBUG: energyAvailable: ' + energyAvailable + '/' + energyCapacityAvailable);

    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    var dropMiners = _.filter(Game.creeps, (creep) => creep.memory.role == 'dropminer');
    var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler');
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');

    // Harvesters
    // Should have MAX_HARVESTER_CREEPS but reduce numbers when drop miners start to appear.
    let maxHarvesterCreeps = dropMiners.length == 0 ? MAX_HARVESTER_CREEPS : MIN_HARVESTER_CREEPS;

    // Drop miners
    // Not sure if the file ternary condition is correct or not.
    let maxDropMinerCreeps = dropMiners.length < MIN_DROPMINER_CREEPS ? Math.max(MIN_DROPMINER_CREEPS, room.getSources() * 2) : MIN_DROPMINER_CREEPS;

    // Haulers
    let maxHaulerCreeps = Math.max(0, Math.round(dropMiners.length * 1.75));

    // Builders
    let constructionSites = findConstructionSites();
    let maxBuilderCreeps = constructionSites > 0
        ? Math.min(MAX_BUILDER_CREEPS, constructionSites + (energyAvailable % 750))
        : MIN_BUILDER_CREEPS;

    // Upgraders
    // Should be a set value + number of containers * 2?
    let maxUpgraderCreeps = MAX_UPGRADER_CREEPS + (1 * 2);

    // Summary of actual vs target numbers.
    console.log('  Harvesters: ' + harvesters.length + '/' + maxHarvesterCreeps);
    console.log('  Drop Miners: ' + dropMiners.length + '/' + maxDropMinerCreeps);
    console.log('  Haulers: ' + haulers.length + '/' + maxHaulerCreeps);
    console.log('  Builders: ' + builders.length + '/' + maxBuilderCreeps);
    console.log('  Upgraders: ' + upgraders.length + '/' + maxUpgraderCreeps);

    if (dropMiners.length < maxDropMinerCreeps || dropMiners.length < sources.length) {
        let newName = 'DropMiner' + Game.time;
        let bodyType = [];

        if (energyAvailable >= 550) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE]; // 5 WORK parts mine exactly 3000 energy every 300 ticks.
            // TODO set room memory max number of miners per source = 1
        } else {
            bodyType = [WORK, MOVE];
            // TODO set room memory max number of miners per source = ?
        }

        let targetSourceId = room.selectAvailableSource(dropMiners)[0].id;
        console.log('Assigning creep sourceId: ' + targetSourceId);

        roleDropMiner.createMiner(Game.spawns['Spawn1'], newName, bodyType, targetSourceId)
    }

    if (haulers.length < maxHaulerCreeps) {
        var newName = 'Hauler' + Game.time;
        let bodyType = [];

        if (energyAvailable >= 200) {
            bodyType = [CARRY, CARRY, MOVE, MOVE];
        } else {
            bodyType = [CARRY, MOVE];
        }

        console.log('Spawning new hauler: ' + newName + ', [' + bodyType + ']');
        Game.spawns['Spawn1'].spawnCreep(bodyType, newName,
            { memory: { role: 'hauler' } });
    }

    if (harvesters.length < maxHarvesterCreeps) {
        var newName = 'Harvester' + Game.time;
        console.log('Spawning new harvester: ' + newName);

        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName,
            { memory: { role: 'harvester' } });
    }

    if (builders.length < maxBuilderCreeps) {
        var newName = 'Builder' + Game.time;
        let bodyType = [];

        if (energyAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 300) {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
        } else {
            bodyType = [WORK, CARRY, MOVE];
        }

        console.log('Spawning new builder: ' + newName + ', [' + bodyType + ']');
        Game.spawns['Spawn1'].spawnCreep(bodyType, newName,
            {
                memory: { role: 'builder' }
            });
    }

    if (upgraders.length < maxUpgraderCreeps) {
        var newName = 'Upgrader' + Game.time;
        let bodyType = [];

        if (room.storage && energyAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else {
            bodyType = [WORK, CARRY, MOVE];
        }

        console.log('Spawning new upgrader: ' + newName + ', [' + bodyType + ']');
        Game.spawns['Spawn1'].spawnCreep(bodyType, newName,
            {
                memory: { role: 'upgrader' }
            });
    }

    if (Game.spawns['Spawn1'].spawning) {
        var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            Game.spawns['Spawn1'].pos.x + 1,
            Game.spawns['Spawn1'].pos.y,
            { align: 'left', opacity: 0.8 });
    }

    console.log('INFO: Running Creeps...');
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == 'dropminer') {
            roleDropMiner.harvest(creep);
        }
        if (creep.memory.role == 'hauler') {
            roleHauler.run(creep);
        }
        if (creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if (creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if (creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
    }
}