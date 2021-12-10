var roleHarvester = {

    createHarvester: function (p_spawn, p_name, p_body) {
        let name = p_name + Game.time;
        console.log('Spawning new HARVESTER: ' + name + ', [' + p_body + ']');

        p_spawn.spawnCreep(p_body, name, {
            memory: {
                role: 'harvester'
            }
        });
    },

    /** @param {Creep} p_creep **/
    run: function (p_creep) {
        let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);

        if (p_creep.store.getFreeCapacity() > 0) {
            if (p_creep.harvest(p_creep.room.memory.sources[0]) == ERR_NOT_IN_RANGE) {
                p_creep.moveTo(p_creep.room.memory.sources[0], {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
                p_creep.say('⚡ ' + creepFillPercentage + '%')
            }
        } else {
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
                    p_creep.moveTo(targets[0], {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });

                    p_creep.say('⚡ mining')
                }
            }
        }
    }
};

module.exports = roleHarvester;