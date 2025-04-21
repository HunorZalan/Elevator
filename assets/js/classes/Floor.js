/**
 * Floor class for managing floor state
 */

class Floor {
    /**
     * @param {Object} config - Floor configuration
     */
    constructor(config) {
            this.number = config.number || 0;
            this.upButtonPressed = false;
            this.downButtonPressed = false;
            this.hasUpButton = config.hasUpButton !== undefined ? config.hasUpButton : (this.number < config.maxFloor);
            this.hasDownButton = config.hasDownButton !== undefined ? config.hasDownButton : (this.number > config.minFloor);
            this.elevatorIndicators = {};
            this.logger = window.logger || console;
            this._initDom();
        }
        /**
         * Initialize floor elements in DOM
         */
    _initDom() {
            const $floor = $(`.floor[data-floor="${this.number}"]`);
            if ($floor.length) {
                if (!this.hasUpButton) {
                    $floor.find('.up-button').hide();
                }
                if (!this.hasDownButton) {
                    $floor.find('.down-button').hide();
                }
            }
        }
        /**
         * Set "up" button state
         */
    setUpButtonState(pressed) {
            this.upButtonPressed = pressed;
            $(`.floor[data-floor="${this.number}"] .up-button`).toggleClass('active', pressed);
            console.log(`Floor ${this.number} up button ${pressed ? 'pressed' : 'released'}`);
        }
        /**
         * Set "down" button state
         */
    setDownButtonState(pressed) {
            this.downButtonPressed = pressed;
            $(`.floor[data-floor="${this.number}"] .down-button`).toggleClass('active', pressed);
            console.log(`Floor ${this.number} down button ${pressed ? 'pressed' : 'released'}`);
        }
        /**
         * Set elevator direction indicator
         */
    setElevatorIndicator(elevatorId, direction) {
            this.elevatorIndicators[elevatorId] = direction;

            const $indicator = $(`.floor[data-floor="${this.number}"] .direction-indicator[data-elevator="${elevatorId}"]`);
            $indicator.find('.indicator').removeClass('active');

            if (direction === 'up') {
                $indicator.find('.up-indicator').addClass('active');
            } else if (direction === 'down') {
                $indicator.find('.down-indicator').addClass('active');
            }

            console.log(`Floor ${this.number} elevator ${elevatorId} indicator set to ${direction || 'none'}`);
        }
        /**
         * Reset floor state
         */
    reset() {
        this.upButtonPressed = false;
        this.downButtonPressed = false;
        this.elevatorIndicators = {};

        const $floor = $(`.floor[data-floor="${this.number}"]`);
        $floor.find('.floor-button').removeClass('active');
        $floor.find('.indicator').removeClass('active');

        console.log(`Floor ${this.number} reset`);
    }
}