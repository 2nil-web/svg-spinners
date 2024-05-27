
var bgInput, bgButton, colorInput, colorButton, colorCompute, colorToggle, filterPixel, lossDetail;

var autoComputeInterval=-1;

// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
function expandHex(hextexp) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hextexp = hextexp.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });
  return hextexp;
}

function rgbToHex(r, g, b) {
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
  const expandedHex = expandHex(hex);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(expandedHex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

function trimRgb(rgb) {
  const [r, g, b] = rgb
    .replace(/rgb\(|\) /i, "")
    .split(",")
    .map((x) => parseInt(x));
  return [r, g, b];
}


class Color {
  constructor(r, g, b) {
    this.set(r, g, b);
  }

  toRgb() {
    return `rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(
      this.b
    )})`;
  }

  toHex() {
    return rgbToHex(Math.round(this.r), Math.round(this.g), Math.round(this.b));
  }

  set(r, g, b) {
    this.r = this.clamp(r);
    this.g = this.clamp(g);
    this.b = this.clamp(b);
  }

  hueRotate(angle = 0) {
    angle = (angle / 180) * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    this.multiply([
      0.213 + cos * 0.787 - sin * 0.213,
      0.715 - cos * 0.715 - sin * 0.715,
      0.072 - cos * 0.072 + sin * 0.928,
      0.213 - cos * 0.213 + sin * 0.143,
      0.715 + cos * 0.285 + sin * 0.14,
      0.072 - cos * 0.072 - sin * 0.283,
      0.213 - cos * 0.213 - sin * 0.787,
      0.715 - cos * 0.715 + sin * 0.715,
      0.072 + cos * 0.928 + sin * 0.072,
    ]);
  }

  grayscale(value = 1) {
    this.multiply([
      0.2126 + 0.7874 * (1 - value),
      0.7152 - 0.7152 * (1 - value),
      0.0722 - 0.0722 * (1 - value),
      0.2126 - 0.2126 * (1 - value),
      0.7152 + 0.2848 * (1 - value),
      0.0722 - 0.0722 * (1 - value),
      0.2126 - 0.2126 * (1 - value),
      0.7152 - 0.7152 * (1 - value),
      0.0722 + 0.9278 * (1 - value),
    ]);
  }

  sepia(value = 1) {
    this.multiply([
      0.393 + 0.607 * (1 - value),
      0.769 - 0.769 * (1 - value),
      0.189 - 0.189 * (1 - value),
      0.349 - 0.349 * (1 - value),
      0.686 + 0.314 * (1 - value),
      0.168 - 0.168 * (1 - value),
      0.272 - 0.272 * (1 - value),
      0.534 - 0.534 * (1 - value),
      0.131 + 0.869 * (1 - value),
    ]);
  }

  saturate(value = 1) {
    this.multiply([
      0.213 + 0.787 * value,
      0.715 - 0.715 * value,
      0.072 - 0.072 * value,
      0.213 - 0.213 * value,
      0.715 + 0.285 * value,
      0.072 - 0.072 * value,
      0.213 - 0.213 * value,
      0.715 - 0.715 * value,
      0.072 + 0.928 * value,
    ]);
  }

  multiply(matrix) {
    const newR = this.clamp(
      this.r * matrix[0] + this.g * matrix[1] + this.b * matrix[2]
    );
    const newG = this.clamp(
      this.r * matrix[3] + this.g * matrix[4] + this.b * matrix[5]
    );
    const newB = this.clamp(
      this.r * matrix[6] + this.g * matrix[7] + this.b * matrix[8]
    );
    this.r = newR;
    this.g = newG;
    this.b = newB;
  }

  brightness(value = 1) {
    this.linear(value);
  }
  contrast(value = 1) {
    this.linear(value, -(0.5 * value) + 0.5);
  }

  linear(slope = 1, intercept = 0) {
    this.r = this.clamp(this.r * slope + intercept * 255);
    this.g = this.clamp(this.g * slope + intercept * 255);
    this.b = this.clamp(this.b * slope + intercept * 255);
  }

  invert(value = 1) {
    this.r = this.clamp((value + (this.r / 255) * (1 - 2 * value)) * 255);
    this.g = this.clamp((value + (this.g / 255) * (1 - 2 * value)) * 255);
    this.b = this.clamp((value + (this.b / 255) * (1 - 2 * value)) * 255);
  }

  hsl() {
    // Code taken from https://stackoverflow.com/a/9493060/2688027, licensed under CC BY-SA.
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;

        case g:
          h = (b - r) / d + 2;
          break;

        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: h * 100,
      s: s * 100,
      l: l * 100,
    };
  }

  clamp(value) {
    if (value > 255) {
      value = 255;
    } else if (value < 0) {
      value = 0;
    }
    return value;
  }
}

class Solver {
  constructor(target, baseColor) {
    this.target = target;
    this.targetHSL = target.hsl();
    this.reusedColor = new Color(0, 0, 0);
  }

  solve() {
    const result = this.solveNarrow(this.solveWide());
    return {
      values: result.values,
      loss: result.loss,
      filter: this.css(result.values),
      filterRaw: this.raw(result.values),
    };
  }

  solveWide() {
    const A = 5;
    const c = 15;
    const a = [60, 180, 18000, 600, 1.2, 1.2];

    let best = { loss: Infinity };
    for (let i = 0; best.loss > 25 && i < 3; i++) {
      const initial = [50, 20, 3750, 50, 100, 100];
      const result = this.spsa(A, a, c, initial, 1000);
      if (result.loss < best.loss) {
        best = result;
      }
    }
    return best;
  }

  solveNarrow(wide) {
    const A = wide.loss;
    const c = 2;
    const A1 = A + 1;
    const a = [0.25 * A1, 0.25 * A1, A1, 0.25 * A1, 0.2 * A1, 0.2 * A1];
    return this.spsa(A, a, c, wide.values, 500);
  }

  spsa(A, a, c, values, iters) {
    const alpha = 1;
    const gamma = 0.16666666666666666;

    let best = null;
    let bestLoss = Infinity;
    const deltas = new Array(6);
    const highArgs = new Array(6);
    const lowArgs = new Array(6);

    for (let k = 0; k < iters; k++) {
      const ck = c / Math.pow(k + 1, gamma);
      for (let i = 0; i < 6; i++) {
        deltas[i] = Math.random() > 0.5 ? 1 : -1;
        highArgs[i] = values[i] + ck * deltas[i];
        lowArgs[i] = values[i] - ck * deltas[i];
      }

      const lossDiff = this.loss(highArgs) - this.loss(lowArgs);
      for (let i = 0; i < 6; i++) {
        const g = (lossDiff / (2 * ck)) * deltas[i];
        const ak = a[i] / Math.pow(A + k + 1, alpha);
        values[i] = fix(values[i] - ak * g, i);
      }

      const loss = this.loss(values);
      if (loss < bestLoss) {
        best = values.slice(0);
        bestLoss = loss;
      }
    }
    return { values: best, loss: bestLoss };

    function fix(value, idx) {
      let max = 100;
      if (idx === 2 /* saturate */) {
        max = 7500;
      } else if (idx === 4 /* brightness */ || idx === 5 /* contrast */) {
        max = 200;
      }

      if (idx === 3 /* hue-rotate */) {
        if (value > max) {
          value %= max;
        } else if (value < 0) {
          value = max + (value % max);
        }
      } else if (value < 0) {
        value = 0;
      } else if (value > max) {
        value = max;
      }
      return value;
    }
  }

  loss(filters) {
    // Argument is array of percentages.
    const color = this.reusedColor;
    color.set(0, 0, 0);

    color.invert(filters[0] / 100);
    color.sepia(filters[1] / 100);
    color.saturate(filters[2] / 100);
    color.hueRotate(filters[3] * 3.6);
    color.brightness(filters[4] / 100);
    color.contrast(filters[5] / 100);

    const colorHSL = color.hsl();
    return (
      Math.abs(color.r - this.target.r) +
      Math.abs(color.g - this.target.g) +
      Math.abs(color.b - this.target.b) +
      Math.abs(colorHSL.h - this.targetHSL.h) +
      Math.abs(colorHSL.s - this.targetHSL.s) +
      Math.abs(colorHSL.l - this.targetHSL.l)
    );
  }

  raw(filters) {
    function fmt(idx, multiplier = 1) {
      return Math.round(filters[idx] * multiplier);
    }
    return `brightness(0) saturate(100%) invert(${fmt(0)}%) sepia(${fmt(
      1
    )}%) saturate(${fmt(2)}%) hue-rotate(${fmt(3, 3.6)}deg) brightness(${fmt(
      4
    )}%) contrast(${fmt(5)}%)`;
  }

  css(filters) {
    function fmt(idx, multiplier = 1) {
      return Math.round(filters[idx] * multiplier);
    }
    return `filter: brightness(0) saturate(100%) invert(${fmt(0)}%) sepia(${fmt(
      1
    )}%) saturate(${fmt(2)}%) hue-rotate(${fmt(3, 3.6)}deg) brightness(${fmt(
      4
    )}%) contrast(${fmt(5)}%);`;
  }
}

function computeVal(hexVal) {
  if (hexVal.startsWith('#')) {
    hexVal=hexVal.substring(1);
  }

  if (hexVal === '') hexVal='0';
  hexVal='#'+String(hexVal).padStart(6, '0')
  
  //console.log(hexVal);

  let rgb;
  //console.log(hexVal+", "+typeof hexVal);

  if (isHEXValid(hexVal)) {
    rgb = hexToRgb(hexVal);
  } else if (isRGBValid(hexVal)) {
    rgb = trimRgb(hexVal);
  }

  const color = new Color(rgb[0], rgb[1], rgb[2]);
  const solver = new Solver(color);
  const result = solver.solve();
  let lossMsg = "";
  const res = {
    color,
    solver,
    result,
    lossMsg,
  };

  Array.from(document.getElementsByClassName('filtered-color')).forEach((elt) => {
    elt.style['filter']=res.result.filterRaw;
  });
  

  if (res.result.loss < 1) {
    res.lossMsg = "This is a perfect result.";
  } else if (res.result.loss < 5) {
    res.lossMsg = "The is close enough.";
  } else if (res.result.loss < 15) {
    res.lossMsg = "The color is somewhat off. Consider running it again.";
  } else {
    res.lossMsg = "The color is extremely off. Run it again!";
  }

  const rgbColor = color.toRgb();
  const hexColor = res.color.toHex();

  //  console.log(typeof res.result.filterRaw);
  //console.log(res.result.filterRaw);
  filterPixel.value=res.result.filterRaw;

  lossDetail.innerHTML = `Loss: ${res.result.loss.toFixed(3)}. <b>${ res.lossMsg }</b>`;

  return [ res.result.loss, res.lossMsg, res.result.filterRaw ];
}

function compute() {
  if (autoComputeInterval < 0) {
    var lossV=100, lossS="", filterS="";
    nLoop=39;
    for (i=0; i < nLoop; i++) {
      [ tmpLossV, tmpLossS, tmpFilterS ]=computeVal(colorInput.value);

      if (tmpLossV < lossV) {
        lossV=tmpLossV;
        lossS=tmpLossS;
        filterS=tmpFilterS;
      }
      if (lossV.toFixed(5) == 0) break;
      //if (lossV == 0) break;
    }
    i++;
    filterPixel.value=filterS;
    lossDetail.innerHTML=`In ${i} loops, Loss: ${lossV.toFixed(1)}. <b>${ lossS }</b>`;
    console.log("loss="+lossV);

  } else {
    computeVal(colorInput.value);
  }
}

function isHEXValid(color) {
  const HEXColorRegExp = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const isValid = HEXColorRegExp.test(color);

  if (isValid) {
    return true;
  } else {
    return false;
  }
}

function isRGBValid(color) {
  const RGBColorRegExp = /^(rgb\()?\d{1,3}, ?\d{1,3}, ?\d{1,3}(\))?$/i;

  if (!RGBColorRegExp.test(color)) return false;

  color = color.toLowerCase();
  const startCheck = color.startsWith("rgb");
  const endCheck = color.endsWith(")");
  if ((startCheck && !endCheck) || (!startCheck && endCheck)) return false;

  const [r, g, b] = color
    .replace(/^rgb\(|\)| /, "")
    .split(",")
    .map((x) => parseInt(x));
  console.log(r, g, b);
  if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
    return true;
  } else {
    return false;
  }
}

function leftTrimChar(s, c) {
    if (c === "]") c = "\\]";
    if (c === "^") c = "\\^";
    if (c === "\\") c = "\\\\";
    return s.replace(new RegExp( "^(" + c + ")+", "g"), "");
}

function validateRgbString(s) {
  var inpVal=s.toString(16);
  inpVal=leftTrimChar(inpVal, '#');
  inpVal=leftTrimChar(inpVal, '0');
  if (inpVal.length < 6) inpVal=String(inpVal).padStart(6, '0')
  if (inpVal.length > 6) inpVal=inpVal.slice(0, 6);
  if (!inpVal.startsWith('#')) inpVal='#'+inpVal;
  return inpVal;
}


function numToRgbString(n) {
  return '#'+n.toString(16).padStart(6, '0');
}

function rgbStringToNum(s) {
  var inpVal=s.toString(16);
  inpVal=leftTrimChar(inpVal, '#');
  inpVal=leftTrimChar(inpVal, '0');
  if (inpVal.length < 6) inpVal=String(inpVal).padStart(6, '0')
  if (inpVal.length > 6) inpVal=inpVal.slice(0, 6);
  if (!inpVal.startsWith('0x')) inpVal='0x'+inpVal;
  return Number(inpVal);

}

function autoCompute() {
  n=rgbStringToNum(colorInput.value);
  n+=10;
  if (n > 16777215) n=0;
  s=numToRgbString(n);
  computeVal(s);
  colorInput.value=colorButton.value=s;
}

// addEventListeners of elements MUST be declared in the DOMContentLoaded
function onReady() {
  function tit(s) { document.body.innerHTML+=`<br /><h3>${s}</h3>`; }
  function src(id, fld="", cl="", st="") {
    if (fld == "") fld="svg-css";
 
    htm=`<a href="${fld}/${id}.svg"><img src="${fld}/${id}.svg" title="${fld}/${id}.svg"`;
    if (cl == "") cl='filtered-color';
    if(cl != '-') htm+=` class="${cl}"`;
    if (st != "") htm+=` style="${st}"`;
    htm+='></a>'
    console.log(htm);
    document.body.innerHTML+=htm;
    //document.body.innerHTML+=`<img src="svg-css/${id}.svg" class="${cla}" style="${cl}" title="svg-css/${id}.svg">`;
  }

  cuSty='width:128px; height:128px;border:1px solid black; margin-right:10px;'

  tit("freesvg (with rotation)");
   src("cgrd4", "freesvg", '-', cuSty);
   src("circulo-cromatico", "freesvg", '-', cuSty);
   src("circle-evolvent2", "freesvg", '-', cuSty);
   src("1310677699", "freesvg", '-', cuSty);
   src("shiny-balls", "freesvg", '-', cuSty);
   src("1537138550", "freesvg", '-', cuSty);
   src("Prismatic-Abstract-Flower-Line-Art-II-4", "freesvg", '-', cuSty);
   src("6-blade-prop", "freesvg", '-', cuSty);

  tit("wjschne.github.io (with rotation)");
   src("hsv_stripes", "wjschne", '-', cuSty);
   src("blurry_circles", "wjschne", '-', cuSty);
   src("root3b", "wjschne", '-', cuSty);
   src("six_points_rainbow", "wjschne", '-', cuSty);

  tit("SVG Background");
   src("bouncing-squares", "svg-bg");
   src("fade-stagger-circles", "svg-bg");
   src("fade-stagger-squares", "svg-bg");
   src("gear-spinner", "svg-bg");
   //src("gears-spinner", "svg-bg");
   src("infinite-spinner", "svg-bg");
   src("motion-blur-2", "svg-bg");

  tit("Sam Herbert");
   src("audio", "SamHerbert");
   src("ball-triangle", "SamHerbert");
   src("bars", "SamHerbert");
   src("circles", "SamHerbert");
   src("grid", "SamHerbert");
   src("hearts", "SamHerbert");
   src("oval", "SamHerbert");
   src("puff", "SamHerbert");
   src("rings", "SamHerbert");
   src("spinning-circles", "SamHerbert");
   src("tail-spin", "SamHerbert");
   src("three-dots", "SamHerbert");

  tit("Rings"); src("90-ring"); src("90-ring-with-bg"); src("180-ring"); src("180-ring-with-bg"); src("270-ring"); src("270-ring-with-bg"); src("ring-resize");
  tit("Dots"); src("3-dots-bounce"); src("3-dots-fade"); src("3-dots-move"); src("3-dots-rotate"); src("3-dots-scale"); src("3-dots-scale-middle");
    src("6-dots-rotate"); src("6-dots-scale"); src("6-dots-scale-middle"); src("8-dots-rotate"); src("12-dots-scale-rotate"); src("dot-revolve");
  tit("Bars"); src("bars-fade"); src("bars-scale"); src("bars-scale-fade"); src("bars-scale-middle"); src("bars-rotate-fade");
  tit("Blocks"); src("blocks-scale"); src("blocks-shuffle-2"); src("blocks-shuffle-3"); src("blocks-wave");
  tit("Pulses"); src("pulse"); src("pulse-2"); src("pulse-3"); src("pulse-multiple"); src("pulse-ring"); src("pulse-rings-2"); src("pulse-rings-3"); src("pulse-rings-multiple");
  tit("Other"); src("bouncing-ball"); src("clock"); src("eclipse"); src("eclipse-half"); src("gooey-balls-1"); src("gooey-balls-2"); src("tadpole"); src("wifi"); src("wifi-fade"); src("wind-toy");

  //tit("Evil icons"); src("evil-Icons", "", "-", "width:'512px; height:512px;'");

  bgInput      = document.getElementById("bg-input");
  bgButton     = document.getElementById("bg-button");
  colorInput   = document.getElementById("color-input");
  colorButton  = document.getElementById("color-button");
  colorCompute = document.getElementById("color-compute");
  colorToggle  = document.getElementById("color-toggle");
  filterPixel  = document.getElementById("filter-pixel");
  lossDetail   = document.getElementById("loss-detail");

  document.body.style.backgroundColor=bgButton.value;

  bgInput.addEventListener("input", (e) => {
    bgInput.value=bgButton.value=validateRgbString(bgInput.value);
    document.body.style.backgroundColor=bgButton.value;
  });

  bgButton.addEventListener("input", (e) => {
    bgInput.value = e.target.value;
    document.body.style.backgroundColor=bgButton.value;
  });

  colorInput.addEventListener("input", (e) => {
    colorInput.value=colorButton.value=validateRgbString(colorInput.value);
    computeVal(colorInput.value);
  });

  colorButton.addEventListener("input", (e) => {
    colorInput.value = e.target.value;
    computeVal(colorButton.value);
  });

  colorCompute.addEventListener('click', (e) => {
    compute();
  });

  colorToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      autoComputeInterval=setInterval(autoCompute, 400);
      colorCompute.disabled=true;
    } else {
      clearInterval(autoComputeInterval);
      autoComputeInterval=-1;
      colorCompute.disabled=false;
    }
  });

  compute();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onReady);
} else {
  onReady(); // Or setTimeout(onReady, 0); if you want it consistently async
}

