const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleGopher = {

    tryBuild: function (room, energyCapacityAvailable) {
        let bodyType = [];
        if (energyCapacityAvailable >= 600) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 550) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 500) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 450) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 400) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 350) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else {
            bodyType = [CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(room, role.GOPHER, bodyType, {
                role: role.GOPHER,
                harvesting: false,
                targetedDroppedEnergy: undefined
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.checkTicksToDie();
        creep.checkTicksToLive();

        const creepFillPercentage = creep.CreepFillPercentage();
        creep.say('🛵 ' + creepFillPercentage + '%');

        if (!creep.memory.targetedDroppedEnergy) {
            // Identify the lowest dropped energy
            const droppedEnergy = creep.room.droppedResources();
            const randomIndex = [Math.floor((Math.random() * droppedEnergy.length))];
            const targetEnergy = droppedEnergy[randomIndex];

            if (!targetEnergy) {
                return;
            }

            creep.memory.targetedDroppedEnergy = {
                id: targetEnergy.id,
                pos: targetEnergy.pos
            };
        }

        // If we're not full and there are ruins around, withdraw from those too.
        if (creepFillPercentage < 100 && !creep.memory.harvesting) {
            const ruin = creep.room.find(FIND_RUINS, { filter: x => x.store && x.store.energy > 0 })[0];

            if (ruin) {
                if (creep.withdraw(ruin, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(ruin, {
                        reusePath: 10
                    });

                    return;
                }
            }
        }

        // Creep has no energy so we need to move to our source.
        if (creepFillPercentage === 0 && !creep.memory.harvesting) {
            const ruin = creep.pos.findClosestByRange(FIND_RUINS);

            if (ruin) {
                if (creep.withdraw(ruin, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(ruin, {
                        reusePath: 10,
                    });

                    return;
                }
            }

            const energyTarget = Game.getObjectById(creep.memory.targetedDroppedEnergy.id);

            // Gopher has no work.
            if (!energyTarget) {
                creep.memory.targetedDroppedEnergy = undefined;
                return;
            }

            if (creep.pos && !creep.pos.inRangeTo(energyTarget, 2)) {
                var moveResult = creep.moveTo(energyTarget, {
                    reusePath: 10,
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });

                return;
            } else {
                // Target source is within range so switch to harvesting mode.
                creep.memory.harvesting = true;
            }

            return;
        } else if (creepFillPercentage === 100) {
            creep.memory.harvesting = false;
        }

        if (creepFillPercentage === 100 && !creep.memory.harvesting) {
            const target = Game.flags[creep.room.name + '_DUMP'];

            // Stand off to the side so we don't block other creeps trying to unload at the 'dump'.
            creep.moveTo(target, {
                reusePath: 10
            });

        }

        if (creepFillPercentage < 100 && creep.memory.harvesting) {
            const ruin = creep.pos.findClosestByRange(FIND_RUINS);
            if (ruin) {
                if (creep.withdraw(ruin, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(ruin, {
                        reusePath: 10
                    });

                    return;
                }
            }
            // TODO: Should the creep just hang around the flag/spawn and not venture further away?

            const energyTarget = Game.getObjectById(creep.memory.targetedDroppedEnergy.id);

            if (!energyTarget) {
                creep.memory.harvesting = false;
                creep.memory.targetedDroppedEnergy = undefined;
                return;
            }

            const pickupResult = creep.pickup(energyTarget);

            switch (pickupResult) {
                case OK: {
                    creep.say('🚄 ' + creepFillPercentage + '%');
                    break;
                }
                case ERR_NOT_IN_RANGE: {
                    const moveResult = creep.moveTo(energyTarget, {
                        reusePath: 10,
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                    break;
                }
                case ERR_INVALID_TARGET:
                case ERR_FULL: {
                    creep.memory.harvesting = false;
                }
            }
        }

        if (!creep.memory.harvesting && creepFillPercentage > 0) {
            const targets = creep.findEnergyTransferTarget();

            // Head home so we're close to base when energy slots open up.
            let target = undefined;

            if (targets.length === 0) {
                target = Game.flags[creep.room.name + '_DUMP'];
            } else {
                // Just select the first target in the collection.
                target = targets[0];
            }

            if (!creep.pos.isEqualTo(target)) {

                creep.moveTo(target, {
                    reusePath: 10,
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                })

                return;
            } else {
                // Should be dropping resources on the spot outside our spawn for other builder and upgrader creeps
                // to pickup.
                creep.dropResources();
                creep.memory.harvesting = false;

                // Move off the target so we don't block other creeps if this one has no current job.
                const x = Math.floor(Math.random() * 9) - 1; // -4, 0, or 4
                const y = Math.floor(Math.random() * 9) - 1;

                // Move the creep off the dump flag. It'll only actually work for one tick if there are other dropped
                // resources for it to pick up. If there aren't it should move the creep far enough away to get out of
                // the way of other creeps.
                creep.say('🛵 ' + x + ',' + y);

                creep.moveTo(creep.pos.x + x, creep.pos.y + y, {
                    reusePath: 10
                });

                return;
            }
        }
    }
};

module.exports = roleGopher;
