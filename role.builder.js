var roleBuilder = {

    /** @param {Creep} p_creep **/
    run: function (p_creep) {
        if (p_creep.memory.ticksToDie) {
            //        p_creep.memory.ticksToDie -= 1;

            if (p_creep.memory.ticksToDie <= 0) {
                console.log('💀 Removing BUILDER creep ' + p_creep.id)

                // Drop all resources.
                for (const resourceType in p_creep.carry) {
                    p_creep.drop(resourceType);
                }

                p_creep.suicide();
            }
        }

        if (p_creep.memory.building && p_creep.carry.energy == 0) {
            p_creep.memory.building = false;
            p_creep.say('🔌 withdraw');
        }
        if (!p_creep.memory.building && p_creep.carry.energy == p_creep.carryCapacity) {
            p_creep.memory.building = true;
            p_creep.memory.harvesting = false;
            //            creep.say('🚧 building');
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
                        structure.structureType == 'storage' ||
                        structure.structureType == 'extension') &&
                    structure.store.getUsedCapacity(RESOURCE_ENERGY) >= p_creep.store.getFreeCapacity();
            });

            if (!p_creep.memory.harvesting && targets.length > 0) {
                const dropSite = p_creep.pos.findClosestByPath(targets);

                if (p_creep.withdraw(dropSite, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    p_creep.say('🔌 withdraw ');
                    return p_creep.moveTo(dropSite, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
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
};

module.exports = roleBuilder;