/*

IMPROVEMENTS:
12. Should the rcl.container simply be placed -30% away from the rcl, back towards the spawn?
15. Spawn name should be stored in room memory.
17. Don't build the RCL container if there's already a base container withing range. 10? 15? tiles.
18. Determine the size of the Upgraders based on the distance of the RCL from the base. 

*/

require('prototype.room')();

const {
    role,
    global
} = require('game.constants');

let roleHarvester = require('role.harvester');
let roleCourier = require('role.courier');
let roleUpgrader = require('role.upgrader');
let roleBuilder = require('role.builder');
let roleDropMiner = require('role.dropminer');
let roleGopher = require('role.gopher');

let infrastructureTasks = require('tasks.infrastructure');
let creepTasks = require('tasks.creeps');
let creepFactory = require('tasks.build.creeps');


module.exports.loop = function () {
    console.log("--- NEW TICK -----------------------------");
    let spawn = Game.spawns['Spawn1'];

    spawn.room.structures();
    // room.linkContainers();
    spawn.room.droppedResources();
    spawn.room.determineSourceAccessPoints();

    infrastructureTasks.locateSpawnDumpLocation(spawn.room);
    if (!spawn.room.memory.creepBuildQueue)

        if (!spawn.room.memory.game) {
            spawn.room.memory.game = {
                phase: 1
            }
        }

    creepFactory.validateCache(spawn.room);
    const structures = spawn.room.structures();

    if (structures.tower) {
        structures.tower.forEach(tower => {
            let hostiles = spawn.room.find(FIND_HOSTILE_CREEPS);

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

    if (_.isEmpty(structures.tower) && spawn.room.controller.level >= 3) {
        console.log('⚠️ WARNING: No towers!');
    }

    let energyCapacityAvailable = spawn.room.energyCapacityAvailable;

    const harvesters = spawn.room.creeps().harvesters || [];
    const couriers = spawn.room.creeps().couriers || [];
    const dropminers = spawn.room.creeps().dropminers || [];
    const builders = spawn.room.creeps().builders || [];
    const upgraders = spawn.room.creeps().upgraders || [];
    const gophers = spawn.room.creeps().gophers || [];

    spawn.room.memory.creeps = {
        harvesters: harvesters.length,
        couriers: couriers.length,
        dropminers: dropminers.length,
        builders: builders.length,
        upgraders: upgraders.length,
        gophers: gophers.length
    };

    let maxBuilderCreeps = 2;
    let maxCourierCreeps = 0;
    let maxDropMinerCreeps = 0;
    let maxHarvesterCreeps = 2;
    let maxUpgraderCreeps = 2;
    let maxGopherCreeps = 1;

    // TODO Only do this mod n times, e.g. % 10.
    infrastructureTasks.buildLinks(spawn.room);

    switch (spawn.room.controller.level) {
        case 0: {

            break;
        }
        case 1: {
            spawn.room.memory.game.phase = 1;
            // Goal is to quickly get to RCL 2 by creating two Upgraders.
            // Builders are extra and in preparation for RCL 2 construction projects.
            maxBuilderCreeps = spawn.room.constructionSites().length > 0 ? 2 : 0;
            // Set only one harvester per source and with a courier act like dropminers. 
            // At this time before we start producing lots of energy then there'll be room for builders/upgraders
            // to also source energy without having to compete with numerous harvester creeps.
            maxDropMinerCreeps = (upgraders.lenth > 0 && couriers.length) > 0 ? spawn.room.memory.sources.length : 0;
            maxHarvesterCreeps = maxDropMinerCreeps == 0 ? spawn.room.memory.sources.length : 0;
            maxCourierCreeps = Math.max(maxHarvesterCreeps, maxDropMinerCreeps);
            maxUpgraderCreeps = 1;
            break;
        }
        case 2: {
            spawn.room.memory.game.phase = 2;

            // May need to increase builder ceiling from 3 to 4.
            maxBuilderCreeps = spawn.room.constructionSites().length > 0 ? 2 : 0;
            // Set only one harvester per source and with a courier act like dropminers. 
            // At this time before we start producing lots of energy then there'll be room for builders/upgraders
            // to also source energy without having to compete with numerous harvester creeps.
            maxDropMinerCreeps = (upgraders.length > 0 && couriers.length) > 0 ? spawn.room.memory.sources.length : 0;
            maxHarvesterCreeps = maxDropMinerCreeps == 0 ? spawn.room.memory.sources.length : 0;
            maxCourierCreeps = Math.max(maxHarvesterCreeps, maxDropMinerCreeps);

            maxUpgraderCreeps = Math.floor(spawn.room.memory._distanceToRCL / 10) * 2;
            break;
        }

        default: {
            spawn.room.memory.game.phase = 999;

            // May need to increase builder ceiling from 3 to 4.
            maxBuilderCreeps = spawn.room.constructionSites().length > 0 ? 2 : 0;
            // Set only one harvester per source and with a courier act like dropminers. 
            // At this time before we start producing lots of energy then there'll be room for builders/upgraders
            // to also source energy without having to compete with numerous harvester creeps.
            maxDropMinerCreeps = (upgraders.length > 0 && couriers.length) > 0 ? spawn.room.memory.sources.length : 0;
            maxHarvesterCreeps = maxDropMinerCreeps == 0 ? spawn.room.memory.sources.length : 0;
            maxCourierCreeps = Math.max(maxHarvesterCreeps, maxDropMinerCreeps);

            maxUpgraderCreeps = Math.floor(spawn.room.memory._distanceToRCL / 10) * 2;
            maxGopherCreeps = 2;
        }

    }

    spawn.room.memory.maxBuilderCreeps = maxBuilderCreeps;
    spawn.room.memory.maxCourierCreeps = maxCourierCreeps;
    spawn.room.memory.maxDropMinerCreeps = maxDropMinerCreeps;
    spawn.room.memory.maxHarvesterCreeps = maxHarvesterCreeps;
    spawn.room.memory.maxUpgraderCreeps = maxUpgraderCreeps;
    spawn.room.memory.maxGopherCreeps = maxGopherCreeps;

    const sufficientBuilders = builders.length >= maxBuilderCreeps; // Should also include harvesters?
    const sufficientCouriers = couriers.length >= maxCourierCreeps;
    const sufficientDropMiners = dropminers.length >= maxDropMinerCreeps;
    const sufficientHarvesters = harvesters.length >= maxHarvesterCreeps;
    const sufficientUpgraders = upgraders.length >= maxUpgraderCreeps;
    const sufficientGophers = gophers.length >= maxGopherCreeps;


    // Summary of actual vs target numbers.
    console.log('  Game Phase: ' + spawn.room.memory.game.phase);
    console.log('  Harvesters: ' + harvesters.length + '/' + maxHarvesterCreeps + ' ' + (sufficientHarvesters ? '✔️' : '❌'));
    console.log('  Couriers: ' + couriers.length + '/' + maxCourierCreeps + ' ' + (sufficientCouriers ? '✔️' : '❌'));
    console.log('  Drop Miners: ' + dropminers.length + '/' + maxDropMinerCreeps + ' ' + (sufficientDropMiners ? '✔️' : '❌'));
    console.log('  Builders: ' + builders.length + '/' + maxBuilderCreeps + ' ' + (sufficientBuilders ? '✔️' : '❌'));
    console.log('  Upgraders: ' + upgraders.length + '/' + maxUpgraderCreeps + ' ' + (sufficientUpgraders ? '✔️' : '❌'));
    console.log('  Gophers: ' + gophers.length + '/' + maxGopherCreeps + ' ' + (sufficientGophers ? '✔️' : '❌'));

    if (Game.time % 50 == 0) {
        console.log('⚠️ INFO: Checking for deleted creeps...');
        for (var i in Memory.creeps) {
            if (!Game.creeps[i]) {
                delete Memory.creeps[i];
            }
        }
    }

    spawn.room.myCreeps().forEach(c => {
        const creep = Game.creeps[c.name];

        if (creep.memory.role == role.COURIER) {
            roleCourier.run(creep);
        }
        if (creep.memory.role == role.HARVESTER) {
            roleHarvester.run(creep);
        }
        if (creep.memory.role == role.DROPMINER) {
            roleDropMiner.run(creep);
        }
        if (creep.memory.role == role.BUILDER) {
            roleBuilder.run(creep);
        }
        if (creep.memory.role == role.UPGRADER) {
            roleUpgrader.run(creep);
        }
        if (creep.memory.role == role.GOPHER) {
            roleGopher.run(creep);
        }
    });

    if (spawn.spawning === null && spawn.room.memory.creepBuildQueue.queue.length == 0) {
        if (harvesters.length == 0 && dropminers.length == 0) {
            energyCapacityAvailable = spawn.room.energyAvailable;
        }

        // HARVESTERS
        if (!sufficientHarvesters) {
            roleHarvester.tryBuild(spawn, energyCapacityAvailable);
        }
        // GOPHERS
        if (!sufficientGophers) {
            roleGopher.tryBuild(spawn, energyCapacityAvailable);
        }
        // COURIERS
        if (!sufficientCouriers) {
            roleCourier.tryBuild(spawn, energyCapacityAvailable);
        }
        // DROPMINERS
        if (!sufficientDropMiners) {
            roleDropMiner.tryBuild(spawn, energyCapacityAvailable);
        }
        // UPGRADERS
        if (!sufficientUpgraders) {
            roleUpgrader.tryBuild(spawn, energyCapacityAvailable);
        }
        // BUILDERS
        if (!sufficientBuilders) {
            roleBuilder.tryBuild(spawn, energyCapacityAvailable);
        }
    } else {
        if (spawn.spawning) {
            console.log('Spawning: ' + spawn.spawning.name)
        }
    }

    creepFactory.processBuildQueue(spawn);
    creepTasks.suicideCreep(spawn.room);

    // Emergency catch all to reset the queue should we end up without any energy gathering screeps.
    if (harvesters == 0 && dropminers == 0 && !_.isEmpty(spawn.room.memory.creepBuildQueue.queue)) {
        const job = spawn.room.memory.creepBuildQueue.queue[0];

        if ((job.name != role.HARVESTER) ||
            creepFactory.bodyCost(job.body > 300)) {
            spawn.room.memory.creepBuildQueue.queue = [];
        }
    }

    creepFactory.evaluateBuildQueue(spawn.room);
}