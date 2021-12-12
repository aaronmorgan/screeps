var {
    role
} = require('game.constants');

var creepTasks = {

    suicideCreep: function (p_room) {
        //console.log('DEBUG: Checking for creeps to remove in room ' + p_room.name);

        let creeps = p_room.find(FIND_MY_CREEPS);

        if (!creeps || creeps.length == 0) {
            console.log('DEBUG: No creeps found in room ' + p_room.name);
            return;
        }

        let harvesters = _.filter(creeps, (creep) => creep.memory.role == role.HARVESTER);
        let dropMiners = _.filter(creeps, (creep) => creep.memory.role == role.DROPMINER);
        let haulers = _.filter(creeps, (creep) => creep.memory.role == role.HAULER);
        let builders = _.filter(creeps, (creep) => creep.memory.role == role.BUILDER);
        let upgraders = _.filter(creeps, (creep) => creep.memory.role == role.UPGRADER);

        let creepsToRemove = [];

        if (harvesters.length > p_room.memory.maxHarvesterCreeps) {
            let creepsToDelete = harvesters.length - p_room.memory.maxHarvesterCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' HARVESTER creeps to remove...');

                for (var i = 0; i <= creepsToDelete; i++) {
                    creepsToRemove.push(harvesters[i]);
                }
            }
        }

        if (dropMiners.length > p_room.memory.maxDropMinerCreeps) {
            let creepsToDelete = dropMiners.length - p_room.memory.maxDropMinerCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' DROPMINER creeps to remove...');

                for (var i = 0; i <= creepsToDelete; i++) {
                    creepsToRemove.push(dropMiners[i]);
                }
            }
        }

        if (haulers.length > p_room.memory.maxHaulerCreeps) {
            let creepsToDelete = haulers.length - p_room.memory.maxHaulerCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' HAULER creeps to remove...');

                for (var i = 0; i <= creepsToDelete; i++) {
                    creepsToRemove.push(haulers[i]);
                }
            }
        }

        if (builders.length > p_room.memory.maxBuilderCreeps) {
            let creepsToDelete = builders.length - p_room.memory.maxBuilderCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' BUILDER creeps to remove...');

                for (var i = 0; i <= creepsToDelete; i++) {
                    creepsToRemove.push(builders[i]);
                }
            }
        }

        if (upgraders.length > p_room.memory.maxUpgraderCreeps) {
            let creepsToDelete = upgraders.length - p_room.memory.maxUpgraderCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' UPGRADER creeps to remove...');

                for (var i = 0; i <= creepsToDelete; i++) {
                    creepsToRemove.push(upgraders[i]);
                }
            }
        }

        // Batch remove all unused creeps.
        if (creepsToRemove.length > 0) {
            for (var i = 0; i < creepsToRemove.length; i++) {
                let creep = creepsToRemove[i];

                if (!creep) { continue; }

                if (creep.memory.role == 'hauler' && creep.store.getUsedCapacity() > 0) { continue; }

                console.log('Removing creep ' + creep.id)
                creep.suicide();
            }
        } else {
            //console.log('DEBUG: None found for room ' + p_room.name);
        }
    }
}

module.exports = creepTasks;
