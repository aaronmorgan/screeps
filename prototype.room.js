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
    Room.prototype.structures = function () {
        if (!this._structures || _.isEmpty(this._structures)) {
            const allStructures = this.find(FIND_STRUCTURES);
            this._structures = _.groupBy(allStructures, "structureType");
            this._structures.all = allStructures;
        }

        //console.log('_structures', JSON.stringify(this._structures))
        return this._structures;
    };

    Room.prototype.constructionSites = function () {
            if (!this._constructionSites || _.isEmpty(this._constructionSites)) {
                this._constructionSites = this.find(FIND_CONSTRUCTION_SITES);
            }
    
            return this._constructionSites;
        };

    Room.prototype.droppedResources = function () {
        if (!this._droppedResources) {//} || _.isEmpty(this._droppedResources)) {
            let resourceEnergy = this.find(FIND_DROPPED_RESOURCES, { filter: (o) => o.resourceType === RESOURCE_ENERGY });
            //console.log('res', JSON.stringify(resourceEnergy));

            this._droppedResources = _.sortBy(resourceEnergy, x => x.energy);
        }

        return this._droppedResources;
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

                // console.log('source', JSON.stringify(source));

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

            return accessPoints;
        },

        /**
         * Garbage Collect - set used variables to undefined
         */
        Room.prototype.gc =
        function () {
            this._droppedResources = undefined;
            //this.lastInit = Game.time;
        };
};