import request from 'request';

function makeRequest(method, uri, data, options) {
  // FIXME: use promise adapter
  return new Promise((resolve, reject) => {
    request({
      url:             uri,
      method:          method,
      // FIXME
      body:            data, // && JSON.parse(data),
      // `request` automatically parses the response body as JSON with this
      // option.
      // The content type header is not enough, as per: https://github.com/mikeal/request/issues/718
      json:            true,
      // accept:          options.accept,
      // headers: {
      //   contentType: data && options.contentType
      // }
      headers: options.headers || {}
    }, function (err, response, responseBody) {
      // console.log('post-request', response.request.headers);
      // console.log('response', response.headers, responseBody);
      // Avoids linting error
      // function getHeader(name) {
      //   return response.headers[name];
      // }

      // FIXME: check if bad err (no network etc)

      // Normalise to look like XMLHttpRequest
      var resp = {
        uri:         uri,
        status:      response.statusCode,
        // contentType: getHeader('content-type'),
        // location:    getHeader('location'),
        body:        responseBody,
        headers:     Object.mixin(response.headers, {
          'Content-Type': response.headers['content-type'],
          'Location':     response.headers['location']
        })
      };

      // TODO: Move inside of Argonaut: https://github.com/theefer/argonaut/issues/14
      if (isSuccess(resp.status)) {
        resolve(resp);
      } else {
        reject(resp);
      }
    });
  });
}


// Stolen from https://github.com/angular/angular.js/blob/cceb455fb167571e26341ded6b595dafd4d92bc6/src/ng/http.js#L81
function isSuccess(status) {
  return 200 <= status && status < 300;
}


export class Http {

  constructor(baseOptions = {}) {
    this.baseOptions = baseOptions;
  }

  get (uri, params, options = {}) {
    const opts = Object.mixin({}, this.baseOptions, options);
    return makeRequest('GET', uri, params, opts);
  }

  post (uri, data, options) {
    const opts = Object.mixin({}, this.baseOptions, options);
    return makeRequest('POST', uri, data, opts);
  }

  put (uri, data, options) {
    const opts = Object.mixin({}, this.baseOptions, options);
    return makeRequest('PUT', uri, data, opts);
  }

  patch (uri, data, options) {
    const opts = Object.mixin({}, this.baseOptions, options);
    return makeRequest('PATCH', uri, data, opts);
  }

  delete (uri, options) {
    const opts = Object.mixin({}, this.baseOptions, options);
    return makeRequest('DELETE', uri, null, opts);
  }
}
