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
            bodyType = [WORK, CARRY, CARRY, MOVE, MOVE]; // 300
        }

        const roomExits = Game.map.describeExits(spawn.room.name);
        let targetRoom = undefined;

        let exit = roomExits[1];

        if (exit && (!Memory.rooms[exit] || !Memory.rooms[exit].isMapped)) {
            targetRoom = exit;
        } else {
            exit = roomExits[3];

            if (exit && (!Memory.rooms[exit] || !Memory.rooms[exit].isMapped)) {
                targetRoom = exit;
            } else {
                exit = roomExits[5];

                if (exit && (!Memory.rooms[exit] || !Memory.rooms[exit].isMapped)) {
                    targetRoom = exit;
                } else {
                    exit = roomExits[7];

                    if (exit && (!Memory.rooms[exit] || !Memory.rooms[exit].isMapped)) {
                        targetRoom = exit;
                    }
                }
            }

            if (!exit) {
                targetRoom = roomExits[1]
            }

            // We've identified an exit but it hasn't met the criteria to assign a harvester, assign one.
            // if (exit && !targetRoom) {
            //     console.log(111)
            //     // Iterate over all rooms and find the one with the least number of harvesters, assign this harvester to that room.
            //     // const roomWithFewestRoamingHarvesters = Memory.rooms.reduce((smallest, current) => {
            //     //     return (current.creeps.roamingHarvesters < smallest.creeps.roamingHarvesters) ? current : smallest;
            //     // });

            //    // let roomWithFewestRoamingHarvesters = exit;
            //     let count = Memory.rooms[exit].creeps.roamingHarvesters;

            //     for (var roomName in Game.rooms) {
            //         var room = Game.rooms[roomName];

            //         if (room.memory.creeps && room.memory.creeps.roamingHarvesters < count) {
            //             console.log(`found room with fewer harvesters, ${roomName}`)
            //             roomWithFewestRoamingHarvesters = roomName;
            //         }
            //     }

            //     //console.log('roomWithFewestRoamingHarvesters', roomWithFewestRoamingHarvesters)

            //     Game.rooms[targetRoom].memory.roamingHarvesters.push(creep.id);
            //     targetRoom = roomWithFewestRoamingHarvesters;
            // }
        }

        if (targetRoom) {
            return creepFactory.create(spawn, role.ROAMING_HARVESTER, bodyType, {
                role: role.ROAMING_HARVESTER,
                spawnRoom: spawn.room.name,
                targetRoomName: targetRoom,
                isHarvesting: true
            });
        } else {
            console.log('⛔ Error: Failing to create new Roaming Harvester, not targetRoom');
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        // if (!Game.rooms[creep.memory.spawnRoom]) {
        //     Memory.rooms[targetRoom].roamingHarvesters = 0;
        // }

        // if (!Game.rooms[creep.memory.spawnRoom].roamingHarvesters) {
        //     Game.rooms[creep.memory.spawnRoom].roamingHarvesters = [];
        // }

        // if (!Game.rooms[creep.memory.spawnRoom].roamingHarvesters.includes(creep.id)) {
        //     Game.rooms[creep.memory.spawnRoom].roamingHarvesters.push(creep.id);
        // }
        // if (!Game.rooms[creep.memory.spawnRoom].roamingHarvesters) {
        //     Game.rooms[creep.memory.spawnRoom].roamingHarvesters = [];
        // }

        // if (Game.rooms[creep.memory.spawnRoom].roamingHarvesters && !Game.rooms[creep.memory.spawnRoom].roamingHarvesters.includes(creep.id)) {
        //     Game.rooms[creep.memory.spawnRoom].roamingHarvesters.push(creep.id);
        // }
        if (!Game.rooms[creep.memory.spawnRoom].memory.roamingHarvesters.includes(creep.id)) {
            Game.rooms[creep.memory.spawnRoom].memory.roamingHarvesters.push(creep.id);
        }

        creep.memory.isHarvesting = creep.store.getFreeCapacity() != 0;

        let closestSource = creep.pos.findClosestByRange(creep.room.find(FIND_SOURCES));

        if (!creep.memory.source) {
            creep.memory.source = closestSource
        }


        //   if (!creep.memory.source) {
        if (creep.pos.roomName === creep.memory.targetRoomName && creep.store.getFreeCapacity() != 0) {
            if (!Memory.rooms[creep.pos.roomName].isMapped) {

                //  const energySources = creep.room.sources().length;

                //   Memory.rooms[creep.pos.roomName].sources = energySources;
                Memory.rooms[creep.pos.roomName].maxHarvesterCount = 3; // Could use better heuristics.
                Memory.rooms[creep.pos.roomName].isMapped = true;
            }

            // let closestSource = creep.pos.findClosestByPath(creep.room.find(FIND_SOURCES));
            // console.log(JSON.stringify(closestSource))

            //    if (!creep.memory.source) {
            //          creep.memory.source = closestSource
            // if (creep.room === creep.targetRoom) {

            //     let sourceRoom = Memory.creeps[creep.name].targetRoomName;

            //     let room = Memory.rooms[sourceRoom]

            //     if (room) {
            //         //let roomPosition = new RoomPosition(25, 25, sourceRoom);

            //         console.log('Memory.rooms[sourceRoom]', JSON.stringify(Game.rooms[sourceRoom]))

            //         let sources = Game.rooms[sourceRoom].find(FIND_SOURCES);
            //         console.log('sources', sources)

            //         let closestSource = pos.findClosestByPath(sources);


            //         console.log('closestSource', closestSource)
            //         if (closestSource) {
            //             console.log(`Closest source is at: ${closestSource.pos}`);

            //             creep.memory.source = closestSource.id;
            //         } else {
            //             console.log('INFO: Attempting set new target source, id=' + JSON.stringify(sourceRoom));
            //         }
            //     }
            // }
            //  }
        }

        const creepFillPercentage = creep.CreepFillPercentage();
        if (creepFillPercentage > 0) {
            creep.say('⛏️ ' + creepFillPercentage + '%')
        }

        if ((creep.memory.isHarvesting && creep.store.getFreeCapacity() != 0)) {
            // Cater for the siuation where the creep wanders into another room.
            // if (_.isEmpty(creep.room.sources())) {
            //     return;
            // }

            if (creep.memory.source) {


                const source = Game.getObjectById(creep.memory.source.id);

                const harvestResult = creep.harvest(source);

                if (harvestResult == ERR_NOT_IN_RANGE) {
                    const moveResult = creep.moveTo(source.pos, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });

                    if (moveResult == ERR_NO_PATH) {
                        const sources = creep.room.selectAvailableSource(creep.room.creeps().harvesters);

                        let sourceRoom = Memory.creeps[creep.name].targetRoomName;

                        if (sourceRoom) {
                            // Find closest source to a specific position (e.g., center of that room)
                            let room = Game.rooms[sourceRoom]

                            if (room) {
                                let roomPosition = new RoomPosition(25, 25, sourceRoom);

                                let closestSource = roomPosition.findClosestByRange(FIND_SOURCES);


                                console.log('closestSource', closestSource)
                                if (closestSource) {
                                    console.log(`Closest source is at: ${closestSource.pos}`);

                                    creep.memory.source = closestSource;
                                } else {
                                    console.log('INFO: Attempting set new target source, id=' + JSON.stringify(sourceRoom));
                                }
                            }
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
                target = creep.pos.findClosestByRange(targets);
            } else {
                target = Game.spawns['Spawn1'];
            }

            if (!target && targets.length === 0) {
                target = Game.flags[creep.room.name + '_DUMP'];
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
