const {
    EXIT_CODE,
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleHarvester = {

    tryBuild: function (room, energyCapacityAvailable) {
        let bodyType = [];

        if (energyCapacityAvailable >= 500) {
            bodyType = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 450) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 350) {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            let sourceIdWithFewestMiners = this.getSourceToMine(room);

            return creepFactory.create(room, role.HARVESTER, bodyType, {
                role: role.HARVESTER,
                source: sourceIdWithFewestMiners,
                isHarvesting: true
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        // TODO: Disabled to see if keeping harvesters around until they naturally die off after dropminers are introduced
        // speeds up resource collection significantly.

        // Harvesters can get in the way of dropminers, if we have the necessary replacement creeps, die early.
        if (creep.room.memory.creeps.dropminers === creep.room.memory.maxDropMinerCreeps && creep.room.memory.creeps.couriers > 0) {
            creep.dropResourcesAndDie();
        }

        creep.checkTicksToDie();
        creep.checkTicksToLive();

        const creepFillPercentage = creep.CreepFillPercentage();

        if (creepFillPercentage > 0) {
            creep.say('⛏️ ' + creepFillPercentage + '%')
        }

        if ((creep.memory.isHarvesting && creep.store.getFreeCapacity() != 0)) {
            // Cater for the siuation where the creep wanders into another room.
            if (_.isEmpty(creep.room.memory.sources)) {
                return;
            }

            const source = Game.getObjectById(creep.memory.source.id);
            if (!source) {
                creep.memory.source.id = this.getSourceToMine(creep.room);
            }

            const harvestResult = creep.harvest(source);

            if (harvestResult === ERR_INVALID_TARGET) {
                console.log('⛔ Error: INVALID_TARGET attempting to locate nearest source, source=' + JSON.stringify(source));

                if (!source) {
                    creep.memory.source = this.getSourceToMine(creep.room);
                }
            } else if (harvestResult === ERR_NOT_IN_RANGE) {
                const moveResult = creep.moveTo(source, {
                    reusePath: 10,
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });

                if (moveResult == ERR_NO_PATH) {
                    const sources = creep.room.selectAvailableSource(creep.room.creeps().harvesters);

                    if (!_.isEmpty(sources)) {
                        const source = sources[0].id;

                        console.log('INFO: Attempting set new target source, id=' + source.id);
                        creep.memory.source = source;
                    }
                }
            } else if (harvestResult == OK) {
                const linkStructure = Game.getObjectById(source.id).pos.findInRange(FIND_MY_STRUCTURES, 3, {
                    filter: {
                        structureType: STRUCTURE_LINK
                    }
                })[0];

                if (linkStructure) {
                    creep.memory.linkId = linkStructure.id;

                    const transferResult = creep.transfer(linkStructure, RESOURCE_ENERGY);

                    switch (transferResult) {
                        case (ERR_NOT_IN_RANGE): {
                            creep.moveTo(linkStructure, {
                                reusePath: 10,
                                visualizePathStyle: {
                                    stroke: '#ffffff'
                                }
                            });

                            break;
                        }
                    }
                } else {
                    creep.memory.isHarvesting = creep.store.getFreeCapacity() != 0;

                    if (!creep.memory.isHarvesting && creep.room.memory.creeps.couriers > 0) {
                        for (const resourceType in creep.carry) {
                            creep.drop(resourceType);
                        }
                    }
                }
            }
        } else {
            if (creep.room.memory.creeps.couriers > 0 ||
                creep.room.memory.creeps.gophers > 0) {
                for (const resourceType in creep.carry) {
                    creep.drop(resourceType);
                }

                creep.memory.isHarvesting = true;

                return;
            }

            const targets = creep.findEnergyTransferTarget();

            if (targets.length == 0) {
                var target = Game.flags[creep.room.name + '_DUMP'];

                if (!target) {
                    for (const resourceType in creep.store) {
                        creep.drop(resourceType);
                    }
                    creep.memory.isHarvesting = true;

                    return;
                }

                if (!creep.pos.isEqualTo(target)) {
                    creep.moveTo(target, {
                        reusePath: 10,
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    })
                } else {
                    for (const resourceType in creep.store) {
                        creep.drop(resourceType);
                    }
                    creep.memory.isHarvesting = true;
                }
            }
        }
    },

    getSourceToMine: function (room) {
        const harvesters = room.creeps().harvesters

        let sourceIdWithFewestMiners = undefined;

        if (harvesters.length > 0) {
            var harvestersForRoom = harvesters.filter(miner => miner.room.name === room.name);

            // Seed with all sources at 0 so unoccupied sources are included.
            const roomSources = room.find(FIND_SOURCES);
            const initialCounts = roomSources.reduce((acc, source) => {
                acc[source.id] = 0;
                return acc;
            }, {});

            // Count miners per source, starting from the seeded zero-counts.
            const sourceIdsWithMinerCount = harvestersForRoom.reduce((acc, miner) => {
                acc[miner.memory.source.id] = (acc[miner.memory.source.id] || 0) + 1;
                return acc;
            }, initialCounts);

            // Build a lookup of accessPoints by source id to use later so we don't over
            // allocate creeps per access point.
            const accessPointsById = room.memory.sources.reduce((acc, source) => {
                acc[source.id] = source.accessPoints;
                return acc;
            }, {});

            // Exclude sources that have no remaining access points
            const availableSources = Object.entries(sourceIdsWithMinerCount)
                .filter(([id, count]) => count < (accessPointsById[id] || Infinity));

            if (availableSources.length === 0) {
                sourceIdWithFewestMiners = null; // No available sources
            } else {
                const leastCommonMinedId = availableSources.reduce(
                    (min, entry) => entry[1] < min[1] ? entry : min
                )[0];

                sourceIdWithFewestMiners = Game.getObjectById(leastCommonMinedId);
            }
        }

        if (!sourceIdWithFewestMiners) {
            sourceIdWithFewestMiners = room.selectAvailableSource()[0];
        }

        return sourceIdWithFewestMiners;
    }


};

module.exports = roleHarvester;