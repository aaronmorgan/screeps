var roleHauler = {

  /** @param {Creep} creep **/
  run: function (creep) {
    // TODO: Determine time to live and whether it's better to suicide while empty than with full energy store.

    if (creep.store.getFreeCapacity() == 0) {
      creep.memory.harvesting = false;
    }

    let creepFillPercentage = Math.round(creep.store.getUsedCapacity() / creep.store.getCapacity() * 100);

    if (creepFillPercentage < 30 && creep.memory.harvesting == true) {
      creep.say('⚡ ' + creepFillPercentage + '%');

      let largestDroppedEnergy = _.last(creep.room.droppedResources());

      if (creep.memory.targetedDroppedEnergy.id == 0) {
        console.log('⛔ Error: Hauler ' + creep.name + ' has no target set');

        creep.memory.targetedDroppedEnergy.id = largestDroppedEnergy.id;
        creep.memory.targetedDroppedEnergy.pos = largestDroppedEnergy.pos;
      }

      const a = Game.getObjectById(creep.memory.targetedDroppedEnergy.id);

      if (!a || !largestDroppedEnergy) {
        console.log('⚠️ Warning: Previous target no longer exists');

        const newTarget = creep.room.droppedResources()[0];

        console.log('newTarget', JSON.stringify(newTarget));

        if (!newTarget) {
          console.log('⚠️ Warning: NO NEW TARGET');
          console.log('creep.room.droppedResources()', JSON.stringify(creep.room.droppedResources()))

          return;
        }
        creep.memory.targetedDroppedEnergy.id = newTarget.id;
        creep.memory.targetedDroppedEnergy.pos = newTarget.pos;
      }

      //if (largestDroppedEnergy && creep.pickup(largestDroppedEnergy) == ERR_NOT_IN_RANGE) {
      //      if (creep.pickup(largestDroppedEnergy) == ERR_NOT_IN_RANGE) {
      if (creep.pickup(a) == ERR_NOT_IN_RANGE) {
        creep.say('⚡' + creepFillPercentage + '%');

        creep.memory.harvesting = true;

        if (creep.memory.targetedDroppedEnergy.id != largestDroppedEnergy.id) {

          //   creep.say('⚡ new');
          //     creep.moveTo(largestDroppedEnergy, {
          //       visualizePathStyle: {
          //         stroke: '#ffaa00'
          //       }
          //     });
          //  } else {


          //if (creep.memory.targetedDroppedEnergy.pos == largestDroppedEnergy.pos) { 
          //   let b = creep.memory.targetedDroppedEnergy.pos;
          //   let c = largestDroppedEnergy.pos;
          // if (_.isEqual(b, c)) { 
          //   console.log('same')
          // }


          // if (!creep.memory.targetedDroppedEnergy.pos) {
          //   creep.memory.targetedDroppedEnergy.pos = new RoomPosition(1, 1, creep.room.name);
          //   console.log('WTF')
          // }

          // if (creep.memory.targetedDroppedEnergy.id != largestDroppedEnergy.id) { 
          //   // creep.moveTo(creep.memory.targetedDroppedEnergy.pos, {
          //   //   visualizePathStyle: {
          //   //     stroke: '#ffaa00'
          //   //   }
          //   // });


          //   console.log('here')

          //   //return;
          //  }

          // Creep has suddenly changed target due to the targed energy no longer being the 'largest'.
          // if (creep.memory.targetedDroppedEnergy.id != largestDroppedEnergy.id) {
          //   console.log('Found new energy that isn\'t current target')
          // }

          // ...instead check the new target against the old and determine the closest.
          const targets = [{
              id: largestDroppedEnergy.id,
              pos: creep.room.getPositionAt(largestDroppedEnergy.pos.x, largestDroppedEnergy.pos.y)
            },
            {
              id: creep.memory.targetedDroppedEnergy.id,
              pos: creep.room.getPositionAt(creep.memory.targetedDroppedEnergy.pos.x, creep.memory.targetedDroppedEnergy.pos.y)
            }
          ];

          // const targets = [
          //     creep.room.getPositionAt(largestDroppedEnergy.pos.x, largestDroppedEnergy.pos.y),
          //    creep.room.getPositionAt(creep.memory.targetedDroppedEnergy.pos.x, creep.memory.targetedDroppedEnergy.pos.y)
          // ];

          //console.log('targets', JSON.stringify(targets));

          const inRangeTargets = creep.pos.findClosestByPath(targets.map(x => x.pos))
          //const inRangeTargets = creep.pos.findInRange(targets, 10);

          //  console.log('target in range', JSON.stringify(inRangeTargets));



          //console.log('largestDroppedEnergy', JSON.stringify(largestDroppedEnergy));

          let energyTarget = targets.find(x => x.pos.x == inRangeTargets.x && x.pos.y == inRangeTargets.y)

          creep.memory.targetedDroppedEnergy = {
            id: energyTarget.id,
            //            roomPosition: new RoomPosition(largestDroppedEnergy.pos.x, largestDroppedEnergy.pos.y, creep.room.name)
            pos: energyTarget.pos
          };


        }

        const source = Game.getObjectById(creep.memory.targetedDroppedEnergy.id);

        creep.moveTo(source, {
          visualizePathStyle: {
            stroke: '#ffaa00'
          }
        });

        //             }

      }
    } else {
      creep.memory.harvesting = false;
      creep.say('⚡ ' + creepFillPercentage + '%');

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