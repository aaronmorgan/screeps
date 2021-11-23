var roleHauler = {

  createHauler: function (p_spawn, p_name, p_body) {
    let name = p_name + Game.time;

    console.log('Spawning new hauler: ' + name + ', [' + p_body + ']');
    p_spawn.spawnCreep(p_body, name, {
      memory: {
        role: 'hauler'
      }
    });

    Memory.buildingHauler = false;
  },

  /** @param {Creep} creep **/
  run: function (creep) {
    // TODO: Determine time to live and whether it's better to suicide while empty than with full energy store.

    if (creep.store.getFreeCapacity() == 0) {
      creep.memory.harvesting = false;
    }

    if (creep.store.getFreeCapacity() > 0 && creep.memory.harvesting == true) {
      let droppedResources = creep.room.find(FIND_DROPPED_RESOURCES);
      let sorted = _.sortBy(droppedResources, 'energy');
      let nearestDroppedSource = sorted[sorted.length - 1];

      if (nearestDroppedSource && creep.pickup(nearestDroppedSource) == ERR_NOT_IN_RANGE) {
        creep.memory.harvesting = true;

        //creep.say('⚡  pickup ');
        creep.moveTo(nearestDroppedSource, {
          visualizePathStyle: {
            stroke: '#ffaa00'
          }
        });
      }
    } else {
      creep.memory.harvesting = false;

      let structures = creep.room.find(FIND_STRUCTURES);

      let targets = structures.filter(function (structure) {
        return (
            structure.structureType == STRUCTURE_TOWER) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      });

      if (!targets || targets.length == 0) {
        targets = structures.filter(function (structure) {
          return (
              structure.structureType == STRUCTURE_SPAWN ||
              structure.structureType == STRUCTURE_EXTENSION) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        });
      }

      if (!targets || targets.length == 0) {
        targets = structures.filter(function (structure) {
          return (
              structure.structureType == STRUCTURE_STORAGE ||
              structure.structureType == STRUCTURE_CONTAINER) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        });
      }

      let dropSite = creep.pos.findClosestByPath(targets);

      if (creep.transfer(dropSite, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        //creep.say('⚡  transfer ');
        creep.moveTo(dropSite, {
          visualizePathStyle: {
            stroke: '#ffffff'
          }
        });
      }

      if (creep.store.getUsedCapacity() == 0) {
        creep.memory.harvesting = true;
      }
    }
  }
};

module.exports = roleHauler;