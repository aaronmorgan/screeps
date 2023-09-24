const {
    role
} = require("./game.constants");

module.exports = function () {

    // Should be called once per tick and then the cached result should be used.
    Room.prototype.structures = function () {
        if (!this._structures || _.isEmpty(this._structures)) {
            const allStructures = this.find(FIND_STRUCTURES, {
                filter: (x) => x.structureType !== STRUCTURE_ROAD // There's too many and we don't need to know about individual road segments.
            });
            this._structures = _.groupBy(allStructures, "structureType");
            this._structures.all = allStructures;

            // Calculate the distance from the spawn to controller and store it once. It's used as a base to calculate number of 
            // required Upgraders. i.e. the further away the controller is the more Upgraders required.
            // Should be moved to a 'run once' function.
            if (!this.memory._distanceToRCL || Number.isNaN(this.memory._distanceToRCL) || this.memory._distanceToRCL % 1 !== 0) {
                this.memory._distanceToRCL = this.structures().spawn[0].pos.findPathTo(this.controller.pos, {
                    maxOps: 1000,
                    ignoreDestructibleStructures: true
                }).length;
            }
        }

        return this._structures;
    };

    Room.prototype.creeps = function () {
        if (!this._creeps || _.isEmpty(this._creeps)) {
            this._creeps = {
                builders: _.filter(this.myCreeps(), (creep) => creep.room.name == this.name && creep.memory.role == role.BUILDER),
                couriers: _.filter(this.myCreeps(), (creep) => creep.room.name == this.name && creep.memory.role == role.COURIER),
                defenders: _.filter(this.myCreeps(), (creep) => creep.room.name == this.name && creep.memory.role == role.DEFENDER),
                dropminers: _.filter(this.myCreeps(), (creep) => creep.room.name == this.name && creep.memory.role == role.DROPMINER),
                gophers: _.filter(this.myCreeps(), (creep) => creep.room.name == this.name && creep.memory.role == role.GOPHER),
                harvesters: _.filter(this.myCreeps(), (creep) => creep.room.name == this.name && creep.memory.role == role.HARVESTER),
                linkBaseHarvesters: _.filter(this.myCreeps(), (creep) => creep.room.name == this.name && creep.memory.role == role.LINK_BASE_HARVESTER),
                upgraders: _.filter(this.myCreeps(), (creep) => creep.room.name == this.name && creep.memory.role == role.UPGRADER)
            }
        }

        return this._creeps;
    };

    Room.prototype.myCreeps = function () {
        if (!this._myCreeps || _.isEmpty(this._myCreeps)) {
            this._myCreeps = this.find(FIND_MY_CREEPS, {
                filter: (o) => o.room.name == this.name
            });
        }

        return this._myCreeps;
    };

    Room.prototype.constructionSites = function () {
        if (!this._constructionSites || _.isEmpty(this._constructionSites)) {
            this._constructionSites = this.find(FIND_CONSTRUCTION_SITES);
        }

        return this._constructionSites;
    };

    Room.prototype.droppedResources = function () {
        if (!this._droppedResources) {
            let resourceEnergy = this.find(FIND_DROPPED_RESOURCES, {
                filter: (o) => o.resourceType === RESOURCE_ENERGY
            });

            this._droppedResources = _.sortBy(resourceEnergy, x => x.energy);
        }

        return this._droppedResources;
    };

    // Finds all the dropped energy within a 7x7 area around the target object or structure.
    Room.prototype.droppedResourcesCloseToSource = function (objId, range) {
        const obj = Game.getObjectById(objId);

        if (!obj) return;

        return this.lookForAtArea(LOOK_ENERGY, obj.pos.y - range, obj.pos.x - range, obj.pos.y + range, obj.pos.x + range, true);
    };

    // Used by creeps that might pickup energy; resetting the room for other creeps that tick.
    Room.prototype.refreshDroppedResources = function () {
        this._droppedResources = [];
        return this.droppedResources();
    };

    Room.prototype.sources = function () {
        if (!this._sources || _.isEmpty(this._sources)) {
            this._sources = this.find(FIND_SOURCES);
        }

        return this._sources;
    };


    Room.prototype.selectAvailableSource =
        function (creeps) {
            if (creeps.length == 0) {
                return this.sources();
            }

            return sources = _.filter(this.memory.sources, (s) => {
                for (let i = 0; i < creeps.length; i++) {
                    if (creeps[i].memory.sourceId != s.id) {
                        return true;
                    }
                }
            });
        };

    // Attempt to locate all Link structures near to Source objects that don't have a creep already assigned.
    Room.prototype.selectAvailableSourceLink =
        function (creeps) {
            if (!creeps || creeps.length == 0) {
                console.log(44)
                return this.sources();
            }

            return sources = _.filter(this.memory.sources, (s) => {
                for (let i = 0; i < creeps.length; i++) {
                    if (creeps[i].memory.linkId != s.linkId) {
                        console.log('s.linkId', s.linkId)
                        console.log('creep', creeps[i].memory.linkId)
                        return true;
                    }
                }
            });
        };

    Room.prototype.determineSourceAccessPoints =
        function () {
            if (this.memory.sources) {
                return;
            }

            let spawn = this.structures().spawn[0];

            let sources = [];
            let accessPoints = 0;

            this.sources().forEach(source => {
                const fields = this.lookForAtArea(LOOK_TERRAIN, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);
                const accessibleFields = 9 - _.countBy(fields, "terrain").wall;

                sources.push({
                    id: source.id,
                    accessPoints: accessibleFields,
                    pathFromSpawn: spawn.pos.findPathTo(source.pos)
                });

                accessPoints += accessibleFields;
            })

            this.memory.sources = _.sortBy(sources, s => spawn.pos.getRangeTo(s))
            this.memory.maxSourceAccessPoints = accessPoints;
        },

        Room.prototype.determineRCLAccessPoints = function () {
            const rcl = this.controller;

            const fields = this.lookForAtArea(LOOK_TERRAIN, rcl.pos.y - 1, rcl.pos.x - 1, rcl.pos.y + 1, rcl.pos.x + 1, true);
            //console.log('fields', JSON.stringify(fields));

            const accessibleFields = 9 - _.countBy(fields, "terrain").wall;

            console.log('RCL access points=' + accessibleFields);
        },

        Room.prototype.getMaxSourceAccessPoints = function () {
            if (!this.memory.sources) {
                this.determineSourceAccessPoints();
            }

            let accessPoints = 0;

            for (let i = 0; i < this.memory.sources.length; i++) {
                accessPoints += this.memory.sources[i].accessPoints;
            }

            return accessPoints;
        },

        Room.prototype.getDistanceToRCL = function () {
            if (this.memory.controller) {
                return;
            }

            let spawn = this.structures().spawn[0];

            const path = spawn.pos.findPathTo(spawn.room.controller.pos, {
                ignoreDestructibleStructures: true,
                ignoreCreeps: true
            });

            this.memory.controller = {
                path: path
            };
        }

    /**
     * Garbage Collect - set used variables to undefined
     */
    Room.prototype.gc =
        function () {
            this._creeps = undefined;
            this._myCreeps = undefined;
            this._sources = undefined;
            this._structures = undefined;
            this._droppedResources = undefined;
            this._constructionSites = undefined;
            //this.lastInit = Game.time;
        };
};