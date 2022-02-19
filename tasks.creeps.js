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

        const dropminers = p_room.creeps().dropminers;
        const upgraders = p_room.creeps().upgraders;

        let creepsToRemove = [];

        this.findCreepsToDelete(p_room.creeps().harvesters, p_room.memory.maxHarvesterCreeps);

        if (dropminers.length > p_room.memory.maxDropMinerCreeps + 1) {
            let creepsToDelete = dropminers.length - p_room.memory.maxDropMinerCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' DROPMINER creeps to remove...');

                for (let i = 1; i <= creepsToDelete; i++) {
                    creepsToRemove.push(dropminers[i]);
                }
            }
        }

        this.findCreepsToDelete(p_room.creeps().haulers, p_room.memory.maxHaulerCreeps);
        this.findCreepsToDelete(p_room.creeps().builders, p_room.memory.maxBuilderCreeps);

        if (upgraders.length > p_room.memory.maxUpgraderCreeps + 1) {
            let creepsToDelete = upgraders.length - p_room.memory.maxUpgraderCreeps;

            if (creepsToDelete > 0) {
                console.log('DEBUG: Found ' + creepsToDelete + ' UPGRADER creeps to remove...');

                for (let i = 1; i <= creepsToDelete; i++) {
                    creepsToRemove.push(upgraders[i]);
                }
            }
        }

        // Batch remove all unused creeps.
        if (creepsToRemove.length > 0) {
            creepsToRemove.forEach(creep => {
                if (!creep) {
                    return;
                }

                if (creep.memory.role == role.HARVESTER ||
                    creep.memory.role == role.HAULER ||
                    creep.memory.role == role.BUILDER) {

                    console.log('⛔ Error: creep with role ' + creep.memory.role + ' should manage it\'s own cleanup');
                    return;
                }


                for (const resourceType in creep.store) {
                    creep.drop(resourceType);
                }

                console.log('💀 Force removing creep ' + creep.name + ', ' + creep.id)
                creep.suicide();
            });
        } else {
            //console.log('DEBUG: None found for room ' + p_room.name);
        }
    },

    findCreepsToDelete: function (p_creeps, p_maxCreeps) {
        if (p_creeps.length > p_maxCreeps + 1) {
            let creepsToDelete = p_creeps.length - p_maxCreeps;

            if (creepsToDelete > 0) {
                let creepsToRemove = 0;

                for (let i = 1; i <= creepsToDelete; i++) {
                    const creep = p_creeps[i];

                    if (!creep || creep.memory.ticksToDie) {
                        continue;
                    }

                    if (!creep.memory.ticksToDie) {
                        creepsToRemove += 1;
                        creep.memory.ticksToDie = global.TICKS_TO_DELETE;
                        console.log('creep.memory.ticksToDie', creep.memory.ticksToDie);
                    }
                }

                if (creepsToRemove > 0) {
                    console.log('DEBUG: Marked ' + creepsToRemove + ' HAULER creeps to be removed');
                }
            }
        } else {
            p_creeps.forEach(creep => {
                creep.memory.ticksToDie = undefined;
            });
        }
    }
}

module.exports = creepTasks;