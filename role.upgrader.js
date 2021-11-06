var roleUpgrader = {

  /** @param {Creep} creep **/
  run: function (creep) {
    if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
      creep.memory.upgrading = false;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
      creep.memory.upgrading = true;
      creep.say('⚡ upgrade');
    }

    if (creep.memory.upgrading) {
      if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    }
    else {
      var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_CONTAINER ||
            structure.structureType == STRUCTURE_STORAGE) &&
            structure.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity();
        }
      });
      if (targets.length > 0) {
        var dropSite = creep.pos.findClosestByPath(targets);

        // console.log('Upgrader target source:', dropSite);
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

module.exports = roleUpgrader;
