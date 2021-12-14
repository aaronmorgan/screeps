var {
  EXIT_CODE
} = require('game.constants');

var infrastructureTasks = {

  buildLinks: function (p_room) {
    // if (!p_room.memory._constructionBuildQueue) {
    //   p_room.memory._constructionBuildQueue = [];
    // }

    // if (!p_room.memory._constructionJobLevel) {
    //   p_room.memory._constructionJobLevel = 0;
    // }

    this.findNextBuildJob(p_room)

    // Periodically check whether we need to rebuild anything by resetting the construction job level.
    // This could be further improved to increase the frequency to per tick during times of war.
    if (Game.time % 20 == 0) {
      //console.log('DEBUG: Game.time=' + Game.time);
      //     this.resetBuildQueue(p_room);
    }
  },

  // resetBuildQueue: function (p_room) {
  //   console.log('⚠️ INFO: Resetting room._constructionJobLevel');
  //   p_room.memory._constructionJobLevel = 0;
  // },

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

    for (let index = 0; index < constructionJobsTemplate.length; index++) {
      const job = constructionJobsTemplate[index];

      if (job.rclLevel > currentRCLLevel) {
        continue;
      }

      let x = spawn.pos.x + job.x;
      let y = spawn.pos.y + job.y;

      let tileObjects = p_room.lookAt(x, y);

      var objects = tileObjects.filter(function (x) {
        return (
          x.type != 'resource' &&
          x.type != 'energy' &&
          x.type != 'ruin' &&
          x.type != 'creep');
      });

      if (objects.length < 3 && objects[0].type == 'terrain') {
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
    rclLevel: 3,
    type: "tower",
    x: 2,
    y: -1
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
    rclLevel: 3,
    type: "extension",
    x: -2,
    y: -2
  },
  {
    rclLevel: 3,
    type: "extension",
    x: -3,
    y: -2
  },
  {
    rclLevel: 3,
    type: "extension",
    x: -3,
    y: -1
  },
];

module.exports = infrastructureTasks;