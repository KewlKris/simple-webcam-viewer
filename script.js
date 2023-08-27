const POPUP_TYPES = {
    ERROR: 0,
    SELECT: 1,
};
let showingVideo = false;

async function main() {
    // Hydrate buttons
    hydrate();

    // Check for permission to use media devices
    let permission = await getPermission();
    if (!permission) {
        configurePopup(POPUP_TYPES.ERROR);
        setErrorMessage(`Unable to access your device's camera. Please enable camera permission in your browser's settings in order to use this site.`);
        showPopup();
        return;
    }

    // Permission has been granted! Show device selector
    await showDevicesPrompt();
}

/**
 * @returns {Boolean} - True if permission was granted
 */
async function getPermission() {
    try {
        await navigator.mediaDevices.getUserMedia({video: true, audio: true}); // Request to get permission
        return true;
    } catch (_) {
        return false;
    }
}

async function showDevicesPrompt() {
    hideSettings();
    showingVideo = false;
    let devices = await navigator.mediaDevices.enumerateDevices();
    devices = devices.filter(d => d.kind == 'videoinput');

    if (devices.length == 0) {
        configurePopup(POPUP_TYPES.ERROR);
        setErrorMessage(`No camera devices detected! Permission should be granted, is your webcam connected properly?`);
        showPopup();
    }

    setSelectElement(devices);
    configurePopup(POPUP_TYPES.SELECT);
    showPopup();
}

/**
 * @param {String} id 
 */
async function loadCamera(id) {
    hidePopup();
    let stream = await navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: id,
        }
    });
    el('webcam').srcObject = stream;
    el('webcam').play();

    // Add settings
    showSettings();
    showingVideo = true;
}

function setSelectElement(devices) {
    const select = el('device-select');
    select.replaceChildren(); // Remove existing options

    for (let device of devices) {
        let option = document.createElement('option');
        option.value = device.deviceId;
        option.innerText = device.label;
        select.appendChild(option);
    }
}

function hydrate() {
    el('popup-close').addEventListener('click', hidePopup);
    el('refresh-button').addEventListener('click', () => {window.location.reload()});
    el('submit-button').addEventListener('click', () => {
        loadCamera(el('device-select').value);
    });
    el('settings').addEventListener('click', () => {showDevicesPrompt()});
    let idleTimer = undefined;
    el('webcam').addEventListener('pointermove', () => {
        if (showingVideo) {
            showSettings();
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                hideSettings();
            }, 2000);
        }
    });
}

/**
 * @param {String} msg 
 */
function setErrorMessage(msg) {
    el('error-span').innerText = msg;
}

function showPopup() {
    const div = el('popup-div');
    div.style.top = '6rem';
    showMask();
}

function hidePopup() {
    const div = el('popup-div');
    div.style.top = '-20rem';
    hideMask();
}

function showSettings() {
    const set = el('settings');
    set.style.bottom = '1rem';
}

function hideSettings() {
    const set = el('settings');
    set.style.bottom = '-6rem';
}

function showMask() {
    const mask = el('mask');
    mask.style.opacity = '0.7';
    mask.style.pointerEvents = 'auto';
}

function hideMask() {
    const mask = el('mask');
    mask.style.opacity = '0.0';
    mask.style.pointerEvents = 'none';
}

/**
 * @param {POPUP_TYPES} type 
 */
function configurePopup(type) {
    const popups = ['popup-content-error', 'popup-content-select'];
    for (let name of popups) el(name).style.display = 'none'; // Hide all pop-up messages

    switch (type) {
        case POPUP_TYPES.ERROR:
            el(popups[0]).style.display = '';
            break;
        case POPUP_TYPES.SELECT:
            el(popups[1]).style.display = '';
            break;
    }
}

/**
 * @param {String} e 
 * @returns {HTMLElement}
 */
function el(e) {
    return document.getElementById(e);
}

// Start main
main();