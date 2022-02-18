require('prototype.creep')();

var roleBuilder = {

    /** @param {Creep} p_creep **/
    run: function (p_creep) {
        p_creep.checkTicksToDie();
        p_creep.checkTicksToLive();

        if (p_creep.memory.building && p_creep.carry.energy == 0) {
            p_creep.memory.building = false;
            p_creep.say('🔌 withdraw');
        }
        if (!p_creep.memory.building && p_creep.carry.energy == p_creep.carryCapacity) {
            p_creep.memory.building = true;
            p_creep.say('🔨 build');
        }

        if (p_creep.memory.building) {
            let targets = p_creep.room.constructionSites();
            if (targets.length) {
                targets.sort(function (a, b) {
                    return a.progress > b.progress ? -1 : 1
                });
                if (p_creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    p_creep.moveTo(targets[0], {
                        reusePath: 10,
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            }
        } else {
            let targets = _.filter(p_creep.room.structures().all, (structure) => {
                return (structure.structureType == 'container' ||
                        structure.structureType == 'storage') &&
                    //structure.structureType == 'extension') &&
                    structure.store.getUsedCapacity(RESOURCE_ENERGY) >= p_creep.store.getFreeCapacity();
            });

            if (targets.length > 0) {
                const dropSite = p_creep.pos.findClosestByPath(targets);

                if (p_creep.withdraw(dropSite, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    p_creep.say('🔌 withdraw');
                    return p_creep.moveTo(dropSite, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            }

            const resourceEnergy = p_creep.room.droppedResources();
            const droppedResources = p_creep.pos.findClosestByPath(resourceEnergy.map(x => x.pos))

            if (droppedResources) {
                const energyTarget = resourceEnergy.find(x => x.pos.x == droppedResources.x && x.pos.y == droppedResources.y)

                if (!_.isEmpty(energyTarget)) {
                    let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);

                    let source = Game.getObjectById(energyTarget.id);

                    if (p_creep.pickup(source) == ERR_NOT_IN_RANGE) {
                        p_creep.say('⛏ pickup');
                        p_creep.moveTo(source, {
                            visualizePathStyle: {
                                stroke: '#ffaa00'
                            }
                        });
                        p_creep.say('⚡ ' + creepFillPercentage + '%')
                    }

                    return;
                }
            }

            // Local energy sources
            let sources = p_creep.room.sources();
            let nearestSource = p_creep.pos.findClosestByPath(sources);

            if (p_creep.harvest(nearestSource) == ERR_NOT_IN_RANGE) {
                p_creep.memory.harvesting = true;
                p_creep.say('⛏ harvest ');
                return p_creep.moveTo(nearestSource, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
            }
        }
    }
}

module.exports = roleBuilder;