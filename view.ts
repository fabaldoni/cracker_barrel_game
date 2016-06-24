/// <reference path="puzzle.ts" />
namespace CBG {

    const STROKE_WIDTH = 2;
    const RADIUS_FACTOR = 0.6;
    const RADIANS_IN_360_DEGREES = Math.PI * 2;

    export class View {

        private spotRadius: number;
        private size: number;
        private canvasHostId: any;
        private margin: number;
        private puzzle: Puzzle;
        private space: number;
        private spotMap: Array<Spot> = [];
        private selectedSpot: any;
        private context: any;
        private canvas: any;
        private offsetx: number;
        private offsety: number;
        private selectedIndex: number;
        private openSpotSelected:boolean = false;



        constructor(size: number, canvasHostId, margin: number, puzzle: Puzzle) {

            //user various multipicative factors to make everything proportional to the size of the puzzle
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

            //get offset of canvas from top left of browser
            let rect = this.canvas.getBoundingClientRect();
            this.offsetx = rect.left;
            this.offsety = rect.top;

            let point = new Point(0, 0);
            let positionsInLevel = this.puzzle.dimension;
            let offset = 0;
            let spotId = 0;

            for (var i = 0; i < this.puzzle.dimension; i++) {
                for (var j = 0; j < positionsInLevel; j++) {

                    let y = Math.round(this.size + this.margin - i * this.space);
                    let x = Math.round(this.margin + offset + j * this.space);

                    let spot = new Spot();
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

        } //end of constructor

        // set up the click and double click handlers
        private clickCount: number = 0;
        private timerId: number;

        private singleClick(e) {
            let idx: number = this.getIndexOfClickedSpot(e, ClickType.single)
            let mapEntry = this.puzzle.getMapEntry(idx)

            if (!mapEntry || !mapEntry.value) return;

            if(!this.openSpotSelected){
              mapEntry.value = false;
              this.erasePiece(this.spotMap[idx]);
              this.openSpotSelected = true;
              return;
            }

            if (this.selectedIndex) this.drawUnselectedPiece(this.spotMap[this.selectedIndex]);
            this.selectedIndex = idx;
            this.drawSelectedPiece(this.spotMap[this.selectedIndex]);
        }

        private doubleClick(e) {
            let idx: number = this.getIndexOfClickedSpot(e, ClickType.single)

            let intermediateSpotIndex = this.puzzle.isJumpAllowed(this.selectedIndex, idx);

            if (intermediateSpotIndex) {
                let s = this.puzzle.getMapEntry(intermediateSpotIndex);
                s.value = false;

                this.drawEmptyPosition(this.spotMap[intermediateSpotIndex]);
                this.puzzle.getMapEntry(intermediateSpotIndex).value = false;

                this.drawEmptyPosition(this.spotMap[this.selectedIndex]);
                this.puzzle.getMapEntry(this.selectedIndex).value = false;

                this.drawUnselectedPiece(this.spotMap[idx]);
                this.puzzle.getMapEntry(idx).value = true;

                this.selectedIndex = null;
            }
        }

        private handleEvent(e) {
            this.clickCount++;
            let that = this;
            let thatEvent = e;
            if (that.clickCount === 1) {
                that.timerId = setTimeout(function(thatEvent) {
                    that.clickCount = 0;
                    that.singleClick(e);
                }, 200);
            } else if (that.clickCount === 2) {
                console.log(that.timerId);
                clearTimeout(that.timerId);
                that.clickCount = 0
                that.doubleClick(thatEvent);
            }
        }

        private getIndexOfClickedSpot(e, type: ClickType) {
            if (e.target !== this.canvas) return null;
            let offsets = this.getCanvasOffset();
            let x = e.clientX - offsets.leftOffset;
            let y = e.clientY - offsets.topOffset;


            for (var i = 0; i < this.spotMap.length; i++) {
                var spot = this.spotMap[i];
                var distance = Math.sqrt(Math.pow(spot.x - x, 2) + Math.pow(spot.y - y, 2));

                if (distance < this.spotRadius) {
                    //this.selectSpot(this.spotMap[i]);
                    return this.spotMap[i].id;
                }

            }
        }

        private getCanvasOffset(): { 'leftOffset': number, 'topOffset': number } {
            //get offset of canvas from top left of browser
            var rect = this.canvas.getBoundingClientRect();
            return { 'leftOffset': rect.left, 'topOffset': rect.top };
        }


        private drawSelectedPiece(spot: Spot) {
            this.drawEmptyPosition(spot);
            this.context.beginPath();
            this.context.arc(spot.x, spot.y, 0.6 * this.spotRadius, 0, 2 * Math.PI);
            this.context.lineWidth = 1;
            this.context.fillStyle = 'blue';
            this.context.fill();
        }

        private drawUnselectedPiece(spot: Spot) {
            this.drawEmptyPosition(spot);
            this.context.beginPath();
            this.context.arc(spot.x, spot.y, RADIUS_FACTOR * this.spotRadius, 0, 2 * Math.PI);
            this.context.lineWidth = STROKE_WIDTH;
            this.context.fillStyle = 'black';
            this.context.fill();
        }

        //just draws the surrounding circle of a puzzle piece
        private drawEmptyPosition(spot) {
            this.erasePiece(spot);
            this.context.beginPath();
            this.context.arc(spot.x, spot.y, this.spotRadius, 0, RADIANS_IN_360_DEGREES);
            this.context.lineWidth = STROKE_WIDTH;
            this.context.strokeStyle = 'lightgrey';
            this.context.stroke();
        }

        //erases the piece in the position
        private erasePiece(spot: Spot) {
            this.context.globalCompositeOperation = 'destination-out';
            this.context.beginPath();
            this.context.arc(spot.x, spot.y, RADIUS_FACTOR*this.spotRadius*1.1, 0, RADIANS_IN_360_DEGREES, true);
            this.context.fill();
            this.context.globalCompositeOperation = 'source-over';
        }

        private updatePuzzlePiece(spot: Spot) {
            if (spot.id === this.selectedIndex) {
                this.puzzle.getMapEntry(spot.id).value = true;
            }
            else {
                this.puzzle.getMapEntry(spot.id).value = false;
            }

        }



    }

    enum ClickType {
        single = 0,
        double
    }

    export class SpotParams {
        public lineWeight: number;
        public strokeColor: string;
        public filled: boolean;
    }

    export class Point {

        public x: number;
        public y: number;

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
        }
    }

    export class Spot {
        public id: number;
        public x: number;
        public y: number;
    }


}
