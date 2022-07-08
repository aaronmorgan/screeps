const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleLinkBaseHarvester = {

    tryBuild: function (p_spawn, p_energyCapacityAvailable) {
        let bodyType = [];
        if (p_energyCapacityAvailable >= 350) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else {
            bodyType = [CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(p_spawn, role.LINK_BASE_HARVESTER, bodyType, {
                role: role.LINK_BASE_HARVESTER,
                harvesting: false,
                targetedDroppedEnergy: undefined
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (p_creep) {
        const creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);

        if (creepFillPercentage == 100) {
            p_creep.memory.harvesting = false;
        }

        if (creepFillPercentage < 100 && p_creep.memory.harvesting == true) {
            var baseLink = Game.getObjectById(p_creep.room.memory.storageStructure.id);
            if (baseLink.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {

                if (p_creep.withdraw(baseLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(baseLink);
                    return;
                }

                p_creep.memory.harvesting = false;
            }
        }

        if (p_creep.memory.harvesting == false) {
            let targets = [];

            if (Game.spawns['Spawn1'].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                targets.push(Game.spawns['Spawn1']);
            }
            if (targets.length == 0) {
                // Only refil the Tower if the fill percentage is < 20%.
                targets = _.filter(p_creep.room.structures().tower, (structure) => Math.round(structure.store.getUsedCapacity(RESOURCE_ENERGY) / structure.store.getCapacity(RESOURCE_ENERGY) * 100) < 80);
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

            if (p_creep.store.getUsedCapacity() === 0) {
                p_creep.memory.harvesting = true;
            }

            p_creep.say(creepFillPercentage + '%');
        }
    }
};

module.exports = roleLinkBaseHarvester;