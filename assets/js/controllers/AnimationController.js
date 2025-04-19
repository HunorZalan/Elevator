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
        this.logger = window.logger || console;
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
            case 'DOOR_OPENING':
                this._animateDoorOpening($elevatorElement);
                break;
            case 'DOOR_CLOSING':
                this._animateDoorClosing($elevatorElement);
                break;
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
     * Animate door opening
     */
    _animateDoorOpening($elevator) {
        $elevator.addClass('doors-open');
        this._playSound('doorOpen');
    }

    /**
     * Animate door closing
     */
    _animateDoorClosing($elevator) {
        $elevator.removeClass('doors-open');
        this._playSound('doorClose');
    }

    /**
     * Animate emergency state
     */
    _animateEmergency($elevator) {
        $elevator.addClass('emergency');
        this._playSound('emergency');
    }

    /**
     * Play sound effect
     */
    _playSound(soundType) {
        const soundsEnabled = this.settings ?
            (this.settings.current.soundsEnabled !== false) : true;

        if (!soundsEnabled) return;

        try {
            switch (soundType) {
                case 'doorOpen':
                    break;
                case 'doorClose':
                    break;
                case 'emergency':
                    this._playEmergencySound();
                    break;
                case 'bell':
                    this._playBellSound();
                    break;
            }
        } catch (error) {
            this.logger.error('Error playing sound: ' + error.message);
        }
    }

    /**
     * Play emergency sound
     */
    _playEmergencySound() {
        try {
            const audioContext = new(window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

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
        } catch (error) {
            this.logger.error('Error playing emergency sound: ' + error.message);
        }
    }

    /**
     * Play bell sound
     */
    _playBellSound() {
        try {
            const audioContext = new(window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);

            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 1);
        } catch (error) {
            this.logger.error('Error playing bell sound: ' + error.message);
        }
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
        this.logger.debug('Animations reset');
    }
}