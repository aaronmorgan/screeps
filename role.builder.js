const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleBuilder = {

    tryBuild: function (spawn, energyCapacityAvailable) {
        let bodyType = [];

        if (energyCapacityAvailable >= 900) {
            bodyType = [
                WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE, MOVE
            ];
        } else if (energyCapacityAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 350) {
            bodyType = [WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
        } else {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(spawn, role.BUILDER, bodyType, {
                role: role.BUILDER,
                building: true,
                ticksWithoutWork: 0
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.checkTicksToDie();
        creep.checkTicksToLive();

        const creepFillPercentage = creep.CreepFillPercentage();
        if (creepFillPercentage > 0) {
            creep.say('🔨 ' + creepFillPercentage + '%')
        }

        if (creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
        }

        if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
        }

        if (creep.memory.building) {
            let targets = creep.room.constructionSites();

            // Attempt to resupply Spawn if there are no couriers.
            if (creep.room.memory.creeps.harvesters == 0 && creep.room.memory.creeps.couriers == 0) {
                if (Game.spawns['Spawn1'].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    targets.push(Game.spawns['Spawn1']);
                }
            }

            if (targets.length) {
                creep.memory.ticksWithoutWork = 0;

                targets.sort(function (a, b) {
                    return a.progress > b.progress ? -1 : 1
                });

                const closestBuildingSite = creep.pos.findClosestByPath(targets);

                if (creep.build(closestBuildingSite) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestBuildingSite, {
                        reusePath: 10,
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            } else {
                creep.memory.ticksWithoutWork++;

                // Only suicide after n number of turns without a job to do.
                if (creep.memory.ticksWithoutWork > 10) {
                    // Creep is idle, we should put the energy back and die.
                    creep.dropResourcesAndDie();
                }
            }
        } else {
            // Look for dropped energy at the spawn dump site first.
            const target = Game.flags[Game.spawns['Spawn1'].name + '_DUMP'];

            if (target) {
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

                    creep.memory.building = true;

                    return;
                }
            }

            // Then look for energy in the normal storage locations...
            let targets = _.filter(creep.room.structures().all, (structure) => {
                return (structure.structureType == STRUCTURE_CONTAINER ||
                        structure.structureType == STRUCTURE_STORAGE) &&
                        structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
            });

            if (targets.length > 0) {
                const dropSite = creep.pos.findClosestByPath(targets);
                const actionResult = creep.withdraw(dropSite, RESOURCE_ENERGY);

                switch (actionResult) {
                    case OK: {
                        creep.memory.building = true;
                        break;
                    }
                    case (ERR_NOT_IN_RANGE): {
                        return creep.moveTo(dropSite, {
                            visualizePathStyle: {
                                stroke: '#3370ac'
                            }
                        });
                    }
                }
            }
        }
    }
}

module.exports = roleBuilder;