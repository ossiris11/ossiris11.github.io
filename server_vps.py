#!/usr/bin/env python3
import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import re
import base64
import sys

PORT = 8088

def decode_caesar(s):
    out = []
    for c in s:
        if 'a' <= c <= 'z' or 'A' <= c <= 'Z':
            limit = 90 if c <= 'Z' else 122
            code = ord(c) + 18
            val = code if limit >= code else code - 26
            out.append(chr(val))
        else:
            out.append(c)
    caesar = ''.join(out)
    caesar += '=' * (-len(caesar) % 4)
    try:
        return base64.b64decode(caesar).decode('utf-8', errors='ignore')
    except Exception:
        return ''

def resolve_kodik(link):
    if not link:
        return {'success': False, 'error': 'No link provided'}
    if not link.startswith('http'):
        link = 'https:' + link if link.startswith('//') else 'https://' + link
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://kodikplayer.com/'
    }
    
    try:
        req = urllib.request.Request(link, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return {'success': False, 'error': f'Failed to fetch player page: {str(e)}'}
    
    html_clean = html.replace('\r', '').replace('\n', '')
    url_params_match = re.search(r"urlParams\s*=\s*'([^']+)'", html_clean)
    type_match = re.search(r"(?:videoInfo|vInfo)\.type\s*=\s*'([^']+)'", html_clean)
    hash_match = re.search(r"(?:videoInfo|vInfo)\.hash\s*=\s*'([^']+)'", html_clean)
    id_match = re.search(r"(?:videoInfo|vInfo)\.id\s*=\s*'([^']+)'", html_clean)
    
    if not (url_params_match and type_match and hash_match and id_match):
        return {'success': False, 'error': 'Failed to parse video info from Kodik page'}
    
    try:
        params = json.loads(url_params_match.group(1))
    except Exception as e:
        return {'success': False, 'error': 'Invalid urlParams JSON'}
        
    postdata = (
        f'd={params.get("d", "")}'
        f'&d_sign={params.get("d_sign", "")}'
        f'&pd={params.get("pd", "")}'
        f'&pd_sign={params.get("pd_sign", "")}'
        f'&ref={params.get("ref", "")}'
        f'&ref_sign={params.get("ref_sign", "")}'
        '&bad_user=true&cdn_is_working=true'
        f'&type={type_match.group(1)}'
        f'&hash={hash_match.group(1)}'
        f'&id={id_match.group(1)}'
        '&info=%7B%7D'
    )
    
    origin_m = re.match(r'^(https?://[^/]+)', link)
    origin = origin_m.group(1) if origin_m else 'https://kodikplayer.com'
    ftor_url = f'{origin}/ftor'
    
    post_req = urllib.request.Request(
        ftor_url,
        data=postdata.encode('utf-8'),
        headers={
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            'Referer': link,
            'X-Requested-With': 'XMLHttpRequest'
        }
    )
    
    try:
        with urllib.request.urlopen(post_req, timeout=10) as resp:
            ftor_res = json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return {'success': False, 'error': f'Failed to call ftor: {str(e)}'}
        
    links = ftor_res.get('links', {})
    result = {}
    for q, arr in links.items():
        if arr and isinstance(arr, list) and len(arr) > 0 and 'src' in arr[0]:
            decoded = decode_caesar(arr[0]['src'])
            if decoded.startswith('//'):
                decoded = 'https:' + decoded
            result[f'{q}p'] = decoded
            
    if not result:
        return {'success': False, 'error': 'No streams found in Kodik response'}
        
    sorted_q = sorted(result.keys(), key=lambda x: int(re.sub(r'\D', '', x) or 0), reverse=True)
    best = sorted_q[0] if sorted_q else list(result.keys())[0]
    
    return {'success': True, 'links': result, 'stream': result[best], 'default_quality': best}

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        
        if parsed.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
            return
            
        if parsed.path == '/kodik':
            link = qs.get('link', [''])[0]
            res = resolve_kodik(link)
            data = json.dumps(res).encode('utf-8')
            self.send_response(200 if res.get('success') else 400)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == '/proxy':
            target_url = qs.get('url', [''])[0]
            if not target_url:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'Missing url param')
                return
            try:
                req = urllib.request.Request(target_url, headers={
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
                })
                with urllib.request.urlopen(req, timeout=15) as resp:
                    body = resp.read()
                    ct = resp.headers.get('Content-Type', 'text/plain')
                    self.send_response(200)
                    self.send_header('Content-Type', ct)
                    self.end_headers()
                    self.wfile.write(body)
            except Exception as e:
                self.send_response(502)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()
        self.wfile.write(b'Not found')

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        content_length = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_length)

        if parsed.path == '/kodik':
            link = qs.get('link', [''])[0]
            if not link:
                try:
                    data = json.loads(post_body.decode('utf-8'))
                    link = data.get('link', '')
                except Exception:
                    pass
            res = resolve_kodik(link)
            resp_bytes = json.dumps(res).encode('utf-8')
            self.send_response(200 if res.get('success') else 400)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(resp_bytes)
            return

        if parsed.path == '/proxy':
            target_url = qs.get('url', [''])[0]
            if not target_url:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'Missing url param')
                return
            try:
                content_type = self.headers.get('Content-Type', 'application/x-www-form-urlencoded')
                req = urllib.request.Request(target_url, data=post_body, headers={
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                    'Content-Type': content_type
                })
                with urllib.request.urlopen(req, timeout=15) as resp:
                    resp_data = resp.read()
                    ct = resp.headers.get('Content-Type', 'text/plain')
                    self.send_response(200)
                    self.send_header('Content-Type', ct)
                    self.end_headers()
                    self.wfile.write(resp_data)
            except Exception as e:
                self.send_response(502)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()
        self.wfile.write(b'Not found')

    def log_message(self, format, *args):
        pass

class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

if __name__ == '__main__':
    server = ThreadingServer(('0.0.0.0', PORT), ProxyHandler)
    print(f'Proxy server running on port {PORT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
