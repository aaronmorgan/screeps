var roleHarvester = {

    /** @param {Creep} p_creep **/
    run: function (p_creep) {
        let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);

        if (creepFillPercentage < 30) {

            // Cater for the siuation where the creep wanders into another room.
            if (_.isEmpty(p_creep.room.memory.sources)) {
                return;
            }

            let resourceEnergy = p_creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: (o) => o.resourceType === RESOURCE_ENERGY
            });

            let droppedResources = p_creep.pos.findClosestByPath(resourceEnergy.map(x => x.pos))
            let energyTarget = resourceEnergy.find(x => x.pos.x == droppedResources.x && x.pos.y == droppedResources.y)

            //console.log('droppedResources', JSON.stringify(energyTarget));
            //let droppedResources = _.sortBy(resourceEnergy, x => x.energy);
            let source = undefined;

            if (!_.isEmpty(energyTarget)) {
                source = Game.getObjectById(energyTarget.id);

                if (p_creep.pickup(source) == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(source, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                    p_creep.say('⚡ ' + creepFillPercentage + '%')
                }

            } else {
                source = Game.getObjectById(p_creep.room.memory.sources[0].id);

                //console.log('mine');
                if (p_creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(source, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                    p_creep.say('⚡ ' + creepFillPercentage + '%')
                }
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