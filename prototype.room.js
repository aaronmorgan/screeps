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

    Room.prototype.getStructures = function () {
        if (!this.memory._structures) {
            this.memory._structures = this.find(FIND_STRUCTURES);
        }

        return this.memory._structures;
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
            if (dropMiners.length == 0) { return this.find(FIND_SOURCES); }

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
                    var source = sources[sourceKey];
                    var initial = source.pos;
                    for (var offsetKey in offsets) {
                        var offset = offsets[offsetKey];
                        var newPos = new RoomPosition(initial.x + offset.x, initial.y + offset.y, initial.roomName);
                        var terrain = Game.map.getTerrainAt(newPos);
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