const {
    EXIT_CODE,
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleDropMiner = {

    tryBuild: function (p_spawn, p_energyCapacityAvailable) {
        const targetSourceId = p_spawn.room.selectAvailableSource(p_spawn.room.creeps().dropminers)[0].id;
        const source = Game.getObjectById(targetSourceId);

        const linkStructure = Game.getObjectById(source.id).pos.findInRange(FIND_MY_STRUCTURES, 3, {
            filter: {
                structureType: STRUCTURE_LINK
            }
        })[0];

        let lastPart = MOVE;

        if (linkStructure) {
            lastPart = CARRY;
        }


        let bodyType = [];

        if (p_energyCapacityAvailable >= 700) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, lastPart];
            p_spawn.room.memory.minersPerSource = 1;
        } else if (p_energyCapacityAvailable >= 600) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, lastPart]; // 5 WORK parts mine exactly 3000 energy every 300 ticks.
            p_spawn.room.memory.minersPerSource = 1;
        } else if (p_energyCapacityAvailable >= 400) {
            bodyType = [WORK, WORK, WORK, MOVE, lastPart];
            p_spawn.room.memory.minersPerSource = 2;
        } else if (p_energyCapacityAvailable >= 350) {
            bodyType = [WORK, WORK, WORK, lastPart];
            p_spawn.room.memory.minersPerSource = 2;
        } else {
            bodyType = [WORK, WORK, MOVE, lastPart];
            p_spawn.room.memory.minersPerSource = 2;
        }

        if (!_.isEmpty(bodyType)) {
            if (!targetSourceId) {
                console.log('ERROR: Attempting to create ' + role.DROPMINER + ' with an assigned source');
                return EXIT_CODE.ERR_INVALID_TARGET;
            } else {
                return creepFactory.create(p_spawn, role.DROPMINER, bodyType, {
                    role: role.DROPMINER,
                    sourceId: targetSourceId
                });
            }
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        const source = Game.getObjectById(creep.memory.sourceId);

        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });

            return creep.harvest(source);
        }
    }
};

module.exports = roleDropMiner;