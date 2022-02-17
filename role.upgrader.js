var roleUpgrader = {

  /** @param {Creep} p_creep **/
  run: function (p_creep) {
    // Drop all carried resources before we die.
    if (p_creep.ticksToLive < 2) {
      console.log('💡 INFO: ticksToLive=' + p_creep.ticksToLive + ', dropping resources...')
      for (const resourceType in p_creep.carry) {
        p_creep.drop(resourceType);
      }
    }

    if (p_creep.memory.upgrading && p_creep.store[RESOURCE_ENERGY] == 0) {
      p_creep.memory.upgrading = false;
      p_creep.say('🔌 withdraw');
    }

    if (!p_creep.memory.upgrading && p_creep.store.getFreeCapacity() == 0) {
      p_creep.memory.upgrading = true;
      p_creep.say('⚒️ upgrade');
    }

    if (p_creep.memory.upgrading) {
      if (p_creep.upgradeController(p_creep.room.controller) == ERR_NOT_IN_RANGE) {
        p_creep.moveTo(p_creep.room.controller, {
          visualizePathStyle: {
            stroke: '#4189d0'
          }
        });
      }
    } else {
      const targets = _.filter(p_creep.room.structures().all, (structure) => {
        return (
            structure.structureType == 'container' ||
            structure.structureType == 'storage') &&
          structure.store.getUsedCapacity(RESOURCE_ENERGY) >= p_creep.store.getFreeCapacity(); // TODO: Should this getFreeCapacity check be here?
      });

      if (targets.length > 0) {
        const dropSite = p_creep.pos.findClosestByPath(targets);

        if (p_creep.withdraw(dropSite, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          p_creep.moveTo(dropSite, {
            visualizePathStyle: {
              stroke: '#3370ac'
            }
          });
        }
      } else {
        if (p_creep.room.controller >= 3) {
            return; // Test upgraders not using energy sources and getting in the way of harvesters and haulers.
        }

        let sources = p_creep.room.sources();
        let nearestSource = p_creep.pos.findClosestByPath(sources);

        if (p_creep.harvest(nearestSource) == ERR_NOT_IN_RANGE) {
          p_creep.moveTo(nearestSource, {
            visualizePathStyle: {
              stroke: '#3370ac'
            }
          });
        }
      }
    }
  }
};

module.exports = roleUpgrader;