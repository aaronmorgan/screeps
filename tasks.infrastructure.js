var infrastructureTasks = {

  buildLinks: function (p_room) {
    if (!p_room.memory._constructionBuildQueue) {
      p_room.memory._constructionBuildQueue = [];
    }

    if (!p_room.memory._constructionJobLevel) {
      p_room.memory._constructionJobLevel = 1;
    }

    if (p_room.memory._constructionJobLevel <= p_room.controller.level) {

      if (p_room.memory._constructionBuildQueue.length > 0) {
        this.processBuildQueue(p_room);
      }

      let constructionSites = p_room.find(FIND_CONSTRUCTION_SITES);
      if (constructionSites.length > 0) {
        return;
      }

      for (let i = 1; i <= p_room.controller.level; i++) {

        this.getJobsForRCLLevel(p_room, i);
      }

      //p_room.memory._constructionJobLevel += 1;
      p_room.memory._constructionJobLevel = p_room.controller.level;
    } else {
      // Periodically check whether we need to rebuild anything by resetting the construction job level.
      // This could be further improved to increase the frequency to per tick during times of war.
      if (Game.time % 10) {
        console.log('🛈 INFO: Resetting room._constructionJobLevel');
        p_room.memory._constructionJobLevel = 1;

        console.log('🛈 INFO: Clearing room construction build queue');
        p_room.memory._constructionBuildQueue = [];
      }
    }
  },

  getJobsForRCLLevel: function (p_room, p_level) {
    //console.log('getJobsForRCLLevel, room=' + p_room + ', level=' + p_level)
    let rclLevelJobs = constructionJobsTemplate.filter(x => x.stage == p_level);

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
  },

  processBuildQueue: function (p_room) {
    if (!p_room.memory._constructionBuildQueue || p_room.memory._constructionBuildQueue.length == 0) {
      //console.log('TRACE: No construction jobs queued');
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

      console.log('objects', JSON.stringify(objects));

      if (objects.length == 1 && objects[0].type == 'terrain') {
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
    stage: 1,
    type: "container",
    x: 3,
    y: 2
  },
  {
    stage: 1,
    type: "extension",
    x: 3,
    y: -1
  },
  {
    stage: 1,
    type: "extension",
    x: 3,
    y: -2
  },
  {
    stage: 1,
    type: "extension",
    x: 3,
    y: -2
  },
  {
    stage: 1,
    type: "extension",
    x: 2,
    y: 1
  },
  {
    stage: 1,
    type: "extension",
    x: 2,
    y: 2
  },
  {
    stage: 1,
    type: "extension",
    x: 3,
    y: 1
  },
  {
    stage: 1,
    type: "tower",
    x: 2,
    y: -1
  },

  {
    stage: 2,
    type: "extension",
    x: -3,
    y: 1
  },
  {
    stage: 2,
    type: "extension",
    x: -2,
    y: 2
  },
  {
    stage: 2,
    type: "extension",
    x: -3,
    y: 2
  },

  {
    stage: 4,
    type: "storage",
    x: -2,
    y: -1
  },
  {
    stage: 5,
    type: "tower",
    x: -2,
    y: 1
  },
  {
    stage: 2,
    type: "extension",
    x: -2,
    y: -2
  },
  {
    stage: 2,
    type: "extension",
    x: -3,
    y: -2
  },
  {
    stage: 2,
    type: "extension",
    x: -3,
    y: -1
  },
];

module.exports = infrastructureTasks;