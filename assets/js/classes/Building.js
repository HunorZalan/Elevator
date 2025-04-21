/**
 * Building class to manage floors and elevators
 */

class Building {
    /**
     * @param {Object} config - Building configuration
     */
    constructor(config) {
            this.floorCount = config.floorCount || 7; // 0-6
            this.elevatorCount = config.elevatorCount || 2; // A & B

            this.floors = [];
            for (let i = 0; i < this.floorCount; i++) {
                this.floors.push(new Floor({
                    number: i,
                    minFloor: 0,
                    maxFloor: this.floorCount - 1,
                    hasUpButton: i < this.floorCount - 1,
                    hasDownButton: i > 0
                }));
            }

            this.elevators = {};

            this.elevators['A'] = new Elevator({
                id: 'A',
                currentFloor: 0,
                minFloor: 0,
                maxFloor: this.floorCount - 1
            });
            this.elevators['B'] = new Elevator({
                id: 'B',
                currentFloor: this.floorCount - 1,
                minFloor: 0,
                maxFloor: this.floorCount - 1
            });

            this.events = {};
            this._setupElevatorEvents();

            console.log('Building initialized with ' + this.floorCount + ' floors and ' + this.elevatorCount + ' elevators');
        }
        /**
         * Set up event listeners for elevators
         */
    _setupElevatorEvents() {
            Object.values(this.elevators).forEach(elevator => {
                elevator.on('stateChanged', (data) => {
                    this._triggerEvent('elevatorStateChanged', data);
                });
                elevator.on('floorChanged', (data) => {
                    this._triggerEvent('elevatorFloorChanged', data);
                });
                elevator.on('doorsOpened', (data) => {
                    this._triggerEvent('elevatorDoorsOpened', data);
                });
                elevator.on('doorsClosed', (data) => {
                    this._triggerEvent('elevatorDoorsClosed', data);
                });
            });
        }
        // Getter methods
    getFloors() { return this.floors; }
    getFloor(number) { return this.floors.find(floor => floor.number === number); }
    getElevators() { return this.elevators; }
    getElevator(id) { return this.elevators[id]; }
        /**
         * Call elevator to a floor
         */
    callElevator(floorNumber, direction) {
            if (floorNumber < 0 || floorNumber >= this.floorCount) {
                this.logger.error(`Invalid floor number: ${floorNumber}`);
                return false;
            }
            if (direction !== 'up' && direction !== 'down') {
                this.logger.error(`Invalid direction: ${direction}`);
                return false;
            }
            const elevatorsAtFloor = Object.values(this.elevators).filter(
                elevator => elevator.getCurrentFloor() === floorNumber && elevator.areDoorsOpen()
            );
            if (elevatorsAtFloor.length > 0) {
                console.debug(`Elevator already at floor ${floorNumber} with doors open`);
                $(`#elevator-${elevatorsAtFloor[0].id}`).addClass('elevator-arrive-flash');
                setTimeout(() => {
                    $(`#elevator-${elevatorsAtFloor[0].id}`).removeClass('elevator-arrive-flash');
                }, 500);
                return true;
            }

            const floor = this.getFloor(floorNumber);
            if (direction === 'up') {
                floor.setUpButtonState(true);
            } else {
                floor.setDownButtonState(true);
            }
            this._triggerEvent('elevatorCalled', {
                floor: floorNumber,
                direction
            });

            return true;
        }
        /**
         * Find the closest elevator to a floor
         */
    findClosestElevator(floorNumber, direction) {
            const availableElevators = Object.values(this.elevators).filter(elevator =>
                !elevator.isInEmergency
            );
            if (availableElevators.length === 0) {
                console.warn('No available elevators');
                return null;
            }

            // Calculate distances for each elevator
            const elevatorDistances = availableElevators.map(elevator => {
                const distance = Math.abs(elevator.getCurrentFloor() - floorNumber);
                // Check if elevator is idle or already moving in the right direction
                const isIdleOrRightDirection =
                    elevator.isIdle() ||
                    (elevator.getDirection() === direction) ||
                    (elevator.getDirection() === null);

                return {
                    elevator,
                    distance,
                    isIdleOrRightDirection
                };
            });

            // First, try to find an elevator that's already moving in the right direction
            const rightDirectionElevators = elevatorDistances.filter(e => e.isIdleOrRightDirection);

            if (rightDirectionElevators.length > 0) {
                // Sort by distance
                rightDirectionElevators.sort((a, b) => a.distance - b.distance);

                // If two elevators are equidistant, choose the one from the lower floor
                if (rightDirectionElevators.length >= 2 &&
                    rightDirectionElevators[0].distance === rightDirectionElevators[1].distance) {

                    return rightDirectionElevators[0].elevator.getCurrentFloor() <=
                        rightDirectionElevators[1].elevator.getCurrentFloor() ?
                        rightDirectionElevators[0].elevator :
                        rightDirectionElevators[1].elevator;
                }

                return rightDirectionElevators[0].elevator;
            }

            // If no elevators are moving in the right direction, choose the closest one
            elevatorDistances.sort((a, b) => a.distance - b.distance);

            // If two elevators are equidistant, choose the one from the lower floor
            if (elevatorDistances.length >= 2 &&
                elevatorDistances[0].distance === elevatorDistances[1].distance) {

                return elevatorDistances[0].elevator.getCurrentFloor() <=
                    elevatorDistances[1].elevator.getCurrentFloor() ?
                    elevatorDistances[0].elevator :
                    elevatorDistances[1].elevator;
            }

            return elevatorDistances[0].elevator;
        }
        /**
         * Register event handler
         */
    on(eventName, callback) {
            if (!this.events[eventName]) {
                this.events[eventName] = [];
            }

            this.events[eventName].push(callback);
        }
        /**
         * Trigger event
         */
    _triggerEvent(eventName, data) {
            if (this.events[eventName]) {
                this.events[eventName].forEach(callback => {
                    callback({
                        building: this,
                        ...data
                    });
                });
            }
        }
        /**
         * Reset the building state
         */
    reset() {
        this.floors.forEach(floor => floor.reset());
        this.elevators['A'].reset(0); // Ground floor
        this.elevators['B'].reset(this.floorCount - 1); // Top floor
        console.info('Building reset to initial state');
        this._triggerEvent('buildingReset');
    }
}