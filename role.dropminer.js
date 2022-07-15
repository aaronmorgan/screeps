const {
    EXIT_CODE,
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleDropMiner = {

    tryBuild: function (p_spawn, p_energyCapacityAvailable) {
        let bodyType = [];

        if (p_energyCapacityAvailable >= 700) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE];
            p_spawn.room.memory.minersPerSource = 1;
        } else if (p_energyCapacityAvailable >= 600) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE]; // 5 WORK parts mine exactly 3000 energy every 300 ticks.
            p_spawn.room.memory.minersPerSource = 1;
        } else if (p_energyCapacityAvailable >= 400) {
            bodyType = [WORK, WORK, WORK, MOVE, MOVE];
            p_spawn.room.memory.minersPerSource = 2;
        } else if (p_energyCapacityAvailable >= 350) {
            bodyType = [WORK, WORK, WORK, MOVE];
            p_spawn.room.memory.minersPerSource = 2;
        } else {
            bodyType = [WORK, WORK, MOVE, MOVE];
            p_spawn.room.memory.minersPerSource = 2;
        }

        if (!_.isEmpty(bodyType)) {
            // Potential bug: We could end up with a dropminer assigning itself to a source with a remaining harvester.
            const targetSourceId = p_spawn.room.selectAvailableSource(p_spawn.room.creeps().dropminers)[0].id;

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