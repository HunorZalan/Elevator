/**
 * ElevatorController manages elevator operations
 */

class ElevatorController {
    /**
     * @param {Object} config - Configuration object
     */
    constructor(config) {
            this.building = config.building;
            this.scheduler = config.scheduler;
            this.settings = config.settings;
            this.timers = {};
            this._setupEventListeners();
        }
        /**
         * Set up event listeners
         */
    _setupEventListeners() {
            this.building.on('elevatorStateChanged', (data) => {
                this._handleElevatorStateChange(data.elevator, data.oldState, data.newState);
            });
            this.building.on('elevatorFloorChanged', (data) => {
                this._handleElevatorFloorChange(data.elevator, data.oldFloor, data.newFloor);
            });
            $(window).on('resize', () => {
                this.updateElevatorPositions();
            });
        }
        /**
         * Call elevator to floor
         */
    callElevator(floor, direction) {
            this.building.callElevator(floor, direction);
        }
        /**
         * Select destination for elevator
         */
    selectDestination(elevatorId, floor) {
            const elevator = this.building.getElevator(elevatorId);
            if (!elevator) {
                console.error(`Elevator ${elevatorId} not found`);
                return false;
            }
            if (elevator.isInEmergency || elevator.isOverloaded) {
                console.warn(`Elevator ${elevatorId} cannot accept destination in ${elevator.getState()} state`);
                return false;
            }

            $(`.elevator-floor-button[data-elevator="${elevatorId}"][data-floor="${floor}"]`).addClass('active');
            elevator.addDestination(floor);

            if (elevator.isIdle()) {
                elevator._processNextDestination();
            }

            return true;
        }
        /**
         * Open elevator door
         */
    openDoor(elevatorId) {
            const elevator = this.building.getElevator(elevatorId);
            if (!elevator) {
                console.error(`Elevator ${elevatorId} not found`);
                return false;
            }
            if (elevator.isMoving() || elevator.areDoorsOpen() ||
                elevator.isInEmergency || elevator.getState() === 'DOOR_OPENING') {
                return false;
            }

            elevator.openDoors();
            return true;
        }
        /**
         * Close elevator door
         */
    closeDoor(elevatorId) {
            const elevator = this.building.getElevator(elevatorId);
            if (!elevator) {
                console.error(`Elevator ${elevatorId} not found`);
                return false;
            }
            if (elevator.isMoving() || !elevator.areDoorsOpen() ||
                elevator.isInEmergency || elevator.getState() === 'DOOR_CLOSING') {
                return false;
            }

            elevator.closeDoors();
            return true;
        }
        /**
         * Handle elevator state change
         */
    _handleElevatorStateChange(elevator, oldState, newState) {
            switch (newState) {
                case 'MOVING_UP':
                case 'MOVING_DOWN':
                    this._updateFloorDirectionIndicators(elevator);
                    break;
                case 'IDLE':
                    this._clearFloorDirectionIndicators(elevator);
                    if (this.scheduler) {
                        this.scheduler._checkPendingCalls();
                    }
                    break;
                case 'LOADING':
                    this._setDoorCloseTimer(elevator);
                    break;
            }
            console.log(`Elevator ${elevator.id} state changed from ${oldState} to ${newState}`);
        }
        /**
         * Handle elevator floor change
         */
    _handleElevatorFloorChange(elevator, oldFloor, newFloor) {
            if (elevator.destinations.includes(newFloor)) {
                $(`.elevator-floor-button[data-elevator="${elevator.id}"][data-floor="${newFloor}"]`)
                    .removeClass('active');
            }
            const floorObj = this.building.getFloor(newFloor);
            if (floorObj) {
                floorObj.setUpButtonState(false);
                floorObj.setDownButtonState(false);
            }

            if (elevator.nextDestination === newFloor) {
                elevator.playSound('arrival');
                setTimeout(() => {
                    elevator.openDoors();
                }, 200);
            }

            this._updateFloorDirectionIndicators(elevator);
            console.log(`Elevator ${elevator.id} moved from floor ${oldFloor} to ${newFloor}`);
        }
        /**
         * Update floor direction indicators for an elevator
         */
    _updateFloorDirectionIndicators(elevator) {
            this._clearFloorDirectionIndicators(elevator);
            if (elevator.getDirection()) {
                const floor = this.building.getFloor(elevator.getCurrentFloor());
                if (floor) {
                    floor.setElevatorIndicator(elevator.id, elevator.getDirection());
                }
            }
        }
        /**
         * Clear floor direction indicators for an elevator
         */
    _clearFloorDirectionIndicators(elevator) {
            this.building.getFloors().forEach(floor => {
                floor.setElevatorIndicator(elevator.id, null);
            });
        }
        /**
         * Set timer for automatic door closing
         */
    _setDoorCloseTimer(elevator) {
            if (this.timers[elevator.id]) {
                clearTimeout(this.timers[elevator.id]);
            }

            const doorOpenTime = this.settings ? this.settings.getDoorOpenTime() : 3000;

            this.timers[elevator.id] = setTimeout(() => {
                elevator.closeDoors();
            }, doorOpenTime);
        }
        /**
         * Update elevator positions in DOM based on screen size
         */
    updateElevatorPositions() {
            Object.values(this.building.getElevators()).forEach(elevator => {
                elevator._updateDOMPosition();
            });
        }
        /**
         * Reset the controller
         */
    reset() {
            Object.values(this.timers).forEach(timer => clearTimeout(timer));
            this.timers = {};

            $('.elevator-floor-button').removeClass('active');
            console.log('Elevator controller reset');
        }
        /**
         * Plays the bell sound for a specific elevator
         */
    playBellSound(elevatorId) {
        const elevator = this.building.getElevator(elevatorId);
        if (elevator) {
            elevator.playSound('bell');
        }
    }
}