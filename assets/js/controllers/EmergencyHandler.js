/**
 * EmergencyHandler manages emergency and maintenance states
 */

class EmergencyHandler {
    /**
     * @param {Object} config - Configuration object
     */
    constructor(config) {
        this.building = config.building;
        this.elevatorController = config.elevatorController;
        this.logger = window.logger || console;
    }

    /**
     * Trigger emergency for an elevator
     */
    triggerEmergency(elevatorId) {
        const elevator = this.building.getElevator(elevatorId);

        if (!elevator) {
            this.logger.error(`Elevator ${elevatorId} not found`);
            return false;
        }

        if (elevator.isInEmergency) {
            return this.cancelEmergency(elevatorId);
        }

        elevator.setEmergency(true);

        $(`.emergency-button[data-elevator="${elevatorId}"]`).addClass('active');

        this.logger.warn(`Emergency triggered for elevator ${elevatorId}`);

        return true;
    }

    /**
     * Cancel emergency for an elevator
     */
    cancelEmergency(elevatorId) {
        const elevator = this.building.getElevator(elevatorId);

        if (!elevator) {
            this.logger.error(`Elevator ${elevatorId} not found`);
            return false;
        }

        elevator.setEmergency(false);

        $(`.emergency-button[data-elevator="${elevatorId}"]`).removeClass('active');

        this.logger.info(`Emergency canceled for elevator ${elevatorId}`);

        return true;
    }

    /**
     * Set maintenance state for an elevator
     */
    setMaintenance(elevatorId) {
        const elevator = this.building.getElevator(elevatorId);

        if (!elevator) {
            this.logger.error(`Elevator ${elevatorId} not found`);
            return false;
        }

        if (elevator.isInMaintenance) {
            return this.cancelMaintenance(elevatorId);
        }

        elevator.setMaintenance(true);

        $(`.maintenance-button[data-elevator="${elevatorId}"]`).addClass('active');

        this.logger.warn(`Maintenance mode activated for elevator ${elevatorId}`);

        return true;
    }

    /**
     * Cancel maintenance for an elevator
     */
    cancelMaintenance(elevatorId) {
        const elevator = this.building.getElevator(elevatorId);

        if (!elevator) {
            this.logger.error(`Elevator ${elevatorId} not found`);
            return false;
        }

        elevator.setMaintenance(false);

        $(`.maintenance-button[data-elevator="${elevatorId}"]`).removeClass('active');

        this.logger.info(`Maintenance mode deactivated for elevator ${elevatorId}`);

        return true;
    }

    /**
     * Set overloaded state for an elevator
     */
    setOverloaded(elevatorId, isOverloaded) {
        const elevator = this.building.getElevator(elevatorId);

        if (!elevator) {
            this.logger.error(`Elevator ${elevatorId} not found`);
            return false;
        }

        elevator.setOverloaded(isOverloaded);

        if (isOverloaded) {
            this.logger.warn(`Elevator ${elevatorId} is overloaded`);
        } else {
            this.logger.info(`Elevator ${elevatorId} is no longer overloaded`);
        }

        return true;
    }

    /**
     * Trigger building-wide emergency (all elevators to ground floor)
     */
    triggerBuildingEmergency() {
        this.logger.warn('Building emergency triggered');

        Object.values(this.building.getElevators()).forEach(elevator => {
            elevator.isInEmergency = false;
            elevator.isInMaintenance = false;

            elevator.clearDestinations();
            elevator.addDestination(0);

            if (elevator.isIdle()) {
                elevator._processNextDestination();
            }
        });

        return true;
    }

    /**
     * Handle power outage (safe shutdown)
     */
    handlePowerOutage() {
        this.logger.warn('Power outage detected, initiating safe shutdown');

        Object.values(this.building.getElevators()).forEach(elevator => {
            if (elevator.isMoving()) {
                elevator.setState('STOPPED');
            }
        });

        return true;
    }

    /**
     * Reset all emergency states
     */
    reset() {
        Object.values(this.building.getElevators()).forEach(elevator => {
            elevator.isInEmergency = false;
            elevator.isInMaintenance = false;
            elevator.isOverloaded = false;
        });
        $('.emergency-button').removeClass('active');
        $('.maintenance-button').removeClass('active');

        this.logger.info('All emergency states reset');

        return true;
    }
}