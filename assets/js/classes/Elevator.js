/**
 * Elevator class for managing elevator state and logic
 */

class Elevator {
    /**
     * @param {Object} config - Elevator configuration object
     */
    constructor(config) {
        this.id = config.id || "A";
        this.currentFloor = config.currentFloor || 0;
        this.maxFloor = config.maxFloor || 6;
        this.minFloor = config.minFloor || 0;
        this.state = "IDLE"; // IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPENING, DOOR_CLOSING, LOADING, EMERGENCY, MAINTENANCE, OVERLOADED, STOPPED
        this.direction = null; // "up", "down", or null if stationary
        this.doorsOpen = false;
        this.destinations = []; // List of destinations
        this.nextDestination = null; // Next destination
        this.isInEmergency = false;
        this.isInMaintenance = false;
        this.isOverloaded = false;
        this.events = {};
        this.debugInfo = {
            lastStateChange: Date.now(),
            stateHistory: [],
            moveCount: 0
        };
        this.logger = window.logger || console;
    }

    // Getter methods
    getState() { return this.state; }
    getCurrentFloor() { return this.currentFloor; }
    getDirection() { return this.direction; }
    isIdle() { return this.state === "IDLE"; }
    isMoving() { return this.state === "MOVING_UP" || this.state === "MOVING_DOWN"; }
    areDoorsOpen() { return this.doorsOpen; }

    /**
     * Add a destination floor
     */
    addDestination(floor) {
        if (floor < this.minFloor || floor > this.maxFloor) {
            this.logger.error(`Invalid destination floor: ${floor}`);
            return false;
        }

        if (this.destinations.includes(floor)) {
            this.logger.debug(`Floor ${floor} already in destinations`);
            return false;
        }

        if (this.isInEmergency || this.isInMaintenance || this.isOverloaded) {
            this.logger.warn(`Elevator ${this.id} cannot accept new destinations in ${this.state} state`);
            return false;
        }

        this.destinations.push(floor);

        this._sortDestinations();

        if (this.nextDestination === null && this.destinations.length > 0) {
            this.nextDestination = this.destinations[0];
            this._determineDirection();
        }

        this.logger.debug(`Floor ${floor} added to elevator ${this.id} destinations`);
        this._triggerEvent('destinationAdded', { floor });

        return true;
    }

    /**
     * Sort destinations based on current direction
     */
    _sortDestinations() {
        if (this.direction === null && this.destinations.length > 0) {
            this._determineDirection();
        }

        if (this.direction === "up") {
            // When going up, first floors above current, then floors below
            const aboveCurrent = this.destinations.filter(floor => floor > this.currentFloor).sort((a, b) => a - b);
            const belowCurrent = this.destinations.filter(floor => floor < this.currentFloor).sort((a, b) => a - b);
            this.destinations = [...aboveCurrent, ...belowCurrent];
        } else if (this.direction === "down") {
            // When going down, first floors below current, then floors above
            const belowCurrent = this.destinations.filter(floor => floor < this.currentFloor).sort((a, b) => b - a);
            const aboveCurrent = this.destinations.filter(floor => floor > this.currentFloor).sort((a, b) => b - a);
            this.destinations = [...belowCurrent, ...aboveCurrent];
        }

        this.destinations = this.destinations.filter(floor => floor !== this.currentFloor);

        if (this.destinations.length > 0) {
            this.nextDestination = this.destinations[0];
        } else {
            this.nextDestination = null;
        }
    }

    /**
     * Determine direction based on current state and destinations
     */
    _determineDirection() {
        if (this.destinations.length === 0) {
            this.direction = null;
            return;
        }

        if (this.nextDestination > this.currentFloor) {
            this.direction = "up";
        } else if (this.nextDestination < this.currentFloor) {
            this.direction = "down";
        }
        // If destination is current floor, keep previous direction or null if no direction
    }

    /**
     * Clear all destinations
     */
    clearDestinations() {
        this.destinations = [];
        this.nextDestination = null;
        this.direction = null;

        this.logger.debug(`Elevator ${this.id} destinations cleared`);
        this._triggerEvent('destinationsCleared');
    }

    /**
     * Set elevator state
     */
    setState(newState, data = {}) {
        this.logger.debug(`Elevator ${this.id} state change: ${this.state} -> ${newState}`);

        this.debugInfo.lastStateChange = Date.now();
        this.debugInfo.stateHistory.push({
            from: this.state,
            to: newState,
            timestamp: Date.now()
        });

        const oldState = this.state;

        this.state = newState;

        switch (newState) {
            case "IDLE":
                this.direction = null;
                break;
            case "MOVING_UP":
                this.direction = "up";
                this.debugInfo.moveCount++;
                break;
            case "MOVING_DOWN":
                this.direction = "down";
                this.debugInfo.moveCount++;
                break;
            case "DOOR_OPENING":
                break;
            case "DOOR_CLOSING":
                break;
            case "LOADING":
                this.doorsOpen = true;
                break;
            case "EMERGENCY":
                this.isInEmergency = true;
                this.clearDestinations();
                break;
            case "MAINTENANCE":
                this.isInMaintenance = true;
                this.clearDestinations();
                break;
            case "OVERLOADED":
                this.isOverloaded = true;
                break;
            case "STOPPED":
                break;
        }

        this._updateDOMState();

        this._triggerEvent('stateChanged', {
            oldState,
            newState,
            floor: this.currentFloor
        });
    }

    /**
     * Update elevator representation in the DOM
     */
    _updateDOMState() {
        const $elevator = $(`#elevator-${this.id}`);

        if ($elevator.length) {
            $elevator.attr('data-state', this.state);

            $elevator.find('.elevator-status').text(this.state);
            $elevator.find('.seven-segment').text(this.currentFloor);

            if (this.doorsOpen) {
                $elevator.addClass('doors-open');
            } else {
                $elevator.removeClass('doors-open');
            }

            if (window.settings && window.settings.isDebugMode()) {
                const debugInfo = `Floor: ${this.currentFloor} | State: ${this.state} | Next: ${this.nextDestination || 'None'}`;
                $elevator.attr('data-debug', debugInfo);
            }
        }
    }

    /**
     * Move to a specific floor
     */
    moveToFloor(floor) {
        if (floor < this.minFloor || floor > this.maxFloor) {
            this.logger.error(`Invalid floor: ${floor}`);
            return false;
        }
        if (floor === this.currentFloor) {
            this.logger.debug(`Elevator ${this.id} already at floor ${floor}`);
            return true;
        }
        if (this.isInEmergency || this.isInMaintenance || this.isOverloaded) {
            this.logger.warn(`Elevator ${this.id} cannot move in ${this.state} state`);
            return false;
        }

        const direction = floor > this.currentFloor ? "up" : "down";
        this.setState(direction === "up" ? "MOVING_UP" : "MOVING_DOWN");
        this.direction = direction;

        const oldFloor = this.currentFloor;
        this.currentFloor = floor;

        this._updateDOMPosition();

        this.logger.debug(`Elevator ${this.id} moving from floor ${oldFloor} to ${floor}`);

        this._triggerEvent('floorChanged', {
            oldFloor,
            newFloor: floor,
            direction
        });

        return true;
    }

    /**
     * Update elevator position in the DOM
     */
    _updateDOMPosition() {
        const $elevator = $(`#elevator-${this.id}`);

        if ($elevator.length) {
            $elevator.attr('data-floor', this.currentFloor);

            if (window.innerWidth <= 992) {
                $elevator.css({
                    'left': `calc(${this.currentFloor} * (100% / 7))`,
                    'bottom': '0'
                });
            } else {
                $elevator.css({
                    'left': '0',
                    'bottom': `calc(${this.currentFloor} * var(--floor-height))`
                });
            }
        }
    }

    /**
     * Open elevator doors
     */
    openDoors() {
        if (this.doorsOpen) return;

        this.setState("DOOR_OPENING");

        setTimeout(() => {
            this.doorsOpen = true;
            this._updateDOMState();
            this.setState("LOADING");

            this._triggerEvent('doorsOpened', {
                floor: this.currentFloor
            });
        }, window.settings ? window.settings.getDoorAnimationTime() : 700);

        return true;
    }

    /**
     * Close elevator doors
     */
    closeDoors() {
        if (!this.doorsOpen) return;

        this.setState("DOOR_CLOSING");

        setTimeout(() => {
            this.doorsOpen = false;
            this._updateDOMState();

            if (this.destinations.length > 0) {
                this._processNextDestination();
            } else {
                this.setState("IDLE");
            }

            this._triggerEvent('doorsClosed', {
                floor: this.currentFloor
            });
        }, window.settings ? window.settings.getDoorAnimationTime() : 700);

        return true;
    }

    /**
     * Process next destination
     */
    _processNextDestination() {
        if (this.destinations.length === 0) {
            this.nextDestination = null;
            this.setState("IDLE");
            return;
        }

        this.nextDestination = this.destinations[0];
        this.moveToFloor(this.nextDestination);
        this.destinations.shift();

        if (this.destinations.length === 0) {
            this.nextDestination = null;
        }
    }

    /**
     * Set emergency state
     */
    setEmergency(isEmergency) {
        if (isEmergency) {
            this.isInEmergency = true;
            this.setState("EMERGENCY");
        } else {
            this.isInEmergency = false;
            this.setState("IDLE");
        }

        this._triggerEvent('emergencyChanged', {
            isEmergency
        });

        return true;
    }

    /**
     * Set maintenance state
     */
    setMaintenance(isMaintenance) {
        if (isMaintenance) {
            this.isInMaintenance = true;
            this.setState("MAINTENANCE");
        } else {
            this.isInMaintenance = false;
            this.setState("IDLE");
        }

        this._triggerEvent('maintenanceChanged', {
            isMaintenance
        });

        return true;
    }

    /**
     * Set overloaded state
     */
    setOverloaded(isOverloaded) {
        if (isOverloaded) {
            this.isOverloaded = true;
            this.setState("OVERLOADED");
        } else {
            this.isOverloaded = false;
            this.setState("IDLE");
        }

        this._triggerEvent('overloadedChanged', {
            isOverloaded
        });

        return true;
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
                    elevator: this,
                    ...data
                });
            });
        }
    }

    /**
     * Reset elevator to initial state
     */
    reset(initialFloor) {
        this.clearDestinations();

        this.state = "IDLE";
        this.direction = null;
        this.doorsOpen = false;
        this.isInEmergency = false;
        this.isInMaintenance = false;
        this.isOverloaded = false;

        if (initialFloor !== undefined) {
            this.currentFloor = initialFloor;
        }

        this._updateDOMPosition();
        this._updateDOMState();

        this.logger.debug(`Elevator ${this.id} reset to floor ${this.currentFloor}`);

        this._triggerEvent('reset', {
            floor: this.currentFloor
        });
    }
}