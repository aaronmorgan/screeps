/*

IMPROVEMENTS:
12. Should the rcl.container simply be placed -30% away from the rcl, back towards the spawn?
15. Spawn name should be stored in room memory.
17. Don't build the RCL container if there's already a base container withing range. 10? 15? tiles.

*/

require('prototype.room')();

const {
    role,
    global
} = require('game.constants');

const roleHarvester = require('role.harvester');
const roleCourier = require('role.courier');
const roleUpgrader = require('role.upgrader');
const roleBuilder = require('role.builder');
const roleDropMiner = require('role.dropminer');
const roleGopher = require('role.gopher');
const roleLinkBaseHarvester = require('role.link.base.harvester');

let infrastructureTasks = require('tasks.infrastructure');
let creepFactory = require('tasks.build.creeps');


module.exports.loop = function () {
    console.log("--- NEW TICK -----------------------------");
    let spawn = Game.spawns['Spawn1'];

    const structures = spawn.room.structures();

    spawn.room.droppedResources();
    spawn.room.determineSourceAccessPoints();
    spawn.room.getDistanceToRCL();

    infrastructureTasks.locateSpawnDumpLocation(spawn.room);
    if (!spawn.room.memory.creepBuildQueue)

        if (!spawn.room.memory.game) {
            spawn.room.memory.game = {
                phase: 1
            }
        }

    if (!spawn.room.memory.jobs) {
        console.log('loading jobs against room')
        spawn.room.memory.jobs = require('tasks.infrastructure.jobs');
    }

    creepFactory.validateCache(spawn.room);

    let storedEnergy = 0;

    if (structures.container) {
        structures.container.forEach(function (x) {
            storedEnergy += x.store.energy;
        });
    }

    if (structures.extensions) {
        structures.extensions.forEach(function (x) {
            storedEnergy += x.store.energy;
        });
    }

    if (structures.storage) {
        structures.storage.forEach(function (x) {
            storedEnergy += x.store.energy;
        });
    }

    if (structures.tower) {
        structures.tower.forEach(tower => {
            let hostiles = spawn.room.find(FIND_HOSTILE_CREEPS);

            if (hostiles.length) {
                console.log("DEFENCE: Attacking hostile from '" + hostiles[0].owner.username + "'");
                tower.attack(hostiles[0]);
            } else if (storedEnergy > 300) {
                let closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => structure.hits < structure.hitsMax
                });
                if (closestDamagedStructure) {
                    tower.repair(closestDamagedStructure);
                }
            }
        });
    }

    // Guard against the RCL dropping to a level less than where Link structures are supported.
    if (spawn.room.controller.level >= 5) {

        // Locate the Link structure closest to the Spawn, this 'should' be the base Link.
        if (!spawn.room.memory.baseLinkId) {
            spawn.room.memory.baseLinkId = {
                id: spawn.pos.findClosestByPath(structures.link).id
            }
        }

        // Foreach room source, check if it has a Link, and if so transfer to the first Link
        // structure in the array, which is the first build; the 'base' Link station.
        spawn.room.memory.sources.forEach(function (source) {
            if (source.linkId) {
                const sourceLink = Game.getObjectById(source.linkId);

                if (sourceLink.store.getUsedCapacity === 0) {
                    return;
                }

                const transferResult = sourceLink.transferEnergy(structures.link[0]);
            }
        });
    }

    let energyCapacityAvailable = spawn.room.energyCapacityAvailable;

    const harvesters = spawn.room.creeps().harvesters || [];
    const couriers = spawn.room.creeps().couriers || [];
    const dropminers = spawn.room.creeps().dropminers || [];
    const builders = spawn.room.creeps().builders || [];
    const upgraders = spawn.room.creeps().upgraders || [];
    const gophers = spawn.room.creeps().gophers || [];
    const linkBaseHarvesters = spawn.room.creeps().linkBaseHarvesters || [];

    spawn.room.memory.creeps = {
        harvesters: harvesters.length,
        couriers: couriers.length,
        dropminers: dropminers.length,
        builders: builders.length,
        upgraders: upgraders.length,
        gophers: gophers.length,
        linkBaseHarvesters: linkBaseHarvesters.length
    };

    let maxBuilderCreeps = 1;
    let maxCourierCreeps = 0;
    let maxDropMinerCreeps = 0;
    let maxHarvesterCreeps = 2;
    let maxUpgraderCreeps = 2;
    let maxGopherCreeps = 0;
    let maxLinkBaseHarvesters = 0;

    // Emergency catch all to reset the queue should we end up without any energy gathering screeps.
    if (harvesters.length <= 2 && dropminers.length == 0 && !_.isEmpty(spawn.room.memory.creepBuildQueue.queue)) {
        const job = spawn.room.memory.creepBuildQueue.queue[0];

        if ((job.name != role.HARVESTER) || creepFactory.bodyCost(job.body) > 300) {
            spawn.room.memory.creepBuildQueue.queue = [];
            energyCapacityAvailable = 300;
        }
    }

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
            maxDropMinerCreeps = couriers.length > 0 ? spawn.room.memory.sources.length : 0;
            maxHarvesterCreeps = maxDropMinerCreeps == 0 ? spawn.room.memory.sources.length : 0;
            maxCourierCreeps = Math.max(maxHarvesterCreeps, maxDropMinerCreeps);
            maxUpgraderCreeps = 1;
            break;
        }
        case 2: {
            spawn.room.memory.game.phase = 2;

            // May need to increase builder ceiling from 3 to 4.
            maxBuilderCreeps = spawn.room.constructionSites().length > 0 ? 2 : 0;
            maxDropMinerCreeps = couriers.length > 0 ? spawn.room.memory.sources.length : 0;
            maxHarvesterCreeps = maxDropMinerCreeps == 0 ? spawn.room.memory.sources.length : 0;
            maxCourierCreeps = Math.max(maxHarvesterCreeps, maxDropMinerCreeps);
            //maxUpgraderCreeps = Math.max(1, Math.floor(spawn.room.memory.controller.path.length / 10)) + 1;
            maxUpgraderCreeps = Math.max(2, Math.floor(storedEnergy / 800));

            if (structures.link) {
                maxLinkBaseHarvesters = structures.link.length > 1 ? 1 : 0;
            }

            break;
        }
        case 3: {
            spawn.room.memory.game.phase = 3;

            // May need to increase builder ceiling from 3 to 4.
            maxBuilderCreeps = spawn.room.constructionSites().length > 0 ? 2 : 0;
            // Set only one harvester per source and with a courier act like dropminers. 
            // At this time before we start producing lots of energy then there'll be room for builders/upgraders
            // to also source energy without having to compete with numerous harvester creeps.
            maxDropMinerCreeps = spawn.room.memory.sources.length; //(upgraders.length > 0 && (couriers.length > 0 || linkSourceHarvesters.length > 0)) > 0 ? spawn.room.memory.sources.length : 0;
            maxHarvesterCreeps = maxDropMinerCreeps == 0 ? spawn.room.memory.sources.length : 0;
            maxCourierCreeps = Math.max(maxHarvesterCreeps, maxDropMinerCreeps);

            maxUpgraderCreeps = Math.max(3, Math.floor(storedEnergy / 800)) + 3;
            maxGopherCreeps = 2; //linkSourceHarvesters.length > 0 ? 0 : 2;

            if (structures.link) {
                maxLinkBaseHarvesters = structures.link.length > 1 ? 1 : 0;
            }

            if (maxBuilderCreeps > 0) {
                maxUpgraderCreeps = 1;
            }

            break;
        }

        default: {
            spawn.room.memory.game.phase = 999;

            // May need to increase builder ceiling from 3 to 4.
            maxBuilderCreeps = spawn.room.constructionSites().length > 0 ? 2 : 0;
            // Set only one harvester per source and with a courier act like dropminers. 
            // At this time before we start producing lots of energy then there'll be room for builders/upgraders
            // to also source energy without having to compete with numerous harvester creeps.
            maxDropMinerCreeps = spawn.room.memory.sources.length; //(upgraders.length > 0 && (couriers.length > 0)) > 0 ? spawn.room.memory.sources.length : 0;
            maxHarvesterCreeps = (spawn.room.memory.creeps.dropminers > 0 && spawn.room.memory.creeps.couriers > 0) ? 0 : 2 - spawn.room.memory.creeps.harvesters; // maxDropMinerCreeps == 0 ? spawn.room.memory.sources.length : 0;
            maxCourierCreeps = spawn.room.memory.sources.length - (structures.link && structures.link.length - 1);

            maxUpgraderCreeps = 4;
            maxGopherCreeps = 1;

            if (structures.link) {
                maxLinkBaseHarvesters = structures.link.length > 1 ? 1 : 0;
            }

            // if (maxBuilderCreeps > 0) {
            //     maxUpgraderCreeps = 1;
            // }
        }
    }

    spawn.room.memory.maxBuilderCreeps = maxBuilderCreeps;
    spawn.room.memory.maxCourierCreeps = maxCourierCreeps;
    spawn.room.memory.maxDropMinerCreeps = maxDropMinerCreeps;
    spawn.room.memory.maxHarvesterCreeps = maxHarvesterCreeps;
    spawn.room.memory.maxUpgraderCreeps = maxUpgraderCreeps;
    spawn.room.memory.maxGopherCreeps = maxGopherCreeps;
    spawn.room.memory.maxLinkBaseHarvesters = maxLinkBaseHarvesters;

    const sufficientBuilders = builders.length >= maxBuilderCreeps; // Should also include harvesters?
    const sufficientCouriers = couriers.length >= maxCourierCreeps;
    const sufficientDropMiners = dropminers.length >= maxDropMinerCreeps;
    const sufficientHarvesters = harvesters.length >= maxHarvesterCreeps;
    const sufficientUpgraders = upgraders.length >= maxUpgraderCreeps;
    const sufficientGophers = gophers.length >= maxGopherCreeps;
    const sufficientLinkBaseHarvesters = linkBaseHarvesters.length >= maxLinkBaseHarvesters;

    // Summary of actual vs target numbers.
    console.log('  Game Phase: ' + spawn.room.memory.game.phase);
    console.log('  Harvesters: ' + harvesters.length + '/' + maxHarvesterCreeps + ' ' + (sufficientHarvesters ? '✔️' : '❌'));
    console.log('  Couriers: ' + couriers.length + '/' + maxCourierCreeps + ' ' + (sufficientCouriers ? '✔️' : '❌'));
    console.log('  Drop Miners: ' + dropminers.length + '/' + maxDropMinerCreeps + ' ' + (sufficientDropMiners ? '✔️' : '❌'));
    console.log('  Builders: ' + builders.length + '/' + maxBuilderCreeps + ' ' + (sufficientBuilders ? '✔️' : '❌'));
    console.log('  Upgraders: ' + upgraders.length + '/' + maxUpgraderCreeps + ' ' + (sufficientUpgraders ? '✔️' : '❌'));
    console.log('  Gophers: ' + gophers.length + '/' + maxGopherCreeps + ' ' + (sufficientGophers ? '✔️' : '❌'));
    console.log('  LinkBaseHarvesters: ' + linkBaseHarvesters.length + '/' + maxLinkBaseHarvesters + ' ' + (sufficientLinkBaseHarvesters ? '✔️' : '❌'));

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
        if (creep.memory.role == role.LINK_BASE_HARVESTER) {
            roleLinkBaseHarvester.run(creep);
        }
    });

    //spawn.room.memory.creepBuildQueue.queue.pop(); // Clear build queue.

    if (spawn.spawning === null && spawn.room.memory.creepBuildQueue.queue.length == 0) {
        //if ((harvesters.length == 0 && dropminers.length == 0) || structures.storage) {
        if ((harvesters.length === 0 && dropminers.length === 0) ||
            (structures.storage && linkBaseHarvesters.length === 0)) {
            energyCapacityAvailable = spawn.room.energyAvailable;
            console.log('⚠️ INFO: Limited energy available, downsizing build allowence to', energyCapacityAvailable)
        }

        // HARVESTERS
        if (!sufficientHarvesters) {
            roleHarvester.tryBuild(spawn, energyCapacityAvailable);
        }
        // LINK BASE HARVESTERS
        if (!sufficientLinkBaseHarvesters) {
            roleLinkBaseHarvester.tryBuild(spawn, energyCapacityAvailable);
        }
        // COURIERS
        if (!sufficientCouriers) {
            roleCourier.tryBuild(spawn, energyCapacityAvailable);
        }
        // GOPHERS
        if (!sufficientGophers) {
            roleGopher.tryBuild(spawn, energyCapacityAvailable);
        }
        // DROPMINERS
        if (!sufficientDropMiners) {
            roleDropMiner.tryBuild(spawn, energyCapacityAvailable);
        }
        // BUILDERS
        if (!sufficientBuilders) {
            roleBuilder.tryBuild(spawn, energyCapacityAvailable);
        }
        // UPGRADERS
        if (!sufficientUpgraders) {
            roleUpgrader.tryBuild(spawn, energyCapacityAvailable);
        }
    } else {
        if (spawn.spawning) {
            console.log('Spawning: ' + spawn.spawning.name)
        }
    }

    creepFactory.processBuildQueue(spawn);
    creepFactory.evaluateBuildQueue(spawn.room);
}