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
        } else {
            bodyType = [RANGED_ATTACK, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(spawn, role.DEFENDER, bodyType, {
                role: role.DEFENDER,
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (creep, spawn) {
        var hostiles = spawn.room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
            creep.memory.sentry = false;

            var username = hostiles[0].owner.username;
            Game.notify(`User ${username} spotted in room ${spawn.room.name}`);

            const enemyTarget = creep.pos.findClosestByPath(hostiles);
            var moveResult = creep.moveTo(enemyTarget, {
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });

            creep.rangedAttack(enemyTarget);

            return;
        }

        // Locate a random tile centered around the Spawn and move there and wait in sentry mode.
        if (creep.memory.sentry && !creep.memory.inPosition) {
            const moveResult = creep.moveTo(creep.memory.sentryPos.x, creep.memory.sentryPos.y, {
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });

            if (moveResult == OK) {
                creep.memory.inPosition = true;
            } else {
                creep.memory.inPosition = false;
            }
        } else {
            const area = spawn.room.lookForAtArea(
                LOOK_TERRAIN,
                spawn.pos.y - 10,
                spawn.pos.x - 10,
                spawn.pos.y + 10,
                spawn.pos.x + 10,
                true
            );

            const index = Math.floor(Math.random() * area.length);
            creep.memory.sentryPos = { x: area[index].x, y: area[index].y };
            creep.memory.sentry = true;
        }
    }
};

module.exports = roleDefender;
