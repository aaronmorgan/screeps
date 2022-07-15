const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleCourier = {

    tryBuild: function (p_spawn, p_energyCapacityAvailable) {
        let bodyType = [];
        if (p_energyCapacityAvailable >= 600) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 550) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 500) {
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
            const targetSourceId = p_spawn.room.selectAvailableSource(p_spawn.room.creeps().couriers)[0].id;

            if (!targetSourceId) {
                console.log('ERROR: Attempting to create ' + role.COURIER + ' with an assigned source');
                return EXIT_CODE.ERR_INVALID_TARGET;
            } else {
                return creepFactory.create(p_spawn, role.COURIER, bodyType, {
                    role: role.COURIER,
                    sourceId: targetSourceId,
                    harvesting: false
                });
            }
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.checkTicksToDie();
        creep.checkTicksToLive();

        const creepFillPercentage = Math.round(creep.store.getUsedCapacity() / creep.store.getCapacity() * 100);
        // creep.say('🚚 ' + creepFillPercentage + '%');

        // Creep has no energy so we need to move to our source.
        if (creepFillPercentage == 0 && creep.memory.harvesting == false) {
            const source = Game.getObjectById(creep.memory.sourceId);

            if (!creep.pos.inRangeTo(source, 4)) {
                var moveResult = creep.moveTo(source, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
            } else {
                // Target source is within range so switch to harvesting mode.
                creep.memory.harvesting = true;
            }

            return;
        }

        if (creep.memory.isLinkTranfer && creep.memory.isLinkTranfer === true)
        {
            var target = creep.pos.findClosestByPath(creep.room.structures().link)

            const transferResult = creep.transfer(target, RESOURCE_ENERGY);

            if (transferResult == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
            }
        }

        // We've moved to our source now look for resources within it's preferring collection point.
        if (creepFillPercentage < 100 && creep.memory.harvesting == true) {
            const droppedResources = creep.room.droppedResourcesCloseToSource(creep.memory.sourceId);

            if (droppedResources) {
                const energyTarget = creep.pos.findClosestByPath(droppedResources.map(x => x.energy));

                if (!_.isEmpty(energyTarget)) {
                    let source = Game.getObjectById(energyTarget.id);

                    const pickupResult = creep.pickup(source);
console.log(pickupResult)
                    switch (pickupResult) {
                        case OK: {
                            creep.say('🚚 ' + creepFillPercentage + '%');

                            //if (creepFillPercentage === 100) {
                                creep.memory.harvesting = false;
    
                                if (creep.room.structures().link) {
                                    creep.memory.isLinkTranfer = true;
                                }
                          //  }
                            break;
                        }
                        case ERR_NOT_IN_RANGE: {
                            const moveResult = creep.moveTo(source, {
                                visualizePathStyle: {
                                    stroke: '#ffaa00'
                                }
                            });
                            break;
                        }
                        case ERR_FULL: {
                            creep.memory.harvesting = false;
                        }
                    }
                }
            }
        }

        if (creepFillPercentage == 100 || creep.memory.harvesting == false) {
            creep.memory.harvesting = false;

            const targets = creep.findEnergyTransferTarget();


            // Head home so we're close to base when energy slots open up.
            if (targets.length == 0) {
                //const target = Game.spawns['Spawn1'];
                const target = Game.flags[Game.spawns['Spawn1'].name + '_DUMP'];

                creep.moveTo(target);

                if (!creep.pos.isEqualTo(target)) {

                    const moveToResult = creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    })

                    return;
                } else {
                    // Should be dropping resources on the spot outside our spawn for other builder and upgrader creeps
                    // to pickup.
                    creep.dropResources();
                    return;
                }
            }

            creep.say('🚚 ' + creepFillPercentage + '%');
        }
    }
};

module.exports = roleCourier;