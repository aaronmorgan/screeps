const {
    role
} = require('game.constants');

const sourceBoundaryDistance = 3;

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleCourier = {

    tryBuild: function (room, energyCapacityAvailable) {
        let bodyType = [];
        if (energyCapacityAvailable >= 600) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 550) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 500) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 450) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 400) {
            bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 350) {
            bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else {
            bodyType = [CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            const couriers = room.creeps().couriers;

            let sourceIdWithFewestCouriers = undefined;

            if (couriers.length > 0) {
                var couriersForRoom = couriers.filter(courier => courier.room.name === room.name);

                // Seed with all sources at 0 so unoccupied sources are included.
                const roomSources = room.find(FIND_SOURCES);
                const initialCounts = roomSources.reduce((acc, source) => {
                    acc[source.id] = 0;
                    return acc;
                }, {});

                // Count couriers per source, starting from the seeded zero-counts.
                const sourceIdsWithCourierCount = couriersForRoom.reduce((acc, courier) => {
                    acc[courier.memory.source.id] = (acc[courier.memory.source.id] || 0) + 1;
                    return acc;
                }, initialCounts);

                // Build a lookup of accessPoints by source id to use later so we don't over
                // allocate creeps per access point.
                const accessPointsById = room.memory.sources.reduce((acc, source) => {
                    acc[source.id] = source.accessPoints;
                    return acc;
                }, {});

                // Exclude sources that have no remaining access points
                const availableSources = Object.entries(sourceIdsWithCourierCount)
                    .filter(([id, count]) => count < (accessPointsById[id] || Infinity));

                if (availableSources.length === 0) {
                    sourceIdWithFewestCouriers = null; // No available sources
                } else {
                    const leastCommonSourceId = availableSources.reduce(
                        (min, entry) => entry[1] < min[1] ? entry : min
                    )[0];

                    sourceIdWithFewestCouriers = Game.getObjectById(leastCommonSourceId);
                }
            }

            if (!sourceIdWithFewestCouriers) {
                sourceIdWithFewestCouriers = room.selectAvailableSource()[0];
            }

            return creepFactory.create(room, role.COURIER, bodyType, {
                role: role.COURIER,
                source: sourceIdWithFewestCouriers,
                harvesting: false
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        const creepFillPercentage = creep.CreepFillPercentage();

        if (creepFillPercentage > 0) {
            creep.say('🚚 ' + creepFillPercentage + '%');
        }

        if (creepFillPercentage === 100) {
            creep.memory.harvesting = false;
        }

        // Creep has no energy so we need to move to our source.
        if (creepFillPercentage === 0 && !creep.memory.harvesting) {
            var path = creep.pos.findPathTo(creep.memory.source.pos);

            if (creep.ticksToLive < (path.length * 2)) {
                creep.dropResourcesAndDie();
            }

            const moveResult = creep.moveTo(Game.getObjectById(creep.memory.source.id), {
                reusePath: 10,
                visualizePathStyle: {
                    stroke: '#ffffff'
                }
            })

            switch (moveResult) {
                case OK: {
                    creep.memory.harvesting = true;
                    break;
                }
                case ERR_NOT_IN_RANGE:
                case ERR_NOT_FOUND:
                default:
                    return;
            }

            return;
        }

        // We've moved to our source now look for resources within it's preferring collection point.
        if (creepFillPercentage < 100 && creep.memory.harvesting) {
            // Don't look too far from the source so use sourceBoundryPosition to create a range to look within. 
            // If this range is too large the creep might favor resources from another source and ignore it's primary target.
            const droppedResources = creep.room.droppedResourcesCloseToSource(creep.memory.source.id, sourceBoundaryDistance);

            if (droppedResources && droppedResources.length > 0) {
                // Identify the largest dropped resource in the array of resources closest to us.
                const resources = droppedResources.reduce((prev, current) => {
                    return (prev.energy.amount > current.energy.amount) ? prev : current;
                });

                if (resources) {
                    const target = Game.getObjectById(resources.energy.id);
                    const pickupResult = creep.pickup(target);

                    switch (pickupResult) {
                        case OK: {
                            creep.memory.harvesting = true;
                            break;
                        }
                        case ERR_NOT_IN_RANGE: {
                            creep.moveTo(target, {
                                reusePath: 10,
                                visualizePathStyle: {
                                    stroke: '#ffffff'
                                }
                            })

                            break;
                        }
                        case ERR_FULL: {
                            creep.memory.harvesting = false;
                        }
                    }
                } else {
                    // Cannot see any dropped resources in range, cancel harvesting state.
                    creep.memory.harvesting = false;
                }
            } else {
                creep.memory.harvesting = false;
            }

            return;
        }

        if (creepFillPercentage > 85 || !creep.memory.harvesting) {
            const targets = creep.findEnergyTransferTarget();

            // Head home so we're close to base when energy slots open up.
            if (targets.length === 0) {
                const target = Game.flags[creep.room.name + '_DUMP'];

                if (!creep.pos.isEqualTo(target)) {
                    creep.moveTo(target, {
                        reusePath: 10,
                        range: 1,
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });

                    if (creep.pos.isNearTo(target) || creep.pos.isEqualTo(target)) {
                        creep.dropResources();
                    }
                } else {
                    // Should be dropping resources on the spot outside our spawn for other builder and upgrader creeps to pickup.
                    creep.dropResources();
                }
            }
        }
    }
};

module.exports = roleCourier;