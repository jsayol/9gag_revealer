// main function: finds all NSFW posts and replaces the placeholder by it's actual image
function gag_reveal_nsfw() {
  var els = document.getElementsByTagName('img');

  // loop over all the IMG tags in the DOM
  for (var i=0; i<els.length; i++) {
    var el = els[i];

    // process only those tagged as NSFW
    if (el.getAttribute('alt') == 'NSFW') {
      var gag_parent = el.parentNode;
      var gag_id = gag_parent.getAttribute('href');
      if (!gag_id) {
        gag_id = window.location.href;
        gag_parent.parentNode.style.height='';
      }
      
      // figure out the post ID and the new URL
      gag_id = gag_id.split('/');
      gag_id = gag_id[gag_id.length-1];
      var gag_original = el.src;
      var gag_url = el.src.replace('img/nsfw-mask_v2.jpg','photo/'+gag_id+'_460s.jpg');

      // let's add an event to detect when the image can't be loaded, so some
      // extra processing can be done
      if (!el.getAttribute('_9gagrevealer')) {
        el.setAttribute('_9gagrevealer', true);
        el.onerror = (function() {
          // first revert back to the original NSFW placeholder to hide
          // the "broken image" icon
          this.el.setAttribute('src', this.url);

          // then make an AJAX call to the post's URL and pass its response to the callback
          var ajaxo = new ajaxObject('/gag/'+this.id, (function(rTxt,rStat) {
            gag_reveal_youtube(this.parent, this.id, rTxt, rStat);
          }).bind(this));
          ajaxo.update();
        }).bind({id:gag_id, el:el, parent:gag_parent, url:gag_original});
      }

      // replace the image src with the new one and add a link to the full resolution image
      el.setAttribute('alt', '');
      el.setAttribute('src', gag_url);
      gag_parent.setAttribute('href', gag_url.replace('_460s', '_700b'));

      // hide the bottom grey bar with the post URL
      var bottom_space = document.createElement("div");
      bottom_space.innerHTML = '&nbsp;';
      bottom_space.style.marginTop = '-29px';
      bottom_space.style.height = '29px';
      bottom_space.style.backgroundColor = 'white';
      bottom_space.style.position = 'relative';
      gag_parent.appendChild(bottom_space);
    }
  }
}

// youtube function: when a replaced image fails to load let's assume it is
// because it's a youtube video, so this function is called to fix it.
function gag_reveal_youtube(gag_parent, gag_id, rTxt, rStat) {
  try {
    if (rStat != 200) {
      throw 'rstat='+rStat;
    }
    else {
      // lets try to get YouTube's video ID from source
      var youtube_id = /<link rel="image_src" href="http:\/\/img\.youtube\.com\/vi\/(\w+)\/0\.jpg" \/ >/i.exec(rTxt)[1];

      var object = document.createElement("object");
      object.width = '460';
      object.height = '310';
      object.className = 'video-element';

      var param1 = document.createElement("param");
      param1.name = 'movie';
      param1.value = 'http://www.youtube.com/v/'+youtube_id+'?version=3&amp;hl=en&amp;showinfo=0&amp;autohide=1';
      object.appendChild(param1);

      var param2 = document.createElement("param");
      param2.name = 'wmode';
      param2.value = 'transparent';
      object.appendChild(param2);

      var param3 = document.createElement("param");
      param3.name = 'allowFullScreen';
      param3.value = 'true';
      object.appendChild(param3);

      var param4 = document.createElement("embed");
      param4.src = 'http://www.youtube.com/v/'+youtube_id+'?version=3&amp;hl=en&amp;showinfo=0&amp;autohide=1';
      param4.class = 'video-element';
      param4.type = 'application/x-shockwave-flash';
      param4.wmode = 'transparent';
      param4.allowfullscreen = 'true';
      param4.allowscriptaccess = 'always';
      param4.width = '460';
      param4.height = '310';
      object.appendChild(param4);

      var parent = gag_parent.parentNode;
      parent.replaceChild(object, gag_parent);
    }
  } catch (e) {
    // something's not right, just keep showing the default 'NSFW' placeholder    
  }
}

// "bind" function borrowed from http://www.robertsosinski.com/2009/04/28/binding-scope-in-javascript/
Function.prototype.bind = function(scope) {
  var _function = this;
  
  return function() {
    return _function.apply(scope, arguments);
  }
};

// "ajaxObject" function borrowed from http://www.hunlock.com/blogs/The_Ultimate_Ajax_Object
function ajaxObject(url, callbackFunction) {
  var that=this;      
  this.updating = false;
  this.abort = function() {
    if (that.updating) {
      that.updating=false;
      that.AJAX.abort();
      that.AJAX=null;
    }
  }
  this.update = function(passData,postMethod) { 
    if (that.updating) { return false; }
    that.AJAX = null;                          
    if (window.XMLHttpRequest) {              
      that.AJAX=new XMLHttpRequest();              
    } else {                                  
      that.AJAX=new ActiveXObject("Microsoft.XMLHTTP");
    }                                             
    if (that.AJAX==null) {                             
      return false;                               
    } else {
      that.AJAX.onreadystatechange = function() {  
        if (that.AJAX.readyState==4) {             
          that.updating=false;                
          that.callback(that.AJAX.responseText,that.AJAX.status,that.AJAX.responseXML);        
          that.AJAX=null;                                         
        }                                                      
      }                                                        
      that.updating = new Date();                              
      if (/post/i.test(postMethod)) {
        var uri=urlCall+'?'+that.updating.getTime();
        that.AJAX.open("POST", uri, true);
        that.AJAX.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        that.AJAX.setRequestHeader("Content-Length", passData.length);
        that.AJAX.send(passData);
      } else {
        var uri=urlCall+'?'+passData+'&timestamp='+(that.updating.getTime()); 
        that.AJAX.open("GET", uri, true);                             
        that.AJAX.send(null);                                         
      }              
      return true;                                             
    }                                                                           
  }
  var urlCall = url;        
  this.callback = callbackFunction || function () { };
}

// call the function to process the website's images
gag_reveal_nsfw();

// (re)process it every 1 second in case new posts have been loaded
setInterval(gag_reveal_nsfw, 1000);