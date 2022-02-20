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

            if (p_dropminers.length == 0) {
                targetSourceId = p_spawn.pos.findClosestByPath(p_room.sources().map(x => x.pos))
            }

            for (let i = 0; i < p_room.memory.sources.length; i++) {
                const source = p_room.memory.sources[i];

                const a = Math.min(source.accessPoints, p_room.memory.minersPerSource);
                const creepsForThisSource = Math.min(a, _.countBy(p_dropminers, x => x.memory.sourceId == source.id).true);

                const b = p_dropminers.filter(x => x.memory.sourceId == source.id).length;

                if (b == p_room.memory.minersPerSource) {
                    continue;
                }

                if (creepsForThisSource > source.accessPoints) {
                    console.log('⚠️ WARNING: Too many DROPMINER creeps for source ' + source.id);

                    // TODO Remove excess creeps. Remove the creep with the lowest TTL?
                    continue;
                }

                targetSourceId = source.id;
                break;
            };

            p_room.memory.maxDropMinerCreeps = p_room.memory.minersPerSource * p_room.memory.sources.length;

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

        p_creep.say('⛏ harvest');
    }
};

module.exports = roleDropMiner;