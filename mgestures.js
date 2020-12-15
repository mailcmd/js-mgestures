/*** 

I took some ideas from https://github.com/adkelley/elm-mouse-gesture and levenshtein algorithm. I also took some ideas and small pieces of code from the internet to be able to draw the mouse tail. 


Usage:

var ___gestures = new Gestures();
___gestures.install();  // enable gestures
...
...
___gestures.uninstall(); // disable gestures

***/

/*                                               N
  0: 'E',                               NW       2       NE                   
  1: 'NE',                                 3     |     1                       
  2: 'N',                                        |                         
  3: 'NW',                            W  4 ------+------ 0 E                    
  4: 'W',                                        |                         
  5: 'SW',                                 5     |     7                    
  6: 'S',                               SW       6       SE                  
  7: 'SE',                                       S                           
  8: 'E'    // 8 is equal to 0                                                              

  One direction every 100ms. Ex: 55555 is a diagonal SW traced in 0.5 seconds. 

*/



/////////////////////////////
// Gesture object definition

var Gestures = function (conf) {
        
    var mx = my = gst = ix = iy = undefined;
    var _this = this;
    var installed = false;
    
    _this.conf = Object.assign({}, {
        normalizeSize: true,
        normalizeTime: true,
        detectCircular: false,
        patterns: null,
        debug: 0
    }, conf);
    
    _this.onmousemove = function(e) {
        if (_this.mouseDown[2] != 1 || e.type == 'mouseup') {        
            if (gst) {
                _this.ts_stop = (new Date()).getTime();
                console.log('GESTURE: ', gst);
                var found = false;
                if (_this.conf.normalizeSize) gst = _this.normalizeSize(gst);
                if (_this.conf.normalizeSize && _this.conf.debug >= 2) console.log('Gesture size normalized: ', gst);
                if (_this.conf.normalizeTime && _this.conf.debug >= 2) console.log('Gesture time normalized!');
                
                for (i in _this.conf.patterns) {
                    const g = _this.conf.patterns[i];
                    for (j in g.patterns) {
                        if (_this.conf.normalizeSize && _this.conf.debug >= 2) console.log('Normalizing pattern size: ', g.patterns[j], ' (', g.name,')');
                        let p = (_this.conf.normalizeSize ? _this.normalizeSize(g.patterns[j]) : g.patterns[j]);
                        if (_this.conf.normalizeSize && _this.conf.debug >= 2) console.log('Normalized pattern size: ', p, ' (', g.name,')');

                        if (_this.conf.normalizeTime || g.normalizeTime) _this.normalizeTime(p.length);

                        const coef = _this.distance(p, g.normalizeSize ? _this.normalizeSize(gst) : gst);
                        
                        if (coef <= 0.3) {
                            found = true;
                            g.action(e);
                            if (_this.conf.debug >= 0) console.log('HIT! Pattern: [', g.name+'] '+p, 'vs', gst, ' - COEF: ', coef);
                            break;
                        } 
                        if (_this.conf.debug >= 1) console.log('FAIL! Pattern: [', g.name+'] '+p, 'vs', gst, ' - COEF: ', coef);
                    }
                    if (found) break;
                }
            }
            mx = my = gst = undefined;
            return;
        }

        if (!mx || !my) {
            mx = e.pageX, my = e.pageY, gst = '';
            ix = mx, iy = my;
            _this.mouse_trail();
            return;
        }

        // 1ms delay, don't aks why, just do it
        setTimeout(function(){            
            _this.add_point(mx - _this.canvas.offsetLeft, my - _this.canvas.offsetTop);                    
        }, 1);
        
        var dx = (e.pageX - mx);
        var dy = (my - e.pageY);
        var dis = Math.sqrt(dx * dx + dy * dy);

        if (dis < 10) return;

        var angle = Math.atan2(dy, dx) * 180 / Math.PI;
        angle = angle < 0 ? angle + 360 : angle;
        angle2 = angle + 22.5;
        var idx = parseInt(angle2 / 45);
        idx = (idx == 8 ? 0 : idx);
        gst += idx.toString();

        mx = e.pageX, my = e.pageY;
    };

    _this.distance = function(a, b) {
        if (a.length == 0) return b.length;
        if (b.length == 0) return a.length;

        if (_this.conf.debug >= 2) console.log('Comparing: ', a, b);

        // length_coef keep relation between length of strings (always > 1)
        var length_coef = a.length / b.length; 
        length_coef = length_coef < 1 ? 1/length_coef : length_coef;

        // time_coef keep relation between time of strings trace (always > 1)
        // a velocity = 100ms/number (the bigger, the slower)
        var time_coef = 100 / ((___gestures.ts_stop - ___gestures.ts_start) / b.length);
        time_coef = time_coef < 1 ? 1/time_coef : time_coef;
        var matrix = [];
        
        // init matrix        
        for (i = 0; i < b.length; i++) {
            matrix[i] = [];
        }

        // fill matrix
        var dis = 0;
        for (var i = 0; i < b.length; i++) {
            for (var j = 0; j < a.length; j++) {
                dis = (length_coef - 1) + (time_coef - 1) + Math.abs(parseInt(b.charAt(i)) - parseInt(a.charAt(j)));
                dis = dis == 8 ? 0 : (dis > 4 ? 8 - dis : dis);
                matrix[i][j] = dis * dis * dis;
            }
        }

        if (_this.conf.debug >= 4) {
            // draw matrix        
            f = '   ';
            for(j = 0; j < a.length; j++) f += j.toString().padStart(2) + ' ';
            console.log(f);

            for(var i = 0; i < b.length; i++) {
                var f = i.toString().padStart(2)+' ';
                for(var j = 0; j < a.length; j++){
                    f += matrix[i][j].toString().padStart(2) + ' ';
                }
                console.log(f);
            }
        }
        
        // do the math
        if (_this.conf.debug >= 3) console.log('Length length_coef: ', length_coef);
        if (_this.conf.debug >= 3) console.log('Length time_coef: ', time_coef);
        var res = [], from = (_this.conf.detectCircular ? b.length-1 : 0);

        for (n = from; n >= 0; n--) {
            var f = '', tot = 0, c = 0;
            for (i = n; i < b.length + n; i++) {
                const j = Math.round((i - n) * length_coef);
                const i2 = (i > b.length-1 ? i - b.length : i);
                if (j >= a.length) break;
                tot += matrix[i2][j];
                c++;
                f += matrix[i2][j].toString() + ' ';
            }
            res.push(tot / c);
            if (_this.conf.debug >= 3) console.log('Diagonal ', n, ': ', f, ' - Coef: ', res[res.length-1]);
        }
        
        return eval('Math.min(' + res.join(',') + ')');
    };

    _this.normalizeTime = function(l) {
        _this.ts_start = 0;
        _this.ts_stop = 100 * l;
    };
    _this.normalizeSize = function(s) {
        var ca = '', r = '', c = 0;
        for (i = 0; i < s.length; i++) {
            const cc = s.charAt(i);
            if (ca != cc) {
                r += cc;
                c = 0;
            } else {
                c++;
                if (c < 4) r += cc;
            }
            ca = cc;
        }
        return r;
    };

    // Mouse trail

    // Point Class 
    _this.Point = function(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 0;
        return this;
    };     
    
    _this.add_point = function(x, y) {
        var point = new _this.Point(x, y);
        _this.points.push(point);
    };    

    _this.mouse_trail = function() {
        _this.canvas.style.display = 'block';
        var ctx = _this.ctx;
        const duration = 1.7 * (1 * 1000) / 60; 
    
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let i = 0; i < _this.points.length; ++i) {
            const point = _this.points[i];
            let lastPoint;
        
            if (_this.points[i - 1] !== undefined) {
                lastPoint = _this.points[i - 1];
            } else lastPoint = point;
        
            point.lifetime += 1;

            if (point.lifetime > duration) {
                // If the point dies, remove it.
                _this.points.shift();
            } else {
                // Otherwise animate it:
        
                // As the lifetime goes on, lifePercent goes from 0 to 1.
                const lifePercent = (point.lifetime / duration);
                const spreadRate = 7 * (1 - lifePercent);
        
                ctx.lineJoin = 'round';
                ctx.lineWidth = spreadRate;
        
                // As time increases, decrease r and b, increase g to go from purple to green.
                const red = 0;
                const green = Math.floor(190 - (190 * lifePercent));
                const blue = Math.floor(210 + (210 * lifePercent));
                ctx.strokeStyle = `rgb(${red},${green},${blue}`;
                ctx.fillStyle = `rgb(${red},${green},${blue}`;
        
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5*(1-lifePercent), 0, 2 * Math.PI, true);
                ctx.fill();
                ctx.closePath();
            }
        }
        if (_this.mouseDown[2] == 1) {
            requestAnimationFrame(_this.mouse_trail);
        } else {
            _this.canvas.style.display = 'none';
            _this.points = [];
        }
    };

    
    // Install and uninstall
    _this.install = function() {
        if (!installed) {            
            // this array keeps mouse buttons status (idx 0: left, 1: middle, 2: right)
            _this.mouseDown = [0, 0, 0];

            // Events
            document.body.addEventListener('mousedown', _this.onmousedown = function (evt) {
                _this.mouseDown[evt.button] = 1;  
                _this.ts_start = (new Date()).getTime();
            }, true);            
            document.body.addEventListener('mouseup', _this.onmouseup = function (evt) {
                _this.mouseDown[evt.button] = 0;                
            }, true);
            window.addEventListener('mousemove', _this.onmousemove, true);
            window.addEventListener('mouseup', _this.onmousemove, true);
            _this.oncontextmenu = document.oncontextmenu;
            document.oncontextmenu = function () { return false; };

            // create canvas to draw mouse trail
            _this.canvas = document.createElement('canvas');
            _this.canvas.id = '___mgestures-canvas';
            _this.canvas.width = innerWidth;
            _this.canvas.height = innerHeight;
            _this.canvas.style.position = 'fixed'; 
            _this.canvas.style.top = 0; 
            _this.canvas.style.left = 0; 
            _this.canvas.style.zIndex = 1000000; 
            _this.canvas.style.display = 'none';
            document.body.appendChild(_this.canvas);
            _this.ctx = _this.canvas.getContext("2d");
            _this.points = [];            
            
            installed = true;
        }
    }
    
    _this.uninstall = function() {
        if (installed) {
            // Events
            window.removeEventListener('mousedown', _this.onmousedown, true);
            window.removeEventListener('mouseup', _this.onmouseup, true);
            window.removeEventListener('mousemove', _this.onmousemove, true);
            window.removeEventListener('mouseup', _this.onmousemove, true);
            _this.canvas.remove();
            document.oncontextmenu = _this.oncontextmenu;
            installed = false;
        }
    }
    
    return _this;

}

