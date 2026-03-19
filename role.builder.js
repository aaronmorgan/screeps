const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleBuilder = {

    tryBuild: function (room, energyCapacityAvailable) {
        let bodyType = [];

        if (energyCapacityAvailable >= 850) {
            bodyType = [
                WORK, WORK, WORK, WORK, WORK,
                CARRY, CARRY, CARRY, CARRY, CARRY,
                MOVE, MOVE
            ];
        } else if (energyCapacityAvailable >= 350) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE];
        } else if (energyCapacityAvailable >= 300) {
            bodyType = [WORK, CARRY, CARRY, CARRY, MOVE];
        } else {
            bodyType = [WORK, CARRY, CARRY, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(room, role.BUILDER, bodyType, {
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

        if (creep.memory.building && creep.carry.energy === 0) {
            creep.memory.building = false;
        }

        if (!creep.memory.building && creep.carry.energy === creep.carryCapacity) {
            creep.memory.building = true;
        }

        if (creep.memory.building) {
            let targets = creep.room.constructionSites();

            // Attempt to resupply Spawn if there are no couriers.
            if (creep.room.memory.creeps.harvesters === 0 && creep.room.memory.creeps.couriers === 0) {
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

                // While there might be building sites if they're blocked by other creeps there may be no path.
                // Return and give the other creeps time to move.
                if (!closestBuildingSite) {
                    return;
                }

                const buildResult = creep.build(closestBuildingSite);

                if (buildResult === ERR_INVALID_TARGET) {
                    if (creep.pos == closestBuildingSite.pos) {
                        creep.moveTo(closestBuildingSite, {
                            reusePath: 10,
                            range: 3
                        })
                    }
                } else if (buildResult === ERR_NOT_IN_RANGE) {
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
            const flag = Game.flags[creep.room.name + '_DUMP'];

            if (flag) {
                const distanceToLookAt = 2;

                var xyTileEnergy = creep.room.lookForAtArea(
                    LOOK_ENERGY,
                    flag.pos.y - distanceToLookAt,
                    flag.pos.x - distanceToLookAt,
                    flag.pos.y + distanceToLookAt,
                    flag.pos.x + distanceToLookAt,
                    true);

                if (xyTileEnergy && xyTileEnergy.length > 0) {
                    const droppedEnergy = Game.getObjectById(xyTileEnergy[0].energy.id);
                    const pickupResult = creep.pickup(droppedEnergy);

                    if (pickupResult == ERR_NOT_IN_RANGE) {
                        creep.moveTo(droppedEnergy, {
                            reusePath: 10,
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
                            reusePath: 10,
                            visualizePathStyle: {
                                stroke: '#3370ac'
                            }
                        });
                    }
                }
            } else {
                // We cannot find any targets, are we sitting on the flag preventing energy from being dropped?
            }
        }
    }
}

module.exports = roleBuilder;