from pythontuio import TuioClient
from pythontuio import Cursor
from pythontuio import TuioListener
from threading import Thread

class MyListener(TuioListener):
  def add_tuio_cursor(self,cursor:Cursor):
    print("detect a new Cursor")
    print(vars(cursor))
  (...)

client = TuioClient(("192.168.11.1",1900))
t=Thread(target=client.start)
listener=MyListener()
client.add_listener(listener)

t.start()
