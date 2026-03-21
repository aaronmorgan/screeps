const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleClaimer = {

    tryBuild: function (room, energyCapacityAvailable) {
        let bodyType = [];

        if (energyCapacityAvailable >= 700) {
            [CLAIM, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            const roomExits = Game.map.describeExits(room.name);

            let targetRoom = roomExits[1];

            return creepFactory.create(room, role.CLAIMER, bodyType, {
                role: role.CLAIMER,
                spawnRoom: room.name,
                targetRoom: targetRoom,
                harvesting: false
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.room.name !== creep.memory.targetRoom) {
            const exit = creep.room.findExitTo(creep.memory.targetRoom);

            creep.moveTo(exit, {
                reusePath: 10,
                visualizePathStyle: {
                    stroke: '#ffffff'
                }
            })
        } else {
            if (creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
    }
};

module.exports = roleClaimer;