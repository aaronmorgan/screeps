const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleCourier = {

    tryBuild: function (p_room, p_spawn, p_energyCapacityAvailable) {
        let bodyType = [];

        if (p_energyCapacityAvailable >= 450) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 400) {
            bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 350) {
            bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else {
            bodyType = [CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(p_room, p_spawn, role.COURIER, bodyType, {
                role: role.COURIER,
                harvesting: true,
                targetedDroppedEnergy: {
                    id: 0,
                    pos: new RoomPosition(1, 1, p_room.name)
                }
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (p_creep) {
        //   const source = Game.getObjectById(p_creep.memory.sourceId);

        p_creep.checkTicksToDie();
        p_creep.checkTicksToLive();

        const creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);
        p_creep.say('🚚 ' + creepFillPercentage + '%');

        if (creepFillPercentage == 0) {
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

            p_creep.memory.isHarvesting = creepFillPercentage > 80;

        } else {
            let targets = [];

            if (Game.spawns['Spawn1'].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                targets.push(Game.spawns['Spawn1']);
            }
            if (targets.length == 0) {
                targets = _.filter(p_creep.room.structures().tower, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            }
            if (targets.length == 0) {
                targets = _.filter(p_creep.room.structures().extension, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            }
            if (targets.length == 0) {
                targets = _.filter(p_creep.room.structures().container, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            }
            if (targets.length == 0) {
                targets = _.filter(p_creep.room.structures().storage, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            }

            if (targets.length > 0) {
                const target = p_creep.pos.findClosestByPath(targets)
                const transferResult = p_creep.transfer(target, RESOURCE_ENERGY);

                if (transferResult == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            }

            // Head home so we're close to base when energy slots open up.
            if (targets.length == 0) {
                const target = Game.spawns['Spawn1'];
                p_creep.moveTo(target);

                if (!p_creep.pos.isEqualTo(target)) {
                    p_creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    })

                    return;
                }
            }
        }
    }
};

module.exports = roleCourier;