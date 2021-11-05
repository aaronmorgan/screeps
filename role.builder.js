var roleBuilder = {

    /** @param {Creep} creep **/
    run: function (creep) {

        if (creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('harvesting');
        }
        if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
            creep.say('building');
        }

        if (creep.memory.building) {
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                targets.sort(function (a, b) { return a.progress > b.progress ? -1 : 1 });
                if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], { reusePath: 10 });
                }
            }
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_CONTAINER) &&
                        structure.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity();
                }
            });
            if (targets.length > 0) {
                var dropSite = creep.pos.findClosestByPath(targets);


                console.log('Upgrader target source:', dropSite);
                if (creep.withdraw(dropSite, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(dropSite, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            else {
                let sources = creep.room.find(FIND_SOURCES);
                let nearestSource = creep.pos.findClosestByPath(sources);

                if (creep.harvest(nearestSource) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(nearestSource, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }
        }
    }
};

module.exports = roleBuilder;
