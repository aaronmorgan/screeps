const { role } = require("game.constants");

require("prototype.creep")();

let creepFactory = require("tasks.build.creeps");

var roleDefender = {
    tryBuild: function (room, energyCapacityAvailable) {
        let bodyType = [];

        if (energyCapacityAvailable >= 250) {
            bodyType = [RANGED_ATTACK, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            return creepFactory.create(room, role.DEFENDER, bodyType, {
                role: role.DEFENDER,
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        var hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
            creep.memory.sentry = false;

            var username = hostiles[0].owner.username;
            Game.notify(`User ${username} spotted in room ${creep.room.name}`);

            const enemyTarget = creep.pos.findClosestByPath(hostiles);
            var moveResult = creep.moveTo(enemyTarget, {
                reusePath: 10,
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });

            creep.rangedAttack(enemyTarget);

            return;
        }

        // Locate a random tile centered around the Spawn and move there and wait in sentry mode.
        if (creep.memory.sentry && !creep.memory.inPosition) {
            if (creep.memory.sentryPos.x < 0 || creep.memory.sentryPos.y < 0) {
                creep.memory.sentry = null;
            }
            const moveResult = creep.moveTo(creep.memory.sentryPos.x, creep.memory.sentryPos.y, {
                reusePath: 10,
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });

            // TODO: If sentryPos isn't accessible recalcule a new position.

            if (!creep.pos.x === creep.memory.sentryPos.x && creep.pos.y === creep.memory.sentryPos.y) {
                creep.memory.inPosition = true;
            } else {
                creep.memory.inPosition = false;
            }
        } else {
            const area = creep.room.lookForAtArea(
                LOOK_TERRAIN,
                creep.pos.y - 10,
                creep.pos.x - 10,
                creep.pos.y + 10,
                creep.pos.x + 10,
                true
            );

            const index = Math.floor(Math.random() * area.length);
            creep.memory.sentryPos = { x: area[index].x, y: area[index].y };
            creep.memory.sentry = true;
        }
    }
};

module.exports = roleDefender;
