var roleHauler = {

  /** @param {Creep} creep **/
  run: function (creep) {
    if (creep.store.getFreeCapacity() > 0) {
        var droppedResources = creep.room.find(FIND_DROPPED_RESOURCES);
        
        
        var sorted = _.sortBy(droppedResources, 'energy');
//        console.log("dr", sorted[sorted.length - 1].energy) // Do this better.
        //var nearestDroppedSource = creep.pos.findClosestByPath(sorted[sorted.length - 1]);
        
        let nearestDroppedSource = sorted[sorted.length - 1];
        

        if (nearestDroppedSource && creep.pickup(nearestDroppedSource) == ERR_NOT_IN_RANGE) {
          creep.say('⚡  pickup ');
          creep.moveTo(nearestDroppedSource, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    }
    else {
      var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_EXTENSION ||
            structure.structureType == STRUCTURE_SPAWN ||
            structure.structureType == STRUCTURE_CONTAINER ||
            structure.structureType == STRUCTURE_TOWER) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
      });
    
        console.log('targets', targets);

      if (targets.length > 0) {
          var dropSite = creep.pos.findClosestByPath(targets);
          
        if (creep.transfer(dropSite, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(dropSite, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
    }
  }
};

module.exports = roleHauler;