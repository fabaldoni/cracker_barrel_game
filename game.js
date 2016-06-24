var CBG;
(function (CBG) {
    var Puzzle = (function () {
        function Puzzle(dimension) {
            this.dimension = dimension;
            this.spots = Array(dimension * (dimension + 1) / 2);
            var maxInRow = dimension;
            var indexInRow = 0;
            var currentRow = 0;
            for (var j = 0; j < this.spots.length; j++) {
                this.spots[j] = new MapEntry(currentRow, indexInRow, true);
                if (indexInRow < maxInRow - 1) {
                    indexInRow++;
                }
                else {
                    maxInRow--;
                    indexInRow = 0;
                    currentRow++;
                }
            }
        }
        Puzzle.prototype.setSpotValue = function (spotIndex, filled) {
            this.spots[spotIndex].value = filled;
        };
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
            if (!start.value) {
                console.log("can't jump form spot with index " + startIdx + " which is empty");
                return null;
            }
            if (end.value) {
                console.log("can't jump to index " + endIdx + " which is filled");
                return null;
            }
            var r = end.rowIndex - start.rowIndex;
            var s = end.indexInRow - start.indexInRow;
            var isPossible = (r === 2 && (s === 0 || s === -2)) ||
                (r === 0 && (s === 2 || s === -2)) ||
                (r === -2 && (s === 2 || s === 0));
            if (!isPossible) {
                console.log("a jump between positions " + startIdx + " and " + endIdx + " provided is not permitted");
                return null;
            }
            var middleSpot = null;
            this.spots.forEach(function (item) {
                if ((item.rowIndex === start.rowIndex + r / 2) && (item.indexInRow === start.indexInRow + s / 2))
                    middleSpot = item;
            });
            if (!middleSpot || !middleSpot.value) {
                console.log("can't jump over empty position at index " + this.getIndexForMapEntry(middleSpot));
                return null;
            }
            var msg = "jump from index " + startIdx + " to index " + endIdx + " is permitted";
            console.log(msg);
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
    (function (JumpResults) {
        JumpResults[JumpResults["success"] = 0] = "success";
        JumpResults[JumpResults["outOfBounds"] = 1] = "outOfBounds";
        JumpResults[JumpResults["targetPositionFilled"] = 2] = "targetPositionFilled";
        JumpResults[JumpResults["intermediateSpotEmpty"] = 3] = "intermediateSpotEmpty";
    })(CBG.JumpResults || (CBG.JumpResults = {}));
    var JumpResults = CBG.JumpResults;
})(CBG || (CBG = {}));
var CBG;
(function (CBG) {
    var STROKE_WIDTH = 2;
    var RADIUS_FACTOR = 0.6;
    var RADIANS_IN_360_DEGREES = Math.PI * 2;
    var View = (function () {
        function View(size, canvasHostId, margin, puzzle) {
            this.spotMap = [];
            this.openSpotSelected = false;
            this.clickCount = 0;
            this.spotRadius = Math.round(0.3 * size / puzzle.dimension);
            this.size = size;
            this.canvasHostId = canvasHostId;
            this.margin = Math.round(size / 12);
            this.puzzle = puzzle;
            this.space = Math.round(this.size / (this.puzzle.dimension - 1));
            this.spotMap = [];
            this.canvas = document.getElementById(canvasHostId);
            this.canvas.setAttribute('width', this.size + 2 * this.margin);
            this.canvas.setAttribute('height', this.size + 2 * this.margin);
            this.context = this.canvas.getContext('2d');
            this.canvas.addEventListener('click', this, false);
            var rect = this.canvas.getBoundingClientRect();
            this.offsetx = rect.left;
            this.offsety = rect.top;
            var point = new Point(0, 0);
            var positionsInLevel = this.puzzle.dimension;
            var offset = 0;
            var spotId = 0;
            for (var i = 0; i < this.puzzle.dimension; i++) {
                for (var j = 0; j < positionsInLevel; j++) {
                    var y = Math.round(this.size + this.margin - i * this.space);
                    var x = Math.round(this.margin + offset + j * this.space);
                    var spot = new Spot();
                    spot.id = spotId;
                    spot.x = x;
                    spot.y = y;
                    this.spotMap.push(spot);
                    if (this.puzzle.getMapEntry(spotId).value === true) {
                        this.drawUnselectedPiece(spot);
                    }
                    else {
                        this.drawEmptyPosition(spot);
                    }
                    spotId++;
                }
                positionsInLevel--;
                offset += this.space / 2;
            }
        }
        View.prototype.singleClick = function (e) {
            var idx = this.getIndexOfClickedSpot(e, ClickType.single);
            var mapEntry = this.puzzle.getMapEntry(idx);
            if (!mapEntry || !mapEntry.value)
                return;
            if (!this.openSpotSelected) {
                mapEntry.value = false;
                this.erasePiece(this.spotMap[idx]);
                this.openSpotSelected = true;
                return;
            }
            if (this.selectedIndex)
                this.drawUnselectedPiece(this.spotMap[this.selectedIndex]);
            this.selectedIndex = idx;
            this.drawSelectedPiece(this.spotMap[this.selectedIndex]);
        };
        View.prototype.doubleClick = function (e) {
            var idx = this.getIndexOfClickedSpot(e, ClickType.single);
            var intermediateSpotIndex = this.puzzle.isJumpAllowed(this.selectedIndex, idx);
            if (intermediateSpotIndex) {
                var s = this.puzzle.getMapEntry(intermediateSpotIndex);
                s.value = false;
                this.drawEmptyPosition(this.spotMap[intermediateSpotIndex]);
                this.puzzle.getMapEntry(intermediateSpotIndex).value = false;
                this.drawEmptyPosition(this.spotMap[this.selectedIndex]);
                this.puzzle.getMapEntry(this.selectedIndex).value = false;
                this.drawUnselectedPiece(this.spotMap[idx]);
                this.puzzle.getMapEntry(idx).value = true;
                this.selectedIndex = null;
            }
        };
        View.prototype.handleEvent = function (e) {
            this.clickCount++;
            var that = this;
            var thatEvent = e;
            if (that.clickCount === 1) {
                that.timerId = setTimeout(function (thatEvent) {
                    that.clickCount = 0;
                    that.singleClick(e);
                }, 200);
            }
            else if (that.clickCount === 2) {
                console.log(that.timerId);
                clearTimeout(that.timerId);
                that.clickCount = 0;
                that.doubleClick(thatEvent);
            }
        };
        View.prototype.getIndexOfClickedSpot = function (e, type) {
            if (e.target !== this.canvas)
                return null;
            var offsets = this.getCanvasOffset();
            var x = e.clientX - offsets.leftOffset;
            var y = e.clientY - offsets.topOffset;
            for (var i = 0; i < this.spotMap.length; i++) {
                var spot = this.spotMap[i];
                var distance = Math.sqrt(Math.pow(spot.x - x, 2) + Math.pow(spot.y - y, 2));
                if (distance < this.spotRadius) {
                    return this.spotMap[i].id;
                }
            }
        };
        View.prototype.getCanvasOffset = function () {
            var rect = this.canvas.getBoundingClientRect();
            return { 'leftOffset': rect.left, 'topOffset': rect.top };
        };
        View.prototype.drawSelectedPiece = function (spot) {
            this.drawEmptyPosition(spot);
            this.context.beginPath();
            this.context.arc(spot.x, spot.y, 0.6 * this.spotRadius, 0, 2 * Math.PI);
            this.context.lineWidth = 1;
            this.context.fillStyle = 'blue';
            this.context.fill();
        };
        View.prototype.drawUnselectedPiece = function (spot) {
            this.drawEmptyPosition(spot);
            this.context.beginPath();
            this.context.arc(spot.x, spot.y, RADIUS_FACTOR * this.spotRadius, 0, 2 * Math.PI);
            this.context.lineWidth = STROKE_WIDTH;
            this.context.fillStyle = 'black';
            this.context.fill();
        };
        View.prototype.drawEmptyPosition = function (spot) {
            this.erasePiece(spot);
            this.context.beginPath();
            this.context.arc(spot.x, spot.y, this.spotRadius, 0, RADIANS_IN_360_DEGREES);
            this.context.lineWidth = STROKE_WIDTH;
            this.context.strokeStyle = 'lightgrey';
            this.context.stroke();
        };
        View.prototype.erasePiece = function (spot) {
            this.context.globalCompositeOperation = 'destination-out';
            this.context.beginPath();
            this.context.arc(spot.x, spot.y, RADIUS_FACTOR * this.spotRadius * 1.1, 0, RADIANS_IN_360_DEGREES, true);
            this.context.fill();
            this.context.globalCompositeOperation = 'source-over';
        };
        View.prototype.updatePuzzlePiece = function (spot) {
            if (spot.id === this.selectedIndex) {
                this.puzzle.getMapEntry(spot.id).value = true;
            }
            else {
                this.puzzle.getMapEntry(spot.id).value = false;
            }
        };
        return View;
    }());
    CBG.View = View;
    var ClickType;
    (function (ClickType) {
        ClickType[ClickType["single"] = 0] = "single";
        ClickType[ClickType["double"] = 1] = "double";
    })(ClickType || (ClickType = {}));
    var SpotParams = (function () {
        function SpotParams() {
        }
        return SpotParams;
    }());
    CBG.SpotParams = SpotParams;
    var Point = (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    }());
    CBG.Point = Point;
    var Spot = (function () {
        function Spot() {
        }
        return Spot;
    }());
    CBG.Spot = Spot;
})(CBG || (CBG = {}));
