export default class Ajax {
    constructor(options = {}) {
        const defaults = {
            baseURL: '',
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        };
        this.config = Object.assign({}, defaults, options);
    }
    setHeader(k, v) {
        this.config.headers = this.config.headers || {};
        this.config.headers[k] = v;
    }
    setBaseURL(url) {
        this.config.baseURL = url;
    }
    setTimeout(ms) {
        this.config.timeout = ms;
    }
    async _request(method, url, data, opts = {}) {
        const conf = Object.assign({}, this.config, opts);
        conf.headers = Object.assign(
            {},
            this.config.headers,
            opts.headers || {}
        );
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), conf.timeout);
        const full =
            conf.baseURL && !/^https?:\/\//i.test(url)
                ? conf.baseURL + url
                : url;
        const init = {
            method,
            headers: conf.headers,
            signal: controller.signal,
        };
        if (data != null) {
            init.body = JSON.stringify(data);
        }
        try {
            const res = await fetch(full, init);
            clearTimeout(id);
            const ct = res.headers.get('content-type') || '';
            if (!res.ok) {
                let body = '';
                let parsed = null;
                try {
                    if (ct.includes('application/json')) {
                        parsed = await res.json();
                        body = JSON.stringify(parsed);
                    } else {
                        body = await res.text();
                    }
                } catch (e) {
                    body = '';
                }
                const err = new Error(`HTTP ${res.status} ${res.statusText}`);
                err.name = 'AjaxError';
                err.status = res.status;
                err.statusText = res.statusText;
                err.url = full;
                err.method = method;
                err.body = parsed !== null ? parsed : body;
                throw err;
            }
            if (res.status === 204) return null;
            if (ct.includes('application/json')) return await res.json();
            return await res.text();
        } catch (e) {
            clearTimeout(id);
            if (e.name === 'AbortError')
                throw new Error(`Timeout after ${conf.timeout} ms`);
            throw e;
        }
    }
    async get(url, opts) {
        return this._request('GET', url, null, opts);
    }
    async post(url, data, opts) {
        return this._request('POST', url, data, opts);
    }
    async put(url, data, opts) {
        return this._request('PUT', url, data, opts);
    }
    async delete(url, opts) {
        return this._request('DELETE', url, null, opts);
    }
}
