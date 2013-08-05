importScripts('NeuQuant.js');

function run(data) {
    var length = Object.keys(data).length;
    var numberPixels = length / 4; // 4 components = rgba
    var sampleInterval = 10;
    var bgrPixels = [];
    var offset = 0;
    var i, r, g, b;
    var pixels = new Uint8Array(numberPixels); // it's an indexed image so 1 byte per pixel is enough

    // extract RGB values into BGR for the quantizer
    while(offset < length) {
        r = data[offset++];
        g = data[offset++];
        b = data[offset++];
        bgrPixels.push(b);
        bgrPixels.push(g);
        bgrPixels.push(r);

        offset++;
    }

    var nq = new NeuQuant(bgrPixels, bgrPixels.length, sampleInterval);

    var paletteBGR = nq.process(); // create reduced palette
    var palette = [];

    for(i = 0; i < paletteBGR.length; i+=3) {
        b = paletteBGR[i];
        g = paletteBGR[i+1];
        r = paletteBGR[i+2];
        palette.push(r << 16 | g << 8 | b);
    }
    var paletteArray = new Uint32Array(palette);

    var k = 0;
    for (var j = 0; j < numberPixels; j++) {
        b = bgrPixels[k++];
        g = bgrPixels[k++];
        r = bgrPixels[k++];
        var index = nq.map(b, g, r);
        pixels[j] = index;
    }

    return ({
        pixels: pixels,
        palette: paletteArray
    });
}

self.onmessage = function(ev) {
    var data = ev.data;
    var response = run(data);
    postMessage(response);
};
