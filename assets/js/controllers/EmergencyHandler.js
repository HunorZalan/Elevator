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
        }
        /**
         * Trigger emergency for an elevator
         */
    triggerEmergency(elevatorId) {
        const elevator = this.building.getElevator(elevatorId);
        if (!elevator) {
            console.error(`Elevator ${elevatorId} not found`);
            return false;
        }
        if (elevator.isInEmergency) {
            return this.cancelEmergency(elevatorId);
        }

        elevator.setEmergency(true);
        elevator.playSound('emergency');

        $(`.emergency-button[data-elevator="${elevatorId}"]`).addClass('active');

        console.warn(`Emergency triggered for elevator ${elevatorId}`);
        return true;
    }

    /**
     * Cancel emergency for an elevator
     */
    cancelEmergency(elevatorId) {
            const elevator = this.building.getElevator(elevatorId);
            if (!elevator) {
                console.error(`Elevator ${elevatorId} not found`);
                return false;
            }

            elevator.setEmergency(false);

            $(`.emergency-button[data-elevator="${elevatorId}"]`).removeClass('active');

            console.info(`Emergency canceled for elevator ${elevatorId}`);
            return true;
        }
        /**
         * Reset all emergency states
         */
    reset() {
        Object.values(this.building.getElevators()).forEach(elevator => {
            elevator.isInEmergency = false;
        });
        $('.emergency-button').removeClass('active');

        console.info('All emergency states reset');
        return true;
    }
}