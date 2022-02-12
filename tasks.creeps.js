const {
    role
} = require('game.constants');

var creepTasks = {

    suicideCreep: function (p_room) {
        const creeps = p_room.myCreeps();

        if (!creeps || creeps.length == 0) {
            return;
        }

        const harvesters = _.filter(creeps, (creep) => creep.memory.role == role.HARVESTER);
        const dropMiners = _.filter(creeps, (creep) => creep.memory.role == role.DROPMINER);
        const haulers = _.filter(creeps, (creep) => creep.memory.role == role.HAULER);
        const builders = _.filter(creeps, (creep) => creep.memory.role == role.BUILDER);
        const upgraders = _.filter(creeps, (creep) => creep.memory.role == role.UPGRADER);

        let creepsToRemove = [];

        if (harvesters.length > p_room.memory.maxHarvesterCreeps) {
            let creepsToDelete = harvesters.length - p_room.memory.maxHarvesterCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' HARVESTER creeps to remove...');

                for (let i = 0; i <= creepsToDelete; i++) {
                    creepsToRemove.push(harvesters[i]);
                }
            }
        }

        if (dropMiners.length > p_room.memory.maxDropMinerCreeps) {
            let creepsToDelete = dropMiners.length - p_room.memory.maxDropMinerCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' DROPMINER creeps to remove...');

                for (let i = 0; i <= creepsToDelete; i++) {
                    creepsToRemove.push(dropMiners[i]);
                }
            }
        }

        if (haulers.length > p_room.memory.maxHaulerCreeps) {
            let creepsToDelete = haulers.length - p_room.memory.maxHaulerCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' HAULER creeps to remove...');

                for (let i = 0; i <= creepsToDelete; i++) {
                    const creep = haulers[i];

                    if (!creep.memory.ticksToDie) {
                        creep.memory.ticksToDie = 50;
                    }
                }
            }
        } else {
            haulers.forEach(creep => {
                creep.ticksToDie = undefined;
            });
        }

        if (builders.length > p_room.memory.maxBuilderCreeps) {
            let creepsToDelete = builders.length - p_room.memory.maxBuilderCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' BUILDER creeps to remove...');

                for (let i = 0; i <= creepsToDelete; i++) {
                    let creep = builders[i];

                    if (creep && !creep.memory.ticksToDie) {
                        creep.memory.ticksToDie = 50;
                    }
                }
            }
        } else {
            builders.forEach(creep => {
                creep.ticksToDie = undefined;
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

                if (creep.memory.role == role.HAULER ||
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