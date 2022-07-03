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

    /** @param {Creep} p_creep **/
    run: function (p_creep) {
        p_creep.checkTicksToDie();
        p_creep.checkTicksToLive();

        let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);
        p_creep.say('⛏️ ' + creepFillPercentage + '%')

        if ((p_creep.memory.isHarvesting && p_creep.store.getFreeCapacity() != 0)) { // ||


            //   var a = p_creep.room.selectAvailableSource(p_creep.room.creeps().harvesters);
            //    console.log(JSON.stringify(a))
            // for (let source of p_creep.room.memory.sources) {
            //     console.log(JSON.stringify(source))

            //     console.log(JSON.stringify(p_creep.room.creeps().harvesters))                
            //     console.log(JSON.stringify(p_creep.room.memory.sources))
            // const creepsForThisSource = _.countBy(p_creep.room.harvesters, x => x.memory.sourceId == source.id);
            // console.log(JSON.stringify(creepsForThisSource));
            //    }

            // Cater for the siuation where the creep wanders into another room.
            if (_.isEmpty(p_creep.room.memory.sources)) {
                return;
            }

            const source = Game.getObjectById(p_creep.memory.sourceId);

            const harvestResult = p_creep.harvest(source);

            if (harvestResult == ERR_NOT_IN_RANGE) {
                const moveResult = p_creep.moveTo(source, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });

                if (moveResult == ERR_NO_PATH) {
                    const sources = p_creep.room.selectAvailableSource(p_creep.room.creeps().harvesters);

                    if (!_.isEmpty(sources)) {
                        const sourceId = sources[0].id;

                        console.log('INFO: Attempting set new target source, id=' + sourceId);
                        p_creep.memory.sourceId = sourceId;
                    }
                }

            } else if (harvestResult == OK) {
                p_creep.memory.isHarvesting = p_creep.store.getFreeCapacity() != 0;
                if (!p_creep.memory.isHarvesting && p_creep.room.memory.creeps.couriers > 0) {
                    for (const resourceType in p_creep.carry) {
                        p_creep.drop(resourceType);
                    }
                }
            }
            //     }
        } else {
            if (p_creep.room.memory.creeps.couriers > 0) {
                for (const resourceType in p_creep.carry) {
                    p_creep.drop(resourceType);
                }

                p_creep.memory.isHarvesting = true;
                return;
            }

            // This is designed to allow the Harvester to act as a sort of Dropminer.
            if (p_creep.room.creeps().haulers.length > 0 && p_creep.room.creeps().dropminers.length == 0) {
                p_creep.drop(RESOURCE_ENERGY)
                return;
            }

            let targets = [];

            if (Game.spawns['Spawn1'].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                targets.push(Game.spawns['Spawn1']);
            }
            if (targets.length == 0) {
                targets = _.filter(p_creep.room.structures().extension, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            }
            if (targets.length == 0) {
                targets = _.filter(p_creep.room.structures().tower, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            }
            if (targets.length == 0) {
                targets = _.filter(p_creep.room.structures().container, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            }
            if (targets.length == 0) {
                targets = _.filter(p_creep.room.structures().storage, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            }

            if (targets.length > 0) {
                const target = p_creep.pos.findClosestByPath(targets)
                p_creep.memory.isHarvesting = false;

                const transferResult = p_creep.transfer(target, RESOURCE_ENERGY);
                if (transferResult == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                } else if (transferResult == ERR_NOT_ENOUGH_ENERGY) {
                    p_creep.memory.isHarvesting = true;
                } else if (transferResult == OK && p_creep.store.getUsedCapacity() == 0) {
                    p_creep.memory.isHarvesting = true;
                }

                return;
            }

            var target = Game.flags[Game.spawns['Spawn1'].name + '_DUMP'];

            if (!p_creep.pos.isEqualTo(target)) {
                p_creep.moveTo(target, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                })
            } else {
                for (const resourceType in p_creep.store) {
                    p_creep.drop(resourceType);
                }
                p_creep.memory.isHarvesting = true;
            }
        }
    }
};

module.exports = roleHarvester;