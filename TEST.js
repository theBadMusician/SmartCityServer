const http = require('http');

const hostname = '127.0.0.1';
const port = 8080;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', "text/javascript");
  res.end(String(Math.random() * 10));
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

function onRequest(request, response) {

    if (request.method == 'GET' && request.url == '/') {
      response.writeHead(200, {"Context-Type" : "text\plain"});
      fs.createReadStream ('./index.html').pipe(response);
    } else if (request.method === 'POST' && request.url == '/do-work') {
  
      // asuming sync as in your example
      let result = my_code.func(request.body); 
      response.writeHead(200, {"Context-Type" : "application/json"});
      response.write(JSON.stringify({
  
        result: result
      }))
      response.end();
    } else {
      send404Response(response);
    }
  }