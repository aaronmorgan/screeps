const {
    EXIT_CODE,
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleDropMiner = {

    tryBuild: function (p_room, p_spawn, p_energyCapacityAvailable, p_dropminers) {
        let bodyType = [];

        if (p_energyCapacityAvailable >= 700) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE];
            p_room.memory.minersPerSource = 1;
        } else if (p_energyCapacityAvailable >= 600) {
            bodyType = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE]; // 5 WORK parts mine exactly 3000 energy every 300 ticks.
            p_room.memory.minersPerSource = 1;
        } else if (p_energyCapacityAvailable >= 400) {
            bodyType = [WORK, WORK, WORK, MOVE, MOVE];
            p_room.memory.minersPerSource = 2;
        } else if (p_energyCapacityAvailable >= 350) {
            bodyType = [WORK, WORK, WORK, MOVE];
            p_room.memory.minersPerSource = 2;
        } else {
            bodyType = [WORK, WORK, MOVE, MOVE];
            p_room.memory.minersPerSource = 2;
        }

        if (!_.isEmpty(bodyType)) {
            let targetSourceId = undefined;

            for (let source of p_room.memory.sources) {
                let creepsForThisSource = _.countBy(p_dropminers, x => x.memory.sourceId == source.id).true;
                creepsForThisSource = Math.min(source.accessPoints, creepsForThisSource);

                if (!creepsForThisSource) {
                    targetSourceId = source.id;
                    break;
                }
            }

            if (!targetSourceId) {
                console.log('ERROR: Attempting to create ' + role.DROPMINER + ' with an assigned source');
                return EXIT_CODE.ERR_INVALID_TARGET;
            } else {
                return creepFactory.create(p_room, p_spawn, role.DROPMINER, bodyType, {
                    role: role.DROPMINER,
                    sourceId: targetSourceId
                });
            }
        }
    },

    /** @param {Creep} creep **/
    run: function (p_creep) {
        const source = Game.getObjectById(p_creep.memory.sourceId);

        if (p_creep.harvest(source) == ERR_NOT_IN_RANGE) {
            p_creep.moveTo(source, {
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });

            return p_creep.harvest(source);
        }

        p_creep.say('⚙️');
    }
};

module.exports = roleDropMiner;