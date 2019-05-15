###################################################################

import logging
import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import os.path
import uuid
from os import environ
import json

from tornado.options import define, options

import mimetypes

###################################################################

import serverlogic
from utils.file import read_string_from_file

###################################################################

define("port", default=environ.get("PORT", 5000), help="run on the given port", type=int)

###################################################################

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/gif.worker.js", GifWorker),
            (r"/static/.*", MyStaticFileHandler),
            (r"/jsonapi", JsonApi),
            (r"/importstudy/.*", ImportStudy),
            (r"/test", Test),
            (r"/docs/.*", Docs),
            (r"/chatsocket", ChatSocketHandler)
        ]
        settings = dict(
            cookie_secret="__TODO:_GENERATE_YOUR_OWN_RANDOM_VALUE_HERE__",
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            #static_path=os.path.join(os.path.dirname(__file__), "static"),
            xsrf_cookies=False,
        )        
        super(Application, self).__init__(handlers, **settings)

class GifWorker(tornado.web.RequestHandler):
    def get(self):        
        with open("static/js/gif.worker.js", 'rb') as f:
            data = f.read()
            self.write(data)

class MyStaticFileHandler(tornado.web.RequestHandler):
    def get(self):        
        path = self.request.path        
        filepath = path[1:]
        if not os.path.isfile(filepath):
            self.set_status(404)
            return
        mimetype = mimetypes.guess_type(path)                
        if mimetype[0]:
            self.set_header("Content-Type", mimetype[0])
        with open(filepath, 'rb') as f:
            data = f.read()
            self.write(data)

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        print(self.request.__dict__)
        self.render("index.html", messages=ChatSocketHandler.cache)

class JsonApi(tornado.web.RequestHandler):
    def post(self):
        reqobj = json.loads(self.request.body.decode('utf-8'))
        resobj = serverlogic.jsonapi(reqobj)        
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps(resobj))

class ImportStudy(tornado.web.RequestHandler):
    def get(self):
        path = self.request.path
        parts = path.split("/")
        paramindex = parts.index("importstudy") + 1
        if ( len(parts) - paramindex ) < 2:
            self.write("too few parameters, usage: /importstudy/[usercode]/[studyid]")
            return
        usercode = parts[paramindex]
        studyid = parts[paramindex + 1]    
        nodeid = "root"    
        if ( paramindex + 2 ) < len(parts):
            nodeid = parts[paramindex + 2]
        self.redirect(f"/?task=importstudy&usercode={usercode}&studyid={studyid}&nodeid={nodeid}&tab=board&boardtab=tree")

class Test(tornado.web.RequestHandler):
    def get(self):        
        self.write(read_string_from_file("templates/test.html", "test"))

class Docs(tornado.web.RequestHandler):
    def get(self):        
        path = self.request.path        
        parts = path.split("/")
        self.write(read_string_from_file("docs/" + parts[2] + ".md", "Pgn Editor."))

class ChatSocketHandler(tornado.websocket.WebSocketHandler):
    waiters = set()
    cache = []
    cache_size = 200

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}

    def open(self):
        ChatSocketHandler.waiters.add(self)

    def on_close(self):
        ChatSocketHandler.waiters.remove(self)

    @classmethod
    def update_cache(cls, chat):
        cls.cache.append(chat)
        if len(cls.cache) > cls.cache_size:
            cls.cache = cls.cache[-cls.cache_size :]

    @classmethod
    def send_updates(cls, chat):
        logging.info("sending message to %d waiters", len(cls.waiters))
        for waiter in cls.waiters:
            try:
                waiter.write_message(chat)
            except:
                logging.error("Error sending message", exc_info=True)

    def on_message(self, message):
        logging.info("got message %r", message)
        parsed = tornado.escape.json_decode(message)
        chat = {"id": str(uuid.uuid4()), "body": parsed["body"]}
        chat["html"] = tornado.escape.to_basestring(
            self.render_string("message.html", message=chat)
        )

        ChatSocketHandler.update_cache(chat)
        ChatSocketHandler.send_updates(chat)

def main():
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)
    tornado.ioloop.IOLoop.current().start()

if __name__ == "__main__":
    main()

###################################################################