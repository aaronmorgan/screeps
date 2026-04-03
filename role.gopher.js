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

        if (creep.memory.harvesting) {
            const ruins = creep.pos.findClosestByRange(FIND_RUINS);
            if (ruins) {
                // Withdraw needs a resource type - iterate what's stored.
                const resource = Object.keys(ruins.store)[0];

                if (resource) {
                    if (creep.withdraw(ruins, resource) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(ruins, { reusePath: 10 });
                    } else {
                        creep.memory.harvesting = false;
                    }
                }

                return;
            }

            const tombstone = creep.pos.findClosestByRange(FIND_TOMBSTONES);
            if (tombstone) {
                // Withdraw needs a resource type - iterate what's stored.
                const resource = Object.keys(tombstone.store)[0];

                if (resource) {
                    if (creep.withdraw(tombstone, resource) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(tombstone, { reusePath: 10 });
                    } else {
                        creep.memory.harvesting = false;
                    }
                }

                return;
            }

            const target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
            if (target) {
                if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { reusePath: 10 });
                } else {
                    creep.memory.harvesting = false;
                }

                return;
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
                //    const flag = Game.flags[creep.room.name + '_DUMP'];

                // We cannot find any targets, are we sitting on the flag preventing energy from being dropped?
                if (creep.pos.x === target.pos.x && creep.pos.y === target.pos.y) {

                    // Locate a random tile around our current position and attempt to move there.
                    const area = creep.room.lookForAtArea(
                        LOOK_TERRAIN,
                        creep.pos.y - 10,
                        creep.pos.x - 10,
                        creep.pos.y + 10,
                        creep.pos.x + 10,
                        true
                    );

                    creep.moveTo(area, {
                        reusePath: 10
                    });
                }
            }
        }
    }
};

module.exports = roleGopher;
