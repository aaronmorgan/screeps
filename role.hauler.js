require('prototype.room')();

var roleHauler = {

  /** @param {Creep} p_creep **/
  run: function (p_creep) {
    if (p_creep.memory.ticksToDie) {
      //     p_creep.memory.ticksToDie -= 1;

      if (p_creep.memory.ticksToDie <= 0) {
        console.log('💀 Removing HAULER creep ' + p_creep.id)

        // Drop all resources.
        for (const resourceType in p_creep.carry) {
          p_creep.drop(resourceType);
        }

        p_creep.suicide();
      }
    }

    // TODO: Determine time to live and whether it's better to suicide while empty than with full energy store.

    if (p_creep.store.getFreeCapacity() == 0) {
      p_creep.memory.harvesting = false;
    }

    let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);

    if (creepFillPercentage < 60 && p_creep.memory.harvesting == true) {
      p_creep.say('⚡ ' + creepFillPercentage + '%');

      let largestDroppedEnergy = _.last(p_creep.room.droppedResources());

      if (p_creep.memory.targetedDroppedEnergy.id == 0) {
        console.log('ℹ️ INFO: Hauler aquiring new dropped energy target...');


        p_creep.memory.targetedDroppedEnergy.id = largestDroppedEnergy.id;
        p_creep.memory.targetedDroppedEnergy.pos = largestDroppedEnergy.pos;
      }

      const targetedDroppedEnergy = Game.getObjectById(p_creep.memory.targetedDroppedEnergy.id);

      if (!targetedDroppedEnergy || !largestDroppedEnergy) {
        const newTarget = p_creep.room.droppedResources()[0];

        if (!newTarget) {
          console.log('⚠️ Warning: NO NEW TARGET');

          return;
        }

        p_creep.memory.targetedDroppedEnergy.id = newTarget.id;
        p_creep.memory.targetedDroppedEnergy.pos = newTarget.pos;
      }

      if (p_creep.pickup(targetedDroppedEnergy) == ERR_NOT_IN_RANGE) {
        p_creep.say('⚡' + creepFillPercentage + '%');

        if (p_creep.memory.targetedDroppedEnergy.id != largestDroppedEnergy.id) {
          // ...instead check the new target against the old and determine the closest.
          const targets = [{
              id: largestDroppedEnergy.id,
              pos: p_creep.room.getPositionAt(largestDroppedEnergy.pos.x, largestDroppedEnergy.pos.y)
            },
            {
              id: p_creep.memory.targetedDroppedEnergy.id,
              pos: p_creep.room.getPositionAt(p_creep.memory.targetedDroppedEnergy.pos.x, p_creep.memory.targetedDroppedEnergy.pos.y)
            }
          ];

          const inRangeTargets = p_creep.pos.findClosestByPath(targets.map(x => x.pos));

          if (!inRangeTargets) {
            console.log('⚠️ Warning: NO IN RANGE TARGETS FOUND');
            return;
          }

          let energyTarget = targets.find(x => x.pos.x == inRangeTargets.x && x.pos.y == inRangeTargets.y)

          p_creep.memory.targetedDroppedEnergy = {
            id: energyTarget.id,
            pos: energyTarget.pos
          };
        }

        const source = Game.getObjectById(p_creep.memory.targetedDroppedEnergy.id);

        if (source.energy < p_creep.store.getFreeCapacity()) {
          p_creep.memory.targetedDroppedEnergy = {
            id: largestDroppedEnergy.id,
            pos: largestDroppedEnergy.pos
          };
        }

        p_creep.moveTo(source, {
          visualizePathStyle: {
            stroke: '#ffaa00'
          }
        });
      }
    } else {
      p_creep.say('🚚 ' + creepFillPercentage + '%');

      let structures = p_creep.room.structures();

      let targets = structures.spawn.filter(structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

      if (!targets || targets.length == 0) {
        targets = structures.tower.filter(structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
      }

      if (!targets || targets.length == 0) {
        targets = structures.extension.filter(structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
      }

      if (!targets || targets.length == 0) {
        targets = _.filter(structures.all, (structure) => {
          return (
              structure.structureType == 'container' ||
              structure.structureType == 'storage') &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        });
      };

      const dropSite = p_creep.pos.findClosestByPath(targets);

      if (p_creep.transfer(dropSite, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        //creep.say('⚡  transfer ');
        p_creep.moveTo(dropSite, {
          visualizePathStyle: {
            stroke: '#ffffff'
          }
        });
      }

      if (p_creep.store.getUsedCapacity() == 0) {
        p_creep.memory.harvesting = true;
      }
    }
  }
};

module.exports = roleHauler;