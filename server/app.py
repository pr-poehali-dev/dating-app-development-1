import base64
import importlib.util
import os
import sys
import traceback
import uuid
from pathlib import Path

from flask import Flask, Response, request

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"

app = Flask(__name__)
_handlers = {}


class Context:
    def __init__(self):
        self.request_id = str(uuid.uuid4())
        self.function_name = "local"
        self.function_version = "1"
        self.memory_limit_in_mb = 512


def load_handlers():
    for folder in sorted(BACKEND_DIR.iterdir()):
        entry = folder / "index.py"
        if not folder.is_dir() or not entry.exists():
            continue
        name = folder.name
        sys.path.insert(0, str(folder))
        before = set(sys.modules)
        spec = importlib.util.spec_from_file_location(f"fn_{name.replace('-', '_')}", entry)
        module = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(module)
            if hasattr(module, "handler"):
                _handlers[name] = module.handler
                print(f"  loaded  {name}")
            else:
                print(f"  skipped {name}: нет handler")
        except Exception as exc:
            print(f"  FAILED  {name}: {exc}")
        finally:
            sys.path.pop(0)
            folder_str = str(folder)
            for mod_name in set(sys.modules) - before:
                mod = sys.modules.get(mod_name)
                mod_file = getattr(mod, "__file__", None) or ""
                if mod_file.startswith(folder_str):
                    del sys.modules[mod_name]


def build_event():
    headers = dict(request.headers)
    if "Authorization" in headers:
        headers.setdefault("X-Authorization", headers["Authorization"])
    if "Cookie" in headers:
        headers.setdefault("X-Cookie", headers["Cookie"])

    raw = request.get_data()
    try:
        body = raw.decode("utf-8")
        is_b64 = False
    except UnicodeDecodeError:
        body = base64.b64encode(raw).decode("ascii")
        is_b64 = True

    ip = request.headers.get("X-Real-IP") or request.headers.get(
        "X-Forwarded-For", request.remote_addr or ""
    ).split(",")[0].strip()

    return {
        "httpMethod": request.method,
        "headers": headers,
        "queryStringParameters": dict(request.args),
        "body": body,
        "isBase64Encoded": is_b64,
        "path": request.path,
        "requestContext": {"identity": {"sourceIp": ip, "userAgent": request.headers.get("User-Agent", "")}},
    }


@app.route("/health")
def health():
    return {"status": "ok", "functions": sorted(_handlers.keys())}


@app.route("/<name>", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@app.route("/<name>/", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def invoke(name):
    fn = _handlers.get(name)
    if fn is None:
        return {"error": f"function '{name}' not found"}, 404

    try:
        result = fn(build_event(), Context())
    except Exception:
        traceback.print_exc()
        return {"error": "internal error"}, 500

    body = result.get("body", "")
    if result.get("isBase64Encoded"):
        body = base64.b64decode(body)

    resp = Response(body, status=result.get("statusCode", 200))
    for key, value in (result.get("headers") or {}).items():
        if key.lower() == "x-set-cookie":
            resp.headers.add("Set-Cookie", value)
        else:
            resp.headers[key] = value
    for cookie in result.get("multiValueHeaders", {}).get("Set-Cookie", []):
        resp.headers.add("Set-Cookie", cookie)
    resp.headers.setdefault("Access-Control-Allow-Origin", "*")
    return resp


print("Загрузка функций:")
load_handlers()
print(f"Готово: {len(_handlers)} функций\n")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))