# listens to tuio events and passes them along to clients

import pythontuio as tuio
from simple_websocket_server import WebSocketServer, WebSocket
import json
from threading import Thread
tuio_client = tuio.TuioClient(("192.168.11.1", 1900))
#tuio_client = tuio.TuioClient(("localhost",3333))
tuio_task = Thread(target=tuio_client.start)

class TuioSender(WebSocket):
    def __init__(self,server,sock,address):
        super(TuioSender,self).__init__(server,sock,address)
        self.listener = tuio.TuioListener()
        self.listener.add_tuio_object = self.add_tuio_object
        self.listener.remove_tuio_object = self.remove_tuio_object
        self.listener.update_tuio_object = self.update_tuio_object

        self.listener.add_tuio_cursor = self.add_tuio_cursor
        self.listener.remove_tuio_cursor = self.remove_tuio_cursor
        self.listener.update_tuio_cursor = self.update_tuio_cursor
        tuio_client.add_listener(self.listener)
        self.obj_map = {-3142370:"pen", 612:"eraser"}
    def connected(self):
        print("got new connection!")
        if not tuio_task.is_alive():
            tuio_task.start()
    def handle(self):
        print("handle was called...")
    def handle_close(self):
        print("got close!")
        tuio_client.remove_all_listeners()
    def add_tuio_object(self,obj):
        data = {"session_id":obj.session_id,
                "type": "touch" if obj.class_id not in self.obj_map.keys() else self.obj_map[obj.class_id],
                "event" : "touchstart",
                "pos" : obj.position,
                "velocity" : obj.velocity,
                "motion_acceleration":obj.motion_acceleration,
                "angle":obj.angle,
                "velocity_rotation":obj.velocity_rotation,
                "rotation_acceleration":obj.rotation_acceleration
                }
        self.send_message(json.dumps(data))
    def update_tuio_object(self,obj):
        data = {"session_id":obj.session_id,
                "type": "touch" if obj.class_id not in self.obj_map.keys() else self.obj_map[obj.class_id],
                "event" : "touchmove",
                "pos" : obj.position,
                "velocity" : obj.velocity,
                "motion_acceleration":obj.motion_acceleration,
                "angle":obj.angle,
                "velocity_rotation":obj.velocity_rotation,
                "rotation_acceleration":obj.rotation_acceleration
                }
        self.send_message(json.dumps(data))
    def remove_tuio_object(self,obj):
        data = {"session_id":obj.session_id,
                "type": "touch" if obj.class_id not in self.obj_map.keys() else self.obj_map[obj.class_id],
                "event" : "touchend",
                "pos" : obj.position,
                "velocity" : obj.velocity,
                "motion_acceleration":obj.motion_acceleration,
                "angle":obj.angle,
                "velocity_rotation":obj.velocity_rotation,
                "rotation_acceleration":obj.rotation_acceleration
                }
        self.send_message(json.dumps(data))
        
    def add_tuio_cursor(self,cursor):
        data = {"session_id":cursor.session_id,
                "type": "touch",
                "event" : "touchstart",
                "pos" : cursor.position,
                "velocity" : cursor.velocity,
                "motion_acceleration":cursor.motion_acceleration,
                }
        self.send_message(json.dumps(data))
    
    def update_tuio_cursor(self,cursor):
        data = {"session_id":cursor.session_id,
                "type": "touch",
                "event" : "touchmove",
                "pos" : cursor.position,
                "velocity" : cursor.velocity,
                "motion_acceleration":cursor.motion_acceleration,
                }
        self.send_message(json.dumps(data))
    def remove_tuio_cursor(self,cursor):
        data = {"session_id":cursor.session_id,
                "type": "touch",
                "event" : "touchend",
                "pos" : cursor.position,
                "velocity" : cursor.velocity,
                "motion_acceleration":cursor.motion_acceleration
                }
        self.send_message(json.dumps(data))

port = 8675
server = WebSocketServer('localhost',port,TuioSender)
print(f"tuio events are being sent to web app at: ws://localhost:{port}")
server.serve_forever()
