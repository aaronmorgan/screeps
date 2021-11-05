var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleDropMiner = require('role.dropminer');
var roleHauler = require('role.hauler');

var MAX_HARVESTER_CREEPS = 2;
//var MAX_BUILDER_CREEPS = maxBuilderCreepsModifier;
var MAX_UPGRADER_CREEPS = 2;
var MAX_BUILDER_CREEPS = 5;
var MIN_BUILDER_CREEPS = 1;
var MIN_DROPMINER_CREEPS = 3;
var MIN_HAULER_CREEPS = 3

function findConstructionSites() {
    return Game.spawns['Spawn1'].room.find(FIND_CONSTRUCTION_SITES).length;
}

function findRoomSources() {
    return Game.spawns['Spawn1'].room.find(FIND_SOURCES_ACTIVE).length;
}

module.exports.loop = function () {
    let room = Game.spawns['Spawn1'].room;

    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    let energyAvailable = room.energyCapacityAvailable;
    console.log('energyAvailable', energyAvailable);

    console.log("---------------------------------------");
    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    var dropMiners = _.filter(Game.creeps, (creep) => creep.memory.role == 'dropminer');
    var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler');
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');

    // Harvesters
    // Should have MAX_HARVESTER_CREEPS but reduce numbers when drop miners start to appear.
    let maxHarvesterCreeps = dropMiners.length == 0 ? MAX_HARVESTER_CREEPS : 0;

    // Drop miners
    // Not sure if the file ternary condition is correct or not.
    let maxDropMinerCreeps = dropMiners.length < MIN_DROPMINER_CREEPS ? Math.max(MIN_DROPMINER_CREEPS, findRoomSources() * 2) : MIN_DROPMINER_CREEPS;

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
    console.log('Harvesters: ' + harvesters.length + '/' + maxHarvesterCreeps);
    console.log('Drop Miners: ' + dropMiners.length + '/' + maxDropMinerCreeps);
    console.log('Haulers: ' + haulers.length + '/' + maxHaulerCreeps);
    console.log('Builders: ' + builders.length + '/' + maxBuilderCreeps);
    console.log('Upgraders: ' + upgraders.length + '/' + maxUpgraderCreeps);

    if (dropMiners.length < maxDropMinerCreeps) {
        let newName = 'DropMiner' + Game.time;
        let bodyType = [];

        if (energyAvailable >= 250) {
            bodyType = [WORK, WORK, MOVE];
        } else {
            bodyType = [WORK, MOVE];
        }

        console.log('Spawning new drop miner: ' + newName + ', [' + bodyType + ']');
        Game.spawns['Spawn1'].spawnCreep(bodyType, newName,
            { memory: { role: 'dropminer' } });
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
        console.log('Spawning new builder: ' + newName);
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName,
            {
                memory: { role: 'builder' }
            });
    }

    if (upgraders.length < maxUpgraderCreeps) {
        var newName = 'Upgrader' + Game.time;
        console.log('Spawning new upgrader: ' + newName);
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName,
            {
                memory: { role: 'upgrader' }
            });
    }

    if (Game.spawns['Spawn1'].spawning) {
        var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        Game.spawns['Spawn1'].room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            Game.spawns['Spawn1'].pos.x + 1,
            Game.spawns['Spawn1'].pos.y,
            { align: 'left', opacity: 0.8 });
    }

    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == 'dropminer') {
            roleDropMiner.run(creep);
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