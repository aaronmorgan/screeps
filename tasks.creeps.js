const {
    role,
    global
} = require('game.constants');

var creepTasks = {

    suicideCreep: function (p_room) {
        const creeps = p_room.myCreeps();

        if (!creeps || creeps.length == 0) {
            return;
        }

        const harvesters = p_room.creeps().harvesters;
        const dropminers = p_room.creeps().dropminers;
        const haulers = p_room.creeps().haulers;
        const builders = p_room.creeps().builders;
        const upgraders = p_room.creeps().upgraders;

        let creepsToRemove = [];

        if (harvesters.length > p_room.memory.maxHarvesterCreeps) {
            let creepsToDelete = harvesters.length - p_room.memory.maxHarvesterCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' HARVESTER creeps to remove...');

                for (let i = 0; i <= creepsToDelete; i++) {
                    let creep = harvesters[i];

                    if (!creep || creep.memory.ticksToDie) {
                        continue;
                    }

                    if (!creep.memory.ticksToDie) {
                        creep.memory.ticksToDie = global.TICKS_TO_DELETE;
                    }
                }
            }
        } else {
            harvesters.forEach(creep => {
                creep.memory.ticksToDie = undefined;
            });
        }


        if (dropminers.length > p_room.memory.maxDropMinerCreeps) {
            let creepsToDelete = dropminers.length - p_room.memory.maxDropMinerCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' DROPMINER creeps to remove...');

                for (let i = 0; i <= creepsToDelete; i++) {
                    creepsToRemove.push(dropminers[i]);
                }
            }
        }

        if (haulers.length > p_room.memory.maxHaulerCreeps) {
            let creepsToDelete = haulers.length - p_room.memory.maxHaulerCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' HAULER creeps to remove...');

                for (let i = 0; i <= creepsToDelete; i++) {
                    let creep = haulers[i];

                    if (!creep || creep.memory.ticksToDie) {
                        continue;
                    }

                    if (!creep.memory.ticksToDie) {
                        creep.memory.ticksToDie = global.TICKS_TO_DELETE;
                    }
                }
            }
        } else {
            haulers.forEach(creep => {
                creep.memory.ticksToDie = undefined;
            });
        }

        if (builders.length > p_room.memory.maxBuilderCreeps) {
            let creepsToDelete = builders.length - p_room.memory.maxBuilderCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' BUILDER creeps to remove...');

                for (let i = 0; i <= creepsToDelete; i++) {
                    let creep = builders[i];

                    if (!creep || creep.memory.ticksToDie) {
                        continue;
                    }

                    if (creep && !creep.memory.ticksToDie) {
                        creep.memory.ticksToDie = global.TICKS_TO_DELETE;
                    }
                }
            }
        } else {
            builders.forEach(creep => {
                creep.memory.ticksToDie = undefined;
            });
        }

        if (upgraders.length > p_room.memory.maxUpgraderCreeps) {
            let creepsToDelete = upgraders.length - p_room.memory.maxUpgraderCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' UPGRADER creeps to remove...');

                for (let i = 0; i <= creepsToDelete; i++) {
                    creepsToRemove.push(upgraders[i]);
                }
            }
        }

        // Batch remove all unused creeps.
        if (creepsToRemove.length > 0) {
            for (let i = 0; i < creepsToRemove.length; i++) {
                const creep = creepsToRemove[i];

                if (!creep) {
                    continue;
                }

                if (creep.memory.role == role.UPGRADER && creep.store.getUsedCapacity() > 0) {
                    continue;
                }

                if (creep.memory.role == role.HARVESTER ||
                    creep.memory.role == role.HAULER ||
                    creep.memory.role == role.BUILDER) {

                    console.log('⛔ Error: creep with role ' + creep.memory.role + ' should manage it\'s own cleanup');
                    continue;
                }


                console.log('Removing creep ' + creep.id)
                creep.suicide();
            }
        } else {
            //console.log('DEBUG: None found for room ' + p_room.name);
        }
    }
}

module.exports = creepTasks;