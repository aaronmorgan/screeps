var infrastructureTasks = {

  processBuildQueue: function (p_room) {
    if (!p_room.memory._constructionBuildQueue || p_room.memory._constructionBuildQueue.length == 0) {
      console.log('TRACE: No construction jobs queued');
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

      if (objects.length == 1 && objects[0].type == 'terrain') {
        p_room.createConstructionSite(job.x, job.y, job.name);
      } else {
        let structure = tileObjects[0];

        if (!structure.structure) {
          console.log('*** ERROR ***: ' + JSON.stringify(structure));
          return;
        }

        console.log('WARNING: Position x: ' + structure.structure.pos.x + ', y: ' + structure.structure.pos.y + ', is already allocated with a ' + structure.structure.structureType + ', removing from queue...');

        p_room.memory._constructionBuildQueue.shift();
      }
    }
  },

  addJob: function (p_room, p_name, p_x, p_y) {
    let tileObjects = p_room.lookAt(p_x, p_y);

    if (tileObjects.find(x => x.type == 'constructionSite')) {
      console.log('WARNING: Found construction site already present on x: ' + p_x + ', y: ' + p_y);
      return;
    }

    p_room.memory._constructionBuildQueue.push({ name: p_name, x: p_x, y: p_y });
  },

  buildLinks: function (p_room) {
    if (!p_room.memory._constructionBuildQueue) {
      p_room.memory._constructionBuildQueue = [];
    }

    if (p_room.memory._constructionBuildQueue.length > 0) {
      this.processBuildQueue(p_room);
      return;
    }
    
    let structures = p_room.find(FIND_MY_STRUCTURES);
    let constructionSites = p_room.find(FIND_CONSTRUCTION_SITES);
    let jobQueue = p_room.memory._constructionBuildQueue;

    console.log('TRACE: Queue contains ' + jobQueue.length + ' jobs');
    console.log('TRACE: Room contains ' + constructionSites.length + ' construction sites');

    if (constructionSites.length > 0) { return; }

    if (p_room.controller.level == 3) {
      if (!p_room.memory.maxTowers) { p_room.memory.maxTowers = 1; }
    }
    
    let spawn = structures.filter(x => x.structureType == STRUCTURE_SPAWN)[0];

    if (p_room.controller.level >= 1) {
      this.addJob(p_room, "container", spawn.pos.x + 3, spawn.pos.y + 2);
    }

    let extensions = structures.filter(x => x.structureType == STRUCTURE_EXTENSION);

    console.log('EXTENSIONS', extensions);
    if (p_room.controller.level >= 2) {
      if (extensions.length < 3) {
        this.addJob(p_room, "extension", spawn.pos.x + 3, spawn.pos.y - 1);
        this.addJob(p_room, "extension", spawn.pos.x + 3, spawn.pos.y - 2);
        this.addJob(p_room, "extension", spawn.pos.x + 2, spawn.pos.y - 2);
        this.addJob(p_room, "extension", spawn.pos.x + 2, spawn.pos.y + 1);
        this.addJob(p_room, "extension", spawn.pos.x + 2, spawn.pos.y + 2);
        this.addJob(p_room, "extension", spawn.pos.x + 3, spawn.pos.y + 1);

        return;
      }

      if (p_room.controller.level >= 3) {
        let towers = structures.filter(x => x.structureType == STRUCTURE_TOWER);

        if (towers.length < p_room.memory.maxTowers) {

          let b = p_room.lookAt(spawn.pos.x + 2, spawn.pos.y - 1);

          if (b.length == 1 && b[0].type == 'terrain') {
            let result = p_room.createConstructionSite(spawn.pos.x + 2, spawn.pos.y - 1, "tower");
            console.log('Construction of TOWER: ' + result);
          }
        }

        return;
      }

      if (p_room.controller.level >= 4) {

      }
    }
  }
}

module.exports = infrastructureTasks;