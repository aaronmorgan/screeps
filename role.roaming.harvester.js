const { role } = require("game.constants");

require("prototype.creep")();

let creepFactory = require("tasks.build.creeps");

var roleRoamingHarvester = {
    tryBuild: function (spawn, energyCapacityAvailable) {
        let bodyType = [];

        if (energyCapacityAvailable >= 1500) {
            bodyType = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 1450) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 1400) {
            bodyType = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyCapacityAvailable >= 1350) {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else {
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE];
        }

        const roomExits = Game.map.describeExits(spawn.room.name);
        var targetRoom = undefined;

        var exit = roomExits[1];

        if (exit && !Memory.rooms[exit].isMapped) {
            targetRoom = exit;
        } else {
            exit = roomExits[3];

            if (exit && !Memory.rooms[exit].isMapped) {
                targetRoom = exit;
            } else {
                exit = roomExits[5];

                if (exit && !Memory.rooms[exit].isMapped) {
                    targetRoom = exit;
                } else {
                    exit = roomExits[7];

                    if (exit && !Memory.rooms[exit].isMapped) {
                        targetRoom = exit;
                    }
                }
            }

            if (!exit) { targetRoom = roomExits[1] }

            return creepFactory.create(spawn, role.ROAMING_HARVESTER, bodyType, {
                role: role.ROAMING_HARVESTER,
                spawnRoom: spawn.room.name,
                targetRoomName: targetRoom,
                isHarvesting: true
            });
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        if (!Game.rooms[creep.memory.spawnRoom].memory.roamingHarvesters.includes(creep.id)) {
            Game.rooms[creep.memory.spawnRoom].memory.roamingHarvesters.push(creep.id);
        }

        creep.memory.isHarvesting = creep.store.getFreeCapacity() != 0;

        if (creep.pos.roomName === creep.memory.targetRoomName && creep.store.getFreeCapacity() != 0) {
            if (!Memory.rooms[creep.pos.roomName].isMapped) {

                const energySourcesCount = creep.room.sources().length;

                Memory.rooms[creep.pos.roomName].energySources = energySourcesCount;
                Memory.rooms[creep.pos.roomName].maxHarvesterCount = 3; // Could use better heuristics.
                Memory.rooms[creep.pos.roomName].isMapped = true;
            }

            if (!creep.memory.sourceId) {
                const sources = creep.room.sources();

                var nearestSource = creep.pos.findClosestByPath(sources);
                creep.memory.sourceId = nearestSource.id;
            }

            const creepFillPercentage = creep.CreepFillPercentage();
            if (creepFillPercentage > 0) {
                creep.say('⛏️ ' + creepFillPercentage + '%')
            }

            if ((creep.memory.isHarvesting && creep.store.getFreeCapacity() != 0)) {
                // Cater for the siuation where the creep wanders into another room.
                if (_.isEmpty(creep.room.sources())) {
                    return;
                }

                const source = Game.getObjectById(creep.memory.sourceId);

                const harvestResult = creep.harvest(source);

                if (harvestResult == ERR_NOT_IN_RANGE) {
                    const moveResult = creep.moveTo(source, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });

                    if (moveResult == ERR_NO_PATH) {
                        const sources = creep.room.selectAvailableSource(creep.room.creeps().harvesters);

                        if (!_.isEmpty(sources)) {
                            const sourceId = sources[0].id;

                            console.log('INFO: Attempting set new target source, id=' + sourceId);
                            creep.memory.sourceId = sourceId;
                        }
                    }
                } else if (harvestResult == OK) {
                    const linkStructure = Game.getObjectById(source.id).pos.findInRange(FIND_MY_STRUCTURES, 3, {
                        filter: {
                            structureType: STRUCTURE_LINK
                        }
                    })[0];

                    if (linkStructure) {
                        creep.memory.linkId = linkStructure.id;

                        const transferResult = creep.transfer(linkStructure, RESOURCE_ENERGY);

                        switch (transferResult) {
                            case (ERR_NOT_IN_RANGE): {
                                creep.moveTo(linkStructure, {
                                    visualizePathStyle: {
                                        stroke: '#ffffff'
                                    }
                                });
                                break;
                            }
                        }
                    } else {
                        if (!creep.memory.isHarvesting && creep.room.memory.creeps.couriers > 0) {
                            creep.memory.isHarvesting = creep.store.getFreeCapacity() != 0;

                            for (const resourceType in creep.carry) {
                                creep.drop(resourceType);
                            }
                        }
                    }
                }
            }

            return;
        }

        if (!creep.memory.isHarvesting) {
            let targets = [];
            let target;

            if (creep.room.name === Game.spawns['Spawn1'].room.name) {
                targets = creep.findEnergyTransferTarget();
                target = creep.pos.findClosestByPath(targets);
            } else {
                target = Game.spawns['Spawn1'];
            }
            if (targets.length === 0) {
                target = Game.flags[Game.spawns['Spawn1'].name + '_DUMP'];
            }

            if (!creep.pos.isEqualTo(target)) {
                const moveResult = creep.moveTo(target, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                })

            } else {
                for (const resourceType in creep.store) {
                    creep.drop(resourceType);
                }
                creep.memory.isHarvesting = true;
            }

            return;
        }



        if (!creep.memory.targetRoomName) {
            console.log('-----------------------------NO ')
            //creep.suicide();
            return;
        }



        var moveResult = creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoomName), {
            visualizePathStyle: {
                stroke: '#ffaa00'
            }
        });
    }
};

module.exports = roleRoamingHarvester;
