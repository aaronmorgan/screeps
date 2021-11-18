var infrastructureTasks = {

  buildLinks: function (p_room) {
    let spawn = p_room.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_SPAWN }
    });

    let s = spawn[0];
    let containers = p_room.find(FIND_STRUCTURES, { filter: (c) => c.structureType == STRUCTURE_CONTAINER });

    if (p_room.controller.level >= 1) {
      if (containers.length < 1) {
        // TODO Check if there's anything at xy before attempting to build.
        let result = p_room.createConstructionSite(s.pos.x + 3, s.pos.y + 2, "container");

        console.log('Construction of CONTAINER: ' + result);
        return;
      // } else if (containers.length == 1) {
      //   // TODO Check if there's anything at xy before attempting to build.
      //   let result = p_room.createConstructionSite(s.pos.x - 3, s.pos.y - 2, "container");

      //   console.log('Construction of CONTAINER: ' + result);
      //   return;
      }
    }

    let extensions = p_room.find(FIND_STRUCTURES, { filter: (c) => c.structureType == STRUCTURE_EXTENSION });

    if (p_room.controller.level >= 2) {
      if (extensions.length < 3) {
        let a = p_room.getPositionAt(s.pos.x + 2, s.pos.y - 1)

        // TODO Check if there's anything at xy before attempting to build.
        let result = p_room.createConstructionSite(s.pos.x + 3, s.pos.y - 2, "extension");
        if (result == ERR_INVALID_TARGET) {
          result = p_room.createConstructionSite(s.pos.x + 2, s.pos.y - 2, "extension");
        }
        if (result == ERR_INVALID_TARGET) {
          result = p_room.createConstructionSite(s.pos.x + 3, s.pos.y - 1, "extension");
        }

        console.log('Construction of EXTENSION: ' + result);
        return;
      }
    }

    if (p_room.controller.level >= 3) {
      // TODO Check if there's anything at xy before attempting to build.
      let result = p_room.createConstructionSite(s.pos.x + 2, s.pos.y - 1, "tower");


      console.log('Construction of TOWER: ' + result);
      return;
    }

    if (p_room.controller.level >= 4) {

    }
  }
}

module.exports = infrastructureTasks;