const {
    EXIT_CODE,
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleHarvester = {

    tryBuild: function (spawn, energyCapacityAvailable) {
        let bodyType = [];

        if (energyCapacityAvailable >= 500) {
            bodyType = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 450) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 350) {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            const targetSourceId = spawn.room.selectAvailableSource(spawn.room.creeps().harvesters)[0].id;

            if (!targetSourceId) {
                console.log('ERROR: Attempting to create ' + role.HARVESTER + ' with an assigned source');
                return EXIT_CODE.ERR_INVALID_TARGET;
            } else {
                return creepFactory.create(spawn, role.HARVESTER, bodyType, {
                    role: role.HARVESTER,
                    sourceId: targetSourceId,
                    isHarvesting: true
                });
            }
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        // Harvesters can get in the way of dropminers, if we have the necessary replacement creeps, die early.
        if (creep.room.memory.creeps.dropminers > 0 && creep.room.memory.creeps.couriers > 0) {
            creep.dropResourcesAndDie();
        }

        creep.checkTicksToDie();
        creep.checkTicksToLive();

        const creepFillPercentage = creep.CreepFillPercentage();
        if (creepFillPercentage > 0) {
            creep.say('⛏️ ' + creepFillPercentage + '%')
        }

        if ((creep.memory.isHarvesting && creep.store.getFreeCapacity() != 0)) {
            // Cater for the siuation where the creep wanders into another room.
            if (_.isEmpty(creep.room.memory.sources)) {
                return;
            }

            const source = Game.getObjectById(creep.memory.sourceId);

            const harvestResult = creep.harvest(source);

            if (harvestResult == ERR_NOT_IN_RANGE) {
                const moveResult = creep.moveTo(source, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });

                if (moveResult == ERR_NO_PATH) {
                    const sources = creep.room.selectAvailableSource(creep.room.creeps().harvesters);

                    if (!_.isEmpty(sources)) {
                        const sourceId = sources[0].id;

                        console.log('INFO: Attempting set new target source, id=' + sourceId);
                        creep.memory.sourceId = sourceId;
                    }
                }
            } else if (harvestResult == OK) {
                const linkStructure = Game.getObjectById(source.id).pos.findInRange(FIND_MY_STRUCTURES, 3, {
                    filter: {
                        structureType: STRUCTURE_LINK
                    }
                })[0];

                if (linkStructure) {
                    creep.memory.linkId = linkStructure.id;

                    const transferResult = creep.transfer(linkStructure, RESOURCE_ENERGY);

                    switch (transferResult) {
                        case (ERR_NOT_IN_RANGE): {
                            creep.moveTo(linkStructure, {
                                visualizePathStyle: {
                                    stroke: '#ffffff'
                                }
                            });
                            break;
                        }
                    }
                } else {

                    creep.memory.isHarvesting = creep.store.getFreeCapacity() != 0;
                    if (!creep.memory.isHarvesting && creep.room.memory.creeps.couriers > 0) {
                        for (const resourceType in creep.carry) {
                            creep.drop(resourceType);
                        }
                    }
                }
            }
        } else {
            if (creep.room.memory.creeps.couriers > 0 ||
                creep.room.memory.creeps.gophers > 0) {
                for (const resourceType in creep.carry) {
                    creep.drop(resourceType);
                }

                creep.memory.isHarvesting = true;
                return;
            }

            const targets = creep.findEnergyTransferTarget();

            if (targets.length == 0) {
                var target = Game.flags[Game.spawns['Spawn1'].name + '_DUMP'];

                if (!creep.pos.isEqualTo(target)) {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    })
                } else {
                    for (const resourceType in creep.store) {
                        creep.drop(resourceType);
                    }
                    creep.memory.isHarvesting = true;
                }
            }
        }
    }
};

module.exports = roleHarvester;