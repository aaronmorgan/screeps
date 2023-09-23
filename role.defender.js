const { role } = require("game.constants");

require("prototype.creep")();

let creepFactory = require("tasks.build.creeps");

var roleDefender = {
    tryBuild: function (spawn, energyCapacityAvailable) {
        let bodyType = [];

        if (energyCapacityAvailable >= 400) {
            bodyType = [RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 350) {
            bodyType = [RANGED_ATTACK, RANGED_ATTACK, MOVE];
        } else if (energyCapacityAvailable >= 250) {
            bodyType = [RANGED_ATTACK, MOVE, MOVE];
        } else {
            bodyType = [RANGED_ATTACK, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(spawn, role.DEFENDER, bodyType, {
                role: role.DEFENDER,
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (creep, room) {
        var hostiles = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
            var username = hostiles[0].owner.username;
            Game.notify(`User ${username} spotted in room ${room.name}`);
            
            const enemyTarget = creep.pos.findClosestByPath(hostiles);
            var moveResult = creep.moveTo(enemyTarget, {
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });

            creep.rangedAttack(enemyTarget);
        }
    }
};

module.exports = roleDefender;
