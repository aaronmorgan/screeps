//let statsConsole = require("statsConsole");

// https://github.com/quonic/screeps-prototypes/blob/master/prototype.room.js

var offsets = [
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
];

module.exports = function () {

    Room.prototype.clearCache = function () {
        this.memory._cacheRoomStructures = undefined;
    };

    Room.prototype.getStructures = function () {
        return this.find(FIND_MY_STRUCTURES);

        if (!this.memory._cacheRoomStructures) {
            console.log('DEBUG: Refreshing STRUCTURES cache...');

            this.memory._cacheRoomStructures = this.find(FIND_STRUCTURES);
        }

        return this.memory._cacheRoomStructures;
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
                console.log('here');
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