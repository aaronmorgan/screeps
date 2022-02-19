const {
  EXIT_CODE
} = require('game.constants');

var infrastructureTasks = {

  // Doesn't use a traditional queue or any cache but instead looks at current construction site objects
  // to determine whether to continue or not.
  buildLinks: function (p_room) {
    const constructionSites = p_room.constructionSites();

    if (constructionSites.length > 0) {
      //console.log('⚠️ Information: Room already has construction sites present');
      return;
    }

    const currentRCLLevel = p_room.controller.level;
    const spawn = p_room.structures().spawn[0];
    let index = 0; // p_room.controller.level;

    // Periodically check whether we need to rebuild anything by resetting the construction job level.
    // This could be further improved to increase the frequency to per tick during times of war.
    // if (Game.time % (400 / p_room.controller.level) == 0) {
    //   console.log('⚠️ Information: Resetting construction queue index to 0');
    //   index = 0;
    // }

    for (let i = index; i < constructionJobsTemplate.length; i++) {
      const job = constructionJobsTemplate[i];
      // console.log("Processing job: ", JSON.stringify(job));

      if (job.rclLevel > currentRCLLevel) {
        break;
      }

      const x = spawn.pos.x + job.x;
      const y = spawn.pos.y + job.y;

      const tileObjects = p_room.lookAt(x, y).filter(function (x) {
        return (
          x.type != 'resource' &&
          x.type != 'energy' &&
          x.type != 'ruin' &&
          x.type != 'creep');
      });

      if (tileObjects.length < 3 &&
        (tileObjects[0].type == 'terrain' && tileObjects[0].terrain != 'wall')) {

        //console.log('terrain', JSON.stringify(tileObjects));

        // switch (job.type) {
        //   // Build a container near the RCL
        //   case 'rcl.container': {
        //     const path = p_room.findPath(spawn.pos, p_room.controller.pos, {
        //       ignoreDestructibleStructures: true,
        //       ignoreCreeps: true
        //     });

        //     if (path) {
        //       console.log('tileobjects', JSON.stringify(tileObjects));
        //       console.log('Information: Found a path to the RCL');

        //       // Far enough away for Upgraders to have it at their backs while working
        //       // but not so close that it gets in the way or too far that they have to 
        //       // travel unnecessarily.
        //       // TODO check that all surrounding tiles are empty and if not move 
        //       // further away from the RCL until condition satisfied/
        //       let newPos = path[path.length - 5];
        //       console.log('newPos', JSON.stringify(newPos));
        //       job.type = 'container';
        //       x = newPos.x;
        //       y = newPos.y;

        //       console.log(JSON.stringify(job))

        //     } else {
        //       console.log('⛔ Error: calling createConstructionSite for rcl.container, ' + EXIT_CODE[result]);
        //     }
        //   }
        // }

        let result = p_room.createConstructionSite(x, y, job.type);

        switch (result) {
          case OK: {
            // Only set down one construction site at a time.
            console.log('OK');
            return;
          }
          default: {
            console.log('⛔ Error: calling createConstructionSite, ' + EXIT_CODE[result] + ', job=', JSON.stringify(job) + ', x=' + job.x + ', y=' + job.y);
            continue;
          }
        }
      } else {
        let tile = tileObjects[0];

        if (!tile.structure) {
          console.log('⛔ Error: ' + JSON.stringify(tile));

          // Try the next templated job...
          continue;
        }

        if (tile.structure.structureType != job.type) {
          console.log('⚠️ WARNING: Position x: ' + tile.structure.pos.x + ', y: ' + tile.structure.pos.y + ', is already allocated with a ' + tile.structure.structureType);
        }
      }
    };
  },
}

const constructionJobsTemplate = [
  // Level 0: Roads, 5 Containers
  {
    rclLevel: 0,
    type: "container",
    x: 4,
    y: 0
  },
  // Level 2
  {
    rclLevel: 2,
    type: "extension",
    x: 1,
    y: -2
  },
  {
    rclLevel: 2,
    type: "extension",
    x: 1,
    y: -1
  },
  {
    rclLevel: 2,
    type: "extension",
    x: 2,
    y: -2
  },
  {
    rclLevel: 2,
    type: "extension",
    x: 2,
    y: -1
  },
  {
    rclLevel: 2,
    type: "extension",
    x: 3,
    y: -1
  },
  {
    rclLevel: 2,
    type: "container",
    x: -4,
    y: 0
  },
  // Level 3
  {
    rclLevel: 3,
    type: "tower",
    x: 3,
    y: -2
  },
  {
    rclLevel: 2,
    type: "extension",
    x: -1,
    y: -2
  },
  {
    rclLevel: 2,
    type: "extension",
    x: -1,
    y: -1
  },
  {
    rclLevel: 2,
    type: "extension",
    x: -2,
    y: -2
  },
  {
    rclLevel: 2,
    type: "extension",
    x: -2,
    y: -1
  },
  {
    rclLevel: 2,
    type: "extension",
    x: -3,
    y: -1
  },
  // Roads, north, south, east, west
  {
    rclLevel: 3,
    type: "road",
    x: 1,
    y: 0
  },
  {
    rclLevel: 3,
    type: "road",
    x: 2,
    y: 0
  },
  {
    rclLevel: 3,
    type: "road",
    x: 3,
    y: 0
  },
  {
    rclLevel: 3,
    type: "road",
    x: 0,
    y: 1
  },
  {
    rclLevel: 3,
    type: "road",
    x: 0,
    y: 2
  },
  {
    rclLevel: 3,
    type: "road",
    x: -1,
    y: 0
  },
  {
    rclLevel: 3,
    type: "road",
    x: -2,
    y: 0
  },
  {
    rclLevel: 3,
    type: "road",
    x: -3,
    y: 0
  },
  {
    rclLevel: 3,
    type: "road",
    x: 0,
    y: -1
  },
  {
    rclLevel: 3,
    type: "road",
    x: 0,
    y: -2
  },
  {
    rclLevel: 3,
    type: "road",
    x: 1,
    y: -3
  },
  {
    rclLevel: 3,
    type: "road",
    x: 2,
    y: -3
  },
  {
    rclLevel: 3,
    type: "road",
    x: 3,
    y: -3
  },
  {
    rclLevel: 3,
    type: "road",
    x: 4,
    y: 0
  },
  {
    rclLevel: 3,
    type: "road",
    x: 4,
    y: -1
  },
  {
    rclLevel: 3,
    type: "road",
    x: 4,
    y: -2
  },
  {
    rclLevel: 3,
    type: "road",
    x: 4,
    y: 1
  },
  {
    rclLevel: 3,
    type: "road",
    x: 4,
    y: 2
  },
  {
    rclLevel: 3,
    type: "road",
    x: 3,
    y: 3
  },
  {
    rclLevel: 3,
    type: "road",
    x: 2,
    y: 3
  },
  {
    rclLevel: 3,
    type: "road",
    x: 1,
    y: 3
  },
  {
    rclLevel: 3,
    type: "road",
    x: -1,
    y: 3
  },
  {
    rclLevel: 3,
    type: "road",
    x: -2,
    y: 3
  },
  {
    rclLevel: 3,
    type: "road",
    x: -3,
    y: 3
  },
  {
    rclLevel: 3,
    type: "road",
    x: -4,
    y: 2
  },
  {
    rclLevel: 3,
    type: "road",
    x: -4,
    y: 0
  },
  {
    rclLevel: 3,
    type: "road",
    x: -4,
    y: 1
  },
  {
    rclLevel: 3,
    type: "road",
    x: -4,
    y: -1
  },
  {
    rclLevel: 3,
    type: "road",
    x: -4,
    y: -2
  },
  {
    rclLevel: 3,
    type: "road",
    x: -3,
    y: -3
  },
  {
    rclLevel: 3,
    type: "road",
    x: -2,
    y: -3
  },
  {
    rclLevel: 3,
    type: "road",
    x: -1,
    y: -3
  },
  // Level 4
  {
    rclLevel: 4,
    type: "extension",
    x: 1,
    y: 1
  },
  {
    rclLevel: 4,
    type: "extension",
    x: 1,
    y: 2
  },
  {
    rclLevel: 4,
    type: "extension",
    x: 2,
    y: 1
  },
  {
    rclLevel: 4,
    type: "extension",
    x: 2,
    y: 2
  },
  {
    rclLevel: 4,
    type: "extension",
    x: 3,
    y: 1
  },
  {
    rclLevel: 4,
    type: "extension",
    x: -1,
    y: 1
  },
  {
    rclLevel: 4,
    type: "extension",
    x: -1,
    y: 2
  },
  {
    rclLevel: 4,
    type: "extension",
    x: -2,
    y: 1
  },
  {
    rclLevel: 4,
    type: "extension",
    x: -2,
    y: 2
  },
  {
    rclLevel: 4,
    type: "extension",
    x: -3,
    y: 1
  },
  {
    rclLevel: 4,
    type: "storage",
    x: 0,
    y: -3
  },
  // Level 5
  {
    rclLevel: 5,
    type: "tower",
    x: -3,
    y: -2
  },
];

module.exports = infrastructureTasks;