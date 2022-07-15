const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleLinkBaseHarvester = {

    tryBuild: function (p_spawn, p_energyCapacityAvailable) {
        let bodyType = [];
        if (p_energyCapacityAvailable >= 500) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 450) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 400) {
            bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 350) {
            bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else {
            bodyType = [CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(p_spawn, role.LINK_BASE_HARVESTER, bodyType, {
                role: role.LINK_BASE_HARVESTER,
                harvesting: false
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        const creepFillPercentage = creep.CreepFillPercentage();

        if (creepFillPercentage > 0) {
            creep.say(creepFillPercentage + '%');
        }

        if (creepFillPercentage == 100) {
            creep.memory.harvesting = false;
        }

        if (creepFillPercentage < 100 && creep.memory.harvesting == true) {
            var baseLink = Game.getObjectById(creep.room.memory.storageStructure.id);
            if (baseLink.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {

                if (creep.withdraw(baseLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(baseLink);
                    return;
                }

                creep.memory.harvesting = false;
            }
        }

        if (creep.memory.harvesting == false) {
            creep.findEnergyTransferTarget();

            if (creep.store.getUsedCapacity() === 0) {
                creep.memory.harvesting = true;
            }
        }
    }
};

module.exports = roleLinkBaseHarvester;