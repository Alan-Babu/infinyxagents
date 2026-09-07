# Streaming through the `agentsapi.nfinyx.ai` gateway

The app builds to static files (`nx build mofa -c production` → `dist/apps/mofa/browser`) and is
deployed straight onto the local server's existing nginx -- there's no separate container for this
app. `apps/mofa/src/environments/environment.ts` points `baseURL` at `https://agentsapi.nfinyx.ai`,
so the **browser** calls that gateway directly for every `/mofa-chatbot/api/...` request, including
`/chat/messages/stream`. That gateway's own nginx is therefore the one and only hop that needs the
streaming-safe settings below.

The current server block for this agent (confirmed against the live config) is:

```nginx
server {
    server_name agentsapi.nfinyx.ai;

    client_max_body_size 25m;

    location /mofa-chatbot/ {
        proxy_pass http://127.0.0.1:8019/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Chat turns can involve several LLM/search round-trips -- mirror the
        # generous timeout used for this project's own /exec-agent nginx config.
        proxy_read_timeout 120s;
    }
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/agentsapi.nfinyx.ai/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/agentsapi.nfinyx.ai/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```

As-is, this buffers `/chat/messages/stream`'s response and delivers it all at once at the end --
the request/response cycle still works correctly, but every latency benefit from task 1 of the
optimization plan is silently lost at this hop. **This is the one file, outside both repos, that
still needs a manual edit** (this backend is reached here via `127.0.0.1:8019` on the gateway host
itself, not through docker-compose, so nothing in either repo can apply this automatically).

## The fix

Add the four lines below inside the `location /mofa-chatbot/` block (nothing else in the block
needs to change -- the existing `Upgrade`/`Connection "upgrade"` headers, timeout, and body-size
limit are all still correct and unrelated to this):

```nginx
    location /mofa-chatbot/ {
        proxy_pass http://127.0.0.1:8019/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;

        # Added for /chat/messages/stream's NDJSON streaming (see the
        # latency optimization plan) -- without these, this hop buffers the
        # whole reply and delivers it in one shot at the end, same as before
        # streaming existed. Every other route under /mofa-chatbot/ is
        # request/response as usual and is unaffected by these.
        proxy_buffering off;
        proxy_cache off;
        gzip off;
        proxy_set_header X-Accel-Buffering no;
    }
```

Then reload nginx (`sudo nginx -t && sudo systemctl reload nginx`, or the equivalent for however
this host manages it) -- no restart of the backend itself is needed, this is purely a proxy-layer
change.

## If it can't be applied yet

`sendMessageStream()` in `MofaChatApiService` degrades gracefully either way: the caller just won't
see `onDelta` calls until the single buffered `done` event arrives, functionally identical to the
pre-streaming behavior -- so shipping the app-side streaming work does not depend on this gateway
change landing first.
