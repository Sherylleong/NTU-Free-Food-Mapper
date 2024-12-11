from http.server import BaseHTTPRequestHandler
from os.path import join

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        with open(join('app','api', 'cronjob', 'freefood_scraper_azuredb.py'), 'r') as file:
            code = file.read()
            exec(code)
        self.send_response(200)
        self.send_header('Content-type','text/plain')
        self.end_headers()
        return