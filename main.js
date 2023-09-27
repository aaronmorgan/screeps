require("prototype.room")();

const { role, global } = require("game.constants");

const roleBuilder = require("role.builder");
const roleCourier = require("role.courier");
const roleDefender = require("role.defender");
const roleDropMiner = require("role.dropminer");
const roleGopher = require("role.gopher");
const roleHarvester = require("role.harvester");
const roleLinkBaseHarvester = require("role.link.base.harvester");
const roleRoamingHarvester = require("role.roaming.harvester");
const roleUpgrader = require("role.upgrader");

let infrastructureTasks = require("tasks.infrastructure");
let creepFactory = require("tasks.build.creeps");

module.exports.loop = function () {
    console.log("--- NEW TICK -----------------------------");

    for (const name in Game.rooms) {
        const room = Game.rooms[name];
        const structures = room.structures();

        let spawn = structures.spawn ? structures.spawn[0] : undefined;

        room.droppedResources();
        room.getDistanceToRCL();

        if (!room.memory) {
            room.memory = {
                jobs: require("tasks.infrastructure.jobs"),
                hasSpawn: spawn ? true : false,
                isFarm: !spawn ? true : false,
                roamingHarvesters: []
            };
            room.determineSourceAccessPoints();
        }

        infrastructureTasks.locateSpawnDumpLocation(room);
        if (!room.memory.creepBuildQueue) {
            if (!room.memory.game) {
                room.memory.game = {
                    phase: 1,
                };
            }
        }


        creepFactory.validateCache(room);

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
            structures.tower.forEach((tower) => {
                let hostiles = room.find(FIND_HOSTILE_CREEPS);

                if (hostiles.length) {
                    console.log("DEFENCE: Attacking hostile from '" + hostiles[0].owner.username + "'");
                    tower.attack(hostiles[0]);
                } else if (storedEnergy > 300) {
                    let closestDamagedStructure = tower.pos.findClosestByRange(
                        FIND_STRUCTURES,
                        {
                            filter: (structure) =>
                                structure.hits < structure.hitsMax,
                        }
                    );
                    if (closestDamagedStructure) {
                        tower.repair(closestDamagedStructure);
                    }
                }
            });
        }

        // Guard against the RCL dropping to a level less than where Link structures are supported.
        if (room.controller.level >= 5) {
            // Locate the Link structure closest to the Spawn, this 'should' be the base Link.
            if (!_.isEmpty(structures.link) && !room.memory.baseLinkId) {
                room.memory.baseLinkId = {
                    id: spawn.pos.findClosestByPath(structures.link).id,
                };
            }

            // Foreach room source, check if it has a Link, and if so transfer to the first Link
            // structure in the array, which is the first build; the 'base' Link station.
            room.memory.sources.forEach(function (source) {
                if (source.linkId) {
                    const sourceLink = Game.getObjectById(source.linkId);

                    if (sourceLink.store.getUsedCapacity === 0) {
                        return;
                    }

                    const transferResult = sourceLink.transferEnergy(
                        structures.link[0]
                    );
                }
            });
        }

        let energyCapacityAvailable = room.energyCapacityAvailable;

        const builders = room.creeps().builders || [];
        const couriers = room.creeps().couriers || [];
        const defenders = room.creeps().defenders || [];
        const dropminers = room.creeps().dropminers || [];
        const gophers = room.creeps().gophers || [];
        const harvesters = room.creeps().harvesters || [];
        const linkBaseHarvesters = room.creeps().linkBaseHarvesters || [];
       // const roamingHarvesters = room.memory.roamingHarvesters;
        const upgraders = room.creeps().upgraders || [];

        // if (spawn) {
        //     room.memory.roamingHarvesters.forEach(creepId => {
        //         roamingHarvesters.push(Game.getObjectById(creepId));
        //     });
        // }

        room.memory.creeps = {
            builders: builders.length,
            couriers: couriers.length,
            defenders: defenders.length,
            dropminers: dropminers.length,
            gophers: gophers.length,
            harvesters: harvesters.length,
            linkBaseHarvesters: linkBaseHarvesters.length,
            roamingHarvesters: room.memory.roamingHarvesters.length,
            upgraders: upgraders.length
        };

        let maxBuilderCreeps = 1;
        let maxCourierCreeps = 0;
        let maxDefenderCreeps = structures.tower === undefined ? 2 : 0; // If we have any towers we don't need defender creeps.
        let maxDropMinerCreeps = 0;
        let maxGopherCreeps = 0;
        let maxHarvesterCreeps = 2;
        let maxLinkBaseHarvesters = 0;
        let maxRoamingHarversterCreeps = 1
        let maxUpgraderCreeps = 2;

        // Emergency catch all to reset the queue should we end up without any energy gathering screeps.
        if (harvesters.length <= 2 && dropminers.length == 0 && !_.isEmpty(room.memory.creepBuildQueue.queue)) {
            const job = room.memory.creepBuildQueue.queue[0];

            if (job.name != role.HARVESTER || creepFactory.bodyCost(job.body) > 300) {
                room.memory.creepBuildQueue.queue = [];
                energyCapacityAvailable = 300;
            }
        }

        // TODO Only do this mod n times, e.g. % 10.
        infrastructureTasks.buildLinks(room);

        switch (room.controller.level) {
            case 0: {
                break;
            }
            case 1: {
                room.memory.game.phase = 1;
                // Goal is to quickly get to RCL 2 by creating two Upgraders.
                // Builders are extra and in preparation for RCL 2 construction projects.
                maxBuilderCreeps = room.constructionSites().length > 0 ? 2 : 0;
                maxDropMinerCreeps = couriers.length > 0 ? room.memory.sources.length : 0;
                maxHarvesterCreeps = maxDropMinerCreeps == 0 ? room.memory.sources.length : 0;
                maxCourierCreeps = Math.max(maxHarvesterCreeps, maxDropMinerCreeps);
                maxRoamingHarversterCreeps = 4;
                maxUpgraderCreeps = 2;
                maxGopherCreeps = 1;

                break;
            }
            case 2: {
                room.memory.game.phase = 2;

                // May need to increase builder ceiling from 3 to 4.
                maxBuilderCreeps = 1;// room.constructionSites().length > 0 ? 2 : 0;
                maxDropMinerCreeps = couriers.length > 0 ? room.memory.sources.length : 0;
                maxHarvesterCreeps = dropminers.length > 0 == 0 ? room.memory.sources.length : 0;
                maxCourierCreeps = Math.max(maxHarvesterCreeps, maxDropMinerCreeps);
                //maxUpgraderCreeps = Math.max(1, Math.floor(room.memory.controller.path.length / 10)) + 1;
                maxUpgraderCreeps = Math.max(3, Math.floor(storedEnergy / 800));
                maxRoamingHarversterCreeps = 4;
                maxGopherCreeps = 1;

                if (structures.link) {
                    maxLinkBaseHarvesters = structures.link.length > 1 ? 1 : 0;
                }

                break;
            }
            case 3: {
                room.memory.game.phase = 3;

                // May need to increase builder ceiling from 3 to 4.
                maxBuilderCreeps = room.constructionSites().length > 0 ? 2 : 0;
                // Set only one harvester per source and with a courier act like dropminers.
                // At this time before we start producing lots of energy then there'll be room for builders/upgraders
                // to also source energy without having to compete with numerous harvester creeps.
                maxDropMinerCreeps = room.memory.sources.length; //(upgraders.length > 0 && (couriers.length > 0 || linkSourceHarvesters.length > 0)) > 0 ? room.memory.sources.length : 0;
                maxHarvesterCreeps = maxDropMinerCreeps == 0 ? room.memory.sources.length : 0;
                maxCourierCreeps = Math.max(maxHarvesterCreeps, maxDropMinerCreeps);

                maxUpgraderCreeps = Math.max(4, Math.floor(storedEnergy / 800)) + 3;
                maxRoamingHarversterCreeps = 4;
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
                room.memory.game.phase = 999;

                // May need to increase builder ceiling from 3 to 4.
                maxBuilderCreeps = room.constructionSites().length > 0 ? 2 : 0;
                // Set only one harvester per source and with a courier act like dropminers.
                // At this time before we start producing lots of energy then there'll be room for builders/upgraders
                // to also source energy without having to compete with numerous harvester creeps.
                maxDropMinerCreeps = room.memory.sources.length;
                maxHarvesterCreeps =
                    room.memory.creeps.dropminers > 0 && room.memory.creeps.couriers > 0
                        ? 0
                        : room.memory.sources.length; // maxDropMinerCreeps == 0 ? room.memory.sources.length : 0;
                maxCourierCreeps = room.memory.sources.length - (_.isEmpty(structures.link) ? 0 : structures.link.length - 1);

                maxUpgraderCreeps = Math.max(3, Math.floor(storedEnergy / 800) + 3);
                maxRoamingHarversterCreeps = 4;
                maxGopherCreeps = 1;

                if (structures.link || structures.storage) {
                    maxLinkBaseHarvesters = 1;
                }
            }
        }

        room.memory.maxBuilderCreeps = maxBuilderCreeps;
        room.memory.maxCourierCreeps = maxCourierCreeps;
        room.memory.maxDefenderCreeps = maxDefenderCreeps;
        room.memory.maxDropMinerCreeps = maxDropMinerCreeps;
        room.memory.maxGopherCreeps = maxGopherCreeps;
        room.memory.maxHarvesterCreeps = maxHarvesterCreeps;
        room.memory.maxLinkBaseHarvesters = maxLinkBaseHarvesters;
        room.memory.maxRoamingHarversterCreeps = maxRoamingHarversterCreeps;
        room.memory.maxUpgraderCreeps = maxUpgraderCreeps;

        const sufficientBuilders = builders.length >= maxBuilderCreeps; // Should also include harvesters?
        const sufficientCouriers = couriers.length >= maxCourierCreeps;
        const sufficientDefenders = defenders.length >= maxDefenderCreeps;
        const sufficientDropMiners = dropminers.length >= maxDropMinerCreeps;
        const sufficientGophers = gophers.length >= maxGopherCreeps;
        const sufficientHarvesters = harvesters.length >= maxHarvesterCreeps;
        const sufficientLinkBaseHarvesters = linkBaseHarvesters.length >= maxLinkBaseHarvesters;
        const sufficientRoamingHarvesters = room.memory.roamingHarvesters.length >= maxRoamingHarversterCreeps;
        const sufficientUpgraders = upgraders.length >= maxUpgraderCreeps;

        console.log("Game Phase: " + room.memory.game.phase + " | " + room.name);

        // Summary of actual vs target numbers.
        if (spawn) {
            console.log("  Builders: " + builders.length + "/" + maxBuilderCreeps + " " + (sufficientBuilders ? "✔️" : "❌"));
            console.log("  Couriers: " + couriers.length + "/" + maxCourierCreeps + " " + (sufficientCouriers ? "✔️" : "❌"));
            console.log("  Defenders: " + defenders.length + "/" + maxDefenderCreeps + " " + (sufficientDefenders ? "✔️" : "❌"));
            console.log("  Drop Miners: " + dropminers.length + "/" + maxDropMinerCreeps + " " + (sufficientDropMiners ? "✔️" : "❌"));
            console.log("  Gophers: " + gophers.length + "/" + maxGopherCreeps + " " + (sufficientGophers ? "✔️" : "❌"));
            console.log("  Harvesters: " + harvesters.length + "/" + maxHarvesterCreeps + " " + (sufficientHarvesters ? "✔️" : "❌"));
            console.log("  LinkBaseHarvesters: " + linkBaseHarvesters.length + "/" + maxLinkBaseHarvesters + " " + (sufficientLinkBaseHarvesters ? "✔️" : "❌"));
            console.log("  Roaming Harvesters: " + room.memory.roamingHarvesters.length + "/" + maxRoamingHarversterCreeps + " " + (sufficientRoamingHarvesters ? "✔️" : "❌"));
            console.log("  Upgraders: " + upgraders.length + "/" + maxUpgraderCreeps + " " + (sufficientUpgraders ? "✔️" : "❌"));

            if (Game.time % 50 == 0) {
                console.log("⚠️ INFO: Checking for deleted creeps...");
                for (var i in Memory.creeps) {
                    if (!Game.creeps[i]) {
                        delete Memory.creeps[i];
                    }
                }

                for (var i in room.memory.roamingHarvesters) {
                    const roamingCreep = Game.getObjectById(i);
                    if (!Game.creeps[roamingCreep]) {
                        delete room.memory.roamingHarvesters[i];
                    }
                }

                room.memory.roamingHarvesters = room.memory.roamingHarvesters.filter(element => {
                    return element !== null;
                });
            }
        }

  
        //room.memory.roamingHarvesters = []
        console.log('memory', JSON.stringify(room.memory.roamingHarvesters))

//         for (var i in room.memory.roamingHarvesters) {
//             const roamingCreep = Game.getObjectById(i);
//             console.log('roamingCream', JSON.stringify(roamingCreep))
//             console.log(!Game.creeps[roamingCreep])

//             if (!Game.creeps[roamingCreep]) {
                
// //                delete room.memory.roamingHarvesters[i];
//             } else {
//                 console.log(room.memory.roamingHarvesters.filter((x) => x == roamingCreep.id))

//             }
//         }

              // room.memory.roamingHarvesters = room.memory.roamingHarvesters.filter(element => {
        //     return element !== null;
        // });

        room.myCreeps().forEach((c) => {
            const creep = Game.creeps[c.name];

            switch (creep.memory.role) {
                case role.BUILDER: roleBuilder.run(creep); break;
                case role.COURIER: roleCourier.run(creep); break;
                case role.DEFENDER: roleDefender.run(creep); break;
                case role.DROPMINER: roleDropMiner.run(creep); break;
                case role.GOPHER: roleGopher.run(creep); break;
                case role.HARVESTER: roleHarvester.run(creep); break;
                case role.LINK_BASE_HARVESTER: roleLinkBaseHarvester.run(creep); break;
                case role.ROAMING_HARVESTER: roleRoamingHarvester.run(creep); break;
                case role.UPGRADER: roleUpgrader.run(creep); break;
            }
        });

        //room.memory.creepBuildQueue.queue.pop(); // Clear build queue.

        if (spawn) {
            if (spawn.spawning === null &&
                room.memory.creepBuildQueue.queue.length == 0
            ) {
                if (
                    (harvesters.length === 0 && dropminers.length === 0) ||
                    (dropminers.length > 0 && (couriers.length === 0 || gophers.length === 0)) ||
                    (structures.storage && linkBaseHarvesters.length === 0)
                ) {
                    energyCapacityAvailable = room.energyAvailable;
                    console.log("⚠️ INFO: Limited energy available, downsizing build allowence to", energyCapacityAvailable
                    );
                }

                // HARVESTERS
                if (!sufficientHarvesters) {
                    roleHarvester.tryBuild(spawn, energyCapacityAvailable);
                }
                // ROAMING HARVESTERS
                if (!sufficientRoamingHarvesters) {
                    roleRoamingHarvester.tryBuild(spawn, energyCapacityAvailable);
                }
                // GOPHERS
                if (!sufficientGophers) {
                    roleGopher.tryBuild(spawn, energyCapacityAvailable);
                }
                // DEFENDERS
                if (!sufficientDefenders) {
                    roleDefender.tryBuild(spawn, energyCapacityAvailable);
                }
                // LINK BASE HARVESTERS
                if (!sufficientLinkBaseHarvesters) {
                    roleLinkBaseHarvester.tryBuild(spawn, energyCapacityAvailable);
                }
                // COURIERS
                if (!sufficientCouriers) {
                    roleCourier.tryBuild(spawn, energyCapacityAvailable);
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
            }

            creepFactory.processBuildQueue(spawn);
        }

        creepFactory.evaluateBuildQueue(room);
    }
};
