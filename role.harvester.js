const {
    EXIT_CODE,
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleHarvester = {

    tryBuild: function (p_spawn, p_energyCapacityAvailable) {
        let bodyType = [];

        if (p_energyCapacityAvailable >= 500) {
            bodyType = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 450) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 350) {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            const targetSourceId = p_spawn.room.selectAvailableSource(p_spawn.room.creeps().harvesters)[0].id;

            if (!targetSourceId) {
                console.log('ERROR: Attempting to create ' + role.HARVESTER + ' with an assigned source');
                return EXIT_CODE.ERR_INVALID_TARGET;
            } else {
                return creepFactory.create(p_spawn, role.HARVESTER, bodyType, {
                    role: role.HARVESTER,
                    sourceId: targetSourceId,
                    isHarvesting: true
                });
            }
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.checkTicksToDie();
        creep.checkTicksToLive();

        let creepFillPercentage = Math.round(creep.store.getUsedCapacity() / creep.store.getCapacity() * 100);
        creep.say('⛏️ ' + creepFillPercentage + '%')

        if ((creep.memory.isHarvesting && creep.store.getFreeCapacity() != 0)) { // ||


            //   var a = creep.room.selectAvailableSource(creep.room.creeps().harvesters);
            //    console.log(JSON.stringify(a))
            // for (let source of creep.room.memory.sources) {
            //     console.log(JSON.stringify(source))

            //     console.log(JSON.stringify(creep.room.creeps().harvesters))                
            //     console.log(JSON.stringify(creep.room.memory.sources))
            // const creepsForThisSource = _.countBy(creep.room.harvesters, x => x.memory.sourceId == source.id);
            // console.log(JSON.stringify(creepsForThisSource));
            //    }

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
                creep.memory.isHarvesting = creep.store.getFreeCapacity() != 0;
                if (!creep.memory.isHarvesting && creep.room.memory.creeps.couriers > 0) {
                    for (const resourceType in creep.carry) {
                        creep.drop(resourceType);
                    }
                }
            }
            //     }
        } else {
            if (creep.room.memory.creeps.couriers > 0) {
                for (const resourceType in creep.carry) {
                    creep.drop(resourceType);
                }

                creep.memory.isHarvesting = true;
                return;
            }

            const targets = creep.findEnergyTransferTarget();

            if (targets.length > 0) {
                const target = creep.pos.findClosestByPath(targets)
                creep.memory.isHarvesting = false;

                const transferResult = creep.transfer(target, RESOURCE_ENERGY);
                if (transferResult == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                } else if (transferResult == ERR_NOT_ENOUGH_ENERGY) {
                    creep.memory.isHarvesting = true;
                } else if (transferResult == OK && creep.store.getUsedCapacity() == 0) {
                    creep.memory.isHarvesting = true;
                }

                return;
            }

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
};

module.exports = roleHarvester;