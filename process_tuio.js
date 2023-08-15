// this is for processing tuio events from a touch surface
// takes the TUIO data and converts to touch and pointer events



export const tuio_socket = new WebSocket("ws://localhost:8675");
tuio_socket.addEventListener('open', function (event) {
    console.log("connected to tuio websocket");
});
tuio_socket.addEventListener("message", function (event) {
    let data = JSON.parse(event.data);
    processEvent(data);
});


let event_map = { "touchstart": "pointerdown", "touchmove": "pointermove", "touchend": "pointerup" }
let touches = [];
let fakeData = {
    motion_acceleration: 0,
    pos: [0.49948158860206604, 0.37476181983947754],
    session_id: 132,
    type: "add_cursor",
    velocity: [0, 0]
}

function processEvent(data) {
    let target = getTarget(data);
    let touchEvent = getTouchEvent(data);
    target.dispatchEvent(touchEvent);
    let pointerEvent = getPointerEvent(touchEvent,data.type);
    
    target.dispatchEvent(pointerEvent);
    
}
function getPointerEvent(touchEvent,pointerType) {
    return new PointerEvent(event_map[touchEvent.type], {
        pointerId: touchEvent.changedTouches[0].identifier,//touchEvent.type == "touchend" ? touches.length + 1 : touches.length,
        pageX: touchEvent.changedTouches[0].pageX,
        pageY: touchEvent.changedTouches[0].pageY,
        clientX: touchEvent.changedTouches[0].clientX,
        clientY: touchEvent.changedTouches[0].clientY,
        target: touchEvent.changedTouches[0].target,
        pointerType: pointerType,
        bubbles: true,
        cancelable: true
    });
}
function getTouchEvent(data) {
    let event = null;
    switch (data.event) {
        case "touchstart":
            event = startTouch(data);
            break;
        case "touchmove":
            event = updateTouch(data);
            break;
        case "touchend":
            event = removeTouch(data);
            break;
    }
    return event;
}
function convertTuioPos(data) { //converts tuio pos data to browser position
    return {
        x: window.outerWidth * data.pos[0] - (window.outerWidth - window.innerWidth),
        y: window.outerHeight * data.pos[1] - (window.outerHeight - window.innerHeight)
    }
}
function getTarget(data) {
    let pos = convertTuioPos(data);
    
    let possibleTarget = document.elementFromPoint(pos.x, pos.y);
    return possibleTarget;
}
function createTouch(data) {
    let pos = convertTuioPos(data);
    
    return new Touch({
        identifier: data.session_id,
        clientX: pos.x,
        clientY: pos.y,
        pageX: pos.x + window.scrollX,
        pageY: pos.y + window.scrollY,
        target: getTarget(data),
        screenX: screen.width * data.pos[0],
        screenY: screen.height * data.pos[1]
    });
}
function startTouch(data) {
    let newTouch = createTouch(data)
    touches.push(newTouch);
    return new TouchEvent(data.event, {
        targetTouches: touches.filter(touch => touch.target == newTouch.target),
        changedTouches: [newTouch],
        touches: touches,
        cancelable: true,
        bubbles: true,
        composed: true
    });

}
function removeTouch(data) {
    let rmTouch = touches.filter(touch => touch.identifier == data["session_id"]);
    touches = touches.filter(touch => touch.identifier != data["session_id"]);

    return new TouchEvent(data.event, {
        changedTouches: rmTouch,
        targetTouches: touches.filter(touch => touch.target == rmTouch[0].target),
        touches: touches,
        cancelable: true,
        bubbles: true,
        composed: true
    });

}
function updateTouch(data) {
    touches = touches.filter(touch => touch.identifier != data["session_id"]);
    let newTouch = createTouch(data);
    touches.push(newTouch);
    return new TouchEvent(data.event, {
        targetTouches: touches.filter(touch => touch.target == newTouch.target),
        touches: touches,
        changedTouches: [newTouch],
        cancelable: true,
        bubbles: true,
        composed: true
    });
}
