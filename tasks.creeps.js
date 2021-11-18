var creepTasks = {

    suicideCreep: function (p_room) {
        console.log('DEBUG: Checking for creeps to remove in room ' + p_room.name);

        let creeps = p_room.find(FIND_CREEPS);

        let harvesters = _.filter(creeps, (creep) => creep.memory.role == 'harvester');
        let dropMiners = _.filter(creeps, (creep) => creep.memory.role == 'dropminer');
        let haulers = _.filter(p_room.creeps, (creep) => creep.memory.role == 'hauler');
        let builders = _.filter(p_room.creeps, (creep) => creep.memory.role == 'builder');
        let upgraders = _.filter(p_room.creeps, (creep) => creep.memory.role == 'upgrader');

        if (harvesters.length > p_room.memory.maxHarvesterCreeps) {
            let creepsToDelete = harvesters.length - p_room.memory.maxHarvesterCreeps;

            if (creepsToDelete > 0) {
                for (var i = 0; i <= creepsToDelete; i++) {
                    creepsToRemove.push(harvesters[i]);
                }
            }
        }

        if (creepsToRemove.length > 0) {
            for (var i = 0; i < creepsToRemove.length; i++) {
                let creep = creepsToRemove[i];
                console.log('Removing creep ' + creep.id)
                creep.suicide();
            }
        } else {
            console.log('DEBUG: None found for room ' + p_room.name);
        }
    }
}

module.exports = creepTasks;