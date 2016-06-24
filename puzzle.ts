namespace CBG {
    export class Puzzle {

        public dimension: number;
        private spots: Array<MapEntry>;

        constructor(dimension: number) {

            //create the spots on the puzzle as an array
            this.dimension = dimension;

            //Well know formula Σi for i=1 to N = N(N+1)/2
            this.spots = Array(dimension * (dimension + 1) / 2);

            //pick random open positions
            //let openSpot = Math.round(this.spots.length* Math.random());
            //console.log(`open spot is ${openSpot}`)

            //create the map of array indexes to geometric positions
            let maxInRow = dimension;
            let indexInRow = 0;
            let currentRow = 0;

            for (var j = 0; j < this.spots.length; j++) {
                //this.spots[j] = new MapEntry(currentRow, indexInRow, j===openSpot?false:true);
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

        public setSpotValue(spotIndex: number, filled: boolean) {
            this.spots[spotIndex].value = filled;
        }

        public getMapEntry(index: number): MapEntry {
            if (index > this.spots.length) throw "index is out of bounds";
            return this.spots[index];
        }

        public getIndexForMapEntry(spot: MapEntry) {
            let s = null;
            this.spots.forEach(function(item: MapEntry, index: number) {
                if (spot.rowIndex === item.rowIndex && spot.indexInRow === item.indexInRow) {
                    s = index;
                }
            })

            return s;
        }

        public isJumpAllowed(startIdx: number, endIdx: number): number {
            let start = this.getMapEntry(startIdx);
            let end = this.getMapEntry(endIdx);

            //The start position must be filled and the end position must
            //be empty
            if (!start.value) {
                console.log(`can't jump form spot with index ${startIdx} which is empty`);
                return null;
            }

            if (end.value) {
                console.log(`can't jump to index ${endIdx} which is filled`);
                return null;
            }

            let r = end.rowIndex - start.rowIndex;
            let s = end.indexInRow - start.indexInRow;


            let isPossible = (r === 2 && (s === 0 || s === -2)) ||
                (r === 0 && (s === 2 || s === -2)) ||
                (r === -2 && (s === 2 || s === 0));

            //Here we check if the jump is to one of the six permited locations
            if (!isPossible) {
                console.log(`a jump between positions ${startIdx} and ${endIdx} provided is not permitted`);
                return null;
            }

            //Here we verify that the position we want to jump over is filled
            let middleSpot = null;
            this.spots.forEach(function(item) {
                if ((item.rowIndex === start.rowIndex + r / 2) && (item.indexInRow === start.indexInRow + s / 2)) middleSpot = item
            });

            if (!middleSpot || !middleSpot.value) {
                console.log(`can't jump over empty position at index ${this.getIndexForMapEntry(middleSpot)}`);
                return null;
            }

            //return the index of the position we are jumping over.
            let msg: String = `jump from index ${ startIdx } to index ${ endIdx } is permitted`;
            console.log(msg);
            return this.getIndexForMapEntry(middleSpot);

        }

    }

    export class MapEntry {
        rowIndex: number;
        indexInRow: number;
        value: boolean;

        constructor(rowIndex: number, indexInRow: number, value: boolean) {
            this.rowIndex = rowIndex;
            this.indexInRow = indexInRow;
            this.value = value;
        }

    }

    export interface JumpHandler {
        handleJump(startIdx: number, endIdx: number): JumpResults;
    }

    export enum JumpResults {
        success = 0,
        outOfBounds = 1,
        targetPositionFilled = 2,
        intermediateSpotEmpty = 3
    }

} //closes namespace
