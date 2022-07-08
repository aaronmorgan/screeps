const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleGopher = {

    tryBuild: function (p_spawn, p_energyCapacityAvailable) {
        let bodyType = [];
        if (p_energyCapacityAvailable >= 600) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 550) {
            bodyType = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (p_energyCapacityAvailable >= 500) {
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
            return creepFactory.create(p_spawn, role.GOPHER, bodyType, {
                role: role.GOPHER,
                harvesting: false,
                targetedDroppedEnergy: undefined
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (p_creep) {
        p_creep.checkTicksToDie();
        p_creep.checkTicksToLive();

        const creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);

        if (_.isEmpty(p_creep.memory.targetedDroppedEnergy)) {
            // Identify the lowest dropped energy
            const droppedEnergy = p_creep.room.droppedResources();
            const randomIndex = [Math.floor((Math.random() * droppedEnergy.length))];
            const targetEnergy = droppedEnergy[randomIndex];

            if (!targetEnergy) {
                return;
            }

            p_creep.memory.targetedDroppedEnergy = {
                id: targetEnergy.id,
                pos: targetEnergy.pos
            };
        }

        // Creep has no energy so we need to move to our source.
        if (creepFillPercentage == 0 && p_creep.memory.harvesting == false) {
            const energyTarget = Game.getObjectById(p_creep.memory.targetedDroppedEnergy.id);

            if (!energyTarget) {
                p_creep.memory.targetedDroppedEnergy = undefined;
                return;
            }

            if (p_creep.pos && !p_creep.pos.inRangeTo(energyTarget, 2)) {
                var moveResult = p_creep.moveTo(energyTarget, {
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

        if (creepFillPercentage < 100 && p_creep.memory.harvesting == true) {
            //const energyTarget = _.last(p_creep.room.droppedResources())
            const energyTarget = Game.getObjectById(p_creep.memory.targetedDroppedEnergy.id);

            if (!energyTarget) {
                p_creep.memory.harvesting = false;
                p_creep.memory.targetedDroppedEnergy = undefined;
                return;
            }

            const pickupResult = p_creep.pickup(energyTarget);

            switch (pickupResult) {
                case OK: {
                    p_creep.say('🚄 ' + creepFillPercentage + '%');
                    break;
                }
                case ERR_NOT_IN_RANGE: {
                    const moveResult = p_creep.moveTo(energyTarget, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                    break;
                }
                case ERR_INVALID_TARGET:
                case ERR_FULL: {
                    p_creep.memory.harvesting = false;
                }
            }
        }

        if (creepFillPercentage == 100 || p_creep.memory.harvesting == false) {
            p_creep.memory.harvesting = false;

            let targets = [];

            if (Game.spawns['Spawn1'].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                targets.push(Game.spawns['Spawn1']);
            }
            if (targets.length == 0) {
                // Only refil the Tower if the fill percentage is < 20%.
                targets = _.filter(p_creep.room.structures().tower, (structure) => Math.round(structure.store.getUsedCapacity(RESOURCE_ENERGY) / structure.store.getCapacity(RESOURCE_ENERGY) * 100) < 80);
            }
            if (targets.length == 0) {
                targets = _.filter(p_creep.room.structures().extension, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
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

            p_creep.say('🚄 ' + creepFillPercentage + '%');
        }
    }
};

module.exports = roleGopher;