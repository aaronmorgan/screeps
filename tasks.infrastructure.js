const {
  EXIT_CODE,
  structure
} = require('game.constants');

const {
  jobs
} = require('tasks.infrastructure.jobs');

var infrastructureTasks = {


  processJobs: function (p_room, p_jobs) {
    const spawn = p_room.structures().spawn[0];

    for (let i = 0; i < p_jobs.length; i++) {
      const job = p_jobs[i];

      let specialSite = false;

      let x = spawn.pos.x + job.x;
      let y = spawn.pos.y + job.y;

      if (specialSite) {
        x = job.x;
        y = job.y;
      }

      // if (job.type == 'rcl.container') {
      //   // RCL adjacent container.
      //   const path = spawn.pos.findPathTo(p_room.controller.pos, {
      //     ignoreDestructibleStructures: true,
      //     ignoreCreeps: true
      //   });

      //   if (path && path.length > 15) { // TODO This location positioning may need tweaking over time.
      //     // Far enough away for Upgraders to have it at their backs while working
      //     // but not so close that it gets in the way or too far that they have to 
      //     // travel unnecessarily.

      //     // TODO check that all surrounding tiles are empty and if not move 
      //     // further away from the RCL until condition satisfied/
      //     let pos = path[path.length - 7];

      //     //p_room.createConstructionSite(pos.x, pos.y, structure.STRUCTURE_CONTAINER);
      //     job = {
      //       type: structure.STRUCTURE_CONTAINER,
      //       x: pos.x,
      //       y: pos.y
      //     };

      //     specialSite = true;
      //   }
      // }
      // if (currentRCLLevel >= 3) {
      //   p_room.sources().forEach(pos => {
      //     let path = spawn.pos.findPathTo(pos, {
      //       maxOps: 200,
      //       ignoreCreeps: true
      //     });
      //     if (path.length) {
      //       //console.log('path', JSON.stringify(path));
      //        //path.forEach(x => {
      //       //   p_room.createConstructionSite(pos.x, pos.y, structure.STRUCTURE_ROAD);
      //       // });

      //       job = {
      //         type: structure.STRUCTURE_ROAD,
      //         x: pos.x,
      //         y: pos.y
      //       };
      //     }

      //     specialSite = true;
      //   });

      //     }
      //   break;
      //     }




      const tileObjects = p_room.lookAt(x, y).filter(function (x) {
        return (
          x.type != 'resource' &&
          x.type != 'energy' &&
          x.type != 'ruin' &&
          x.type != 'creep');
      });

      if (tileObjects.length < 3 &&
        (tileObjects[0].type == 'terrain' && tileObjects[0].terrain != 'wall')) {

        let result = p_room.createConstructionSite(x, y, job.type);

        switch (result) {
          case OK: {
            // Only set down one construction site at a time.
            return;
          }
          default: {
            console.log('⛔ Error: calling createConstructionSite, ' + EXIT_CODE[result] + ', job=', JSON.stringify(job) + ', x=' + job.x + ', y=' + job.y);
            return;
          }
        }
      } else {
        let tile = tileObjects[0];

        if (tile.type == 'constructionSite') {
          continue;
        }
        //  console.log('tile', JSON.stringify(tile));
        if (!tile.structure) {
          console.log('⛔ Error: ' + JSON.stringify(tile));

          // Try the next templated job...
          continue;
        }

        if (tile.structure.structureType != job.type) {
          console.log('⚠️ WARNING: Position x: ' + tile.structure.pos.x + ', y: ' + tile.structure.pos.y + ', is already allocated with a ' + tile.structure.structureType);
        }
      }
    }
  },

  // Doesn't use a traditional queue or any cache but instead looks at current construction site objects
  // to determine whether to continue or not.
  buildLinks: function (p_room) {
    // Only enqueue one construction site at a time.
    const constructionSites = p_room.constructionSites();
    if (constructionSites.length > 0) {
      return;
    }

    // Periodically check whether we need to rebuild anything by resetting the construction job level.
    // This could be further improved to increase the frequency to per tick during times of war.
    // if (Game.time % (400 / p_room.controller.level) == 0) {
    //   console.log('⚠️ Information: Resetting construction queue index to 0');
    //   index = 0;
    // }

    this.processJobs(p_room, jobs['RCL_' + p_room.controller.level].jobs);
  }
}

module.exports = infrastructureTasks;