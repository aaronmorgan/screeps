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
                building: true,
                ticksWithoutWork: 0
            });
        }
    },

    /** @param {Creep} p_creep **/
    run: function (p_creep) {
        p_creep.checkTicksToDie();
        p_creep.checkTicksToLive();

        let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);
        // p_creep.say('🔨 ' + creepFillPercentage + '%')

        if (p_creep.memory.building && p_creep.carry.energy == 0) {
            p_creep.memory.building = false;
        }

        if (!p_creep.memory.building && p_creep.carry.energy == p_creep.carryCapacity) {
            p_creep.memory.building = true;
        }

        if (p_creep.memory.building) {
            // Attempt to resupply Spawn if there are no couriers.
            if (p_creep.room.memory.creeps.harvesters == 0 && p_creep.room.memory.creeps.couriers == 0) {
                if (Game.spawns['Spawn1'].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    targets.push(Game.spawns['Spawn1']);
                }
            }

            let targets = p_creep.room.constructionSites();
            if (targets.length) {
                p_creep.memory.ticksWithoutWork = 0;

                targets.sort(function (a, b) {
                    return a.progress > b.progress ? -1 : 1
                });

                const closestBuildingSite = p_creep.pos.findClosestByPath(targets);

                if (p_creep.build(closestBuildingSite) == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(closestBuildingSite, {
                        reusePath: 10,
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });

                    p_creep.say('🔨 ' + creepFillPercentage + '%')
                }
            } else {
                p_creep.memory.ticksWithoutWork++;

                // Only suicide after n number of turns without a job to do.
                if (p_creep.memory.ticksWithoutWork > 10) {
                    // Creep is idle, we should put the energy back and die.
                    p_creep.dropResourcesAndDie();
                }
            }
        } else {
            // Look for dropped energy at the spawn dump site first.
            const target = Game.flags[Game.spawns['Spawn1'].name + '_DUMP'];

            if (target) {
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

                    p_creep.memory.building = true;

                    return;
                }
            }

            // Then look for energy in the normal storage locations...
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
                        case ERR_FULL: { }
                    }

                    return;
                }

                if (creepFillPercentage == 100 ) {
                    return;
                }
            }

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