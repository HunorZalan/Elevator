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
            this.events = {};
            this.debugInfo = {
                lastStateChange: Date.now(),
                stateHistory: [],
                moveCount: 0
            };
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
                console.error(`Invalid destination floor: ${floor}`);
                return false;
            }
            if (this.destinations.includes(floor)) {
                console.log(`Floor ${floor} already in destinations`);
                return false;
            }
            if (this.isInEmergency) {
                console.warn(`Elevator ${this.id} cannot accept new destinations in ${this.state} state`);
                return false;
            }
            if (floor === this.currentFloor && !this.doorsOpen && this.state !== "DOOR_OPENING") {
                this.openDoors();
                return true;
            }

            this.destinations.push(floor);
            this._sortDestinations();

            if (this.nextDestination === null && this.destinations.length > 0) {
                this.nextDestination = this.destinations[0];
                this._determineDirection();
            }

            $(`.elevator-floor-button[data-elevator="${this.id}"][data-floor="${floor}"]`).addClass('active');
            console.log(`Floor ${floor} added to elevator ${this.id} destinations`);
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
                const aboveCurrent = this.destinations.filter(floor => floor > this.currentFloor).sort((a, b) => a - b);
                const belowCurrent = this.destinations.filter(floor => floor < this.currentFloor).sort((a, b) => a - b);
                this.destinations = [...aboveCurrent, ...belowCurrent];
            } else if (this.direction === "down") {
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
            $(`.elevator-floor-button[data-elevator="${this.id}"]`).removeClass('active');
            this.destinations = [];
            this.nextDestination = null;
            this.direction = null;

            console.log(`Elevator ${this.id} destinations cleared`);
            this._triggerEvent('destinationsCleared');
        }
        /**
         * Set elevator state
         */
    setState(newState) {
            console.log(`Elevator ${this.id} state change: ${this.state} -> ${newState}`);

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
                case "LOADING":
                    this.doorsOpen = true;
                    break;
                case "EMERGENCY":
                    this.isInEmergency = true;
                    this.clearDestinations();
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
            }
        }
        /**
         * Move to a specific floor
         */
    moveToFloor(floor) {
            if (floor < this.minFloor || floor > this.maxFloor) {
                console.error(`Invalid floor: ${floor}`);
                return false;
            }
            if (floor === this.currentFloor) {
                console.log(`Elevator ${this.id} already at floor ${floor}`);
                return true;
            }
            if (this.isInEmergency) {
                console.warn(`Elevator ${this.id} cannot move in ${this.state} state`);
                return false;
            }

            const direction = floor > this.currentFloor ? "up" : "down";
            this.setState(direction === "up" ? "MOVING_UP" : "MOVING_DOWN");
            this.direction = direction;

            const oldFloor = this.currentFloor;
            this.currentFloor = floor;

            this._updateDOMPosition();

            console.log(`Elevator ${this.id} moving from floor ${oldFloor} to ${floor}`);

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
            if (this.doorsOpen || this.state === "DOOR_OPENING") return;

            this.playSound('doorOpen');
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
            if (!this.doorsOpen || this.state === "DOOR_CLOSING") return;

            this.playSound('doorClose');
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
         * Plays a sound effect for elevator events
         */
    playSound(soundType) {
            try {
                const audioContext = new(window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                switch (soundType) {
                    case 'doorOpen':
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.5);
                        break;
                    case 'doorClose':
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.5);
                        break;
                    case 'bell':
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 1);
                        break;
                    case 'arrival':
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
                        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.4);
                        break;
                    case 'emergency':
                        oscillator.type = 'square';
                        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

                        for (let i = 0; i < 5; i++) {
                            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + i * 0.4);
                            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + i * 0.4 + 0.2);

                            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + i * 0.4);
                            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.4 + 0.2);
                        }

                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);

                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 2);
                        break;
                }
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

            } catch (error) {
                console.error('Error playing sound:', error);
            }
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

        if (initialFloor !== undefined) {
            this.currentFloor = initialFloor;
        }

        this._updateDOMPosition();
        this._updateDOMState();

        console.log(`Elevator ${this.id} reset to floor ${this.currentFloor}`);

        this._triggerEvent('reset', {
            floor: this.currentFloor
        });
    }
}