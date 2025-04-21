/**
 * AnimationController manages elevator animations
 */

class AnimationController {
    /**
     * @param {Object} config - Configuration object
     */
    constructor(config) {
            this.building = config.building;
            this.settings = config.settings;
            this._setupEventListeners();
        }
        /**
         * Set up event listeners
         */
    _setupEventListeners() {
            this.building.on('elevatorStateChanged', (data) => {
                this._handleStateChange(data.elevator, data.newState);
            });
            $(window).on('resize', () => {
                this._updateAnimationsForScreenSize();
            });
        }
        /**
         * Handle elevator state change
         */
    _handleStateChange(elevator, newState) {
            const $elevatorElement = $(`#elevator-${elevator.id}`);
            switch (newState) {
                case 'MOVING_UP':
                case 'MOVING_DOWN':
                    $elevatorElement.addClass('elevator-moving');
                    break;
                case 'IDLE':
                case 'LOADING':
                    $elevatorElement.removeClass('elevator-moving');
                    break;
                case 'EMERGENCY':
                    this._animateEmergency($elevatorElement);
                    break;
            }
        }
        /**
         * Animate emergency state
         */
    _animateEmergency($elevator) {
            $elevator.addClass('emergency');
        }
        /**
         * Update animations for screen size
         */
    _updateAnimationsForScreenSize() {
            const elevators = this.building.getElevators();
            const isMobile = window.innerWidth <= 992;

            Object.values(elevators).forEach(elevator => {
                const $elevatorElement = $(`#elevator-${elevator.id}`);

                if (isMobile) {
                    $elevatorElement.addClass('mobile-view');
                } else {
                    $elevatorElement.removeClass('mobile-view');
                }
            });
        }
        /**
         * Reset all animations
         */
    reset() {
        $('.elevator').removeClass('doors-open elevator-moving emergency mobile-view');
        console.log.debug('Animations reset');
    }
}