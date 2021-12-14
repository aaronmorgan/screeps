var roleHauler = {

  /** @param {Creep} p_creep **/
  run: function (p_creep) {
    // TODO: Determine time to live and whether it's better to suicide while empty than with full energy store.

    if (p_creep.store.getFreeCapacity() == 0) {
      p_creep.memory.harvesting = false;
    }

    let creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);

    if (p_creep.memory.harvesting == true) {
      p_creep.say('⚡ ' + creepFillPercentage + '%');

      let largestDroppedEnergy = _.last(p_creep.room.droppedResources());

      if (p_creep.memory.targetedDroppedEnergy.id == 0) {
        console.log('⛔ Error: Hauler ' + p_creep.name + ' has no target set');

        p_creep.memory.targetedDroppedEnergy.id = largestDroppedEnergy.id;
        p_creep.memory.targetedDroppedEnergy.pos = largestDroppedEnergy.pos;
      }

      const targetedDroppedEnergy = Game.getObjectById(p_creep.memory.targetedDroppedEnergy.id);

      if (!targetedDroppedEnergy || !largestDroppedEnergy) {
        //console.log('⚠️ Warning: Previous target no longer exists');

        const newTarget = p_creep.room.droppedResources()[0];
        //console.log('newTarget', JSON.stringify(newTarget));

        if (!newTarget) {
          console.log('⚠️ Warning: NO NEW TARGET');
          //console.log('creep.room.droppedResources()', JSON.stringify(creep.room.droppedResources()))

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

          // if (creepFillPercentage > 60) {
          //   let spawn = p_creep.room.find(FIND_MY_STRUCTURES, {
          //     filter: (structure) => {
          //       return structure.structureType == STRUCTURE_SPAWN;
          //     }
          //   })[0];

          //   const b = p_creep.pos.findClosestByPath([{
          //       id: spawn.id,
          //       pos: spawn.pos
          //     },
          //     {
          //       id: inRangeTargets.id,
          //       pos: {
          //         x: inRangeTargets.x,
          //         y: inRangeTargets.y
          //       }
          //     }
          //   ].map(x => x.pos));

          //   if (b.id == spawn.id) {
          //     p_creep.memory.harvesting = false;
          //     return;
          //   }
          // }


          let energyTarget = targets.find(x => x.pos.x == inRangeTargets.x && x.pos.y == inRangeTargets.y)

          p_creep.memory.targetedDroppedEnergy = {
            id: energyTarget.id,
            pos: energyTarget.pos
          };
        }

        const source = Game.getObjectById(p_creep.memory.targetedDroppedEnergy.id);

        p_creep.moveTo(source, {
          visualizePathStyle: {
            stroke: '#ffaa00'
          }
        });
      }
    } else {
      p_creep.say('⚡ ' + creepFillPercentage + '%');

      let structures = p_creep.room.find(FIND_STRUCTURES);

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

      let dropSite = p_creep.pos.findClosestByPath(targets);

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