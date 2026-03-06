const {
    role
} = require('game.constants');

const sourceBoundaryDistance = 3;

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleCourier = {

    tryBuild: function (spawn, energyCapacityAvailable) {
        let bodyType = [];
        if (energyCapacityAvailable >= 600) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 550) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 500) {
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
            const targetSource = spawn.room.selectAvailableSource(spawn.room.creeps().couriers)[0];

            if (!targetSource) {
                console.log('ERROR: Attempting to create ' + role.COURIER + ' with an assigned source');
                return EXIT_CODE.ERR_INVALID_TARGET;
            } else {
                return creepFactory.create(spawn, role.COURIER, bodyType, {
                    role: role.COURIER,
                    source: targetSource,
                    harvesting: false
                });
            }
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {

        const creepFillPercentage = creep.CreepFillPercentage();

        if (creepFillPercentage > 0) {
            creep.say('🚚 ' + creepFillPercentage + '%');
        }

        // Creep has no energy so we need to move to our source.
        if (creepFillPercentage === 0 && !creep.memory.harvesting) {

            var path = creep.pos.findPathTo(creep.memory.source.pos);

            if (creep.ticksToLive < (path.length * 2)) {
                creep.dropResourcesAndDie();
            }

            path = path.slice(0, path.length - sourceBoundaryDistance);

            const moveResult = creep.moveByPath(path);

            switch (moveResult) {
                case OK: {
                    creep.memory.harvesting = true;
                    break;
                }
                case ERR_NOT_IN_RANGE:
                    return;
                default:
                    return;
            }
        }

        // We've moved to our source now look for resources within it's preferring collection point.
        if (creepFillPercentage < 100 && creep.memory.harvesting) {
            const droppedResources = creep.room.droppedResourcesCloseToSource(creep.memory.source.id, sourceBoundaryDistance);

            if (droppedResources) {
                const energyTarget = creep.pos.findClosestByPath(droppedResources.map(x => x.energy));

                if (!_.isEmpty(energyTarget)) {
                    let source = Game.getObjectById(energyTarget.id);

                    const pickupResult = creep.pickup(source);

                    switch (pickupResult) {
                        case OK: {
                            creep.memory.harvesting = false;
                            break;
                        }
                        case ERR_NOT_IN_RANGE: {
                            creep.moveByPath(creep.pos.findPathTo(source.pos));
                            break;
                        }
                        case ERR_FULL: {
                            creep.memory.harvesting = false;
                        }
                    }
                }
            }
        }

        if (creepFillPercentage === 100 || !creep.memory.harvesting) {

            creep.memory.harvesting = false;

            const targets = creep.findEnergyTransferTarget();

            // Head home so we're close to base when energy slots open up.
            if (targets.length == 0) {
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
        }
    }
};

module.exports = roleCourier;