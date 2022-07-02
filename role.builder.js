const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleBuilder = {

    tryBuild: function (p_spawn, p_energyCapacityAvailable) {
        let bodyType = [];

        if (p_energyCapacityAvailable >= 900) {
            bodyType = [
                WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE
            ];
        } else if (p_energyCapacityAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 350) {
            bodyType = [WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
        } else {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(p_spawn, role.BUILDER, bodyType, {
                role: role.BUILDER,
                building: true
            });
        }
    },

    /** @param {Creep} p_creep **/
    run: function (p_creep) {
        p_creep.checkTicksToDie();
        p_creep.checkTicksToLive();

        let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);
        p_creep.say('🔨 ' + creepFillPercentage + '%')

        if (p_creep.memory.building && p_creep.carry.energy == 0) {
            p_creep.memory.building = false;
        }

        if (!p_creep.memory.building && p_creep.carry.energy == p_creep.carryCapacity) {
            p_creep.memory.building = true;
        }

        if (p_creep.memory.building) {
            let targets = p_creep.room.constructionSites();
            if (targets.length) {
                targets.sort(function (a, b) {
                    return a.progress > b.progress ? -1 : 1
                });
                if (p_creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(targets[0], {
                        reusePath: 10,
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            } else {
                // Creep is idle, we should put the energy back and die.
                p_creep.dropResourcesAndDie();
            }
        } else {
           // p_creep.memory.building = false;

            let targets = _.filter(p_creep.room.structures().all, (structure) => {
                return (structure.structureType == STRUCTURE_CONTAINER ||
                        structure.structureType == STRUCTURE_STORAGE) &&
                    //structure.structureType == 'extension') &&
                    structure.store.getUsedCapacity(RESOURCE_ENERGY) >= p_creep.store.getFreeCapacity();
            });

            if (targets.length > 0) {
                const dropSite = p_creep.pos.findClosestByPath(targets);

                if (p_creep.withdraw(dropSite, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    return p_creep.moveTo(dropSite, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            }

            if (p_creep.room.memory.creeps.couriers == 0) {
                const resourceEnergy = p_creep.room.droppedResources();
                const droppedResources = p_creep.pos.findClosestByPath(resourceEnergy.map(x => x.pos))

                if (droppedResources) {
                    const energyTarget = resourceEnergy.find(x => x.pos.x == droppedResources.x && x.pos.y == droppedResources.y)

                    if (!_.isEmpty(energyTarget)) {
                        let source = Game.getObjectById(energyTarget.id);

                        if (p_creep.pickup(source) == ERR_NOT_IN_RANGE) {
                            p_creep.moveTo(source, {
                                visualizePathStyle: {
                                    stroke: '#ffaa00'
                                }
                            });
                        }

                        return;
                    }
                }
            }

            // Don't attempt to mine resources; target droppped preferrably.
            // Local energy sources
            let nearestSource = p_creep.pos.findClosestByPath(p_creep.room.sources());

            if (p_creep.harvest(nearestSource) == ERR_NOT_IN_RANGE) {
                p_creep.memory.harvesting = true;
                return p_creep.moveTo(nearestSource, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
            }
        }
    }
}

module.exports = roleBuilder;