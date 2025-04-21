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
                darkMode: false,
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
                this.updateUIValues();
            });
            $('#door-time-control').val(this.current.doorOpenTime).on('input', (e) => {
                this.updateSetting('doorOpenTime', parseInt($(e.target).val()));
                this.calculateTimings();
                this.updateUIValues();
            });
            $('#theme-toggle').on('click', () => {
                this.toggleDarkMode();
            });
            $('#reset-system').on('click', () => {
                this.resetToDefaults();
            });
        }
        /**
         * Updates the UI elements to display current setting values
         */
    updateUIValues() {
            const speedValue = this.current.elevatorSpeed;
            const moveTime = this.current.timing.elevatorMoveTime / 1000;
            $('#speed-value').text(`${speedValue} (${moveTime}s)`);

            const doorTime = this.current.doorOpenTime;
            $('#door-time-value').text(`${doorTime}s`);

            if (this.current.darkMode) {
                $('#theme-toggle').html('<i class="fas fa-sun"></i> Light Mode');
            } else {
                $('#theme-toggle').html('<i class="fas fa-moon"></i> Dark Mode');
            }
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
        }
        /**
         * Update a setting
         */
    updateSetting(key, value) {
            this.current[key] = value;
        }
        /**
         * Toggle dark mode
         */
    toggleDarkMode() {
            this.current.darkMode = !this.current.darkMode;
            $('body').toggleClass('dark-mode', this.current.darkMode);
            this.updateUIValues();
        }
        /**
         * Reset to default settings
         */
    resetToDefaults() {
            this.current = {...this.defaults };
            this.calculateTimings();
            $('#speed-control').val(this.current.elevatorSpeed);
            $('#door-time-control').val(this.current.doorOpenTime);
            $('body').removeClass('dark-mode');
            this.updateUIValues();
            console.log('Settings reset to defaults');
        }
        // Getter methods
    getElevatorTransitionTime() { return this.current.timing.elevatorMoveTime; }
    getDoorAnimationTime() { return this.current.timing.doorAnimationTime; }
    getDoorOpenTime() { return this.current.timing.doorOpenTime; }
    getLoadingTime() { return this.current.stateDurations.loading; }
    getFloorCount() { return this.current.floorCount; }
    getElevatorCount() { return this.current.elevatorCount; }
    isDarkMode() { return this.current.darkMode; }
}

window.settings = new Settings();