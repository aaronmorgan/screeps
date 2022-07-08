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

    /** @param {Creep} p_creep **/
    run: function (p_creep) {
        p_creep.checkTicksToLive();

        //p_creep.memory.energyCollection = energyCollection.UNKNOWN;

        let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);
        //        p_creep.say('⚒️ ' + creepFillPercentage + '%');

        if (p_creep.memory.upgrading && p_creep.store[RESOURCE_ENERGY] == 0) {
            p_creep.memory.upgrading = false;
        }

        if (!p_creep.memory.upgrading && p_creep.store.getFreeCapacity() == 0) {
            p_creep.memory.upgrading = true;
        }

        if (p_creep.memory.upgrading) {
            if (p_creep.upgradeController(p_creep.room.controller) == ERR_NOT_IN_RANGE) {
                p_creep.moveTo(p_creep.room.controller, {
                    visualizePathStyle: {
                        stroke: '#4189d0'
                    }
                });

                p_creep.say('⚒️ ' + creepFillPercentage + '%');
            }
        } else {
            if (p_creep.room.memory.maxSourceAccessPoints <= p_creep.room.creeps().harvesters.length) {
                p_creep.memory.energyCollection = energyCollection.SCAVENGING;
            }

            // Look for dropped energy at the spawn dump site first.
            const target = Game.flags[Game.spawns['Spawn1'].name + '_DUMP'];

            if (!p_creep.memory.energyCollection == energyCollection.MINING && target) {
                var xyTileEnergy = p_creep.room.lookForAtArea(LOOK_ENERGY, target.pos.y, target.pos.x, target.pos.y, target.pos.x, true);

                if (!_.isEmpty(xyTileEnergy)) {
                    const droppedEnergy = Game.getObjectById(xyTileEnergy[0].energy.id);
                    const pickupResult = p_creep.pickup(droppedEnergy);

                    if (pickupResult == ERR_NOT_IN_RANGE) {
                        p_creep.moveTo(droppedEnergy, {
                            visualizePathStyle: {
                                stroke: '#ffaa00'
                            }
                        });
                    }

                    p_creep.memory.upgrading = true;

                    return;
                }
            }

            // Then look for energy in the normal storage locations...
            const targets = _.filter(p_creep.room.structures().all, (structure) => {
                return (
                        structure.structureType == STRUCTURE_CONTAINER ||
                        structure.structureType == STRUCTURE_STORAGE) &&
                    structure.store.getUsedCapacity(RESOURCE_ENERGY) >= p_creep.store.getFreeCapacity(); // TODO: Should this getFreeCapacity check be here?
            });

            if (targets.length > 0) {
                const dropSite = p_creep.pos.findClosestByPath(targets);

                if (p_creep.withdraw(dropSite, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(dropSite, {
                        visualizePathStyle: {
                            stroke: '#3370ac'
                        }
                    });
                }
            } else {
                // if (p_creep.room.memory.creeps.couriers == 0) {

                if (p_creep.memory.energyCollection != energyCollection.MINING) {
                    const resourceEnergy = p_creep.room.droppedResources();
                    const droppedResources = p_creep.pos.findClosestByPath(resourceEnergy.map(x => x.pos))

                    if (droppedResources) {
                        const energyTarget = resourceEnergy.find(x => x.pos.x == droppedResources.x && x.pos.y == droppedResources.y)

                        if (!_.isEmpty(energyTarget)) {
                            source = Game.getObjectById(energyTarget.id);

                            const pickupResult = p_creep.pickup(source);

                            p_creep.memory.energyCollection = energyCollection.SCAVENGING;

                            if (pickupResult == ERR_NOT_IN_RANGE) {
                                p_creep.moveTo(source, {
                                    visualizePathStyle: {
                                        stroke: '#ffaa00'
                                    }
                                });

                                return;
                            } else if (pickupResult == OK) {
                                p_creep.room.refreshDroppedResources();
                            }
                        }

                        return;
                    }
                }

                // Last resort, go and mine the energy.
                let nearestSource = p_creep.pos.findClosestByPath(p_creep.room.sources());

                const droppedResources = p_creep.room.droppedResourcesCloseToSource(nearestSource.id);

                if (droppedResources) {
                    const energyTarget = p_creep.pos.findClosestByPath(droppedResources.map(x => x.energy))

                    if (!_.isEmpty(energyTarget)) {
                        let source = Game.getObjectById(energyTarget.id);

                        const pickupResult = p_creep.pickup(source);

                        switch (pickupResult) {
                            case ERR_NOT_IN_RANGE: {
                                const moveResult = p_creep.moveTo(source, {
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

                p_creep.memory.energyCollection = energyCollection.MINING;

                if (p_creep.harvest(nearestSource) == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(nearestSource, {
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