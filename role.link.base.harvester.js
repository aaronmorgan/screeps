const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

const ROLES = {
    Undefined: 0,
    WithdrawFromLink: 1,
    TransferToStorage: 2,
    WithdrawFromStorage: 3,
    Transfer: 4
};

var roleLinkBaseHarvester = {

    tryBuild: function (spawn, energyCapacityAvailable) {
        let bodyType = [];
        if (energyCapacityAvailable >= 500) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 450) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 400) {
            bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 350) {
            bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else {
            bodyType = [CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(spawn, role.LINK_BASE_HARVESTER, bodyType, {
                role: role.LINK_BASE_HARVESTER,
                harvesting: false,
                taskId: ROLES.Undefined
            });
        }
    },

    findEnergyTransferTargets: function (room) {
        let targets = [];

        if (Game.spawns['Spawn1'].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            targets.push(Game.spawns['Spawn1']);
        }
        if (targets.length == 0) {
            // Only refill the Tower if the fill percentage is < 20%.
            targets = _.filter(room.structures().tower, (structure) => Math.round(structure.store.getUsedCapacity(RESOURCE_ENERGY) / structure.store.getCapacity(RESOURCE_ENERGY) * 100) < 80);
        }
        if (targets.length == 0) {
            targets = _.filter(room.structures().extension, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
        }

        // Deliberately don't attempt to fill containers.

        return targets;
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        const creepFillPercentage = creep.CreepFillPercentage();

        if (creepFillPercentage > 0) {
            creep.say(creepFillPercentage + '%');
        }

        if (creepFillPercentage === 0) {
            creep.memory.taskId = ROLES.WithdrawFromLink;
        }

        const targets2 = this.findEnergyTransferTargets(creep.room);


        if (creep.memory.taskId == ROLES.WithdrawFromLink) {
            // Check there is a link, if not simply move to task 3, unloading Storage.
            if (creep.room.memory.baseLinkId) {
                var baseLink = Game.getObjectById(creep.room.memory.baseLinkId.id);

                if (baseLink && baseLink.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    const withdrawResult = creep.withdraw(baseLink, RESOURCE_ENERGY);

                    switch (withdrawResult) {
                        case ERR_NOT_IN_RANGE: {
                            if (withdrawResult == ERR_NOT_IN_RANGE) {
                                creep.moveTo(baseLink);
                                return;
                            }
                        }
                        case OK:
                        case ERR_FULL: {
                            creep.memory.taskId = ROLES.TransferToStorage;
                            break;
                        }
                        default: {
                            console.log('⚠️ Uncaught withdrawResult: ', withdrawResult)
                            return;
                        }
                    }
                } else {
                    creep.memory.taskId = ROLES.WithdrawFromStorage;
                }
            } else {
                creep.memory.taskId = ROLES.WithdrawFromStorage;
            }
        }

        // Transfer creep energy into the Storage structure.
        if (creep.memory.taskId == ROLES.TransferToStorage) {
            let targets = _.filter(creep.room.structures().storage, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

            if (targets.length > 0) {
                const target = creep.pos.findClosestByPath(targets)
                const transferResult = creep.transfer(target, RESOURCE_ENERGY);

                switch (transferResult) {
                    case OK: {
                        creep.memory.taskId = ROLES.WithdrawFromLink;
                        return;
                    }
                    case ERR_NOT_ENOUGH_RESOURCES: {
                        creep.memory.taskId = ROLES.WithdrawFromLink;
                        return;
                    }
                    case ERR_NOT_IN_RANGE: {
                        creep.moveTo(target, {
                            visualizePathStyle: {
                                stroke: '#ffffff'
                            }
                        });
                        return;
                    }
                    default: {
                        console.log('⚠️ Uncaught transferResult: ', transferResult)
                        return;
                    }
                }
            }
        }

        if (targets2.length === 0) {
            creep.memory.taskId = ROLES.WithdrawFromLink;

            return;
        }


        if (creep.memory.taskId == ROLES.WithdrawFromStorage) {

            let targets = _.filter(creep.room.structures().storage, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            if (targets.length > 0) {
                const target = creep.pos.findClosestByPath(targets)
                const transferResult = creep.withdraw(target, RESOURCE_ENERGY);

                switch (transferResult) {
                    case ERR_NOT_IN_RANGE: {
                        creep.moveTo(target, {
                            visualizePathStyle: {
                                stroke: '#ffffff'
                            }
                        });
                        return;
                    }
                    // The Storage may be empty, if so revert to base state, emptying Link into Storage.
                    case ERR_NOT_ENOUGH_RESOURCES: {
                        creep.memory.taskId = ROLES.WithdrawFromLink;
                        return;
                    }
                    case OK: {
                        creep.memory.taskId = ROLES.Transfer;
                        return;
                    }
                }
            }
        }

        if (creep.memory.taskId == ROLES.Transfer) {
            if (targets2.length > 0) {
                const target = creep.pos.findClosestByPath(targets2)
                const transferResult = creep.transfer(target, RESOURCE_ENERGY);

                switch (transferResult) {
                    case OK: {
                        // Don't reset or change the taskId, we may have more energy to transfer.
                        break;
                    }
                    case ERR_NOT_IN_RANGE: {
                        creep.moveTo(target, {
                            visualizePathStyle: {
                                stroke: '#ffffff'
                            }
                        });
                        return;
                    }
                    default: {
                        console.log('⚠️ Uncaught transferResult: ', transferResult)
                        return;
                    }
                }
            }
        }
    }
};

module.exports = roleLinkBaseHarvester;