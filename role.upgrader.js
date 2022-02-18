require('prototype.creep')();

var roleUpgrader = {

  /** @param {Creep} p_creep **/
  run: function (p_creep) {
    p_creep.checkTicksToLive();

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

        const resourceEnergy = p_creep.room.droppedResources();
        const droppedResources = p_creep.pos.findClosestByPath(resourceEnergy.map(x => x.pos))

        if (droppedResources) {
          const energyTarget = resourceEnergy.find(x => x.pos.x == droppedResources.x && x.pos.y == droppedResources.y)

          if (!_.isEmpty(energyTarget)) {
            let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);

            source = Game.getObjectById(energyTarget.id);

            if (p_creep.pickup(source) == ERR_NOT_IN_RANGE) {
              p_creep.say('⛏ pickup');
              p_creep.moveTo(source, {
                visualizePathStyle: {
                  stroke: '#ffaa00'
                }
              });

              p_creep.say('⚡ ' + creepFillPercentage + '%')
              return;
            }
          }
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