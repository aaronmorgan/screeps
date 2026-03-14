const {
    EXIT_CODE,
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleDropMiner = {

    tryBuild: function (room, energyCapacityAvailable) {
        const dropMiners = room.creeps().dropminers

        let sourceIdWithFewestMiners = undefined;

        if (dropMiners.length > 0) {
            var minersForRoom = dropMiners.filter(miner => miner.room.name === room.name);

            // Seed with all sources at 0 so unoccupied sources are included.
            const roomSources = room.find(FIND_SOURCES);
            const initialCounts = roomSources.reduce((acc, source) => {
                acc[source.id] = 0;
                return acc;
            }, {});

            // Count miners per source, starting from the seeded zero-counts.
            const sourceIdsWithMinerCount = minersForRoom.reduce((acc, miner) => {
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

        const linkStructure = sourceIdWithFewestMiners.pos.findInRange(FIND_MY_STRUCTURES, 3, {
            filter: {
                structureType: STRUCTURE_LINK
            }
        })[0];

        let lastPart = MOVE;

        if (linkStructure) {
            lastPart = CARRY;
        }


        let bodyType = [];

        if (energyCapacityAvailable >= 700) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, lastPart];
            room.memory.minersPerSource = 1;
        } else if (energyCapacityAvailable >= 600) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, lastPart]; // 5 WORK parts mine exactly 3000 energy every 300 ticks.
            room.memory.minersPerSource = 1;
        } else if (energyCapacityAvailable >= 400) {
            bodyType = [WORK, WORK, WORK, MOVE, lastPart];
            room.memory.minersPerSource = 2;
        } else if (energyCapacityAvailable >= 350) {
            bodyType = [WORK, WORK, WORK, lastPart];
            room.memory.minersPerSource = 2;
        } else {
            bodyType = [WORK, WORK, MOVE, lastPart];
            room.memory.minersPerSource = 2;
        }

        if (!_.isEmpty(bodyType)) {
            if (!sourceIdWithFewestMiners) {
                console.log('ERROR: Attempting to create ' + role.DROPMINER + ' with an assigned source');
                return EXIT_CODE.ERR_INVALID_TARGET;
            } else {
                return creepFactory.create(room, role.DROPMINER, bodyType, {
                    role: role.DROPMINER,
                    source: sourceIdWithFewestMiners
                });
            }
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        const harvestResult = creep.harvest(Game.getObjectById(creep.memory.source.id));

        switch (harvestResult) {
            case (ERR_NOT_IN_RANGE): {
                const moveToResult = creep.moveTo(creep.memory.source.pos, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });

                if (moveToResult === ERR_NOT_IN_RANGE) {
                    return;
                }

                break;
            }
        }

        const linkStructure = Game.getObjectById(creep.memory.source.id).pos.findInRange(FIND_MY_STRUCTURES, 3, {
            filter: {
                structureType: STRUCTURE_LINK
            }
        })[0];

        if (linkStructure) {
            creep.memory.linkId = linkStructure.id;

            const transferResult = creep.transfer(linkStructure, RESOURCE_ENERGY);

            switch (transferResult) {
                case (ERR_NOT_IN_RANGE): {
                    const moveToResult = creep.moveTo(linkStructure, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });

                    if (moveToResult !== OK) {
                        return;
                    };

                    break;
                }
            }
        }

        if (harvestResult == ERR_NOT_IN_RANGE) {
            const moveToResult = creep.moveTo(Game.getObjectById(creep.memory.source.id), {
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });

            if (moveToResult !== OK) {
                return;
            };

            return creep.harvest(creep.memory.source);
        }
    }
};

module.exports = roleDropMiner;