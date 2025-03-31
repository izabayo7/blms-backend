const fs = require('fs')
var data = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAA..kJggg==';

function decodeBase64Image(dataString) {
    var matches = dataString.match(),
        response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}

var imageBuffer = decodeBase64Image(data);
const dir = './abana'
fs.exists(dir, exist => {
    if (!exist) {
        console.log('creating dir')
        fs.mkdirSync(dir, {
            recursive: true
        })
    }
    fs.writeFile(dir + '/test.jpg', imageBuffer.data, function (err) { console.log(err) });
})
