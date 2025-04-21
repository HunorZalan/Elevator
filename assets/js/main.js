/**
 * Elevator Control System - Main Application
 */

const App = {
    components: {
        settings: null,
        building: null,
        elevatorController: null,
        elevatorScheduler: null,
        emergencyHandler: null
    },
    /**
     * Initialize the application
     */
    init: function() {
        this.initComponents();
        this.setupEventListeners();
        console.log('Elevator Control System initialized');
    },
    /**
     * Initialize components
     */
    initComponents: function() {
        try {
            this.components.settings = window.settings;
            this.createModels();
            this.createControllers();
            console.log('Components successfully initialized');
        } catch (error) {
            console.error('Error initializing components: ' + error.message);
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
        console.log('Model objects created');
    },
    /**
     * Create controllers
     */
    createControllers: function() {
        this.components.elevatorScheduler = new ElevatorScheduler({
            building: this.components.building
        });
        this.components.elevatorController = new ElevatorController({
            building: this.components.building,
            scheduler: this.components.elevatorScheduler,
            settings: this.components.settings
        });
        this.components.emergencyHandler = new EmergencyHandler({
            building: this.components.building,
            elevatorController: this.components.elevatorController
        });
        console.log('Controllers created');
    },
    /**
     * Set up UI event listeners
     */
    setupEventListeners: function() {
        $('.floor-button').on('click', (e) => {
            const floor = parseInt($(e.currentTarget).data('floor'));
            const direction = $(e.currentTarget).data('direction');
            console.log(`Elevator call: floor ${floor}, direction ${direction}`);
            this.components.elevatorController.callElevator(floor, direction);
        });
        $('.elevator-floor-button').on('click', (e) => {
            const elevatorId = $(e.currentTarget).data('elevator');
            const floor = parseInt($(e.currentTarget).data('floor'));
            console.log(`Destination selected: elevator ${elevatorId}, floor ${floor}`);
            this.components.elevatorController.selectDestination(elevatorId, floor);
        });
        $('.emergency-button').on('click', (e) => {
            const elevatorId = $(e.currentTarget).data('elevator');
            console.warn(`Emergency: elevator ${elevatorId}`);
            this.components.emergencyHandler.triggerEmergency(elevatorId);
        });
        $('.door-open-button').on('click', (e) => {
            const elevatorId = $(e.currentTarget).data('elevator');
            console.log(`Opening doors: elevator ${elevatorId}`);
            this.components.elevatorController.openDoor(elevatorId);
        });
        $('.door-close-button').on('click', (e) => {
            const elevatorId = $(e.currentTarget).data('elevator');
            console.log(`Closing doors: elevator ${elevatorId}`);
            this.components.elevatorController.closeDoor(elevatorId);
        });
        $('.bell-button').on('click', (e) => {
            const elevatorId = $(e.currentTarget).data('elevator');
            console.log(`Bell: elevator ${elevatorId}`);
            this.components.elevatorController.playBellSound(elevatorId);
        });
        $('#reset-system').on('click', () => {
            this.resetSystem();
        });
        console.log('Event listeners set up');
    },
    /**
     * Reset the entire system
     */
    resetSystem: function() {
        this.components.building.reset();
        this.components.elevatorController.reset();
        this.components.emergencyHandler.reset();
        this.components.elevatorScheduler.reset();
        console.log('System reset complete');
    },
};

$(document).ready(function() {
    $('#current-year').text(new Date().getFullYear());
    App.init();
});