var CBG;
(function (CBG) {
    var View = (function () {
        function View(dimension) {
            this.dimension = dimension;
        }
        return View;
    }());
    CBG.View = View;
    var Spot = (function () {
        function Spot(state) {
        }
        return Spot;
    }());
    CBG.Spot = Spot;
    var Puzzle = (function () {
        function Puzzle(dimension) {
            this.dimension = dimension;
            this.spots = Array(dimension * (dimension + 1) / 2);
            var maxInRow = 5;
            var indexInRow = 0;
            var currentRow = 0;
            for (var j = 0; j < this.spots.length; j++) {
                this.spots.push(new MapEntry(currentRow, indexInRow, true));
                if (indexInRow < maxInRow) {
                    indexInRow++;
                }
                else {
                    maxInRow--;
                    indexInRow = 0;
                    currentRow++;
                }
            }
        }
        Puzzle.prototype.getMapEntry = function (index) {
            if (index > this.spots.length)
                throw "index is out of bounds";
            return this.spots[index];
        };
        Puzzle.prototype.getIndexForMapEntry = function (spot) {
            var s = null;
            this.spots.forEach(function (item, index) {
                if (spot.rowIndex === item.rowIndex && spot.indexInRow === item.indexInRow) {
                    s = index;
                }
            });
            return s;
        };
        Puzzle.prototype.isJumpAllowed = function (startIdx, endIdx) {
            var start = this.getMapEntry(startIdx);
            var end = this.getMapEntry(endIdx);
            if (!start.value)
                throw "can't jump from an empty spot";
            if (end.value)
                throw "can't jump to a spot that is filled";
            var r = start.rowIndex - end.rowIndex;
            var s = start.indexInRow - end.indexInRow;
            var isPossible = (r === 2 && (s === 0 || s === -2)) ||
                (r === 0 && (s === 2 || s === -2)) ||
                (r === -2 && (s === 2 || s === 0));
            if (!isPossible)
                throw "a jump between the two positions provided is not permitted";
            var middleSpot = null;
            this.spots.forEach(function (item) { if ((item.rowIndex === start.rowIndex + r / 2) && (item.indexInRow === start.indexInRow + s / 2))
                middleSpot = item; });
            if (!middleSpot || !middleSpot.value)
                throw "can't jump over an empty position";
            return this.getIndexForMapEntry(middleSpot);
        };
        return Puzzle;
    }());
    CBG.Puzzle = Puzzle;
    var MapEntry = (function () {
        function MapEntry(rowIndex, indexInRow, value) {
            this.rowIndex = rowIndex;
            this.indexInRow = indexInRow;
            this.value = value;
        }
        return MapEntry;
    }());
    CBG.MapEntry = MapEntry;
    (function (SpotState) {
        SpotState[SpotState["open"] = 0] = "open";
        SpotState[SpotState["filled"] = 1] = "filled";
    })(CBG.SpotState || (CBG.SpotState = {}));
    var SpotState = CBG.SpotState;
    ;
    (function (JumpResults) {
        JumpResults[JumpResults["success"] = 0] = "success";
        JumpResults[JumpResults["outOfBounds"] = 1] = "outOfBounds";
        JumpResults[JumpResults["targetPositionFilled"] = 2] = "targetPositionFilled";
        JumpResults[JumpResults["intermediateSpotEmpty"] = 3] = "intermediateSpotEmpty";
    })(CBG.JumpResults || (CBG.JumpResults = {}));
    var JumpResults = CBG.JumpResults;
})(CBG || (CBG = {}));
