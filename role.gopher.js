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

        if (_.isEmpty(creep.memory.targetedDroppedEnergy)) {
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

        // Creep has no energy so we need to move to our source.
        if (creepFillPercentage === 0 && !creep.memory.harvesting) {
            const energyTarget = Game.getObjectById(creep.memory.targetedDroppedEnergy.id);

            if (!energyTarget) {
                creep.memory.targetedDroppedEnergy = undefined;
                return;
            }

            if (creep.pos && !creep.pos.inRangeTo(energyTarget, 2)) {
                var moveResult = creep.moveTo(energyTarget, {
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

        if (creepFillPercentage < 100 && creep.memory.harvesting) {
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

        if (!creep.memory.harvesting) {
            creep.memory.harvesting = false;

            const targets = creep.findEnergyTransferTarget();

            // Head home so we're close to base when energy slots open up.
            if (targets.length === 0) {
                //const target = Game.spawns['Spawn1'];
                const target = Game.flags[creep.room.name + '_DUMP'];

                // Stand off to the side so we don't block other creeps trying to unload at the 'dump'.
                creep.moveTo(target, { range: 2 });

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
                    creep.memory.harvesting = false;

                    // Move off the target so we don't block other creeps if this one has no current job.
                    creep.moveTo(target, { range: 2 });
                    return;
                }
            } else {
                creep.moveTo(Game.flags[creep.room.name + '_DUMP'], { range: 2 });
                creep.memory.harvesting = false;
            }

            creep.say('🚄 ' + creepFillPercentage + '%');
        }
    }
};

module.exports = roleGopher;
