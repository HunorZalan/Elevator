/**
 * General Logger management class
 */

class Logger {
    constructor(debugMode = false) {
        this.debugMode = debugMode;
        this._initToastr();
    }

    _hasToastr() { return typeof toastr !== 'undefined'; }

    _initToastr() {
        if (this._hasToastr()) {
            toastr.options = {
                closeButton: true,
                progressBar: true,
                timeOut: 4000,
                extendedTimeOut: 2000,
                preventDuplicates: true,
                positionClass: 'toast-top-right',
                showDuration: 300,
                hideDuration: 1000,
                showMethod: 'fadeIn',
                hideMethod: 'fadeOut'
            };
        }
    }

    _showNotification(type, message) {
        if (this._hasToastr()) { toastr[type](message); } else { alert(message); }
    }

    log(message, options = { toast: false, console: true }) {
        if (options.console) { console.log(message); }
        if (options.toast) { this._showNotification('info', message); }
    }

    info(message, options = { toast: true, console: true }) {
        if (options.console) { console.info(message); }
        if (options.toast) { this._showNotification('info', message); }
    }

    success(message, options = { toast: true, console: false }) {
        if (options.console) { console.log('Success: ', message); }
        if (options.toast) { this._showNotification('success', message); }
    }

    warn(message, options = { toast: true, console: true }) {
        if (options.console) { console.warn(message); }
        if (options.toast) { this._showNotification('warning', message); }
    }

    error(message, options = { toast: true, console: true }) {
        if (options.console) { console.error(message); }
        if (options.toast) { this._showNotification('error', message); }
    }

    debug(message) {
        if (this.debugMode) { console.log('Debug: ', message); }
    }

    enableDebug() {
        this.debugMode = true;
        console.info('Debug mode enabled!');
    }

    disableDebug() {
        this.debugMode = false;
        console.info('Debug mode disabled!');
    }
}