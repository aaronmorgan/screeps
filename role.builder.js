var roleBuilder = {

  /** @param {Creep} creep **/
  run: function(creep) {

    if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
          creep.memory.building = false;
          creep.say('🔄 harvest');
    }
    if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
        creep.memory.building = true;
        creep.say('🚧 build');
    }

    if(creep.memory.building) {
        var repTarget = creep.room.find(FIND_STRUCTURES, {filter: function(object){ return (object.structureType === STRUCTURE_ROAD || object.structureType === STRUCTURE_CONTAINER) && (object.hits < object.hitsMax); } });
        
        if (repTarget.length) {
            if(creep.repair(repTarget[0]) == ERR_NOT_IN_RANGE) {
                creep.say('🔄 repair');
                  creep.moveTo(repTarget[0], {visualizePathStyle: {stroke: '#ffffff'}});
              }
            
            return;
        }
        
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        
          if(targets.length) {
              if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                  creep.say('🔄 build');
                  creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
              }
          }
    }
    else {
        var nearestDroppedSource = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);

        if (nearestDroppedSource && creep.pickup(nearestDroppedSource) == ERR_NOT_IN_RANGE) {
            creep.say('🔄 pickup');
            creep.moveTo(nearestDroppedSource, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        else {
            var sources = creep.room.find(FIND_SOURCES);
        
            if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.say('🔄 harvest');
                creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
}
    }
};

module.exports = roleBuilder;