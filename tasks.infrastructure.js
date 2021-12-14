var {
  EXIT_CODE
} = require('game.constants');

var infrastructureTasks = {

  buildLinks: function (p_room) {
    this.findNextBuildJob(p_room)
  },

  findNextBuildJob: function (p_room) {
    let constructionSites = p_room.constructionSites();

    if (constructionSites.length > 0) {
      //console.log('⚠️ Information: Room already has construction sites present');
      return;
    }

    let currentRCLLevel = p_room.controller.level;

    // TODO use room.spawn
    let spawn = p_room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType == STRUCTURE_SPAWN;
      }
    })[0];

    let index = p_room.controller.level;

    // Periodically check whether we need to rebuild anything by resetting the construction job level.
    // This could be further improved to increase the frequency to per tick during times of war.
    if (Game.time % (p_room.controller.level * 10) == 0) {
      index = 0;
    }

    for (let i = index; i < constructionJobsTemplate.length; i++) {
      const job = constructionJobsTemplate[i];

      if (job.rclLevel > currentRCLLevel) {
        continue;
      }

      const x = spawn.pos.x + job.x;
      const y = spawn.pos.y + job.y;

      let tileObjects = p_room.lookAt(x, y).filter(function (x) {
        return (
          x.type != 'resource' &&
          x.type != 'energy' &&
          x.type != 'ruin' &&
          x.type != 'creep');
      });

      if (tileObjects.length < 3 && tileObjects[0].type == 'terrain') {
        let result = p_room.createConstructionSite(x, y, job.type);

        if (result != OK) {
          console.log('⛔ Error: calling createConstructionSite, ' + EXIT_CODE[result]);
          console.log('job', JSON.stringify(job));
          continue;
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

const constructionJobsTemplate = [{
    rclLevel: 2,
    type: "extension",
    x: 3,
    y: -1
  },
  {
    rclLevel: 2,
    type: "extension",
    x: 3,
    y: -2
  },
  {
    rclLevel: 2,
    type: "extension",
    x: 2,
    y: -2
  },
  {
    rclLevel: 2,
    type: "container",
    x: 3,
    y: 2
  },
  {
    rclLevel: 2,
    type: "extension",
    x: 2,
    y: 1
  },
  {
    rclLevel: 2,
    type: "extension",
    x: 2,
    y: 2
  },
  {
    rclLevel: 3, // RCL caps us at 5 extensions until level 3.
    type: "extension",
    x: 3,
    y: 1
  },
  {
    rclLevel: 2,
    type: "container",
    x: 1,
    y: -1
  },
  {
    rclLevel: 3,
    type: "tower",
    x: 2,
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
    x: 0,
    y: 3
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
    x: 0,
    y: -3
  },
  {
    rclLevel: 3,
    type: "extension",
    x: -3,
    y: 1
  },
  {
    rclLevel: 3,
    type: "extension",
    x: -2,
    y: 2
  },
  {
    rclLevel: 3,
    type: "extension",
    x: -3,
    y: 2
  },
  {
    rclLevel: 3,
    type: "container",
    x: -1,
    y: 1
  },
  {
    rclLevel: 4,
    type: "storage",
    x: -2,
    y: -1
  },
  {
    rclLevel: 5,
    type: "tower",
    x: -2,
    y: 1
  },
  {
    rclLevel: 4,
    type: "extension",
    x: -2,
    y: -2
  },
  {
    rclLevel: 4,
    type: "extension",
    x: -3,
    y: -2
  },
  {
    rclLevel: 4,
    type: "extension",
    x: -3,
    y: -1
  },
];

module.exports = infrastructureTasks;