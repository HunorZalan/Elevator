/**
 * Settings class for handling elevator system configuration
 */
class Settings {
    constructor() {
        this.defaults = {
            elevatorSpeed: 5, // 1-10
            doorOpenTime: 3, // Seconds
            floorCount: 7, // 0-6
            elevatorCount: 2, // A, B
            debugMode: false,
            timing: { // Timing settings in ms
                elevatorMoveTime: 1000, // Base time to move one floor
                doorOpenTime: 3000, // Time door stays open
                doorAnimationTime: 700, // Door open/close animation time
            },
            stateDurations: { // State durations in ms
                doorOpening: 700,
                doorClosing: 700,
                loading: 3000,
            },
        };
        this.current = {...this.defaults };
        this.init();
    }

    /**
     * Initialize settings and event handlers
     */
    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.syncWithCSSVars();
    }

    /**
     * Set up event listeners for UI controls
     */
    setupEventListeners() {
        $('#speed-control').val(this.current.elevatorSpeed).on('input', (e) => {
            this.updateSetting('elevatorSpeed', parseInt($(e.target).val()));
            this.calculateTimings();
        });
        $('#door-time-control').val(this.current.doorOpenTime).on('input', (e) => {
            this.updateSetting('doorOpenTime', parseInt($(e.target).val()));
            this.calculateTimings();
        });
        $('#toggle-debug').on('click', () => {
            this.toggleDebugMode();
        });
        $('#reset-system').on('click', () => {
            this.resetToDefaults();
        });
    }

    /**
     * Synchronize settings with CSS variables
     */
    syncWithCSSVars() {
        document.documentElement.style.setProperty('--elevator-transition', `${this.getElevatorTransitionTime()}ms`);
        document.documentElement.style.setProperty('--door-transition', `${this.current.timing.doorAnimationTime}ms`);
        document.documentElement.style.setProperty('--door-open-delay', `${this.current.timing.doorOpenTime}ms`);
    }

    /**
     * Calculate timings based on elevator speed
     */
    calculateTimings() {
        // Set elevator speed (inverse relationship: higher value = shorter time)
        const speedFactor = (11 - this.current.elevatorSpeed) / 5; // Scale 1-10: 10 = fastest, 1 = slowest
        this.current.timing.elevatorMoveTime = Math.round(1000 * speedFactor);
        this.current.timing.doorOpenTime = this.current.doorOpenTime * 1000;
        this.current.stateDurations.loading = this.current.timing.doorOpenTime;

        this.syncWithCSSVars();
        this.saveToLocalStorage();
    }

    /**
     * Update a setting
     */
    updateSetting(key, value) {
        this.current[key] = value;
        this.saveToLocalStorage();
    }

    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        this.current.debugMode = !this.current.debugMode;
        $('body').toggleClass('debug-mode', this.current.debugMode);
        this.saveToLocalStorage();

        const logger = window.logger || console;
        if (this.current.debugMode) {
            logger.info('Debug mode enabled');
        } else {
            logger.info('Debug mode disabled');
        }
    }

    /**
     * Reset to default settings
     */
    resetToDefaults() {
        this.current = {...this.defaults };
        this.calculateTimings();

        $('#speed-control').val(this.current.elevatorSpeed);
        $('#door-time-control').val(this.current.doorOpenTime);

        $('body').toggleClass('debug-mode', this.current.debugMode);

        this.saveToLocalStorage();
        const logger = window.logger || console;
        logger.info('Settings reset to defaults');
    }

    /**
     * Load settings from local storage
     */
    loadFromLocalStorage() {
        try {
            const savedSettings = localStorage.getItem('elevatorSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                this.current = {...this.defaults, ...parsed };

                $('body').toggleClass('debug-mode', this.current.debugMode);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    /**
     * Save settings to local storage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('elevatorSettings', JSON.stringify(this.current));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    // Getter methods
    getElevatorTransitionTime() { return this.current.timing.elevatorMoveTime; }
    getDoorAnimationTime() { return this.current.timing.doorAnimationTime; }
    getDoorOpenTime() { return this.current.timing.doorOpenTime; }
    getLoadingTime() { return this.current.stateDurations.loading; }
    getFloorCount() { return this.current.floorCount; }
    getElevatorCount() { return this.current.elevatorCount; }
    isDebugMode() { return this.current.debugMode; }
}

window.settings = new Settings();