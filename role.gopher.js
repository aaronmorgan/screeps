// Gopher has some pathing problems if the spawn is full on energy and it's full it sits on the dump flag.
// After the first container is built it's working better because there's always somewhere to dump the energy.

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

        if (creepFillPercentage === 0) {
            creep.memory.harvesting = true;
        }

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

        // Creep has no energy so we need to move to our source.
        if (creepFillPercentage < 100 && !creep.memory.harvesting) {
            const ruin = creep.pos.findClosestByRange(FIND_RUINS, {
                filter: x => x.store && x.store.energy > 0
            });

            if (ruin) {
                if (creep.withdraw(ruin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(ruin, {
                        reusePath: 10,
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });

                    return;
                }
            }

            const energyTarget = Game.getObjectById(creep.memory.targetedDroppedEnergy.id);

            // Gopher has no work.
            if (!energyTarget) {
                const targets = creep.findEnergyTransferTarget();

                // Head home so we're close to base when energy slots open up.
                let target = undefined;

                if (targets.length === 0) {
                    target = Game.flags[creep.room.name + '_DUMP'];
                } else {
                    // Just select the first target in the collection.
                    target = targets[0];
                }

                creep.memory.harvesting = false;
                if (!creep.pos.isEqualTo(target)) {

                    creep.moveTo(target, {
                        reusePath: 10,
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    })
                };


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

            const energyTarget = Game.getObjectById(creep.memory.targetedDroppedEnergy.id);

            if (!energyTarget) {
                creep.memory.harvesting = false;
                creep.memory.targetedDroppedEnergy = undefined;

                return;
            }

            const pickupResult = creep.pickup(energyTarget);

            switch (pickupResult) {
                case OK: {
                    break;
                }
                case ERR_NOT_IN_RANGE: {
                    creep.moveTo(energyTarget, {
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

            return;
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

            creep.memory.harvesting = false;
            if (!creep.pos.isEqualTo(target)) {
                creep.moveTo(target, {
                    reusePath: 10,
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                })

                return;
            } else {
                const flag = Game.flags[creep.room.name + '_DUMP'];

                // We cannot find any targets, are we sitting on the flag preventing energy from being dropped?
                if (creep.pos.x === flag.pos.x && creep.pos.y === flag.pos.y) {

                    // Locate a random tile around our current position and attempt to move there.
                    const area = creep.room.lookForAtArea(
                        LOOK_TERRAIN,
                        creep.pos.y - 10,
                        creep.pos.x - 10,
                        creep.pos.y + 10,
                        creep.pos.x + 10,
                        true
                    );

                    var moveResult = creep.moveTo(area, {
                        reusePath: 10
                    });

                    if (moveResult !== OK) {
                        console.log('⚠️ Gopher cannot move off Flag position, error: ', moveResult)
                    }
                }
            }
        }
    }
};

module.exports = roleGopher;
