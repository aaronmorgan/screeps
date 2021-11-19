
// 
//          r
//          r
//          rEE
//          rTE
//      rrrrSrrrr
//          r
//          r  C
//          r
//          r
//

var infrastructureTasks = {

  buildLinks: function (p_room) {
    let spawn = p_room.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_SPAWN }
    });

    if (p_room.controller.level == 3) {
      if (!p_room.memory.maxTowers) { p_room.memory.maxTowers = 1; }
    }

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

    let a = p_room.getPositionAt(s.pos.x + 2, s.pos.y - 1);
    console.log('a', JSON.stringify(a));

    let b = p_room.lookAt(a.x, a.y);
    console.log('b', JSON.stringify(b));

    let extensions = p_room.find(FIND_STRUCTURES, { filter: (c) => c.structureType == STRUCTURE_EXTENSION });

    if (p_room.controller.level >= 2) {
      if (extensions.length < 3) {
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
      let towers = p_room.find(FIND_STRUCTURES, { filter: (c) => c.structureType == STRUCTURE_TOWER });

      if (towers.length < p_room.memory.maxTowers) {

        let b = p_room.lookAt(s.pos.x + 2, s.pos.y - 1);

        if (b.length == 1 && b[0].type == 'terrain') {
          let result = p_room.createConstructionSite(s.pos.x + 2, s.pos.y - 1, "tower");
          console.log('Construction of TOWER: ' + result);
        }

        // for (var i = 0; i < b.length; i++) {
        //   if (b[i].type == 'constructionSite') {

        //   }
        // }


      }

      return;
    }

    if (p_room.controller.level >= 4) {

    }
  }
}

module.exports = infrastructureTasks;