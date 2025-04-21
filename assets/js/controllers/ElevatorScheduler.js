/**
 * ElevatorScheduler manages elevator scheduling decisions
 */

class ElevatorScheduler {
    /**
     * @param {Object} config - Configuration object
     */
    constructor(config) {
            this.building = config.building;
            this.pendingCalls = []; // elevator calls
            this._setupEventListeners();
        }
        /**
         * Set up event listeners
         */
    _setupEventListeners() {
            this.building.on('elevatorCalled', (data) => {
                this.scheduleElevator(data.floor, data.direction);
            });
            this.building.on('elevatorFloorChanged', (data) => {
                this._handleElevatorFloorChange(data.elevator, data.newFloor);
            });
            this.building.on('elevatorDoorsClosed', (data) => {
                this._checkPendingCalls();
            });
        }
        /**
         * Schedule an elevator for a floor call
         */
    scheduleElevator(floor, direction) {
            console.log(`Scheduling elevator for floor ${floor}, direction ${direction}`);

            const existingCall = this.pendingCalls.find(call =>
                call.floor === floor && call.direction === direction);
            if (existingCall) {
                console.log(`Call for floor ${floor}, direction ${direction} already pending`);
                return;
            }
            const elevator = this.building.findClosestElevator(floor, direction);
            if (!elevator) {
                this.pendingCalls.push({ floor, direction });
                this.logger.warn(`No available elevator, added to pending calls: floor ${floor}, direction ${direction}`);
                return;
            }

            if (elevator.getCurrentFloor() === floor && !elevator.areDoorsOpen()) {
                elevator.openDoors();

                const floorObj = this.building.getFloor(floor);
                if (direction === 'up') {
                    floorObj.setUpButtonState(false);
                } else {
                    floorObj.setDownButtonState(false);
                }

                console.log(`Elevator ${elevator.id} already at floor ${floor}, opening doors`);
                return;
            }

            elevator.addDestination(floor);

            if (elevator.isIdle()) {
                elevator._processNextDestination();
            }

            console.log(`Scheduled elevator ${elevator.id} for floor ${floor}, direction ${direction}`);
        }
        /**
         * Handle elevator floor change
         */
    _handleElevatorFloorChange(elevator, newFloor) {
            const callsForFloor = this.pendingCalls.filter(call => call.floor === newFloor);

            if (callsForFloor.length > 0) {
                const floorObj = this.building.getFloor(newFloor);

                callsForFloor.forEach(call => {
                    if (call.direction === 'up') {
                        floorObj.setUpButtonState(false);
                    } else {
                        floorObj.setDownButtonState(false);
                    }
                });

                this.pendingCalls = this.pendingCalls.filter(call => call.floor !== newFloor);

                console.log(`Removed calls for floor ${newFloor} from pending calls`);
            }
        }
        /**
         * Check for pending calls and assign to elevators
         */
    _checkPendingCalls() {
            if (this.pendingCalls.length === 0) {
                return;
            }

            console.log(`Checking ${this.pendingCalls.length} pending calls`);

            const assignedCalls = [];

            this.pendingCalls.forEach(call => {
                const elevator = this.building.findClosestElevator(call.floor, call.direction);

                if (elevator && elevator.isIdle()) {
                    elevator.addDestination(call.floor);
                    elevator._processNextDestination();
                    assignedCalls.push(call);

                    console.log(`Assigned pending call: floor ${call.floor}, direction ${call.direction} to elevator ${elevator.id}`);
                }
            });
            this.pendingCalls = this.pendingCalls.filter(call =>
                !assignedCalls.some(assignedCall =>
                    assignedCall.floor === call.floor && assignedCall.direction === call.direction
                )
            );
        }
        /**
         * Reset the scheduler
         */
    reset() {
        this.pendingCalls = [];
        console.log('Elevator scheduler reset');
    }
}