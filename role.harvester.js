const {
    EXIT_CODE,
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleHarvester = {

    tryBuild: function (p_room, p_spawn, p_energyCapacityAvailable, p_harvesters) {
        let bodyType = [];

        if (p_energyCapacityAvailable >= 500) {
            bodyType = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 350) {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            let targetSourceId = undefined;

            if (p_harvesters.length == 0) {
                targetSourceId = p_spawn.pos.findClosestByPath(p_room.sources().map(x => x.pos))
            }

            for (let i = 0; i < p_room.memory.sources.length; i++) {
                const source = p_room.memory.sources[i];

                const creepsForThisSource = Math.min(source.accessPoints, _.countBy(p_harvesters, x => x.memory.sourceId == source.id).true);

                const b = p_harvesters.filter(x => x.memory.sourceId == source.id).length;

                if (b == p_room.memory.minersPerSource) {
                    continue;
                }

                if (creepsForThisSource > source.accessPoints) {
                    console.log('⚠️ WARNING: Too many DROPMINER creeps for source ' + source.id);

                    // TODO Remove excess creeps. Remove the creep with the lowest TTL?
                    continue;
                }

                targetSourceId = source.id;
                break;
            };

            if (!targetSourceId) {
                console.log('ERROR: Attempting to create ' + role.HARVESTER + ' with an assigned source');
                return EXIT_CODE.ERR_INVALID_TARGET;
            } else {
                return creepFactory.create(p_room, p_spawn, role.HARVESTER, bodyType, {
                    role: role.HARVESTER,
                    sourceId: targetSourceId,
                    isHarvesting: true
                });
            }
        }
    },

    /** @param {Creep} p_creep **/
    run: function (p_creep) {
        p_creep.checkTicksToDie();
        p_creep.checkTicksToLive();

        let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);
        p_creep.say('⛏ ' + creepFillPercentage + '%')

        if (p_creep.memory.isHarvesting && p_creep.store.getFreeCapacity() != 0) {
            // Favor dropped energy first so havesters can act as haulers to the dropminers.
            const resourceEnergy = p_creep.room.droppedResources();
            const droppedResources = p_creep.pos.findClosestByPath(resourceEnergy.map(x => x.pos))

            let energyTarget = undefined;

            if (droppedResources) {
                energyTarget = resourceEnergy.find(x => x.pos.x == droppedResources.x && x.pos.y == droppedResources.y)
            }

            let droppedEnergy = undefined;

            if (!_.isEmpty(energyTarget)) {
                droppedEnergy = Game.getObjectById(energyTarget.id);

                const pickupResult = p_creep.pickup(droppedEnergy);

                console.log(pickupResult);
                if (pickupResult == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(droppedEnergy, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                } else if (pickupResult == OK) {
                    p_creep.room.refreshDroppedResources();
                }
            } else {
                // Cater for the siuation where the creep wanders into another room.
                if (_.isEmpty(p_creep.room.memory.sources)) {
                    return;
                }

                const source = Game.getObjectById(p_creep.memory.sourceId);

                p_creep.memory.isHarvesting = true;

                const harvestResult = p_creep.harvest(source);

                if (harvestResult == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(source, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                } else if (harvestResult == OK) {
                    p_creep.memory.isHarvesting = p_creep.store.getFreeCapacity() != 0;
                }
            }
        } else {
            if (p_creep.room.creeps().haulers.length > 0) {
                p_creep.drop(RESOURCE_ENERGY)
                return;
            }

            // They're not always returned in this order, is that a problem?
            const targets = _.filter(p_creep.room.structures().all, (structure) => {
                return (
                        structure.structureType == STRUCTURE_TOWER ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_CONTAINER ||
                        structure.structureType == STRUCTURE_STORAGE) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            });

            if (targets.length > 0) {
                p_creep.memory.isHarvesting = false;

                const transferResult = p_creep.transfer(targets[0], RESOURCE_ENERGY);
                if (transferResult == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(targets[0], {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                } else if (transferResult == ERR_NOT_ENOUGH_ENERGY) {
                    p_creep.memory.isHarvesting = true;
                } else if (transferResult == OK && p_creep.store.getUsedCapacity() == 0) {
                    p_creep.memory.isHarvesting = true;
                }
            }
        }
    }
};

module.exports = roleHarvester;