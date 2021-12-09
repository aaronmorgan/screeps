//let statsConsole = require("statsConsole");

// https://github.com/quonic/screeps-prototypes/blob/master/prototype.room.js

var offsets = [{
        x: -1,
        y: -1
    },
    {
        x: 0,
        y: -1
    },
    {
        x: 1,
        y: -1
    },
    {
        x: -1,
        y: 0
    },
    {
        x: 1,
        y: 0
    },
    {
        x: -1,
        y: 1
    },
    {
        x: 0,
        y: 1
    },
    {
        x: 1,
        y: 1
    }
];

module.exports = function () {

    // Should be called once per tick and then the cached result should be used.
    Room.prototype.structures = function() {
        if (!this._structures || _.isEmpty(this._structures)) {
            const allStructures = this.find(FIND_STRUCTURES);
            this._structures = _.groupBy(allStructures, "structureType");
            this._structures.all = allStructures;
        }

        //console.log('_structures', JSON.stringify(this._structures))
        return this._structures;
    };

    Room.prototype.getConstructionSites = function () {
        return this.find(FIND_CONSTRUCTION_SITES);

        if (!this.memory._cacheRoomConstructionSites) {
            console.log('DEBUG: Refreshing CONSTRUCTION_SITES cache...');

            this.memory._cacheRoomConstructionSites = this.find(FIND_CONSTRUCTION_SITES);
        }

        return this.memory._cacheRoomConstructionSites;
    };

    /**
     * Returns the sources in this room.
     * @returns {*}
     */
    Room.prototype.getSources =
        function () {
            return this.find(FIND_SOURCES);
        };

    /**
     * Returns the stored amount of energy in the room.
     * @returns {number|*}
     */
    Room.prototype.selectAvailableSource =
        function (dropMiners) {
            if (dropMiners.length == 0) {
                return this.find(FIND_SOURCES);
            }


            let sources = _.filter(this.find(FIND_SOURCES), (s) => {
                for (var i = 0; i < dropMiners.length; i++) {
                    if (dropMiners[i].memory.sourceId != s.id) {
                        return true;
                    }
                }
            });

            return sources;
        };

    Room.prototype.determineSourceAccessPoints = function () {
            if (this.memory.sources) {
                return;
            }

            this.memory.sources = [];

            let sources = this.find(FIND_SOURCES);

            for (let i = 0; i < sources.length; i++) {

                const source = sources[i];

                console.log('source', JSON.stringify(source));

                var fields = this.lookForAtArea(LOOK_TERRAIN, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);
                //console.log('fields', JSON.stringify(fields));

                var accessibleFields = 9 - _.countBy(fields, "terrain").wall;
                //console.log('accessibleFields', JSON.stringify(accessibleFields));

                this.memory.sources.push({
                    id: source.id,
                    accessPoints: accessibleFields
                });
            }

        },

        Room.prototype.getMaxSourceAccessPoints = function () {
            if (!this.memory.sources) {
                this.determineSourceAccessPoints();
            }

            let accessPoints = 0;

            for (let i = 0; i < this.memory.sources.length; i++) {
                accessPoints += this.memory.sources[i].accessPoints;
            }

            console.log('accessPoints', accessPoints);

            return accessPoints;
        },

        /**
         * Gets how many harvest points are around the sources you specify.
         * @param sources
         * @returns {*}
         */
        Room.prototype.getHarvestPoints =
        function (sources) {
            if (this.memory.harvestPoints === undefined) {
                let harvestPoints = 0
                for (var sourceKey in sources) {
                    if (!sources.hasOwnProperty(sourceKey)) {
                        continue;
                    }
                    let source = sources[sourceKey];
                    let initial = source.pos;

                    for (var offsetKey in offsets) {
                        let offset = offsets[offsetKey];
                        let newPos = new RoomPosition(initial.x + offset.x, initial.y + offset.y, initial.roomName);
                        let terrain = Game.map.getTerrainAt(newPos);

                        if (terrain == "plain") {
                            harvestPoints++;
                        }
                        if (terrain == "swamp") {
                            harvestPoints++;
                        }
                    }
                }
                this.memory.harvestPoints = harvestPoints;
                return harvestPoints;
            } else {
                return this.memory.harvestPoints;
            }
        };

    /**
     * Garbage Collect - set used variables to undefined
     */
    Room.prototype.gc =
        function () {
            this._storedEnergyInRoom = undefined;
            this._sources = undefined;
            this._extensions = undefined;
            this._hostiles = undefined;
            this._hostile_structures = undefined;
            this._mineral = undefined;
            this._labs = undefined;
            this._usedEnergy = undefined;
            this._towers = undefined;
            this._storage = undefined;
            this._storedEnergyInRoom = undefined;
            this._harvestedEnergy = undefined;
            this.lastInit = Game.time;
        };
};