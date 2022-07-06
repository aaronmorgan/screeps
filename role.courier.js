const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleCourier = {

    tryBuild: function (p_spawn, p_energyCapacityAvailable) {
        let bodyType = [];
        if (p_energyCapacityAvailable >= 500) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 450) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 400) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 350) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
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
    run: function (p_creep) {
        p_creep.checkTicksToDie();
        p_creep.checkTicksToLive();

        const creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);
        // p_creep.say('🚚 ' + creepFillPercentage + '%');

        // Creep has no energy so we need to move to our source.
        if (creepFillPercentage == 0 && p_creep.memory.harvesting == false) {
            const source = Game.getObjectById(p_creep.memory.sourceId);

            if (!p_creep.pos.inRangeTo(source, 4)) {
                var moveResult = p_creep.moveTo(source, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });

                return;
            } else {
                // Target source is within range so switch to harvesting mode.
                p_creep.memory.harvesting = true;
            }

            return;
        }

        // We've moved to our source now look for resources within it's preferring collection point.
        if (creepFillPercentage < 100 && p_creep.memory.harvesting == true) {
            const droppedResources = p_creep.room.droppedResourcesCloseToSource(p_creep.memory.sourceId);

            if (droppedResources) {
                const energyTarget = p_creep.pos.findClosestByPath(droppedResources.map(x => x.energy));

                if (!_.isEmpty(energyTarget)) {
                    let source = Game.getObjectById(energyTarget.id);

                    const pickupResult = p_creep.pickup(source);

                    switch (pickupResult) {
                        case OK: {
                            p_creep.say('🚚 ' + creepFillPercentage + '%');
                            break;
                        }
                        case ERR_NOT_IN_RANGE: {
                            const moveResult = p_creep.moveTo(source, {
                                visualizePathStyle: {
                                    stroke: '#ffaa00'
                                }
                            });
                        }
                        case ERR_FULL: {
                            p_creep.memory.harvesting = false;
                        }
                    }

                    return;
                }

                if (creepFillPercentage == 100 || _.isEmpty(droppedResources)) {
                    // Don't do any more, wait for the next turn to pickup nearby resources.
                    p_creep.memory.harvesting = false
                }

                return;
            }
        }

        if (creepFillPercentage == 100 || p_creep.memory.harvesting == false) {
            p_creep.memory.harvesting = false;

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
                //const target = Game.spawns['Spawn1'];
                const target = Game.flags[Game.spawns['Spawn1'].name + '_DUMP'];

                p_creep.moveTo(target);

                if (!p_creep.pos.isEqualTo(target)) {

                    const moveToResult = p_creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    })

                    return;
                } else {
                    // Should be dropping resources on the spot outside our spawn for other builder and upgrader creeps
                    // to pickup.
                    p_creep.dropResources();
                    return;
                }
            }

            p_creep.say('🚚 ' + creepFillPercentage + '%');
        }
    }
};

module.exports = roleCourier;