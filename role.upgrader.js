const {
    role,
    energyCollection
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleUpgrader = {

    tryBuild: function (p_spawn, p_energyCapacityAvailable) {
        let bodyType = [];

        if (p_spawn.room.storage && p_energyCapacityAvailable >= 1750) {
            bodyType = [
                WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE, MOVE
            ];
        } else if (p_spawn.room.storage && p_energyCapacityAvailable >= 1000) {
            bodyType = [
                WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
            ];
            // Prioritise movement overy carry capaciity. If the container is repeatedly low
            // on energy we don't want to be waiting.
        } else if (p_energyCapacityAvailable >= 850) {
            bodyType = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY];
        } else if (p_energyCapacityAvailable >= 700) {
            bodyType = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, CARRY, CARRY, CARRY, CARRY];
        } else if (p_energyCapacityAvailable >= 600) {
            bodyType = [MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, CARRY, CARRY, CARRY];
        } else if (p_energyCapacityAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, CARRY, MOVE];
        } else if (p_energyCapacityAvailable >= 350) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE];
        } else {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(p_spawn, role.UPGRADER, bodyType, {
                role: role.UPGRADER,
                energyCollection: energyCollection.UNKNOWN
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.checkTicksToLive();

        //p_creep.memory.energyCollection = energyCollection.UNKNOWN;

        const creepFillPercentage = creep.CreepFillPercentage();
        //        p_creep.say('⚒️ ' + creepFillPercentage + '%');

        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
        }

        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
        }

        if (creep.memory.upgrading) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {
                    visualizePathStyle: {
                        stroke: '#4189d0'
                    }
                });

                creep.say('⚒️ ' + creepFillPercentage + '%');
            }
        } else {
            if (creep.room.memory.maxSourceAccessPoints <= creep.room.creeps().harvesters.length) {
                creep.memory.energyCollection = energyCollection.SCAVENGING;
            }

            // Look for dropped energy at the spawn dump site first.
            const target = Game.flags[Game.spawns['Spawn1'].name + '_DUMP'];

            if (!creep.memory.energyCollection == energyCollection.MINING && target) {
                var xyTileEnergy = creep.room.lookForAtArea(LOOK_ENERGY, target.pos.y, target.pos.x, target.pos.y, target.pos.x, true);

                if (!_.isEmpty(xyTileEnergy)) {
                    const droppedEnergy = Game.getObjectById(xyTileEnergy[0].energy.id);
                    const pickupResult = creep.pickup(droppedEnergy);

                    if (pickupResult == ERR_NOT_IN_RANGE) {
                        creep.moveTo(droppedEnergy, {
                            visualizePathStyle: {
                                stroke: '#ffaa00'
                            }
                        });
                    }

                    creep.memory.upgrading = true;

                    return;
                }
            }

            // Then look for energy in the normal storage locations...
            const targets = _.filter(creep.room.structures().all, (structure) => {
                return (
                        structure.structureType == STRUCTURE_CONTAINER ||
                        structure.structureType == STRUCTURE_STORAGE) &&
                    structure.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity(); // TODO: Should this getFreeCapacity check be here?
            });

            if (targets.length > 0) {
                const dropSite = creep.pos.findClosestByPath(targets);

                if (creep.withdraw(dropSite, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(dropSite, {
                        visualizePathStyle: {
                            stroke: '#3370ac'
                        }
                    });
                }
            } else {
                // if (p_creep.room.memory.creeps.couriers == 0) {

                if (creep.memory.energyCollection != energyCollection.MINING) {
                    const resourceEnergy = creep.room.droppedResources();
                    const droppedResources = creep.pos.findClosestByPath(resourceEnergy.map(x => x.pos))

                    if (droppedResources) {
                        const energyTarget = resourceEnergy.find(x => x.pos.x == droppedResources.x && x.pos.y == droppedResources.y)

                        if (!_.isEmpty(energyTarget)) {
                            source = Game.getObjectById(energyTarget.id);

                            const pickupResult = creep.pickup(source);

                            creep.memory.energyCollection = energyCollection.SCAVENGING;

                            if (pickupResult == ERR_NOT_IN_RANGE) {
                                creep.moveTo(source, {
                                    visualizePathStyle: {
                                        stroke: '#ffaa00'
                                    }
                                });

                                return;
                            } else if (pickupResult == OK) {
                                creep.room.refreshDroppedResources();
                            }
                        }

                        return;
                    }
                }

                // Last resort, go and mine the energy.
                let nearestSource = creep.pos.findClosestByPath(creep.room.sources());

                const droppedResources = creep.room.droppedResourcesCloseToSource(nearestSource.id);

                if (droppedResources) {
                    const energyTarget = creep.pos.findClosestByPath(droppedResources.map(x => x.energy))

                    if (!_.isEmpty(energyTarget)) {
                        let source = Game.getObjectById(energyTarget.id);

                        const pickupResult = creep.pickup(source);

                        switch (pickupResult) {
                            case ERR_NOT_IN_RANGE: {
                                const moveResult = creep.moveTo(source, {
                                    visualizePathStyle: {
                                        stroke: '#ffaa00'
                                    }
                                });
                            }
                            case ERR_FULL: {}
                        }

                        return;
                    }

                    if (creepFillPercentage == 100) {
                        return;
                    }
                }

                creep.memory.energyCollection = energyCollection.MINING;

                if (creep.harvest(nearestSource) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(nearestSource, {
                        visualizePathStyle: {
                            stroke: '#3370ac'
                        }
                    });
                }
                //    }
            }
        }
    }
};

module.exports = roleUpgrader;