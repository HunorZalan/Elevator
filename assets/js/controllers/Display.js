/**
 * Display controller for UI updates
 */

class Display {
    /**
     * @param {Object} config - Configuration object
     */
    constructor(config) {
        this.building = config.building;
        this.logger = window.logger || console;
        this.maxLogEntries = 10; // Maximum number of log entries to display
    }

    /**
     * Update elevator status display
     */
    updateElevatorStatus(elevatorId, state, floor) {
        $(`#status-elevator${elevatorId}`).text(`${state} (Floor ${floor})`);
    }

    /**
     * Add event to log
     */
    addEventToLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `${timestamp}: ${message}`;
        const $eventsList = $('#events-list');

        $eventsList.prepend(`<li>${logEntry}</li>`);
        if ($eventsList.children().length > this.maxLogEntries) {
            $eventsList.children().last().remove();
        }
    }

    /**
     * Update elevator state in DOM
     */
    updateElevatorState(elevatorId, state) {
        const $elevator = $(`#elevator-${elevatorId}`);
        $elevator.attr('data-state', state);
        $elevator.find('.elevator-status').text(state);
        $elevator.find('.elevator-status').attr('class', `elevator-status ${state}`);
    }

    /**
     * Update elevator floor in DOM
     */
    updateElevatorFloor(elevatorId, floor) {
        $(`#elevator-${elevatorId} .seven-segment`).text(floor);
    }

    /**
     * Toggle elevator doors
     */
    toggleElevatorDoors(elevatorId, isOpen) {
        const $elevator = $(`#elevator-${elevatorId}`);
        if (isOpen) {
            $elevator.addClass('doors-open');
        } else {
            $elevator.removeClass('doors-open');
        }
    }

    /**
     * Update floor button state
     */
    updateFloorButton(floorNumber, direction, isActive) {
        $(`.floor[data-floor="${floorNumber}"] .${direction}-button`).toggleClass('active', isActive);
    }

    /**
     * Update elevator direction indicator
     */
    updateDirectionIndicator(floorNumber, elevatorId, direction) {
        const $indicators = $(`.floor[data-floor="${floorNumber}"] .direction-indicator[data-elevator="${elevatorId}"] .indicator`);

        $indicators.removeClass('active');

        if (direction === 'up') {
            $(`.floor[data-floor="${floorNumber}"] .direction-indicator[data-elevator="${elevatorId}"] .up-indicator`).addClass('active');
        } else if (direction === 'down') {
            $(`.floor[data-floor="${floorNumber}"] .direction-indicator[data-elevator="${elevatorId}"] .down-indicator`).addClass('active');
        }
    }

    /**
     * Clear all indicators
     */
    clearAllIndicators() {
        $('.floor-button').removeClass('active');
        $('.indicator').removeClass('active');
        $('.elevator-floor-button').removeClass('active');
    }

    /**
     * Reset the display
     */
    reset() {
        $('#events-list').empty();
        this.clearAllIndicators();
        $('#status-elevatorA').text('IDLE (Floor 0)');
        $('#status-elevatorB').text('IDLE (Floor 6)');

        this.logger.debug('Display reset');
    }
}