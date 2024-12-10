from http.server import BaseHTTPRequestHandler
from os.path import join

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type','text/plain')
        self.end_headers()
        with open(join('scraper_code', 'freefood_scraper_azuredb.py'), 'r') as file:
            code = file.read()
            exec(code)
        return
