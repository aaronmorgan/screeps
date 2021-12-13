var roleHarvester = {

    /** @param {Creep} p_creep **/
    run: function (p_creep) {
        let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);

        if (p_creep.store.getFreeCapacity() > 0) {
            if (_.isEmpty(p_creep.room.memory.sources)) {
                return;
            }

            let source = Game.getObjectById(p_creep.room.memory.sources[0].id);

            if (p_creep.harvest(source) == ERR_NOT_IN_RANGE) {
                p_creep.moveTo(source, {
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

                    p_creep.say('⚡ ' + creepFillPercentage + '%')
                }
            }
        }
    }
};

module.exports = roleHarvester;