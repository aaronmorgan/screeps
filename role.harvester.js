var roleHarvester = {

    /** @param {Creep} p_creep **/
    run: function (p_creep) {
        // Drop all carried resources before we die.
        if (p_creep.ticksToLive < 2) {
            console.log('💡 INFO: ticksToLive=' + p_creep.ticksToLive + ', dropping resources...')
            for (const resourceType in p_creep.carry) {
                p_creep.drop(resourceType);
            }
        }

        let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);

        if (creepFillPercentage < 30) {

            // Cater for the siuation where the creep wanders into another room.
            if (_.isEmpty(p_creep.room.memory.sources)) {
                return;
            }

            // Favor dropped energy first so havesters can act as haulers to the dropminers.
            const resourceEnergy = p_creep.room.droppedResources();
            const droppedResources = p_creep.pos.findClosestByPath(resourceEnergy.map(x => x.pos))

            let energyTarget = undefined;

            if (droppedResources) {
                energyTarget = resourceEnergy.find(x => x.pos.x == droppedResources.x && x.pos.y == droppedResources.y)
            }

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
            const targets = _.filter(p_creep.room.structures().all, (structure) => {
                return (
                        structure.structureType == 'extension' ||
                        structure.structureType == 'spawn' ||
                        structure.structureType == 'tower') &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
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