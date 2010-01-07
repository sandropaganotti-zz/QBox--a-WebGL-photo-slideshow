// ======================================================
// Qbox a cube slideshow created with WebGL.
// Author: Sandro Paganotti
// Mail:   sandro.paganotti@gmail.com
// Help:   
// 
// This script takes a lot from the original 'Spinning WebGL box':
// http://webkit.org/blog/603/webgl-now-available-in-webkit-nightlies/


function init(o)
{

    // Initialize
    var gl = initWebGL(  o,                                     // The id of the Canvas Element
                        "vshader", "fshader",                   // The ids of the vertex and fragment shaders
                        [ "vNormal", "vTexCoord", "vPosition"], // The vertex attribute names used by the shaders.
                                                                // The order they appear here corresponds to their index
                                                                // used later.
                        [ 255, 255, 255, 1 ], 10000);                 // The clear color and depth values
                           
    // Set some uniform variables for the shaders
    gl.uniform3f(gl.getUniformLocation(gl.program, "lightDir"), 0, 0, 1);
    gl.uniform1i(gl.getUniformLocation(gl.program, "sampler2d"), 0);
    
    // Enable texturing
    gl.enable(gl.TEXTURE_2D);
    
    // Create a box. On return 'gl' contains a 'box' property with the BufferObjects containing
    // the arrays for vertices, normals, texture coords, and indices.
    gl.box = makeBox(gl);
    
    // Create some matrices to use later and save their locations in the shaders
    gl.mvMatrix = new CanvasMatrix4();
    gl.u_normalMatrixLoc = gl.getUniformLocation(gl.program, "u_normalMatrix");
    gl.normalMatrix = new CanvasMatrix4();
    gl.u_modelViewProjMatrixLoc = gl.getUniformLocation(gl.program, "u_modelViewProjMatrix");
    gl.mvpMatrix = new CanvasMatrix4();
    
    // Enable all the vertex arrays
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
   
    // Setup all the vertex attributes for vertices, normals and texCoords
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.box.vertexObject);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.box.normalObject);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.box.texCoordObject);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
   
    // Bind the index array
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.box.indexObject);
    
    return gl;
}

width = -1;
height = -1;
image_indexes = [0,1,2,3]; 
locks = [true,true,true,true];
// 
function reshape(gl,o)
{

    var canvas = document.getElementById(o);
    if (canvas.clientWidth == width && canvas.clientHeight == height)
        return;

    width = canvas.clientWidth;
    height = canvas.clientHeight;

    // Set the viewport and projection matrix for the scene
    gl.viewport(0, 0, width, height);
    gl.perspectiveMatrix = new CanvasMatrix4();
    gl.perspectiveMatrix.lookat(0,0,5, 0, 0, 0, 0, 1, 0);
    gl.perspectiveMatrix.perspective(30, width/height, 1, 10000);
}

function drawPicture(gl,o,prepared_textures)
{
    // Make sure the canvas is sized correctly.
    reshape(gl,o);

    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Make a model/view matrix.
    gl.mvMatrix.makeIdentity();
    gl.mvMatrix.rotate(currentAngle, 0,1,0);
    //gl.mvMatrix.rotate(20, 1,0,0);

    // Construct the normal matrix from the model-view matrix and pass it in
    gl.normalMatrix.load(gl.mvMatrix);
    gl.normalMatrix.invert();
    gl.normalMatrix.transpose();
    gl.uniformMatrix4fv(gl.u_normalMatrixLoc, false, gl.normalMatrix.getAsWebGLFloatArray());
    
    // Construct the model-view * projection matrix and pass it in
    gl.mvpMatrix.load(gl.mvMatrix);
    gl.mvpMatrix.multRight(gl.perspectiveMatrix);
    gl.uniformMatrix4fv(gl.u_modelViewProjMatrixLoc, false, gl.mvpMatrix.getAsWebGLFloatArray());
    

    // draw the cube faces we need and change textures
    gl.bindTexture(gl.TEXTURE_2D, prepared_textures[image_indexes[0]]);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
    gl.bindTexture(gl.TEXTURE_2D, prepared_textures[image_indexes[1]]);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 18);
    gl.bindTexture(gl.TEXTURE_2D, prepared_textures[image_indexes[2]]);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 30);
    gl.bindTexture(gl.TEXTURE_2D, prepared_textures[image_indexes[3]]);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 6);
    

    // Finish up.
    gl.flush();
    
    // change the images
    currentAngle += incAngle;
    
    if (currentAngle >= 90 && locks[0]){
        image_indexes[0] = image_indexes[0] + 4;
        if (image_indexes[0] > prepared_textures.length){
            image_indexes[0] = image_indexes[0] - prepared_textures.length;
        }   
        locks[0] = false;
    }
    if (currentAngle >= 180 && locks[1]){
        image_indexes[1] = image_indexes[1] + 4;
        if (image_indexes[1] > prepared_textures.length){
            image_indexes[1] = image_indexes[1] - prepared_textures.length;
        }
        locks[1] = false;
    }
    if (currentAngle >= 270 && locks[2]){
        image_indexes[2] = image_indexes[2] + 4;
        if (image_indexes[2] > prepared_textures.length){
            image_indexes[2] = image_indexes[2] - prepared_textures.length;
        }
        locks[2] = false;
    }
    if (currentAngle >= 360 && locks[3]){
        image_indexes[3] = image_indexes[3] + 4;
        if (image_indexes[3] > prepared_textures.length){
            image_indexes[3] = image_indexes[3] - prepared_textures.length;
        }
        locks[3] = false;
    }
    
    
    if (currentAngle > 360){
        locks = [true,true,true,true];
        currentAngle -= 360;
    }
}

function initTexture(e,c) 
{
  var textureWidth  = 500;
    
  if($(e).width() > $(e).height()){
     var magnitude = textureWidth/$(e).width();
  } else {
     var magnitude = textureWidth/$(e).height();
  }
  
  var new_width  = Math.floor($(e).width()*magnitude);
  var new_height = Math.floor($(e).height()*magnitude); 
  var textureCanvas     = document.createElement("canvas");
  textureCanvas.width   = textureCanvas.height = textureWidth;
  var textureContext    = textureCanvas.getContext("2d");
  textureContext.drawImage(e,Math.floor((textureWidth-new_width)/2.0),Math.floor((textureWidth-new_height)/2.0),new_width,new_height); 

  return textureCanvas;
}

function qbox(collection,o)
{
    var textures = new Array;
    $(collection).each(function(index){$(this).hide();textures.push(initTexture(this,$('#'+o)));});

    if (!document.getElementById(o).getContext("experimental-webgl"))
        alert("You don't have a version of WebKit with WebGL or you don't have it enabled.")
   
    var gl = init(o);
    var prepared_textures = make_textures(gl,textures);
    
    currentAngle = 0;
    incAngle = 0.1;
                    
    setInterval(function() { drawPicture(gl,o,prepared_textures ) }, 10);
}


function createTextureFromCanvas(ctx, canvas_imagedata) {
  
    var pixels = new WebGLUnsignedByteArray(canvas_imagedata.data);
    var texture = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    //  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
    //  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
    ctx.pixelStorei(ctx.UNPACK_ALIGNMENT, 1);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, canvas_imagedata.width, canvas_imagedata.height, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);
    ctx.generateMipmap(ctx.TEXTURE_2D)
    ctx.bindTexture(ctx.TEXTURE_2D, null);
    
    return texture;
}

function make_textures(gl,textures){
  var prepared_textures = new Array();
  for(var p=0;p<textures.length;p++){
      prepared_textures.push(createTextureFromCanvas(gl,textures[p].getContext("2d").getImageData(0, 0, 500, 500)));
  }
  return prepared_textures;
}