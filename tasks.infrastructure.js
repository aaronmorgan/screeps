var {
  EXIT_CODES
} = require('game.constants');

var infrastructureTasks = {

  buildLinks: function (p_room) {
    //this.resetBuildQueue(p_room);

    if (!p_room.memory._constructionBuildQueue) {
      p_room.memory._constructionBuildQueue = [];
    }

    if (!p_room.memory._constructionJobLevel) {
      p_room.memory._constructionJobLevel = 0;
    }

    this.findNextBuildJob(p_room)

    // if (p_room.memory._constructionJobLevel <= p_room.controller.level) {
    //   for (let i = 1; i <= p_room.controller.level; i++) {
    //     this.getJobsForRCLLevel(p_room, i);
    //   }

    //   if (p_room.memory._constructionBuildQueue.length > 0) {
    //     this.processBuildQueue(p_room);
    //   }

    //   let constructionSites = p_room.find(FIND_CONSTRUCTION_SITES);
    //   if (constructionSites.length > 0) {
    //     return;
    //   }

    //   p_room.memory._constructionJobLevel = p_room.controller.level;
    // }

    // Periodically check whether we need to rebuild anything by resetting the construction job level.
    // This could be further improved to increase the frequency to per tick during times of war.
    if (Game.time % 20 == 0) {
      //console.log('DEBUG: Game.time=' + Game.time);
      this.resetBuildQueue(p_room);
    }
  },

  resetBuildQueue: function (p_room) {
    console.log('⚠️ INFO: Resetting room._constructionJobLevel');
    p_room.memory._constructionJobLevel = 0;

    // console.log('⚠️ INFO: Clearing room construction build queue');
    // p_room.memory._constructionBuildQueue = [];
  },

  findNextBuildJob: function (p_room) {
    let constructionSites = p_room.constructionSites();

    if (constructionSites.length > 0) {
      console.log('⚠️ Information: Room already has construction sites present');
      return;
    }

    console.log('constructionSites', JSON.stringify(constructionSites));

    let currentRCLLevel = p_room.controller.level;
    //    let rclLevelJobs = constructionJobsTemplate.filter(x => x.rclLevel <= currentRCLLevel);

    // console.log('crlLevelJobs', JSON.stringify(rclLevelJobs));


    // TODO use room.spawn
    let spawn = p_room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType == STRUCTURE_SPAWN;
      }
    })[0];

    // Iterate over the build jobs ensuring each is present before queuing the next.
    //constructionJobsTemplate.forEach(job => {

    for (let index = 0; index < constructionJobsTemplate.length; index++) {
      const job = constructionJobsTemplate[index];

      if (job.rclLevel > currentRCLLevel) {
        continue;
      }

      let x = spawn.pos.x + job.x;
      let y = spawn.pos.y + job.y;

      //      if (job) {
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
          console.log('⛔ Error: calling createConstructionSite, ' + EXIT_CODES[result]);
          console.log('job', JSON.stringify(job));
          continue;
        }
      } else {
        let tile = tileObjects[0];

        if (!tile.structure) {
          console.log('⛔ Error: ' + JSON.stringify(tile));
          //  p_room.memory._constructionBuildQueue.shift();

          // Try the next templated job...
          continue;
        }

        if (tile.structure.structureType != job.type) {
          console.log('⚠️ WARNING: Position x: ' + tile.structure.pos.x + ', y: ' + tile.structure.pos.y + ', is already allocated with a ' + tile.structure.structureType);
        }

        // ...go around again for the next templated job.

        //  p_room.memory._constructionBuildQueue.shift();
      }
      //    }

    };
















  },

  getJobsForRCLLevel: function (p_room, p_level) {
    //console.log('getJobsForRCLLevel, room=' + p_room + ', level=' + p_level)
    let rclLevelJobs = constructionJobsTemplate.filter(x => x.rclLevel == p_level);

    // TODO use room.spawn
    let spawn = p_room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType == STRUCTURE_SPAWN;
      }
    })[0];


    for (var i = 0; i < rclLevelJobs.length; i++) {
      let job = rclLevelJobs[i];

      this.queueJob(p_room, job.type, spawn.pos.x + job.x, spawn.pos.y + job.y)
    }
  },

  queueJob: function (p_room, p_type, p_x, p_y) {
    if (p_room.memory._constructionBuildQueue.length >= 1) {
      return;
    }

    let tileObjects = p_room.lookAt(p_x, p_y);

    if (tileObjects.find(x => x.type == 'constructionSite')) {
      console.log('WARNING: Found construction site already present on x: ' + p_x + ', y: ' + p_y);
      p_room.memory._constructionBuildQueue = [];

      return;
    }

    //console.log('INFO: Queuing construction job: ' + p_type + ', x:' + p_x + ', y: ' + p_y);

    p_room.memory._constructionBuildQueue.push({
      name: p_type,
      x: p_x,
      y: p_y
    });

    console.log('build queue', JSON.stringify(p_room.memory._constructionBuildQueue));
  },

  processBuildQueue: function (p_room) {
    if (p_room.memory._constructionBuildQueue.length == 0) {
      return;
    }

    let job = p_room.memory._constructionBuildQueue[0];

    if (job) {
      let tileObjects = p_room.lookAt(job.x, job.y);

      var objects = tileObjects.filter(function (x) {
        return (
          x.type != 'resource' &&
          x.type != 'energy' &&
          x.type != 'ruin' &&
          x.type != 'creep');
      });

      var index = objects.findIndex(x => x.type == 'constructionSite');

      if (index >= 0) {
        console.log('WARNING: Position x: ' + job.x + ', y: ' + job.y + ', already contains a constructionSite');
        console.log('DEBUG: Dequeuing build job...');

        p_room.memory._constructionBuildQueue.shift();

        return;
      }

      //console.log('objects', JSON.stringify(objects));

      if (objects.length < 3 && objects[0].type == 'terrain') {
        p_room.createConstructionSite(job.x, job.y, job.name);
      } else {
        let tile = tileObjects[0];

        if (!tile.structure) {
          console.log('⛔ Error: ' + JSON.stringify(tile));
          p_room.memory._constructionBuildQueue.shift();

          return;
        }

        if (tile.structure.structureType != job.name) {
          console.log('WARNING: Position x: ' + tile.structure.pos.x + ', y: ' + tile.structure.pos.y + ', is already allocated with a ' + tile.structure.structureType);
        }

        p_room.memory._constructionBuildQueue.shift();
      }
    }
  },
}

const constructionJobsTemplate = [{
    rclLevel: 1,
    type: "extension",
    x: 3,
    y: -1
  },
  {
    rclLevel: 1,
    type: "extension",
    x: 3,
    y: -2
  },
  {
    rclLevel: 1,
    type: "extension",
    x: 3,
    y: -2
  },
  {
    rclLevel: 1,
    type: "container",
    x: 3,
    y: 2
  },
  {
    rclLevel: 1,
    type: "extension",
    x: 2,
    y: 1
  },
  {
    rclLevel: 1,
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