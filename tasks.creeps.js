var creepTasks = {

    suicideCreep: function (p_room) {
        console.log('DEBUG: Checking for creeps to remove in room ' + p_room.name);

        let creeps = p_room.find(FIND_MY_CREEPS);

        if (!creeps || creeps.length == 0) {
            console.log('DEBUG: No creeps found in room ' + p_room.name);
            return;
        }

        let harvesters = _.filter(creeps, (creep) => creep.memory.role == 'harvester');
        let dropMiners = _.filter(creeps, (creep) => creep.memory.role == 'dropminer');
        let haulers = _.filter(creeps, (creep) => creep.memory.role == 'hauler');
        let builders = _.filter(creeps, (creep) => creep.memory.role == 'builder');
        let upgraders = _.filter(creeps, (creep) => creep.memory.role == 'upgrader');

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

        if (builders.length > p_room.memory.maxBuilderCreeps) {
            let creepsToDelete = builders.length - p_room.memory.maxBuilderCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' BUILDER creeps to remove...');

                for (var i = 0; i <= creepsToDelete; i++) {
                    creepsToRemove.push(builders[i]);
                }
            }
        }

        // Batch remove all unused creeps.
        if (creepsToRemove.length > 0) {
            for (var i = 0; i < creepsToRemove.length; i++) {
                let creep = creepsToRemove[i];

                if (!creep) { continue; }

                console.log('Removing creep ' + creep.id)
                creep.suicide();
            }
        } else {
            console.log('DEBUG: None found for room ' + p_room.name);
        }
    }
}

module.exports = creepTasks;
