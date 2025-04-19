/**
 * Elevator Control System - Main Application
 */

const App = {
    components: {
        logger: null,
        settings: null,
        building: null,
        elevatorController: null,
        display: null,
        emergencyHandler: null,
        animationController: null
    },

    /**
     * Initialize the application
     */
    init: function() {
        this.initLogger();
        this.initComponents();
        this.setupEventListeners();

        this.components.logger.info('Elevator Control System initialized', { toast: false });
    },

    /**
     * Initialize logger component
     */
    initLogger: function() {
        if (!window.logger) {
            window.logger = new Logger(false);
        }
        this.components.logger = window.logger;
    },

    /**
     * Initialize components
     */
    initComponents: function() {
        try {
            this.components.settings = window.settings;
            this.createModels();
            this.createControllers();

            this.components.logger.debug('Components successfully initialized');
        } catch (error) {
            this.components.logger.error('Error initializing components: ' + error.message);
            console.error(error);
        }
    },

    /**
     * Create model objects
     */
    createModels: function() {
        this.components.building = new Building({
            floorCount: this.components.settings.getFloorCount(),
            elevatorCount: this.components.settings.getElevatorCount()
        });

        this.components.logger.debug('Model objects created');
    },

    /**
     * Create controllers
     */
    createControllers: function() {
        this.components.display = new Display({
            building: this.components.building
        });

        this.components.elevatorScheduler = new ElevatorScheduler({
            building: this.components.building
        });

        this.components.elevatorController = new ElevatorController({
            building: this.components.building,
            scheduler: this.components.elevatorScheduler,
            display: this.components.display,
            settings: this.components.settings
        });

        this.components.emergencyHandler = new EmergencyHandler({
            building: this.components.building,
            elevatorController: this.components.elevatorController
        });

        this.components.animationController = new AnimationController({
            building: this.components.building,
            settings: this.components.settings
        });

        this.components.logger.debug('Controllers created');
    },

    /**
     * Set up UI event listeners
     */
    setupEventListeners: function() {
        $('.floor-button').on('click', (e) => {
            const floor = parseInt($(e.currentTarget).data('floor'));
            const direction = $(e.currentTarget).data('direction');

            this.components.logger.debug(`Elevator call: floor ${floor}, direction ${direction}`);
            this.components.elevatorController.callElevator(floor, direction);
        });
        $('.elevator-floor-button').on('click', (e) => {
            const elevatorId = $(e.currentTarget).data('elevator');
            const floor = parseInt($(e.currentTarget).data('floor'));

            this.components.logger.debug(`Destination selected: elevator ${elevatorId}, floor ${floor}`);
            this.components.elevatorController.selectDestination(elevatorId, floor);
        });
        $('.emergency-button').on('click', (e) => {
            const elevatorId = $(e.currentTarget).data('elevator');

            this.components.logger.warn(`Emergency: elevator ${elevatorId}`);
            this.components.emergencyHandler.triggerEmergency(elevatorId);
        });
        $('.maintenance-button').on('click', (e) => {
            const elevatorId = $(e.currentTarget).data('elevator');

            this.components.logger.warn(`Maintenance: elevator ${elevatorId}`);
            this.components.emergencyHandler.setMaintenance(elevatorId);
        });
        $('.door-open-button').on('click', (e) => {
            const elevatorId = $(e.currentTarget).data('elevator');

            this.components.logger.debug(`Opening doors: elevator ${elevatorId}`);
            this.components.elevatorController.openDoor(elevatorId);
        });
        $('.door-close-button').on('click', (e) => {
            const elevatorId = $(e.currentTarget).data('elevator');

            this.components.logger.debug(`Closing doors: elevator ${elevatorId}`);
            this.components.elevatorController.closeDoor(elevatorId);
        });
        $('.bell-button').on('click', (e) => {
            const elevatorId = $(e.currentTarget).data('elevator');

            this.components.logger.debug(`Bell: elevator ${elevatorId}`);
            this.playBellSound();
        });
        $('#reset-system').on('click', () => {
            this.resetSystem();
        });

        this.components.logger.debug('Event listeners set up');
    },

    /**
     * Play bell sound effect
     */
    playBellSound: function() {
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
            this.components.logger.error('Error playing sound: ' + error.message);
        }
    },

    /**
     * Reset the entire system
     */
    resetSystem: function() {
        this.components.building.reset();
        this.components.elevatorController.reset();
        this.components.emergencyHandler.reset();
        this.components.animationController.reset();
        this.components.display.reset();

        this.components.logger.info('System reset complete', { toast: true });
    },
};

$(document).ready(function() {
    setTimeout(function() {
        App.init();
    }, 500);

    $('#current-year').text(new Date().getFullYear());
});