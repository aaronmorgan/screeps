var roleHarvester = {

    createHarvester: function (p_spawn, p_name, p_body) {
        let name = p_name + Game.time;
        console.log('Spawning new harvester: ' + name + ', [' + p_body + ']');

        p_spawn.spawnCreep(p_body, name, { memory: { role: 'harvester' } });
    },

    /** @param {Creep} creep **/
    harvest: function (p_creep) {
        if (p_creep.store.getFreeCapacity() > 0) {
            // TODO Store sources in Memory as they're immutable.
            let sources = p_creep.room.find(FIND_SOURCES);

            if (p_creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                p_creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
        else {
            let targets = p_creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if (targets.length > 0) {
                if (p_creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
    }
};

module.exports = roleHarvester;
